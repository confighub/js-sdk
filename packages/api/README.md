# @confighub/api

A typed, framework-agnostic client for the [ConfigHub](https://confighub.com) API,
generated from the ConfigHub OpenAPI spec. Built on
[openapi-fetch](https://openapi-ts.dev/openapi-fetch/) — a few KB, no Redux, no
React, no required provider. Every path, parameter, and response is typed against a
pinned server version.

```ts
import { createConfigHubClient } from '@confighub/api';

const api = createConfigHubClient({
  baseUrl: 'https://hub.confighub.com',
  getToken: () => session.accessToken, // optional; sets Authorization: Bearer
});

const me = await api.GET('/me');
const { data, error } = await api.GET('/space/{space_id}/unit', {
  params: { path: { space_id } },
});
```

## Options

- `baseUrl` — absolute base URL of the ConfigHub instance.
- `getToken?` — returns the current bearer token (may be async). Wired as a
  per-request middleware. The client never stores or refreshes tokens; pair it with
  [`@confighub/react-auth`](https://www.npmjs.com/package/@confighub/react-auth) or
  supply your own token source.
- `onUnauthorized?` — called on a 401 so the caller can refresh or re-login. The
  request is not retried automatically.
- `fetch?` — override the fetch implementation.

## Configuration data

A Unit's configuration is not a field of the Unit. `Unit`, `Revision` and `Release` carry
`DataHash` and `DataSize`; the document itself lives on its own endpoints, which serve it
as `application/octet-stream`. `openapi-fetch` parses every response as JSON and
serializes every body with `JSON.stringify`, and both are wrong for a document — so use
these helpers rather than calling those paths directly:

```ts
import { getUnitData, putUnitData, getUnitMutationSources } from '@confighub/api';

const { data: config, dataHash, notModified } = await getUnitData(api, { spaceId, unitId });

const { data: result } = await putUnitData(api, { spaceId, unitId }, config + '\n', {
  ifMatch: dataHash,             // 409 rather than clobbering a concurrent write
  lastChangeDescription: 'note',
  include: 'ConfigData',         // the configuration the write produced
});
const unit = result?.Unit;       // a write answers with the result, not the entity
```

- `getUnitData` / `getRevisionData` / `getReleaseData` read text, and return the `DataHash`
  from the ETag. Pass it back as `ifNoneMatch` to get `notModified: true` instead of a body
  when nothing changed.
- `putUnitData` writes it. **Every parameter describing how the configuration should land
  belongs here**, not on a metadata update that precedes it — `mergeExternalSource`,
  `mergeBase`, `mergeEnableSubtraction`, `protect`, `clearance`, `tag`, `subgroup`,
  `changeSetId`, `lastChangeDescription` and `dryRun`. A metadata call changes no
  configuration, so anything sent there is silently dropped.
- An **empty configuration is a configuration** — emptying a Unit is how its resources are
  withdrawn — so never guard the write with `if (config)`.
- `getUnitMutationSources` / `getRevisionMutationSources` read what set each value.

For a list, read many at once rather than one request per Unit. Those are ordinary JSON,
so the client handles them directly:

```ts
const { data } = await api.GET('/unit_data', {
  params: { query: { where: `SpaceID = '${spaceId}'` } },
});
```

`/revision_data`, `/unit_mutation_sources` and `/revision_mutation_sources` are the same
shape. All four are organization-scoped and take a `where` clause.

## Writes answer with the operation's result

`POST /space/{id}/unit`, `PUT` and `PATCH` on one, the data write, and the bulk forms all
return `UnitCreateOrUpdateResponse` rather than a `Unit` — unwrap `.Unit`. Naming
`ConfigData` or `MutationSources` in `include` adds the configuration the operation
produced and what set each value in it; for a `dryRun` that is the only place the result
exists, because nothing was stored. An `include` naming neither those nor an expandable
field is a 400.

## Types

The full generated surface is exported for reuse:

```ts
import type { paths, components } from '@confighub/api';
type Unit = components['schemas']['Unit'];
```

`Data` and `MutationSources` are not fields of any entity, so naming either in a `select`
is a 400 rather than a silently absent field. There is one content hash, `DataHash`;
`ContentHash` and `RevisionHash` no longer exist.

Types track the ConfigHub server version pinned in the SDK repo's `.spec-version`.
