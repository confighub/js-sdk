# @confighub/react-auth

React provider and hooks for authenticating a browser app against the
[ConfigHub](https://confighub.com) API. Runs the browser-direct flow end to end —
runtime discovery, OIDC Authorization Code + PKCE against the discovered IdP, then
RFC 8693 token exchange for a minted ConfigHub token — and hands back a typed
[`@confighub/api`](https://www.npmjs.com/package/@confighub/api) client pre-wired
with the token.

```tsx
import { ConfigHubAuthProvider, useAuth, useConfigHub } from '@confighub/react-auth';

<ConfigHubAuthProvider baseUrl="https://hub.confighub.com" clientId={CLIENT_ID}>
  <App />
</ConfigHubAuthProvider>;

function App() {
  const { status, user, login, logout } = useAuth();
  const api = useConfigHub(); // typed client, token already attached
  // await api.GET('/me'); await api.GET('/space/{space_id}/unit', { params: { path: { space_id } } });

  if (status === 'loading') return <p>…</p>;
  if (status !== 'authenticated') return <button onClick={login}>Log in</button>;
  return <button onClick={logout}>Sign out {user!.organizationId}</button>;
}
```

## Configuration

- `baseUrl` — the ConfigHub instance, e.g. `https://hub.confighub.com`.
- `clientId` — this app's registered OAuth client id, from
  `cub oauthclient create <name> --redirect-uri <origin>`.

The IdP issuer and OIDC endpoints are discovered from `{baseUrl}/api/info`, so the
same build runs against any ConfigHub instance (the bundled Keycloak for Cloud, an
organization's own IdP for Enterprise).

## Token posture

The minted token is kept in memory, never `localStorage`; only the transient PKCE
verifier is parked in `sessionStorage` across the authorize redirect. A 401 clears
the session so the app re-authenticates.

## Silent re-auth on page refresh

Because tokens are memory-only, a full page refresh discards them. Rather than
persisting tokens, the provider re-runs the authorize redirect with `prompt=none`:
the IdP's SSO cookie answers non-interactively, and the app is authenticated again
after a quick redirect round-trip — no login screen, no user interaction. The app
shows `status === 'loading'` throughout, and the pre-refresh URL (path, query,
hash) is restored afterward.

The `silentReauth` prop controls when this happens:

- `'returning'` (default) — only when a prior login is remembered on this
  browser, via a non-sensitive marker in `localStorage` (a bare flag — no token
  material). The marker is set on successful login and cleared by `logout()` or
  by the IdP declining the silent attempt (`login_required`), so first-time
  visitors and logged-out users go straight to the login screen.
- `'always'` — attempt on every fresh load, first-time visitors included. Use
  this when users arrive already holding an IdP session — e.g. the app is
  reached from a portal that shares the IdP — so they are logged in without ever
  seeing a login screen. A visitor with no IdP session pays one redirect
  round-trip, after which attempts are suppressed for that tab until they log in
  explicitly. Note this requires the app to load as a top-level page (own tab or
  full-page navigation); inside a cross-site iframe the IdP cookie is partitioned
  away and silent auth cannot work (see issue #3).
- `'never'` — no automatic attempts; auth starts only from `login()`.

## Logout

`logout()` clears the in-memory session and the silent re-auth marker, and
suppresses automatic login in the tab (relevant for `'always'` mode) until the
user logs in explicitly — but it leaves the IdP SSO cookie alone, so the next
login is one non-interactive click. To also end the IdP session (e.g. shared
machines), pass `logout({ endSession: true })`: this redirects through the OIDC
end-session endpoint with `id_token_hint`, after which logging in requires
credentials again.

`react` (18 or 19) is a peer dependency.
