# @confighub/react-auth

## 0.4.2

- `login()` remembers the organization of the last successful login (its Keycloak
  alias, per client, in `localStorage`) and hints it by default, so a new tab or a
  login after logout does not stop at Keycloak's organization picker.
  `login({ organization: null })` asks on purpose. `rememberedOrganization(clientId)`
  and `organizationAliasOf(claims)` are exported.

## 0.2.0

### Minor Changes

- Fixed redirect URI (`{origin}{callbackPath}`, default `/`); the page a login
  started from travels in the PKCE state and is restored on return. Register one
  redirect URI per origin instead of one per page.
- `login(options)`: `returnTo`, `organization` (Keycloak alias hint, sent as the
  `organization:<alias>` scope), `prompt: 'none' | 'login'`. A `prompt=none` round
  trip that comes back `login_required` resolves to `unauthenticated` instead of
  throwing.
- `logout({ endSession, postLogoutRedirectUri })`: RP-initiated logout at the IdP's
  `end_session_endpoint` with `id_token_hint`; the `id_token` is kept on the session.
- `switchOrganization(orgId)`: `POST /auth/switch-organization` with the bearer token.
- `reauthenticate()`: silent re-auth for the session's own organization with status
  held at `loading`; used by the client's 401 path when `onUnauthorized` is `'login'`.
- `persist: 'session'` keeps the session in `sessionStorage` across reloads.
- New exports: `callbackUri`, `decodeJwtClaims`, `isExpired`, `LoginOptions`,
  `LogoutOptions`, `FlowOptions`.

### Breaking

- `login` and `logout` take an options object, so `onClick={login}` must become
  `onClick={() => login()}` (a click event is not `LoginOptions`).

## 0.1.0

### Minor Changes

- 4172cc4: Initial public release: `@confighub/api` (typed openapi-fetch client),
  `@confighub/react-auth` (browser auth provider + hooks), and `@confighub/rtk-query`
  (RTK Query client).

### Patch Changes

- Updated dependencies [4172cc4]
  - @confighub/api@0.1.0
