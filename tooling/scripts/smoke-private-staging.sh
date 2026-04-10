#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/.env.private-staging}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Private staging env file not found: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

BASE_URL="http://127.0.0.1:${STAGING_HTTP_PORT:-8080}"

json_get() {
  local key="$1"
  python3 - "$key" <<'PY'
import json
import sys

key = sys.argv[1]
body = json.load(sys.stdin)
value = body[key]
if isinstance(value, str):
    print(value)
else:
    print(json.dumps(value))
PY
}

echo "Checking web entrypoint..."
curl -fsS "${BASE_URL}" >/dev/null

echo "Checking backend health..."
health_json="$(curl -fsS "${BASE_URL}/actuator/health")"
status="$(printf '%s' "${health_json}" | json_get status)"
if [[ "${status}" != "UP" ]]; then
  echo "Health check failed: ${health_json}" >&2
  exit 1
fi

echo "Checking dev-login customer scope..."
customer_login="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+97699999999","role":"CUSTOMER"}' \
  "${BASE_URL}/api/v1/auth/dev/login")"
customer_token="$(printf '%s' "${customer_login}" | json_get access_token)"
customer_scope="$(curl -fsS -H "Authorization: Bearer ${customer_token}" "${BASE_URL}/api/v1/security/customer/ping")"
if [[ "$(printf '%s' "${customer_scope}" | json_get scope)" != "customer" ]]; then
  echo "Customer scope smoke failed: ${customer_scope}" >&2
  exit 1
fi

echo "Checking dev-login tasker scope..."
tasker_login="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+97699988888","role":"TASKER"}' \
  "${BASE_URL}/api/v1/auth/dev/login")"
tasker_token="$(printf '%s' "${tasker_login}" | json_get access_token)"
tasker_scope="$(curl -fsS -H "Authorization: Bearer ${tasker_token}" "${BASE_URL}/api/v1/security/tasker/ping")"
if [[ "$(printf '%s' "${tasker_scope}" | json_get scope)" != "tasker" ]]; then
  echo "Tasker scope smoke failed: ${tasker_scope}" >&2
  exit 1
fi

echo "Private staging smoke passed."
