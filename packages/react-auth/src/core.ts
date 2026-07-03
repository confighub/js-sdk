// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// Framework-neutral browser-auth engine for ConfigHub. Productionized from the
// reference harness `test/browser-auth/src/confighubAuth.ts` in the ConfigHub
// monorepo, which is validated end to end against staging and prod.
//
// Flow (design: third-party-browser-app-auth.md §6):
//   GET {base}/api/info                 -> discovery { AuthIssuer, TokenExchangeEndpoint }
//   OIDC discovery on AuthIssuer        -> authorize/token endpoints
//   PKCE authorize + code->token        -> IdP token
//   POST {TokenExchangeEndpoint} (8693) -> minted ConfigHub token
//
// The minted token then rides `Authorization: Bearer` against `/api`. The flow is
// edition-agnostic: `AuthIssuer` is whatever discovery names (ConfigHub's bundled
// Keycloak for Cloud, the org's own IdP for Enterprise), so the same code runs
// against both. Tokens are held in memory by the caller; only the transient PKCE
// verifier is parked in sessionStorage across the authorize redirect.

export interface Discovery {
  AuthIssuer?: string;
  TokenExchangeEndpoint?: string;
  TokenExchangeAudience?: string;
}

export interface MintedSession {
  accessToken: string;
  organizationId: string;
  /** Claims of the validated IdP token (owning-org, audience, organization shape). */
  idpClaims: Record<string, unknown>;
}

interface PkceState {
  verifier: string;
  state: string;
  clientId: string;
  tokenEndpoint: string;
  exchangeEndpoint: string;
}

const PKCE_KEY = 'confighub_pkce';

const redirectUri = (): string => window.location.origin + window.location.pathname;

const trimSlash = (s: string): string => s.replace(/\/+$/, '');

const b64url = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (n = 64): string =>
  b64url(crypto.getRandomValues(new Uint8Array(n)).buffer);

async function sha256(s: string): Promise<string> {
  return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}

function decodeJwtClaims(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) return {};
  return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
}

export async function discover(base: string): Promise<Discovery> {
  const r = await fetch(trimSlash(base) + '/api/info');
  if (!r.ok) throw new Error('/api/info failed: ' + r.status);
  return r.json();
}

async function oidcMetadata(
  issuer: string,
): Promise<{ authorization_endpoint: string; token_endpoint: string }> {
  const r = await fetch(trimSlash(issuer) + '/.well-known/openid-configuration');
  if (!r.ok) throw new Error('OIDC discovery failed: ' + r.status);
  return r.json();
}

/**
 * Discover, build a PKCE request, and navigate to the IdP authorize endpoint.
 * Returns only by redirecting the page; `completeLoginFromRedirect()` finishes on
 * the way back.
 */
export async function startLogin(base: string, clientId: string): Promise<void> {
  const info = await discover(base);
  if (!info.AuthIssuer || !info.TokenExchangeEndpoint) {
    throw new Error(
      'this instance is not configured for token-exchange auth (server needs CONFIGHUB_IDP_ISSUER)',
    );
  }
  const meta = await oidcMetadata(info.AuthIssuer);
  const verifier = randomString();
  const challenge = await sha256(verifier);
  const state = randomString(16);
  const pkce: PkceState = {
    verifier,
    state,
    clientId,
    tokenEndpoint: meta.token_endpoint,
    exchangeEndpoint: info.TokenExchangeEndpoint,
  };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));

  const authURL = new URL(meta.authorization_endpoint);
  authURL.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri(),
    // The "organization" scope makes Keycloak emit the org claim the exchange resolves.
    scope: 'openid email profile organization',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  }).toString();
  window.location.assign(authURL.toString());
}

// Memoize so React StrictMode's double-mount can't redeem the one-time code twice.
let pending: Promise<MintedSession | null> | null = null;

/**
 * If the page is the IdP redirect (`?code=...`), exchange the code for an IdP token
 * and then exchange that for a minted ConfigHub token. Returns null on a normal load.
 */
export function completeLoginFromRedirect(): Promise<MintedSession | null> {
  if (!pending) pending = doCompleteLogin();
  return pending;
}

async function doCompleteLogin(): Promise<MintedSession | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (error) {
    history.replaceState({}, '', redirectUri());
    throw new Error(`IdP returned error: ${error} ${params.get('error_description') ?? ''}`);
  }
  if (!code) return null;

  const savedRaw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  history.replaceState({}, '', redirectUri()); // strip ?code= from the URL
  if (!savedRaw) throw new Error('no PKCE state; restart login');
  const saved: PkceState = JSON.parse(savedRaw);
  if (params.get('state') !== saved.state) throw new Error('state mismatch; aborting');

  // Exchange the authorization code for an IdP token (PKCE, public client).
  const tokenResp = await fetch(saved.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: saved.clientId,
      code_verifier: saved.verifier,
    }),
  });
  if (!tokenResp.ok) {
    throw new Error(`IdP token endpoint ${tokenResp.status}: ${await tokenResp.text()}`);
  }
  const idpToken = await tokenResp.json();

  // RFC 8693 token exchange against ConfigHub -> minted ConfigHub token.
  const exResp = await fetch(saved.exchangeEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: idpToken.access_token,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    }),
  });
  if (!exResp.ok) throw new Error(`/auth/exchange ${exResp.status}: ${await exResp.text()}`);
  const minted = await exResp.json();

  return {
    accessToken: minted.access_token,
    organizationId: minted.organization_id,
    idpClaims: decodeJwtClaims(idpToken.access_token),
  };
}

/** Discard the in-progress login memo (used on logout so a later login re-runs). */
export function resetPending(): void {
  pending = null;
}
