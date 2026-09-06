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
- `persist` (default `'none'`) — `'session'` keeps the session in `sessionStorage`,
  so a reload or in-tab navigation does not round-trip through the IdP. Tab-scoped,
  gone when the tab closes, dropped when the token has expired.
- `onUnauthorized` (default `'login'`) — what a 401 from the API means. `'login'`
  tries a silent re-authentication; `'logout'` just drops the session.

The IdP issuer and OIDC endpoints are discovered from `{baseUrl}/api/info`, so the
same build runs against any ConfigHub instance (the bundled Keycloak for Cloud, an
organization's own IdP for Enterprise).

## `useAuth()`

```ts
const { status, user, error, login, logout, switchOrganization, reauthenticate, getToken } = useAuth();
```

- `login(options?)` — redirects to the IdP. `returnTo` picks the landing path
  (default: the current one). `organization` is a Keycloak organization alias, sent
  as the `organization:<alias>` scope so a multi-org user is not prompted. Left
  out, the alias of the last successful login in this browser is used (remembered
  per client in `localStorage`; a short public name, not a credential), so a new
  tab or a login after logout lands in the same organization silently. `null`
  sends no hint on purpose, so Keycloak prompts: that is "switch organization".
  `prompt: 'none' | 'login'` is passed through.
- `logout(options?)` — forgets the session in this tab. `endSession: true` also ends
  the IdP session (RP-initiated logout with `id_token_hint`), landing on
  `postLogoutRedirectUri` (default: the callback URI), which must be registered
  for the client. Without it the next login rides the SSO cookie silently.
- `switchOrganization(organizationId)` — `POST /auth/switch-organization` with the
  bearer token, re-minting for another org the user belongs to. Requires a server
  that offers the bearer form; a fresh `login()` with no organization hint is the
  portable alternative, since the IdP then prompts for the organization.
- `reauthenticate()` — the token stopped working: a `prompt=none` round trip for the
  organization the session already had. Status is `loading` meanwhile, not
  `unauthenticated`, so an app that auto-logs-in on `unauthenticated` does not race
  it. If the IdP session is gone too, the page comes back `unauthenticated`.

## Token posture

The minted token is kept in memory by default; opt in to `sessionStorage` with
`persist: 'session'`. Never `localStorage`. The transient PKCE state is parked in
`sessionStorage` across the authorize redirect. A 401 triggers a silent
re-authentication (see `onUnauthorized`), which needs a live IdP session; refresh
tokens are not used.

`react` (18 or 19) is a peer dependency.
