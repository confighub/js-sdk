// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

import createClient, { type Client, type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

export interface ConfigHubClientOptions {
  /**
   * Base URL of the ConfigHub instance, e.g. `https://hub.confighub.com` — the same
   * value passed to the auth provider. The ConfigHub API is mounted under `/api`
   * (the spec's paths are relative to it), so the client targets `{baseUrl}/api`.
   * Passing a URL that already ends in `/api` is accepted as-is.
   */
  baseUrl: string;

  /**
   * Returns the current bearer token, or undefined when unauthenticated. May be
   * async so the caller can await a refresh. Wired as an openapi-fetch middleware
   * that sets `Authorization: Bearer <token>` per request. The client never stores
   * or refreshes tokens itself — that is the auth layer's job (see
   * `@confighub/react-auth`).
   */
  getToken?: () => string | undefined | Promise<string | undefined>;

  /**
   * Called when a request returns 401. A library must not redirect on its own, so
   * this hands control back to the caller — typically to trigger a token refresh
   * or re-login. The originating request is not retried automatically.
   */
  onUnauthorized?: () => void | Promise<void>;

  /** Override the fetch implementation (tests, non-browser runtimes). */
  fetch?: typeof globalThis.fetch;
}

export type ConfigHubClient = Client<paths>;

const trimTrailingSlash = (s: string): string => s.replace(/\/+$/, '');

// The ConfigHub API lives under /api and the OpenAPI paths are relative to it. Accept
// either the instance origin or a URL that already includes /api.
const apiBaseUrl = (baseUrl: string): string => {
  const trimmed = trimTrailingSlash(baseUrl);
  return trimmed.endsWith('/api') ? trimmed : trimmed + '/api';
};

/**
 * Create a typed ConfigHub API client. Every path, param, and response is derived
 * from the pinned OpenAPI spec (`src/schema.d.ts`), so it stays in lockstep with
 * the server.
 *
 * ```ts
 * const api = createConfigHubClient({ baseUrl, getToken: () => session.accessToken });
 * const { data, error } = await api.GET('/me');
 * const units = await api.GET('/space/{space_id}/unit', { params: { path: { space_id } } });
 * ```
 */
export function createConfigHubClient(options: ConfigHubClientOptions): ConfigHubClient {
  const { baseUrl, getToken, onUnauthorized, fetch: fetchImpl } = options;

  const client = createClient<paths>({
    baseUrl: apiBaseUrl(baseUrl),
    fetch: fetchImpl,
  });

  const middleware: Middleware = {
    async onRequest({ request }) {
      if (getToken) {
        const token = await getToken();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      }
      // ConfigHub's PATCH endpoints expect RFC 7386 merge-patch semantics. This
      // mirrors the first-party UI, which sets the same content type for its
      // patch/bulk-patch operations.
      if (request.method === 'PATCH' && request.body != null) {
        request.headers.set('Content-Type', 'application/merge-patch+json');
      }
      return request;
    },
    async onResponse({ response }) {
      if (response.status === 401 && onUnauthorized) {
        await onUnauthorized();
      }
      return response;
    },
  };

  client.use(middleware);
  return client;
}
