// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ConfigHubConfig {
  /**
   * Base URL of the ConfigHub instance, e.g. `https://hub.confighub.com`. The API is
   * mounted under `/api`, so the client targets `{baseUrl}/api`. A URL already ending
   * in `/api` is accepted as-is.
   */
  baseUrl: string;
  /**
   * Returns the current bearer token, or undefined when unauthenticated. May be async.
   * Called in `prepareHeaders` per request. The same seam as `@confighub/api` — pair it
   * with `@confighub/react-auth`'s `getAccessToken`, or your own token source.
   */
  getToken?: () => string | undefined | Promise<string | undefined>;
  /** Called on a 401 so the app can refresh or re-login. The query is not retried. */
  onUnauthorized?: () => void | Promise<void>;
}

// Endpoints whose ConfigHub handlers expect RFC 7386 merge-patch semantics. Mirrors the
// first-party UI's base query (endpoint names are the camelCased operationIds).
const MERGE_PATCH_PREFIXES = ['patch', 'bulkPatch', 'bulkCreate', 'patchView'];

// The one endpoint whose request body is a configuration document rather than JSON.
const OCTET_STREAM_ENDPOINTS = ['uploadUnitData'];

const apiBaseUrl = (raw: string): string => {
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : trimmed + '/api';
};

let config: ConfigHubConfig | null = null;
let inner: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> | null = null;

/**
 * Configure the ConfigHub API before dispatching any query — call once at store setup.
 * Unlike the plain `@confighub/api` client (a per-instance factory), the RTK Query api
 * is a module singleton, so its base URL and token source are set here rather than per
 * instance.
 *
 * ```ts
 * import { getAccessToken } from '@confighub/react-auth';
 * configureConfigHub({ baseUrl: 'https://hub.confighub.com', getToken: getAccessToken });
 * ```
 */
export function configureConfigHub(cfg: ConfigHubConfig): void {
  config = cfg;
  inner = fetchBaseQuery({
    baseUrl: apiBaseUrl(cfg.baseUrl),
    isJsonContentType: (headers) => (headers.get('Content-Type') ?? '').includes('json'),
    // Read a response as what the server says it is, rather than assuming JSON. The
    // configuration endpoints (downloadUnitData, downloadRevisionData, downloadReleaseData)
    // serve the document itself as application/octet-stream; the default 'json' handler
    // JSON.parses every body, which fails on YAML and surfaces as a parse error with no
    // data -- an empty editor and nothing to say why. 'content-type' routes the decision
    // through isJsonContentType above, so those come back as strings and every JSON
    // endpoint is unchanged.
    responseHandler: 'content-type',
    prepareHeaders: async (headers, { endpoint }) => {
      const token = await cfg.getToken?.();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (MERGE_PATCH_PREFIXES.some((p) => endpoint.startsWith(p))) {
        headers.set('Content-Type', 'application/merge-patch+json');
      }
      // The body of a configuration write is the document, not a JSON envelope around it.
      // Declaring it keeps isJsonContentType above from stringifying the string.
      if (OCTET_STREAM_ENDPOINTS.includes(endpoint)) {
        headers.set('Content-Type', 'application/octet-stream');
      }
      return headers;
    },
  });
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  if (!inner || !config) {
    throw new Error(
      'configureConfigHub({ baseUrl, getToken }) must be called before dispatching ConfigHub queries',
    );
  }
  const result = await inner(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    await config.onUnauthorized?.();
  }
  return result;
};

// The empty api the generated endpoints inject into. A distinct reducerPath keeps it
// from colliding with a consumer's own `api` slice.
export const confighubApi = createApi({
  reducerPath: 'confighubApi',
  baseQuery,
  endpoints: () => ({}),
});
