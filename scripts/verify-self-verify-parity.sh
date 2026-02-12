#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/verify-self-verify-parity.sh --local <local-artifact.json> --ci <ci-artifact.json>
USAGE
}

local_artifact=""
ci_artifact=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      local_artifact="${2:-}"
      shift 2
      ;;
    --ci)
      ci_artifact="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${local_artifact}" || -z "${ci_artifact}" ]]; then
  usage
  exit 2
fi

python3 - "${local_artifact}" "${ci_artifact}" <<'PY'
import json
import sys
from pathlib import Path

local_path = Path(sys.argv[1])
ci_path = Path(sys.argv[2])

if not local_path.is_file():
    print(f"Missing local artifact: {local_path}", file=sys.stderr)
    sys.exit(1)
if not ci_path.is_file():
    print(f"Missing CI artifact: {ci_path}", file=sys.stderr)
    sys.exit(1)

local = json.loads(local_path.read_text(encoding="utf-8"))
ci = json.loads(ci_path.read_text(encoding="utf-8"))
errors = []

for field in ("ticket", "risk_level", "required_check_ids"):
    if local.get(field) != ci.get(field):
        errors.append(f"{field} mismatch: local={local.get(field)} ci={ci.get(field)}")

local_req_ids = local.get("req_ids", [])
ci_req_ids = ci.get("req_ids", [])
if local_req_ids != ci_req_ids:
    errors.append("req_ids mismatch between local and CI artifacts.")

required = local.get("required_check_ids", [])
local_checks = {c.get("id"): c for c in local.get("checks", []) if isinstance(c, dict)}
ci_checks = {c.get("id"): c for c in ci.get("checks", []) if isinstance(c, dict)}

for check_id in required:
    l = local_checks.get(check_id)
    c = ci_checks.get(check_id)
    if l is None:
        errors.append(f"Local artifact missing check: {check_id}")
        continue
    if c is None:
        errors.append(f"CI artifact missing check: {check_id}")
        continue
    if l.get("status") != c.get("status"):
        errors.append(
            f"Status mismatch for {check_id}: local={l.get('status')} ci={c.get('status')}"
        )

if errors:
    print("Self-verify parity failed:", file=sys.stderr)
    for item in errors:
        print(f"- {item}", file=sys.stderr)
    sys.exit(1)

print("Self-verify parity check passed.")
PY
