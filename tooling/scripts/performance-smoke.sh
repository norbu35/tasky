#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

target="${PERF_TARGET_URL:-http://127.0.0.1:${PERF_TARGET_PORT:-8080}}"
max_p95_ms="${PERF_MAX_P95_MS:-500}"
sample_count="${PERF_SAMPLE_COUNT:-7}"
startup_timeout_s="${PERF_STARTUP_TIMEOUT_S:-90}"
managed_local_mode=false
started_local_postgres=false
boot_pid=""
boot_log="${ROOT_DIR}/artifacts/checks/perf_bootrun.log"

cleanup() {
  if [[ -n "${boot_pid}" ]] && kill -0 "${boot_pid}" >/dev/null 2>&1; then
    kill "${boot_pid}" >/dev/null 2>&1 || true
    wait "${boot_pid}" >/dev/null 2>&1 || true
  fi
  if [[ "${started_local_postgres}" == "true" ]]; then
    docker compose -f "${ROOT_DIR}/docker-compose.yml" stop postgres >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

can_connect_postgres() {
  python3 - "$1" "$2" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
s = socket.socket()
s.settimeout(1.5)
try:
    s.connect((host, port))
    print("ok")
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

if [[ ! "${target}" =~ ^https?:// ]]; then
  echo "PERF_TARGET_URL must start with http:// or https://: ${target}" >&2
  exit 1
fi

if [[ -z "${PERF_TARGET_URL:-}" ]]; then
  managed_local_mode=true
  mkdir -p "${ROOT_DIR}/artifacts/checks"
  echo "PERF_TARGET_URL is not set. Starting local app via :services:api:bootRun for smoke test."
  export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
  export POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
  export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  export POSTGRES_DB="${POSTGRES_DB:-tasky}"
  export POSTGRES_USER="${POSTGRES_USER:-tasky}"
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-tasky}"
  export APP_DB_USER="${APP_DB_USER:-tasky}"
  export APP_DB_PASSWORD="${APP_DB_PASSWORD:-tasky}"
  export TASKY_JWT_SECRET="${TASKY_JWT_SECRET:-test-jwt-secret-32-chars-minimum!!}"
  export TASKY_ENCRYPTION_KEY="${TASKY_ENCRYPTION_KEY:-MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=}"
  export TASKY_BLIND_INDEX_KEY="${TASKY_BLIND_INDEX_KEY:-RkVEQ0JBOTg3NjU0MzIxMEZFRENCQTk4NzY1NDMyMTA=}"
  export TASKY_QPAY_WEBHOOK_SECRET="${TASKY_QPAY_WEBHOOK_SECRET:-test-qpay-secret}"
  if ! can_connect_postgres "${POSTGRES_HOST}" "${POSTGRES_PORT}"; then
    if command -v docker >/dev/null 2>&1; then
      echo "Postgres is not reachable at ${POSTGRES_HOST}:${POSTGRES_PORT}. Starting local postgres service via docker compose."
      docker compose -f "${ROOT_DIR}/docker-compose.yml" up -d postgres >/dev/null
      started_local_postgres=true
    fi
  fi
  "${ROOT_DIR}/gradlew" --no-daemon :services:api:bootRun >"${boot_log}" 2>&1 &
  boot_pid="$!"
fi

health_url="${target%/}/actuator/health"
latencies=()

wait_for_endpoint() {
  local url="$1"
  local timeout_s="$2"
  local elapsed=0
  while (( elapsed < timeout_s )); do
    http_code="$(curl --silent --max-time 5 --output /dev/null --write-out '%{http_code}' "${url}" || true)"
    if [[ "${http_code}" =~ ^[0-9]{3}$ && "${http_code}" != "000" ]]; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  return 1
}

if ! wait_for_endpoint "${health_url}" "${startup_timeout_s}"; then
  echo "Performance smoke failed: application did not become reachable at ${health_url} within ${startup_timeout_s}s." >&2
  if [[ "${managed_local_mode}" == "true" ]]; then
    echo "See ${boot_log} for boot logs." >&2
  fi
  exit 1
fi

for _ in $(seq 1 "${sample_count}"); do
  sample="$(curl --silent --max-time 10 --output /dev/null --write-out '%{http_code} %{time_total}' "${health_url}" || true)"
  http_code="$(awk '{print $1}' <<< "${sample}")"
  latency_s="$(awk '{print $2}' <<< "${sample}")"
  if [[ ! "${http_code}" =~ ^[0-9]{3}$ || "${http_code}" == "000" || -z "${latency_s}" ]]; then
    echo "Performance smoke failed: unable to get valid response from ${health_url}." >&2
    exit 1
  fi
  latency_ms="$(python3 - <<PY
latency_s = float("${latency_s}")
print(int(round(latency_s * 1000)))
PY
)"
  latencies+=("${latency_ms}")
done

p95_ms="$(python3 - "${latencies[@]}" <<'PY'
import sys

values = [int(x) for x in sys.argv[1:] if x]
if not values:
    raise SystemExit("No latency samples collected")
values.sort()
idx = int(0.95 * (len(values) - 1))
print(values[idx])
PY
)"

echo "Performance smoke results: p95=${p95_ms}ms, threshold=${max_p95_ms}ms, samples=${sample_count}"

if (( p95_ms > max_p95_ms )); then
  echo "Performance smoke failed: p95 ${p95_ms}ms exceeds threshold ${max_p95_ms}ms." >&2
  exit 1
fi

echo "Performance smoke passed."
