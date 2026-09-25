// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

// Generates the RTK Query endpoints + hooks from the ConfigHub server's spec
// (public/core/openapi/ in the ConfigHub repository; see scripts/generate.mjs) into the
// hand-written base api in baseApi.ts.
// Plain CommonJS so @rtk-query/codegen-openapi needs no TS config loader.

/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: '../../../core/openapi/openapi.json',
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
