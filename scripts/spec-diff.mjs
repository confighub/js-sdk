// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT
//
// Summarize what changed between two OpenAPI documents, for a release's changelog: a
// removed path, operation, parameter, or schema field is a break for anyone typed
// against the old spec, while additions are not.
//
// Usage: node scripts/spec-diff.mjs <before.json> <after.json> <fromVersion> <toVersion>

import { readFileSync } from 'node:fs';

const [, , beforePath, afterPath, fromVersion, toVersion] = process.argv;

const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const before = load(beforePath);
const after = load(afterPath);

const METHODS = new Set(['get', 'put', 'post', 'patch', 'delete', 'head', 'options']);
const removed = [];
const added = [];

const paths = (doc) => Object.keys(doc.paths ?? {});
for (const p of paths(before)) if (!after.paths?.[p]) removed.push(`path \`${p}\``);
for (const p of paths(after)) if (!before.paths?.[p]) added.push(`path \`${p}\``);

for (const p of paths(before)) {
  const b = before.paths[p];
  const a = after.paths?.[p];
  if (!a) continue;
  for (const m of Object.keys(b).filter((k) => METHODS.has(k))) {
    if (!a[m]) {
      removed.push(`operation \`${m.toUpperCase()} ${p}\``);
      continue;
    }
    const names = (op) => (op.parameters ?? []).map((x) => x.name);
    for (const name of names(b[m])) {
      if (!names(a[m]).includes(name)) removed.push(`parameter \`${name}\` on \`${m.toUpperCase()} ${p}\``);
    }
    for (const name of names(a[m])) {
      if (!names(b[m]).includes(name)) added.push(`parameter \`${name}\` on \`${m.toUpperCase()} ${p}\``);
    }
  }
  for (const m of Object.keys(a).filter((k) => METHODS.has(k))) {
    if (!b[m]) added.push(`operation \`${m.toUpperCase()} ${p}\``);
  }
}

const schemas = (doc) => doc.components?.schemas ?? {};
for (const s of Object.keys(schemas(before))) {
  if (!schemas(after)[s]) {
    removed.push(`schema \`${s}\``);
    continue;
  }
  const props = (d) => Object.keys(d.properties ?? {});
  for (const f of props(schemas(before)[s])) {
    if (!props(schemas(after)[s]).includes(f)) removed.push(`field \`${s}.${f}\``);
  }
  for (const f of props(schemas(after)[s])) {
    if (!props(schemas(before)[s]).includes(f)) added.push(`field \`${s}.${f}\``);
  }
}
for (const s of Object.keys(schemas(after))) {
  if (!schemas(before)[s]) added.push(`schema \`${s}\``);
}

const list = (items, cap = 40) => {
  const shown = items.slice(0, cap).map((i) => `- ${i}`);
  if (items.length > cap) shown.push(`- …and ${items.length - cap} more`);
  return shown.join('\n');
};

const out = [`Compared with ConfigHub \`${fromVersion}\`:`, ''];

if (removed.length === 0 && added.length === 0) {
  out.push('The API is unchanged.', '');
} else {
  if (removed.length > 0) {
    out.push(`#### Removed (${removed.length}), breaking for code typed against them`, '', list(removed), '');
  }
  if (added.length > 0) {
    out.push(`#### Added (${added.length})`, '', list(added), '');
  }
}

process.stdout.write(out.join('\n'));
