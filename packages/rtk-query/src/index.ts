// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

export { configureConfigHub } from './baseApi';
export type { ConfigHubConfig } from './baseApi';

// The generated api (`confighubApi`) plus every endpoint hook and request/response
// type. Add `confighubApi.reducer` + `confighubApi.middleware` to your store.
export * from './confighubApi.gen';
