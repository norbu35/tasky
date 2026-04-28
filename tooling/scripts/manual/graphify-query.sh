#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

if ! command -v graphify >/dev/null 2>&1; then
  cat >&2 <<'EOF'
graphify is not installed.
Run: pnpm repo:graph:setup
EOF
  exit 127
fi

if [ "${1:-}" = "--" ]; then
  shift
fi

if [ "$#" -eq 0 ]; then
  cat >&2 <<'EOF'
usage: pnpm repo:graph:query -- "<question>" [--budget N]
EOF
  exit 2
fi

exec graphify query "$@"
