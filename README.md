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
version-pegged spec, same `getToken` auth seam, different generator, no shared code.
Pick one. The only contract between the auth package and a client is `getToken()`: the
client accepts a token source; the auth layer provides one (via `useConfigHub()` for the
plain client, or `getAccessToken` for RTK Query).

## Versions

`X.Y` of a package version is the ConfigHub API version it was generated against
(the pinned spec's; see `.spec-version`), the same rule the server and `cub` use:
`@confighub/*@0.4.7` speaks the same API as any `v0.4.*` server. `Z` increments on
every publish. Each ConfigHub release re-pins the spec and publishes automatically
(`.github/workflows/update-spec.yml`); a hand-written change publishes by pushing the
next `vX.Y.Z` tag. `@confighub/api` also exports the server's input-validation
constants (`SLUG_PATTERN`, `LABEL_KEY_MAX_LENGTH`, …) for validating forms.

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

Unlike the Go SDK (`confighub/sdk`, a mirror of the monorepo), this repo is the home
of its own code. The one thing it pulls from ConfigHub is the OpenAPI spec, pinned to
a released server version in [`.spec-version`](.spec-version).

```
npm run sync-spec          # fetch the pinned spec, regenerate BOTH clients

# Or from a checkout, which is the only way to sync against a server whose spec
# no release carries yet:
SPEC_FILE=../confighub/public/core/openapi/openapi.json npm run sync-spec
```

One pegged spec drives both clients through their own generators: `openapi-typescript`
for `@confighub/api`, `@rtk-query/codegen-openapi` for `@confighub/rtk-query`. The
fetched root `openapi.json` and both generated files (`packages/api/src/schema.d.ts`,
`packages/rtk-query/src/confighubApi.gen.ts`) are committed, so a spec change is a
reviewable diff. Bumping the targeted server version is: edit `.spec-version`, run
`npm run sync-spec`, commit the regenerated files, and open a PR.

## Development

```
npm install
npm run sync-spec        # generate the client types (needed once before build)
npm run build            # tsup -> dual ESM/CJS + d.ts for all packages
npm run typecheck
npm run example          # run examples/space-browser (plain client)
npm run example:rtk      # run examples/space-browser-rtk (RTK Query)
```

## Releasing

Publishing is tag-driven (matching the main codebase). The git tag is the source of
truth for the version; CI sets each package to that version and publishes all three to
npm with provenance.

```
git tag v0.2.0
git push origin v0.2.0     # triggers .github/workflows/release.yml
```

Use a `v*.*.*` semver tag. The package.json versions in the repo are placeholders that
CI overwrites at publish time, so they don't need bumping by hand.

## Standards

| Concern | Standard |
| --- | --- |
| Bearer token on `/api` | OAuth 2.0 Bearer (RFC 6750) |
| Browser login | OIDC Core + PKCE (RFC 7636) |
| Mint a ConfigHub token from an IdP token | OAuth 2.0 Token Exchange (RFC 8693) |
| Issuer / endpoint discovery | OIDC Discovery / AS Metadata (RFC 8414) |
| Per-app registration (Cloud) | Dynamic Client Registration (RFC 7591) |
