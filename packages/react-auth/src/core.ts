// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// Framework-neutral browser-auth engine for ConfigHub. Productionized from the
// reference harness `test/browser-auth/src/confighubAuth.ts` in the ConfigHub
// monorepo, which is validated end to end against staging and prod.
//
// Flow (design: third-party-browser-app-auth.md §6):
//   GET {base}/api/info                 -> discovery { AuthIssuer, TokenExchangeEndpoint }
//   OIDC discovery on AuthIssuer        -> authorize/token/end_session endpoints
//   PKCE authorize + code->token        -> IdP token
//   POST {TokenExchangeEndpoint} (8693) -> minted ConfigHub token
//
// The minted token then rides `Authorization: Bearer` against `/api`. The flow is
// edition-agnostic: `AuthIssuer` is whatever discovery names (ConfigHub's bundled
// Keycloak for Cloud, the org's own IdP for Enterprise), so the same code runs
// against both. Tokens are held by the caller; only the transient PKCE state is
// parked in sessionStorage across the authorize redirect.

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
  /**
   * The IdP's ID token, kept only so logout can pass it as `id_token_hint` to the
   * end-session endpoint. Absent for sessions that did not come from an OIDC login.
   */
  idToken?: string;
}

export interface LoginOptions {
  /**
   * Where to land after login, as a same-origin path (`/space/x?tab=units`). Carried
   * through the authorize round trip in the PKCE state, never in the redirect URI:
   * OAuth clients register exact redirect URIs, so the URI itself must not vary with
   * the page the user started from. Defaults to the current path and query.
   */
  returnTo?: string;
  /**
   * Which organization to sign in to, as the Keycloak organization alias sent in
   * the `organization:<alias>` scope.
   *
   * - a string: that organization, no prompt;
   * - `undefined` (default): the organization of the last successful login in this
   *   browser, remembered per client in `localStorage`, so a new tab or a login after
   *   logout lands in the same organization without a prompt; with nothing
   *   remembered, Keycloak decides (prompt for a multi-org user, or the org matching
   *   the email domain on a fresh authentication);
   * - `null`: no hint on purpose, so Keycloak prompts. This is "switch organization".
   */
  organization?: string | null;
  /**
   * `'none'` asks the IdP to re-authenticate without any UI, failing with
   * `login_required` if the SSO session is gone -- the way to refresh an expired
   * ConfigHub token when the user is still signed in at the IdP. `'login'` forces the
   * login form even with a live SSO session.
   */
  prompt?: 'none' | 'login';
}

export interface FlowOptions {
  /**
   * Same-origin path the IdP redirects back to, and therefore the redirect URI to
   * register for the client: `{origin}{callbackPath}`. Defaults to `/`.
   */
  callbackPath?: string;
}

interface PkceState {
  verifier: string;
  state: string;
  clientId: string;
  tokenEndpoint: string;
  exchangeEndpoint: string;
  redirectUri: string;
  returnTo: string;
  silent: boolean;
  /** The organization alias the authorize request hinted, if any. */
  hintedOrganization?: string;
  /** This login is already the retry after a token without an organization. */
  retriedForOrganization?: boolean;
}

/**
 * Thrown by `completeLoginFromRedirect` when the IdP token names no organization,
 * which the exchange would refuse. Seen on a fresh brokered (Google) login, where
 * Keycloak's organization step does not run; on the next login the SSO session is
 * alive and it does, so the caller logs in again, once, with no hint. Any
 * remembered alias has already been forgotten.
 */
export class OrganizationMissing extends Error {
  constructor(public readonly returnTo: string) {
    super('the identity provider issued a token with no organization');
    this.name = 'OrganizationMissing';
  }
}

export interface RetryOptions {
  /** @internal set by the provider on the one retry after OrganizationMissing. */
  retriedForOrganization?: boolean;
}

const PKCE_KEY = 'confighub_pkce';
const LAST_ORG_KEY = 'confighub_last_org';

// The alias is a short public identifier, not a credential, so localStorage is the
// right place: it must outlive the tab, which is exactly what the token must not.
const lastOrgKey = (clientId: string): string => `${LAST_ORG_KEY}:${clientId}`;

/** The organization alias of the last successful login for this client, if any. */
export function rememberedOrganization(clientId: string): string | undefined {
  try {
    return localStorage.getItem(lastOrgKey(clientId)) ?? undefined;
  } catch {
    return undefined;
  }
}

/** @internal */
export function rememberOrganization(clientId: string, alias: string | undefined): void {
  try {
    if (alias) localStorage.setItem(lastOrgKey(clientId), alias);
    else localStorage.removeItem(lastOrgKey(clientId));
  } catch {
    // Storage unavailable: the next login gets no hint.
  }
}

/**
 * The alias in an IdP token's `organization` claim (`{ "<alias>": { id } }`), or
 * undefined when the claim is absent or names more than one organization.
 */
export function organizationAliasOf(idpClaims: Record<string, unknown>): string | undefined {
  const org = idpClaims.organization;
  if (!org || typeof org !== 'object') return undefined;
  const aliases = Object.keys(org as Record<string, unknown>);
  return aliases.length === 1 ? aliases[0] : undefined;
}

const trimSlash = (s: string): string => s.replace(/\/+$/, '');

/** The fixed callback URI: the page origin plus the configured callback path. */
export const callbackUri = (opts?: FlowOptions): string =>
  window.location.origin + (opts?.callbackPath ?? '/');

const currentPath = (): string =>
  window.location.pathname + window.location.search + window.location.hash;

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

/** Decode a JWT's claims without verifying it. Returns {} for anything malformed. */
export function decodeJwtClaims(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) return {};
  try {
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

/** Whether a JWT's `exp` is in the past (with a small skew allowance). */
export function isExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtClaims(token).exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export async function discover(base: string): Promise<Discovery> {
  const r = await fetch(trimSlash(base) + '/api/info');
  if (!r.ok) throw new Error('/api/info failed: ' + r.status);
  return r.json();
}

interface OidcMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

async function oidcMetadata(issuer: string): Promise<OidcMetadata> {
  const r = await fetch(trimSlash(issuer) + '/.well-known/openid-configuration');
  if (!r.ok) throw new Error('OIDC discovery failed: ' + r.status);
  return r.json();
}

/**
 * Discover, build a PKCE request, and navigate to the IdP authorize endpoint.
 * Returns only by redirecting the page; `completeLoginFromRedirect()` finishes on
 * the way back.
 */
export async function startLogin(
  base: string,
  clientId: string,
  login: LoginOptions = {},
  flow: FlowOptions = {},
  retry: RetryOptions = {},
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
  const redirectUri = callbackUri(flow);
  // The "organization" scope makes Keycloak emit the org claim the exchange resolves;
  // "organization:<alias>" selects one without prompting.
  const alias =
    login.organization === null
      ? undefined
      : (login.organization ?? rememberedOrganization(clientId));
  const orgScope = alias ? `organization:${alias}` : 'organization';
  const pkce: PkceState = {
    verifier,
    state,
    clientId,
    tokenEndpoint: meta.token_endpoint,
    exchangeEndpoint: info.TokenExchangeEndpoint,
    redirectUri,
    returnTo: login.returnTo ?? currentPath(),
    silent: login.prompt === 'none',
    hintedOrganization: alias,
    retriedForOrganization: retry.retriedForOrganization,
  };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));
  const params: Record<string, string> = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: `openid email profile ${orgScope}`,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  };
  if (login.prompt) params.prompt = login.prompt;

  const authURL = new URL(meta.authorization_endpoint);
  authURL.search = new URLSearchParams(params).toString();
  window.location.assign(authURL.toString());
}

// Memoize so React StrictMode's double-mount can't redeem the one-time code twice.
let pending: Promise<MintedSession | null> | null = null;

/**
 * If the page is the IdP redirect (`?code=...`), exchange the code for an IdP token
 * and then exchange that for a minted ConfigHub token, and restore the URL the
 * login started from. Returns null on a normal load, and also when a `prompt=none`
 * attempt came back with `login_required` (the SSO session is gone; the caller
 * should offer an interactive login).
 */
export function completeLoginFromRedirect(): Promise<MintedSession | null> {
  if (!pending) pending = doCompleteLogin();
  return pending;
}

const SILENT_FAILURES = new Set(['login_required', 'interaction_required', 'consent_required']);

async function doCompleteLogin(): Promise<MintedSession | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (!code && !error) return null;

  const savedRaw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  const saved: PkceState | null = savedRaw ? JSON.parse(savedRaw) : null;

  // Put the URL back to where the user started before anything else can fail, so
  // neither the code nor an error string lingers in the address bar or history.
  history.replaceState({}, '', saved?.returnTo ?? callbackUri());

  if (error) {
    if (saved?.silent && SILENT_FAILURES.has(error)) return null;
    throw new Error(`IdP returned error: ${error} ${params.get('error_description') ?? ''}`);
  }
  if (!saved) throw new Error('no PKCE state; restart login');
  if (params.get('state') !== saved.state) throw new Error('state mismatch; aborting');

  // Exchange the authorization code for an IdP token (PKCE, public client).
  const tokenResp = await fetch(saved.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: saved.redirectUri,
      client_id: saved.clientId,
      code_verifier: saved.verifier,
    }),
  });
  if (!tokenResp.ok) {
    throw new Error(`IdP token endpoint ${tokenResp.status}: ${await tokenResp.text()}`);
  }
  const idpToken = await tokenResp.json();

  // RFC 8693 token exchange against ConfigHub -> minted ConfigHub token.
  const idpClaims = decodeJwtClaims(idpToken.access_token);
  if (!organizationAliasOf(idpClaims) && !saved.retriedForOrganization) {
    // The exchange would refuse this token. Rather than surface that, log in
    // once more: with the SSO session now alive the IdP runs its organization
    // step. A hint that was sent evidently did not help, so forget it.
    if (saved.hintedOrganization) rememberOrganization(saved.clientId, undefined);
    throw new OrganizationMissing(saved.returnTo);
  }
  const minted = await exchange(saved.exchangeEndpoint, idpToken.access_token);
  rememberOrganization(saved.clientId, organizationAliasOf(idpClaims));
  return {
    ...minted,
    idpClaims,
    idToken: typeof idpToken.id_token === 'string' ? idpToken.id_token : undefined,
  };
}

async function exchange(
  exchangeEndpoint: string,
  subjectToken: string,
): Promise<Pick<MintedSession, 'accessToken' | 'organizationId'>> {
  const exResp = await fetch(exchangeEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: subjectToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    }),
  });
  if (!exResp.ok) throw new Error(`/auth/exchange ${exResp.status}: ${await exResp.text()}`);
  const minted = await exResp.json();
  return { accessToken: minted.access_token, organizationId: minted.organization_id };
}

/**
 * Trade the current minted token for one scoped to another organization the user
 * belongs to (`POST {base}/auth/switch-organization`, bearer-authenticated). The
 * IdP session is untouched; only the ConfigHub token changes.
 */
export async function switchOrganization(
  base: string,
  accessToken: string,
  organizationId: string,
): Promise<Pick<MintedSession, 'accessToken' | 'organizationId'>> {
  const r = await fetch(trimSlash(base) + '/auth/switch-organization', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ organization_id: organizationId }),
  });
  if (!r.ok) throw new Error(`/auth/switch-organization ${r.status}: ${await r.text()}`);
  const minted = await r.json();
  return { accessToken: minted.access_token, organizationId: minted.organization_id };
}

/**
 * End the IdP session (RP-initiated logout) and land on `postLogoutRedirectUri`,
 * which must be registered for the client. Returns only by redirecting. If the
 * issuer publishes no end-session endpoint, navigates to the redirect URI directly.
 */
export async function endSession(
  base: string,
  clientId: string,
  idToken: string | undefined,
  postLogoutRedirectUri: string,
): Promise<void> {
  const info = await discover(base);
  const meta = info.AuthIssuer ? await oidcMetadata(info.AuthIssuer) : undefined;
  if (!meta?.end_session_endpoint) {
    window.location.assign(postLogoutRedirectUri);
    return;
  }
  const params: Record<string, string> = {
    client_id: clientId,
    post_logout_redirect_uri: postLogoutRedirectUri,
  };
  if (idToken) params.id_token_hint = idToken;
  const url = new URL(meta.end_session_endpoint);
  url.search = new URLSearchParams(params).toString();
  window.location.assign(url.toString());
}

/** Discard the in-progress login memo (used on logout so a later login re-runs). */
export function resetPending(): void {
  pending = null;
}
