# ConfigHub JavaScript SDK

Two small packages for building browser apps on the ConfigHub API:

- [`@confighub/api`](packages/api) — a typed, framework-agnostic client generated
  from the ConfigHub OpenAPI spec. No Redux, no React, no required provider.
- [`@confighub/react-auth`](packages/react-auth) — a React provider and hooks that
  run the browser-direct auth flow (OIDC PKCE + RFC 8693 token exchange) and hand
  back a client pre-wired with the token.

They compose but are independently usable. The only contract between them is a
`getToken()` seam: the client accepts a token source; the auth layer provides one.

## Try it (the example app)

`examples/space-browser` is a full app built on both packages — it logs you in and
browses your spaces and units. Nothing is published to npm; the example uses the
packages straight from this repo, so cloning and running is all it takes.

Prerequisites: Node 18+, and [`cub`](https://docs.confighub.com) logged in to a
ConfigHub instance with browser auth enabled (`hub.confighub.com` works).

1. Clone and install:

   ```
   git clone git@github.com:confighub/js-sdk.git
   cd js-sdk
   npm install
   ```

2. Register your app to get a `client_id` (it registers in whatever org your `cub` is
   currently logged into; a `client_id` is public, not a secret):

   ```
   cub oauthclient create my-tryout --redirect-uri http://localhost:5173/
   ```

3. Configure the example — copy the template and paste in your `client_id`:

   ```
   cp examples/space-browser/.env.example examples/space-browser/.env
   # edit examples/space-browser/.env: set VITE_OAUTH_CLIENT_ID
   # (VITE_CONFIGHUB_BASE_URL defaults to https://hub.confighub.com)
   ```

4. Run it:

   ```
   npm run example       # vite dev server on http://localhost:5173
   ```

   Open http://localhost:5173, click Log in, and — if you belong to more than one org —
   pick the same org your `cub` is logged into (the app can only sign you in for the org
   that owns its `client_id`).

When you're done, remove the throwaway client: `cub oauthclient delete my-tryout`.

## Quick start (React)

```tsx
import { ConfigHubAuthProvider, useAuth, useConfigHub } from '@confighub/react-auth';

function Root() {
  return (
    <ConfigHubAuthProvider baseUrl="https://hub.confighub.com" clientId={CLIENT_ID}>
      <App />
    </ConfigHubAuthProvider>
  );
}

function App() {
  const { status, user, login } = useAuth();
  const api = useConfigHub();

  if (status !== 'authenticated') return <button onClick={login}>Log in</button>;

  // `api` is a typed client (see below); calls are fully typed against the pinned spec:
  //   await api.GET('/me')
  //   await api.GET('/space/{space_id}/unit', { params: { path: { space_id } } })
  return <div>signed in as org {user!.organizationId}</div>;
}
```

`clientId` comes from registering the app: `cub oauthclient create <name>
--redirect-uri <origin>`. The issuer and endpoints are discovered at runtime from
`{baseUrl}/api/info`, so the same build runs against any ConfigHub instance.

## Using the API client on its own

```ts
import { createConfigHubClient } from '@confighub/api';

const api = createConfigHubClient({
  baseUrl: 'https://hub.confighub.com',
  getToken: () => myToken,
});
const { data, error } = await api.GET('/space/{space_id}/unit', {
  params: { path: { space_id } },
});
```

## How this repo relates to the spec

Unlike the Go SDK (`confighub/sdk`, a mirror of the monorepo), this repo is the home
of its own code. The one thing it pulls from ConfigHub is the OpenAPI spec, pinned to
a released server version in [`.spec-version`](.spec-version).

```
npm run sync-spec          # fetch openapi.json at .spec-version, regenerate types
```

The fetched `openapi.json` and generated `packages/api/src/schema.d.ts` are committed,
so a spec change is a reviewable diff. Bumping the targeted server version is: edit
`.spec-version`, run `sync-spec`, review, release. CI can do this via the
`Sync OpenAPI spec` workflow, which opens a PR with a changeset.

## Development

```
npm install
npm run sync-spec        # generate the client types (needed once before build)
npm run build            # tsup -> dual ESM/CJS + d.ts for both packages
npm run typecheck
```

Versioning is managed with [changesets](https://github.com/changesets/changesets):
add one with `npm run changeset` for any change you want to publish.

## Standards

| Concern | Standard |
| --- | --- |
| Bearer token on `/api` | OAuth 2.0 Bearer (RFC 6750) |
| Browser login | OIDC Core + PKCE (RFC 7636) |
| Mint a ConfigHub token from an IdP token | OAuth 2.0 Token Exchange (RFC 8693) |
| Issuer / endpoint discovery | OIDC Discovery / AS Metadata (RFC 8414) |
| Per-app registration (Cloud) | Dynamic Client Registration (RFC 7591) |
