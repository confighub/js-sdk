# @confighub/rtk-query

An [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) client for the
[ConfigHub](https://confighub.com) API — generated endpoints, hooks, and cache tags,
with bearer auth. Use this if your app is already on Redux Toolkit and you want the
`useListUnitsQuery(...)` style with automatic caching and invalidation.

If you are not on Redux, use [`@confighub/api`](https://www.npmjs.com/package/@confighub/api)
instead — a tiny framework-agnostic client. The two are parallel: same version-pegged
spec, same `getToken` auth seam, different generator. They share no code.

## Setup

Configure the api once, then add it to your store:

```ts
import { configureStore } from '@reduxjs/toolkit';
import { confighubApi, configureConfigHub } from '@confighub/rtk-query';
import { getAccessToken } from '@confighub/react-auth';

configureConfigHub({
  baseUrl: 'https://hub.confighub.com',
  getToken: getAccessToken, // any () => string | undefined; token source is your choice
});

export const store = configureStore({
  reducer: { [confighubApi.reducerPath]: confighubApi.reducer },
  middleware: (getDefault) => getDefault().concat(confighubApi.middleware),
});
```

Wrap your app in the react-redux `<Provider store={store}>` as usual.

## Use

```tsx
import { useListSpacesQuery, useListUnitsQuery } from '@confighub/rtk-query';
import { skipToken } from '@reduxjs/toolkit/query';

function Spaces() {
  const { data: spaces, isLoading } = useListSpacesQuery();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const { data: units } = useListUnitsQuery(spaceId ? { spaceId } : skipToken);
  // ...
}
```

## Configuration data

A Unit's configuration is not a field of the Unit. `Unit`, `Revision` and `Release` carry
`DataHash` and `DataSize`; the document itself has its own endpoints, and its own hooks:

```tsx
const { data: config } = useDownloadUnitDataQuery({ spaceId, unitId });   // a string
const [uploadUnitData] = useUploadUnitDataMutation();

await uploadUnitData({
  spaceId,
  unitId,
  body: edited,                       // the document, not a JSON envelope
  lastChangeDescription: 'raise replicas',
  include: 'ConfigData',              // the configuration the write produced
}).unwrap();
```

`useGetUnitMutationSourcesQuery` reads what set each value. For a list, use the bulk
queries — `useSearchUnitDataQuery`, `useSearchRevisionDataQuery`,
`useSearchUnitMutationSourcesQuery`, `useSearchRevisionMutationSourcesQuery` — each of
which takes a `where` clause and answers for many Units in one request. One request per
Unit is what taking the configuration off the entity was meant to avoid.

Three things to know, none of which the type checker enforces:

- **These endpoints serve `application/octet-stream`.** The base query sets
  `responseHandler: 'content-type'` for exactly this reason: RTK Query's default `'json'`
  handler `JSON.parse`s every body, which fails on YAML and surfaces as a parse error with
  no data — an empty editor and nothing to say why. If you build your own base query,
  carry that setting over.
- **A write answers with the operation's result, not the entity.** `useCreateUnitMutation`,
  `useUpdateUnitMutation`, `usePatchUnitMutation`, `useUploadUnitDataMutation` and the bulk
  forms return `UnitCreateOrUpdateResponse`; the Unit is in its `Unit` field. For a
  `dryRun`, `include: 'ConfigData,MutationSources'` is the only way to see what the
  operation produced, since nothing was stored.
- **An empty configuration is a configuration** — emptying a Unit is how its resources are
  withdrawn — so never guard the upload with `if (body)`.

Every parameter describing how the configuration should land goes on
`uploadUnitData`, not on a metadata update before it: `mergeExternalSource`, `mergeBase`,
`mergeEnableSubtraction`, `protect`, `clearance`, `tag`, `subgroup`, `changeSetId`,
`lastChangeDescription` and `dryRun`. A metadata call changes no configuration, so
anything sent there is silently dropped.

Naming `Data` or `MutationSources` in a `select` is a 400 rather than a silently absent
field. There is one content hash, `DataHash`; `ContentHash` and `RevisionHash` are gone.

## Notes

- `baseUrl` is the instance origin; the client targets `{baseUrl}/api`. Same value as
  the auth provider.
- The api is a module singleton, so `baseUrl`/`getToken` are set at configure time, not
  per instance — the one ergonomic difference from `@confighub/api`.
- A 401 calls your `onUnauthorized` (if provided); it does not redirect.
- Peer deps: `@reduxjs/toolkit`, `react`, `react-redux`.
- Endpoints and types are regenerated from the pinned server spec (`.spec-version`) by
  `@rtk-query/codegen-openapi`.
