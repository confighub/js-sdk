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

Not yet implemented: silent refresh via refresh-token rotation, and IdP
end-session on logout. Today a 401 or `logout()` returns the app to the login
screen. These follow the server-side refresh-rotation work.

`react` (18 or 19) is a peer dependency.
