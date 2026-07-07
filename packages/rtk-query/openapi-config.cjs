// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

// Generates the RTK Query endpoints + hooks from the version-pegged spec (written to
// the repo root by scripts/sync-spec.mjs) into the hand-written base api in baseApi.ts.
// Plain CommonJS so @rtk-query/codegen-openapi needs no TS config loader.

/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: '../../openapi.json',
  apiFile: './src/baseApi.ts',
  apiImport: 'confighubApi',
  exportName: 'confighubApi',
  hooks: { queries: true, lazyQueries: true, mutations: true },
  outputFile: './src/confighubApi.gen.ts',
  tag: true,
  // fetchBaseQuery escapes query params via URLSearchParams already.
  encodeQueryParams: false,
};

module.exports = config;
