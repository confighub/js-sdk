#!/usr/bin/env node
// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// Pull the OpenAPI spec at the pinned version and regenerate BOTH typed clients.
//
// The spec is a version-pegged artifact, not a live "latest" endpoint: on every
// `v*.*.*` release the monorepo mirrors `public/` into the public `confighub/sdk`
// repo, which is tagged with the same semver. So the spec for version X lives at
//   https://raw.githubusercontent.com/confighub/sdk/<X>/core/openapi/openapi.json
// and a given SDK build maps to exactly one server version.
//
// One pegged spec drives two independent generators (they emit incompatible
// artifacts and share no code — see docs):
//   - @confighub/api        openapi-typescript      -> packages/api/src/schema.d.ts
//   - @confighub/rtk-query  @rtk-query/codegen-openapi -> packages/rtk-query/src/confighubApi.gen.ts
//
// The pinned version lives in `.spec-version` at the repo root. Bump it, run this,
// review the diffs, and release.
//
// Override the source for local/preview work:
//   SPEC_URL=http://localhost:9090/api/openapi.json npm run sync-spec

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const specOut = resolve(root, 'openapi.json');
const apiTypesOut = resolve(root, 'packages/api/src/schema.d.ts');
const rtkPkg = resolve(root, 'packages/rtk-query');

function pinnedVersion() {
  return readFileSync(resolve(root, '.spec-version'), 'utf8').trim();
}

function specUrl() {
  if (process.env.SPEC_URL) return process.env.SPEC_URL;
  const version = pinnedVersion();
  if (!version) throw new Error('.spec-version is empty');
  return `https://raw.githubusercontent.com/confighub/sdk/${version}/core/openapi/openapi.json`;
}

async function main() {
  const url = specUrl();
  console.log(`sync-spec: fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  const raw = await res.text();

  // Validate + normalize (stable formatting, trailing newline) so the committed diff
  // is minimal and reviewable.
  const spec = JSON.parse(raw);
  if (!spec.openapi || !spec.paths) {
    throw new Error('fetched document does not look like an OpenAPI spec');
  }
  writeFileSync(specOut, JSON.stringify(spec, null, 2) + '\n');
  console.log(`sync-spec: wrote ${specOut} (openapi ${spec.info?.version ?? '?'})`);

  // @confighub/api — openapi-typescript types.
  console.log('sync-spec: openapi-typescript -> @confighub/api');
  execFileSync('npx', ['openapi-typescript', specOut, '-o', apiTypesOut, '--enum'], {
    stdio: 'inherit',
    cwd: root,
  });

  // @confighub/rtk-query — RTK Query codegen (own generator, own base query). Run from
  // the package dir so the config's relative paths resolve, matching the monorepo.
  console.log('sync-spec: @rtk-query/codegen-openapi -> @confighub/rtk-query');
  execFileSync('npx', ['@rtk-query/codegen-openapi', 'openapi-config.cjs'], {
    stdio: 'inherit',
    cwd: rtkPkg,
  });

  console.log('sync-spec: done. Review the diffs and add a changeset if anything changed.');
}

main().catch((err) => {
  console.error(`sync-spec: ${err.message}`);
  process.exit(1);
});
