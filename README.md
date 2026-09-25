# ConfigHub JavaScript SDK

Packages for building browser apps on the ConfigHub API:

- [`@confighub/react-auth`](packages/react-auth) — a React provider and hooks that
  run the browser-direct auth flow (OIDC PKCE + RFC 8693 token exchange) and hand
  back a client pre-wired with the token.
- [`@confighub/api`](packages/api) — a typed, framework-agnostic client (openapi-fetch).
  No Redux, no React, no required provider. Reach for this by default.
- [`@confighub/rtk-query`](packages/rtk-query) — an [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
  client (generated hooks, cache tags) for apps already on Redux Toolkit.

`@confighub/api` and `@confighub/rtk-query` are parallel, independent clients: same
spec, same `getToken` auth seam, different generator, no shared code.
Pick one. The only contract between the auth package and a client is `getToken()`: the
client accepts a token source; the auth layer provides one (via `useConfigHub()` for the
plain client, or `getAccessToken` for RTK Query).

## Versions

A package version is the version of the ConfigHub server it was generated from, the
same rule `cub` uses: `@confighub/*@0.5.8` is ConfigHub `v0.5.8`'s API, and `X.Y`
names the API any `v0.5.*` server speaks. Every ConfigHub release publishes all three
packages at its version, including releases whose API did not change. `@confighub/api`
also exports the server's input-validation constants (`SLUG_PATTERN`,
`LABEL_KEY_MAX_LENGTH`, …) for validating forms.

## Contributing

The packages are developed in the ConfigHub server's repository, next to the API they
describe, and copied here on each release (see "Releasing"). A pull request here is
welcome and is carried over by hand. `examples/`, `CHANGELOG.md` and the workflows in
`.github/` belong to this repository and are changed here directly.

## Try it (the example app)

`examples/space-browser` is a full app built on `@confighub/api` and
`@confighub/react-auth` — it logs you in and browses your spaces and units.
`examples/space-browser-rtk` is the same app on `@confighub/rtk-query`. Each is a
standalone app that installs the published packages from npm, exactly as your own app
would.

Prerequisites: Node 18+, and [`cub`](https://docs.confighub.com) logged in to a
ConfigHub instance with browser auth enabled (`hub.confighub.com` works).

1. Clone and install the example:

   ```
   git clone git@github.com:confighub/js-sdk.git
   cd js-sdk/examples/space-browser
   npm install
   ```

2. Register your app to get a `client_id` (it registers in whatever org your `cub` is
   currently logged into; a `client_id` is public, not a secret):

   ```
   cub oauthclient create my-tryout --redirect-uri http://localhost:5173/
   ```

3. Configure the example — copy the template and paste in your `client_id`:

   ```
   cp .env.example .env
   # edit .env: set VITE_OAUTH_CLIENT_ID
   # (VITE_CONFIGHUB_BASE_URL defaults to https://hub.confighub.com)
   ```

4. Run it:

   ```
   npm run dev           # vite dev server on http://localhost:5173
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

## Configuration data

A Unit's configuration is not a field of the Unit. `Unit`, `Revision` and `Release` carry
`DataHash` and `DataSize` — enough to tell whether a document changed and how big it is —
and the document itself is read from and written to its own endpoints, which serve it as
`application/octet-stream` rather than as JSON. So a list of a thousand Units is a list,
not a thousand documents.

```ts
import { getUnitData, putUnitData } from '@confighub/api';

const { data: config, dataHash } = await getUnitData(api, { spaceId, unitId });
await putUnitData(api, { spaceId, unitId }, edited, {
  ifMatch: dataHash, // fail rather than clobber somebody else's write
  lastChangeDescription: 'raise replicas',
});
```

The RTK Query client has the same endpoints as generated hooks
(`useDownloadUnitDataQuery`, `useUploadUnitDataMutation`,
`useGetUnitMutationSourcesQuery`, and the bulk `useSearchUnitDataQuery`).

Three things are easy to get wrong, and none of them are caught by the type checker:

- **Do not JSON-parse a configuration.** Both clients are wired to read a response as
  whatever the server says it is. `@confighub/rtk-query` sets
  `responseHandler: 'content-type'`; `@confighub/api` reads through the helpers above,
  which pass `parseAs: 'text'`. Calling `api.GET('.../data')` yourself parses YAML as
  JSON and throws.
- **A write answers with the operation's result, not the entity.** `POST`/`PUT`/`PATCH`
  on a Unit, the data write, and the bulk forms all return `UnitCreateOrUpdateResponse`;
  the Unit is in its `Unit` field. Ask for `include: 'ConfigData,MutationSources'` to get
  back the configuration the operation produced — for a dry run that is the only place it
  exists, since nothing was stored.
- **An empty configuration is a configuration.** Emptying a Unit is how its resources are
  withdrawn, so never guard the write with `if (config)`. Track whether a configuration
  was supplied separately from what it contains.

For a list, read the configurations in one request rather than one per Unit:
`GET /unit_data`, `/revision_data`, `/unit_mutation_sources` and
`/revision_mutation_sources` each take a `where` clause and are organization-scoped.

`Data` and `MutationSources` are no longer names any entity has, so naming either in a
`select` is a 400 rather than a silently missing field. `ContentHash` and `RevisionHash`
are gone; there is one hash, `DataHash`.

## How this repo relates to the spec

The clients are generated from the server's OpenAPI spec in the server's own
repository, by `scripts/generate.mjs`: `openapi-typescript` for `@confighub/api`,
`@rtk-query/codegen-openapi` for `@confighub/rtk-query`, and the server's validation
constants copied into `@confighub/api`. A server change and the client code that uses
it land together there. The generated files (`packages/api/src/schema.d.ts`,
`packages/rtk-query/src/confighubApi.gen.ts`, `packages/api/src/validation.ts`) are
committed, so they are here as published and the packages build without the spec.

## Development

```
npm install
npm run build            # tsup -> dual ESM/CJS + d.ts for all packages
npm run typecheck
```

Each example is its own app; see its README.

## Releasing

Nothing here is versioned or published by hand. On each ConfigHub release `vX.Y.Z`, the
server's release workflow copies the packages here, sets all three to `X.Y.Z`, prepends
a section to `CHANGELOG.md` (the notes written for the release, then what the API spec
gained or lost since the previous release), commits `ConfigHub vX.Y.Z`, and pushes the
tag `vX.Y.Z`. The tag runs `.github/workflows/release.yml`, which builds, publishes all
three packages to npm with provenance, and creates a GitHub release with that
`CHANGELOG.md` section as its notes. npm is the authoritative record; the GitHub
release and `CHANGELOG.md` are the readable one.

## Standards

| Concern | Standard |
| --- | --- |
| Bearer token on `/api` | OAuth 2.0 Bearer (RFC 6750) |
| Browser login | OIDC Core + PKCE (RFC 7636) |
| Mint a ConfigHub token from an IdP token | OAuth 2.0 Token Exchange (RFC 8693) |
| Issuer / endpoint discovery | OIDC Discovery / AS Metadata (RFC 8414) |
| Per-app registration (Cloud) | Dynamic Client Registration (RFC 7591) |
