#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required for SDK contract drift validation." >&2
  exit 1
fi

target_file="packages/sdk/src/generated/api-types.ts"
before_hash="MISSING"
if [[ -f "${target_file}" ]]; then
  before_hash="$(shasum "${target_file}" | awk '{print $1}')"
fi

pnpm contract:sdk:generate

if [[ ! -f "${target_file}" ]]; then
  echo "SDK contract output missing: ${target_file}" >&2
  exit 1
fi

after_hash="$(shasum "${target_file}" | awk '{print $1}')"
if [[ "${before_hash}" != "${after_hash}" ]]; then
  echo "SDK contract drift detected. Re-run generation and include updated ${target_file} before passing gates." >&2
  exit 1
fi

echo "SDK contract drift check passed."
