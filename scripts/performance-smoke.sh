#!/usr/bin/env bash
set -euo pipefail

target="${PERF_TARGET_URL:-http://127.0.0.1:${PERF_TARGET_PORT:-8080}}"
max_p95_ms="${PERF_MAX_P95_MS:-500}"
sample_count="${PERF_SAMPLE_COUNT:-7}"
startup_timeout_s="${PERF_STARTUP_TIMEOUT_S:-90}"
managed_local_mode=false
boot_pid=""
boot_log="artifacts/checks/perf_bootrun.log"

cleanup() {
  if [[ -n "${boot_pid}" ]] && kill -0 "${boot_pid}" >/dev/null 2>&1; then
    kill "${boot_pid}" >/dev/null 2>&1 || true
    wait "${boot_pid}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if [[ ! "${target}" =~ ^https?:// ]]; then
  echo "PERF_TARGET_URL must start with http:// or https://: ${target}" >&2
  exit 1
fi

if [[ -z "${PERF_TARGET_URL:-}" ]]; then
  managed_local_mode=true
  mkdir -p artifacts/checks
  echo "PERF_TARGET_URL is not set. Starting local app via ./gradlew bootRun for smoke test."
  ./gradlew --no-daemon bootRun >"${boot_log}" 2>&1 &
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
