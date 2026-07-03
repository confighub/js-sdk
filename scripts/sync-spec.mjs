#!/usr/bin/env node
// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// Pull the OpenAPI spec at the pinned version and regenerate the typed client.
//
// The spec is a version-pegged artifact, not a live "latest" endpoint: on every
// `v*.*.*` release the monorepo mirrors `public/` into the public `confighub/sdk`
// repo, which is tagged with the same semver. So the spec for version X lives at
//   https://raw.githubusercontent.com/confighub/sdk/<X>/core/openapi/openapi.json
// and a given `@confighub/api` build maps to exactly one server version.
//
// The pinned version lives in `.spec-version` at the repo root. Bump it, run this,
// review the diff to `openapi.json` + `src/schema.d.ts`, and release.
//
// Override the source for local/preview work:
//   SPEC_URL=http://localhost:9090/api/openapi.json npm run sync-spec
// (the server serves the spec unauthenticated at /api/openapi.json).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const apiPkg = resolve(root, 'packages/api');
const specOut = resolve(apiPkg, 'openapi.json');
const typesOut = resolve(apiPkg, 'src/schema.d.ts');

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

  // Validate + normalize (stable key order, trailing newline) so the committed
  // diff is minimal and reviewable.
  const spec = JSON.parse(raw);
  if (!spec.openapi || !spec.paths) {
    throw new Error('fetched document does not look like an OpenAPI spec');
  }
  writeFileSync(specOut, JSON.stringify(spec, null, 2) + '\n');
  console.log(`sync-spec: wrote ${specOut} (openapi ${spec.info?.version ?? '?'})`);

  // Generate the TypeScript types from the spec. openapi-typescript resolves from
  // the workspace root node_modules.
  console.log('sync-spec: running openapi-typescript');
  execFileSync(
    'npx',
    ['openapi-typescript', specOut, '-o', typesOut, '--enum'],
    { stdio: 'inherit', cwd: root },
  );
  console.log(`sync-spec: wrote ${typesOut}`);
  console.log('sync-spec: done. Review the diff and add a changeset if it changed.');
}

main().catch((err) => {
  console.error(`sync-spec: ${err.message}`);
  process.exit(1);
});
