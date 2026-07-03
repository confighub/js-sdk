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

## Types

The full generated surface is exported for reuse:

```ts
import type { paths, components } from '@confighub/api';
type Unit = components['schemas']['Unit'];
```

Types track the ConfigHub server version pinned in the SDK repo's `.spec-version`.
