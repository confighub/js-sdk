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
  `cub oauthclient create <name> --redirect-uri <origin>/`.
- `callbackPath` (default `/`) — the IdP redirects back to `{origin}{callbackPath}`,
  which is the redirect URI to register. It is fixed on purpose: the page the user
  started from travels in the PKCE `state` and is restored on return, so a login
  from `/space/x?tab=units` lands back there without registering every path.
- `persist` (default `'session'`) — the session is kept in `sessionStorage`, so a
  reload or in-tab navigation does not round-trip through the IdP. Tab-scoped, gone
  when the tab closes, dropped when the token has expired. `'none'` keeps it in memory
  only, and every page load starts unauthenticated.
- `onUnauthorized` (default `'login'`) — what a rejected token means. `'login'` tries a
  silent re-authentication; `'logout'` just drops the session. Applied when
  `getAccessToken` finds the token expired, and when a data client reports a 401
  through `handleUnauthorized` (below).

The IdP issuer and OIDC endpoints are discovered from `{baseUrl}/api/info`, so the
same build runs against any ConfigHub instance (the bundled Keycloak for Cloud, an
organization's own IdP for Enterprise).

## `useAuth()`

```ts
const { status, user, error, login, logout, reauthenticate, signInWithTicket, getToken } = useAuth();
```

- `login(options?)` — redirects to the IdP. `returnTo` picks the landing path
  (default: the current one). `organization` is a Keycloak organization alias, sent
  as the `organization:<alias>` scope so a multi-org user is not prompted. Left
  out, the alias of the last successful login in this browser is used (remembered
  per client in `localStorage`; a short public name, not a credential), so a new
  tab or a login after logout lands in the same organization silently. `null`
  sends no hint on purpose, so Keycloak prompts. Either is how an app switches
  organization: a fresh login through the IdP, which is where membership is
  decided. `prompt: 'none' | 'login' | 'create'` is passed through; `'create'` opens
  the IdP's registration form, so a sign-up link is `login({ prompt: 'create' })`.
- `logout(options?)` — forgets the session in this tab. `endSession: true` also ends
  the IdP session (RP-initiated logout with `id_token_hint`), landing on
  `postLogoutRedirectUri` (default: the callback URI), which must be registered
  for the client. Without it the next login rides the SSO cookie silently. While the
  page navigates to the IdP, status stays `loading`, so an app that logs in
  automatically on `unauthenticated` does not start a login that races the logout.
- `reauthenticate()` — the token stopped working: a `prompt=none` round trip for the
  organization the session already had. Status is `loading` meanwhile, not
  `unauthenticated`, so an app that auto-logs-in on `unauthenticated` does not race
  it. If the IdP session is gone too, the page comes back `unauthenticated`. On an
  instance with no identity provider there is nothing to ask, and status goes
  straight to `unauthenticated`.
- `signInWithTicket(ticket)` — redeems a single-use ticket from
  `cub auth browser-session` (`POST /auth/browser-session`) for a session. This is how
  a browser signs in to an instance with no identity provider, which `/api/info`
  shows by advertising no `AuthIssuer`; `login()` rejects with `NoIdentityProvider`
  there. The session has no IdP behind it, so when it expires the user runs the
  command again.

## Outside React

Two module-level functions carry the session to code that cannot use hooks, such as a
data client's request setup:

- `getAccessToken()` — the current token, or undefined. It never returns an expired
  token: it starts the provider's recovery (per `onUnauthorized`) and returns undefined,
  and the page comes back from the IdP where it was.
- `handleUnauthorized()` — report a 401. Only needed for a token rejected before its
  expiry (a server key rotation, a revoked session); expiry is handled by
  `getAccessToken`. A no-op while a recovery is already under way.

```ts
import { getAccessToken, handleUnauthorized } from '@confighub/react-auth';
import { configureConfigHub } from '@confighub/rtk-query';

configureConfigHub({ baseUrl, getToken: getAccessToken, onUnauthorized: handleUnauthorized });
```

## Token posture

The minted token is kept in `sessionStorage` (tab-scoped) by default, or in memory
with `persist: 'none'`. Never `localStorage`. The transient PKCE state is parked in
`sessionStorage` across the authorize redirect. A rejected or expired token triggers a
silent re-authentication (see `onUnauthorized`), which needs a live IdP session; refresh
tokens are not used, so the token's lifetime is the longest a page goes without a
redirect.

`react` (18 or 19) is a peer dependency.
