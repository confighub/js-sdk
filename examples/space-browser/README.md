# Space Browser example

A full ConfigHub browser app in ~200 lines, built on the two SDK packages:

- [`@confighub/react-auth`](../../packages/react-auth) runs the login flow and gives
  the app a token-wired API client.
- [`@confighub/api`](../../packages/api) is that typed client — every call below is
  checked against the pinned server spec.

It logs a real user in (OIDC PKCE → RFC 8693 token exchange), then lists the org's
spaces with unit counts and drills into a space to show its units. Read-only.

## What to look at

- `src/main.tsx` — wraps the app in `<ConfigHubAuthProvider baseUrl clientId>`.
- `src/App.tsx` — `useAuth()` for the login gate, user, and sign-out.
- `src/SpaceBrowser.tsx` — `useConfigHub()` for the typed client, then
  `api.GET('/space')` and `api.GET('/space/{space_id}/unit', { params: { path: { space_id } } })`.
  No Redux, no data-fetching library — just the client and `useState`.

The only seam between auth and API access is `useConfigHub()`: the token is attached
for you.

## Run it

1. Register this app to get a `client_id` (from the ConfigHub monorepo, or any
   machine with `cub`):

   ```
   cub oauthclient create space-browser --redirect-uri http://localhost:5173/
   ```

2. Configure and run (from the SDK repo root):

   ```
   cp examples/space-browser/.env.example examples/space-browser/.env
   # edit .env: set VITE_OAUTH_CLIENT_ID (and VITE_CONFIGHUB_BASE_URL if not the default)
   npm install
   npm run example          # vite dev server on http://localhost:5173
   ```

3. Open http://localhost:5173, click Log in, and browse.

The dev server is pinned to port 5173 because the registered `redirect_uri` must
match. The issuer and OIDC endpoints are discovered from `{baseUrl}/api/info`, so the
same build runs against any ConfigHub instance.

## Outside this monorepo

Here the packages resolve to their workspace source (see `vite.config.ts` aliases).
A standalone copy of this app just depends on the published packages and drops those
aliases:

```
npm install @confighub/api @confighub/react-auth react react-dom
```
