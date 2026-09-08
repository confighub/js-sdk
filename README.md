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
every publish, whether a spec re-pin or a hand-written change. All three packages
publish together at one version. How a version comes to be is under "Releasing".
`@confighub/api` also exports the server's input-validation constants
(`SLUG_PATTERN`, `LABEL_KEY_MAX_LENGTH`, …) for validating forms.

## Commits

Commit subjects are `type(scope): what changed`, since the changelog is generated from
them. Types: `feat`, `fix`, `docs`, `chore`, `ci`. Scopes: `api`, `react-auth`,
`rtk-query`, `spec` (a re-pin, written by the update-spec workflow), or none. A `!` after
the type, or a `BREAKING CHANGE:` footer, marks a breaking change. Merge commits are
ignored, so a PR's own commits are what appear. Nothing enforces the format; a commit
that does not follow it lands under "Other" in the changelog.

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
reviewable diff. The pin moves automatically with each ConfigHub release (see
"Releasing"); to work ahead of one, sync from a checkout as above and keep the result on
a branch.

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

Nothing here is versioned or published by hand. A release is a `vX.Y.Z` tag, and two
things create one:

**A ConfigHub release** (the usual case). `.github/workflows/update-spec.yml` runs
every hour, on demand, and immediately when the ConfigHub release workflow dispatches a
`confighub-release` event. It re-pins `.spec-version` at the latest `confighub/sdk`
release, regenerates both clients, and typechecks the hand-written code against them; a
regeneration that no longer typechecks fails there and nothing is committed. Then:

- If the generated files changed (`schema.d.ts`, `confighubApi.gen.ts`,
  `validation.ts`), it commits `feat(spec): ConfigHub vA.B.C` to `main` with a summary
  of what the API gained or lost as the body, computes the next version with
  `scripts/next-version.mjs` (`X.Y` from the new spec, `Z` the next patch), pushes the
  tag, and calls the release workflow.
- If they are identical, it commits `chore(spec): pin ConfigHub vA.B.C, generated
  clients unchanged` and stops. Nothing goes to npm. The pin still moves, so the next
  published version names the spec it was built against.

**A hand-written change** (react-auth, the API client's non-generated code, this
README). Merge it, then push the next tag; `next-version.mjs` prints it and refuses a
tag whose `X.Y` does not match the pinned spec:

```
git tag "v$(node scripts/next-version.mjs)"
git push origin --tags       # triggers .github/workflows/release.yml
```

**What the release workflow does**, on either path (`.github/workflows/release.yml`):
checks the version against the pinned spec, sets every package to it (the `package.json`
versions in the repo are placeholders), builds, publishes all three to npm with
provenance, renders the commits since the previous tag into a section with
[git-cliff](https://git-cliff.org) (`cliff.toml`), prepends that section to
`CHANGELOG.md` on `main` as `docs(changelog): vX.Y.Z`, and creates a GitHub release
under the tag with the same text as its notes. npm is the authoritative record; the
GitHub release and `CHANGELOG.md` are the readable one.

| Piece | Where |
| --- | --- |
| Pinned spec version | `.spec-version` |
| Fetch the spec, regenerate both clients | `scripts/sync-spec.mjs` (`npm run sync-spec`) |
| Re-pin, regenerate, summarize the API diff | `scripts/update-spec.sh`, `scripts/spec-diff.mjs` |
| Next version, and the `X.Y` check | `scripts/next-version.mjs` |
| Automatic re-pin and publish | `.github/workflows/update-spec.yml` |
| Publish, changelog, GitHub release | `.github/workflows/release.yml`, `cliff.toml` |

## Standards

| Concern | Standard |
| --- | --- |
| Bearer token on `/api` | OAuth 2.0 Bearer (RFC 6750) |
| Browser login | OIDC Core + PKCE (RFC 7636) |
| Mint a ConfigHub token from an IdP token | OAuth 2.0 Token Exchange (RFC 8693) |
| Issuer / endpoint discovery | OIDC Discovery / AS Metadata (RFC 8414) |
| Per-app registration (Cloud) | Dynamic Client Registration (RFC 7591) |
