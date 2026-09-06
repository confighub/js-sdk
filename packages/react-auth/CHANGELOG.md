# @confighub/react-auth

## 0.4.4

- A redirect carrying an authorization code that this tab holds no PKCE state for
  (Keycloak's password-reset and verify-email links finish the login in the tab the
  mail opened) no longer surfaces as "no PKCE state; restart login". It is treated
  as a normal load, so the caller's usual login start runs and completes silently
  against the now-live IdP session.

## 0.4.3

- A login that comes back with an IdP token naming no organization (a fresh brokered
  login, e.g. Google after logout, where Keycloak's organization step does not run)
  no longer surfaces as an exchange error: the login is retried once with no hint,
  and with the SSO session now alive the IdP prompts. Any remembered alias is
  forgotten first. `OrganizationMissing` is exported for callers that drive
  `completeLoginFromRedirect` themselves.

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
