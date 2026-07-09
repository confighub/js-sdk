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
//
// Because tokens never persist, a full page refresh would normally land on the
// login screen even while the IdP still holds a live SSO cookie. Silent re-auth
// covers that: after a successful login a non-sensitive hint is set in
// localStorage, and on the next fresh load the same authorize redirect runs with
// `prompt=none` — the IdP either bounces straight back with a code (no UI) or
// with `error=login_required`, which quietly settles into unauthenticated.

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
  /** The IdP `id_token`, kept in memory so end-session logout can pass it as
   *  `id_token_hint` (skips the IdP's logout-confirmation page). */
  idpIdToken?: string;
}

interface PkceState {
  verifier: string;
  state: string;
  clientId: string;
  tokenEndpoint: string;
  exchangeEndpoint: string;
  /** True for a `prompt=none` attempt: IdP errors mean "not logged in", not failure. */
  silent?: boolean;
  /** In-app URL (path + search + hash) to restore once the round-trip completes. */
  returnTo?: string;
}

const PKCE_KEY = 'confighub_pkce';

// The hint records only that *some* login succeeded in this browser — no token
// material — so a fresh page load knows a silent re-auth is worth attempting.
const hintKey = (clientId: string): string => `confighub_auth_hint:${clientId}`;

export function hasLoginHint(clientId: string): boolean {
  try {
    return localStorage.getItem(hintKey(clientId)) !== null;
  } catch {
    return false;
  }
}

export function setLoginHint(clientId: string): void {
  try {
    localStorage.setItem(hintKey(clientId), '1');
  } catch {
    // Storage unavailable (private mode, blocked): silent re-auth just won't arm.
  }
}

export function clearLoginHint(clientId: string): void {
  try {
    localStorage.removeItem(hintKey(clientId));
  } catch {
    // ignore
  }
}

// Per-tab (sessionStorage) suppression of automatic login attempts. Set by
// logout() and by a declined silent attempt, cleared by an interactive login —
// so in `silentReauth: 'always'` mode a logged-out user isn't silently logged
// straight back in on refresh, and a session-less visitor pays the redirect
// round-trip once per tab, not on every reload.
const SUPPRESS_KEY = 'confighub_auth_suppressed';

export function isAutoLoginSuppressed(): boolean {
  try {
    return sessionStorage.getItem(SUPPRESS_KEY) !== null;
  } catch {
    return false;
  }
}

export function suppressAutoLogin(): void {
  try {
    sessionStorage.setItem(SUPPRESS_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearAutoLoginSuppression(): void {
  try {
    sessionStorage.removeItem(SUPPRESS_KEY);
  } catch {
    // ignore
  }
}

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

async function oidcMetadata(issuer: string): Promise<{
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}> {
  const r = await fetch(trimSlash(issuer) + '/.well-known/openid-configuration');
  if (!r.ok) throw new Error('OIDC discovery failed: ' + r.status);
  return r.json();
}

export interface StartLoginOptions {
  /** `'none'` makes the attempt non-interactive: the IdP redirects straight back
   *  with a code (SSO session alive) or `error=login_required` (no session, no UI). */
  prompt?: 'none';
}

/**
 * Discover, build a PKCE request, and navigate to the IdP authorize endpoint.
 * Returns only by redirecting the page; `completeLoginFromRedirect()` finishes on
 * the way back.
 */
export async function startLogin(
  base: string,
  clientId: string,
  options: StartLoginOptions = {},
): Promise<void> {
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
    silent: options.prompt === 'none',
    returnTo: window.location.pathname + window.location.search + window.location.hash,
  };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));

  const query = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri(),
    // The "organization" scope makes Keycloak emit the org claim the exchange resolves.
    scope: 'openid email profile organization',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  if (options.prompt) query.set('prompt', options.prompt);

  const authURL = new URL(meta.authorization_endpoint);
  authURL.search = query.toString();
  window.location.assign(authURL.toString());
}

// Memoize so React StrictMode's double-mounted effect can't kick off two
// concurrent silent redirects.
let silentPending: Promise<void> | null = null;

/**
 * Begin a non-interactive (`prompt=none`) re-auth redirect. Idempotent per page
 * load: concurrent callers share one attempt.
 */
export function startSilentLogin(base: string, clientId: string): Promise<void> {
  if (!silentPending) silentPending = startLogin(base, clientId, { prompt: 'none' });
  return silentPending;
}

/** A `prompt=none` attempt came back without a session (IdP has no SSO cookie). */
export type SilentDeclined = 'silent-declined';

// Memoize so React StrictMode's double-mount can't redeem the one-time code twice.
let pending: Promise<MintedSession | SilentDeclined | null> | null = null;

/**
 * If the page is the IdP redirect (`?code=...`), exchange the code for an IdP token
 * and then exchange that for a minted ConfigHub token. Returns null on a normal
 * load, and `'silent-declined'` when a `prompt=none` attempt found no IdP session.
 */
export function completeLoginFromRedirect(): Promise<MintedSession | SilentDeclined | null> {
  if (!pending) pending = doCompleteLogin();
  return pending;
}

async function doCompleteLogin(): Promise<MintedSession | SilentDeclined | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (!code && !error) return null;

  const savedRaw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  const saved: PkceState | null = savedRaw ? JSON.parse(savedRaw) : null;
  // Strip ?code=/?error= and put back the URL the user was on before the hop.
  history.replaceState({}, '', saved?.returnTo || redirectUri());

  // A silent attempt never surfaces as an error: clear the hint so the next load
  // goes straight to the login screen, and settle into unauthenticated.
  const declineSilently = (reason: string): SilentDeclined => {
    if (saved) clearLoginHint(saved.clientId);
    suppressAutoLogin();
    console.warn(`[confighub-auth] silent re-auth declined: ${reason}`);
    return 'silent-declined';
  };

  if (error) {
    const detail = `${error} ${params.get('error_description') ?? ''}`.trim();
    if (saved?.silent) return declineSilently(detail);
    throw new Error(`IdP returned error: ${detail}`);
  }
  if (!saved) throw new Error('no PKCE state; restart login');
  if (params.get('state') !== saved.state) {
    if (saved.silent) return declineSilently('state mismatch');
    throw new Error('state mismatch; aborting');
  }

  try {
    // Exchange the authorization code for an IdP token (PKCE, public client).
    const tokenResp = await fetch(saved.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
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
      idpIdToken: idpToken.id_token,
    };
  } catch (e) {
    if (saved.silent) return declineSilently(e instanceof Error ? e.message : String(e));
    throw e;
  }
}

/**
 * Redirect to the IdP end-session endpoint (RP-initiated logout), killing the SSO
 * cookie so neither silent re-auth nor one-click login works afterward. Passing
 * `idToken` as `id_token_hint` lets Keycloak skip its logout-confirmation page.
 * Returns only by redirecting; the IdP sends the browser back to this app.
 */
export async function startLogout(
  base: string,
  clientId: string,
  idToken?: string,
): Promise<void> {
  const info = await discover(base);
  if (!info.AuthIssuer) throw new Error('no AuthIssuer in discovery; cannot end IdP session');
  const meta = await oidcMetadata(info.AuthIssuer);
  if (!meta.end_session_endpoint) {
    throw new Error('IdP does not advertise an end_session_endpoint');
  }
  const query = new URLSearchParams({
    client_id: clientId,
    post_logout_redirect_uri: redirectUri(),
  });
  if (idToken) query.set('id_token_hint', idToken);
  const url = new URL(meta.end_session_endpoint);
  url.search = query.toString();
  window.location.assign(url.toString());
}

/** Discard the in-progress login memos (used on logout so a later login re-runs). */
export function resetPending(): void {
  pending = null;
  silentPending = null;
}
