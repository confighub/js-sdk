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

## Notes

- `baseUrl` is the instance origin; the client targets `{baseUrl}/api`. Same value as
  the auth provider.
- The api is a module singleton, so `baseUrl`/`getToken` are set at configure time, not
  per instance — the one ergonomic difference from `@confighub/api`.
- A 401 calls your `onUnauthorized` (if provided); it does not redirect.
- Peer deps: `@reduxjs/toolkit`, `react`, `react-redux`.
- Endpoints and types are regenerated from the pinned server spec (`.spec-version`) by
  `@rtk-query/codegen-openapi`.
