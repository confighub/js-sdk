#!/usr/bin/env bash
# Re-pin the generated clients at a ConfigHub release and regenerate them.
#
# Usage: scripts/update-spec.sh [version]     # default: latest confighub/sdk release
#
# Env:
#   SUMMARY_FILE  write a markdown summary here (for the PR body)
#
# This does not change any package version; scripts/next-version.mjs decides
# that (X.Y = the pinned spec's API version, Z = next patch).

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
cd "${repo_root}"

version="${1:-}"
if [[ -z "${version}" ]]; then
  version="$(curl -fsSL https://api.github.com/repos/confighub/sdk/releases/latest |
    sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"
fi
if [[ ! "${version}" =~ ^v[0-9] ]]; then
  echo "Could not determine a ConfigHub SDK version (got: '${version}')" >&2
  exit 1
fi

current="$(cat .spec-version 2>/dev/null | tr -d '[:space:]')"
echo "==> Pinned: ${current:-none}   Target: ${version}"

if [[ "${current}" == "${version}" ]]; then
  echo "Already pinned at ${version}; nothing to do."
  if [[ -n "${SUMMARY_FILE:-}" ]]; then
    printf 'Already pinned at `%s`.\n' "${version}" > "${SUMMARY_FILE}"
  fi
  exit 0
fi

before="$(mktemp -t openapi-before.XXXXXX.json)"
trap 'rm -f "${before}"' EXIT
cp openapi.json "${before}"

echo "${version}" > .spec-version
npm run sync-spec

# Build before typecheck: react-auth resolves @confighub/api from its built dist,
# the same order CI uses.
npm run build
npm run typecheck

summary="$(node scripts/spec-diff.mjs "${before}" openapi.json "${current:-unknown}" "${version}")"
printf '%s\n' "${summary}"
if [[ -n "${SUMMARY_FILE:-}" ]]; then
  printf '%s\n' "${summary}" > "${SUMMARY_FILE}"
fi
