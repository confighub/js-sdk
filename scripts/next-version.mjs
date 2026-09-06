#!/usr/bin/env node
// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// The version to publish next, following ConfigHub's own rule: the first two
// numbers of a version name the API it speaks (see docs/dev/versioning.md in the
// server repo). So @confighub/*@0.4.x is built against a v0.4.* server, and the
// patch number increments on every publish, whether a spec re-pin or a hand-written
// change. When the pinned spec's API version moves, the patch resets.
//
//   node scripts/next-version.mjs            -> prints e.g. 0.4.3
//   node scripts/next-version.mjs --check X  -> exits 1 if X does not match the pinned API

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pinned = readFileSync(resolve(root, '.spec-version'), 'utf8').trim();
const m = /^v(\d+)\.(\d+)\./.exec(pinned);
if (!m) throw new Error(`.spec-version is not vX.Y.Z: ${pinned}`);
const api = `${m[1]}.${m[2]}`;

const args = process.argv.slice(2);
if (args[0] === '--check') {
  const v = args[1] ?? '';
  if (!v.startsWith(api + '.')) {
    console.error(`version ${v} does not speak the pinned API ${api} (spec ${pinned})`);
    process.exit(1);
  }
  process.exit(0);
}

let published = [];
try {
  published = JSON.parse(execFileSync('npm', ['view', '@confighub/api', 'versions', '--json'], { encoding: 'utf8' }));
  if (!Array.isArray(published)) published = [published];
} catch {
  // never published: start at api.0
}
const patches = published
  .filter((v) => v.startsWith(api + '.'))
  .map((v) => Number(v.slice(api.length + 1)))
  .filter(Number.isInteger);
const next = patches.length ? Math.max(...patches) + 1 : 0;
console.log(`${api}.${next}`);
