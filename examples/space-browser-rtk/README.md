# Space Browser example (RTK Query)

The same app as [`space-browser`](../space-browser), but data access goes through
[`@confighub/rtk-query`](../../packages/rtk-query) instead of the plain
[`@confighub/api`](../../packages/api) client. Auth is identical — the same
[`@confighub/react-auth`](../../packages/react-auth) provider and login flow.

Use this side-by-side with `space-browser` to compare the two approaches:

- `src/store.ts` — mounts `confighubApi.reducer` + `confighubApi.middleware`.
- `src/main.tsx` — `configureConfigHub({ baseUrl, getToken: getAccessToken })` once, then
  wraps the app in the react-redux `<Provider>` and `<ConfigHubAuthProvider>`.
- `src/SpaceBrowser.tsx` — `useListSpacesQuery()` and `useListUnitsQuery({ spaceId })`.
  Caching, dedup, and loading state come from RTK Query; compare with the plain example's
  manual `fetch` + `useState` in the same file.
- `useDownloadUnitDataQuery({ spaceId, unitId })` in the same file — a Unit's
  configuration is not a field of the Unit. The list carries each Unit's `DataSize`, shown
  as a column; the document comes from the Unit's data endpoint as
  `application/octet-stream`, which arrives as a string because the base query is
  configured with `responseHandler: 'content-type'`.

The token seam is the same `getToken` contract as the plain client — here the RTK base
query reads `getAccessToken()` (react-auth's non-React accessor) in `prepareHeaders`.

## Run it

This example runs on port 5174 (the plain one uses 5173), so register the redirect URI
for 5174:

```
cub oauthclient create space-browser-rtk --redirect-uri http://localhost:5174/

cp examples/space-browser-rtk/.env.example examples/space-browser-rtk/.env
# edit .env: set VITE_OAUTH_CLIENT_ID
npm install
npm run example:rtk       # vite dev server on http://localhost:5174
```

Open http://localhost:5174, log in, and browse. Clean up with
`cub oauthclient delete space-browser-rtk`.
