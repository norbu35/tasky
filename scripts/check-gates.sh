#!/usr/bin/env bash
# check-gates.sh
# Reads tests/registry.yaml and enforces quality gates.
#
# Usage: ./scripts/check-gates.sh <gate>
#   gate: smoke | regression | full
#
# Exit code: 0 = pass, 1 = fail
set -euo pipefail

GATE="${1:-smoke}"
REGISTRY="tests/registry.yaml"

if [ ! -f "$REGISTRY" ]; then
    echo "[gate] ERROR: $REGISTRY not found. Run ./scripts/sync-registry.sh first."
    exit 1
fi

python3 - "$GATE" "$REGISTRY" <<'PYEOF'
import sys, yaml
from datetime import datetime, timezone, timedelta

gate = sys.argv[1]
registry_path = sys.argv[2]

# Maximum age for PIT data before Gate 2 treats it as stale.
# Nightly CI refreshes PIT; allow up to 25 hours to cover scheduling drift.
# Override via env: MUTATION_STALENESS_HOURS=N
import os
PIT_STALENESS_HOURS = int(os.environ.get("MUTATION_STALENESS_HOURS", "25"))

if gate not in ("smoke", "regression", "full"):
    print(f"[gate] ERROR: unknown gate '{gate}'. Use: smoke | regression | full")
    sys.exit(1)

with open(registry_path) as f:
    data = yaml.safe_load(f)
scenarios = data.get("scenarios") or {}

failures = []

# ── Gate 1 (Smoke): Critical scenarios must all be covered ───────────────────
if gate in ("smoke", "regression", "full"):
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] != "critical":
            continue
        override = (entry.get("override_status") or "").strip()
        if entry["status"] != "covered" and not override.startswith("waived"):
            failures.append(
                f"[SMOKE] Critical scenario not covered: {scn_id} — {entry['title']}"
            )

# ── Gate 2 (Regression): High scenarios + PIT staleness check ─────────────────
# Mutation FLOORS are enforced by Gate 3 (nightly) only — PIT takes 30-60 minutes
# and cannot run inline on every merge. Gate 2 ensures PIT data is not stale so
# that Gate 3 enforcement is based on current results.
if gate in ("regression", "full"):
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] != "high":
            continue
        override = (entry.get("override_status") or "").strip()
        if entry["status"] != "covered" and not override.startswith("waived"):
            failures.append(
                f"[REGRESSION] High scenario not covered: {scn_id} — {entry['title']}"
            )

    # PIT staleness check: find the most recent mutation_kill_rate_updated_at across
    # all Critical/High domain entries. Fail if absent or older than threshold.
    TIER_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    critical_high_domains = set(
        e["domain"] for e in scenarios.values()
        if e["risk"] in ("critical", "high")
    )
    latest_pit_update = None
    domains_with_no_pit = []
    for entry in scenarios.values():
        if entry["domain"] not in critical_high_domains:
            continue
        ts_str = entry.get("mutation_kill_rate_updated_at")
        if ts_str is None:
            if entry["domain"] not in domains_with_no_pit:
                domains_with_no_pit.append(entry["domain"])
        else:
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if latest_pit_update is None or ts > latest_pit_update:
                    latest_pit_update = ts
            except ValueError:
                pass

    if domains_with_no_pit:
        failures.append(
            f"[REGRESSION] PIT data missing for Critical/High domain(s): "
            f"{sorted(set(domains_with_no_pit))} — run ./gradlew pitest then sync-registry.sh"
        )
    elif latest_pit_update is not None:
        age = datetime.now(timezone.utc) - latest_pit_update
        if age > timedelta(hours=PIT_STALENESS_HOURS):
            failures.append(
                f"[REGRESSION] PIT data is stale: last updated "
                f"{int(age.total_seconds() / 3600)}h ago "
                f"(threshold: {PIT_STALENESS_HOURS}h) — run ./gradlew pitest"
            )

# ── Gate 3 (Full): Mutation floors + no silent untested high/critical ─────────
# This is the gate that enforces mutation kill-rate floors. It runs nightly via
# ./gradlew gateFull which depends on pitest, so PIT data is always fresh here.
if gate == "full":
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] not in ("critical", "high"):
            continue
        if entry["status"] == "untested" \
                and not (entry.get("notes") or "").strip() \
                and not (entry.get("override_status") or "").strip():
            failures.append(
                f"[FULL] Untested scenario with no notes: {scn_id} — {entry['title']}"
            )

    FLOORS = {"critical": 75, "high": 60}
    MEDIUM_FLOOR = 40
    TIER_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    domain_tier = {}
    domain_kill = {}
    for entry in scenarios.values():
        d, r = entry["domain"], entry["risk"]
        current = domain_tier.get(d, "low")
        if TIER_ORDER.get(r, 3) < TIER_ORDER.get(current, 3):
            domain_tier[d] = r
        rate = entry.get("mutation_kill_rate")
        if rate is not None and (d not in domain_kill or rate < domain_kill[d]):
            domain_kill[d] = rate

    reported = set()
    for d, tier in domain_tier.items():
        floor = FLOORS.get(tier)
        if floor is None:
            continue
        if d not in domain_kill:
            failures.append(f"[FULL] No PIT data for domain '{d}' (tier: {tier})")
            continue
        rate = domain_kill[d]
        if rate < floor and d not in reported:
            reported.add(d)
            failures.append(
                f"[FULL] Domain '{d}' mutation kill {rate}% < floor {floor}% (tier: {tier})"
            )

    for entry in scenarios.values():
        d = entry["domain"]
        if entry["risk"] != "medium":
            continue
        rate = entry.get("mutation_kill_rate")
        if rate is not None and rate < MEDIUM_FLOOR and d not in reported:
            reported.add(d)
            failures.append(
                f"[FULL] Domain '{d}' medium mutation kill {rate}% < floor {MEDIUM_FLOOR}%"
            )

# ── Report ────────────────────────────────────────────────────────────────────
if failures:
    print(f"\n❌  Gate '{gate}' FAILED  ({len(failures)} issue(s)):\n")
    for msg in failures:
        print(f"  •  {msg}")
    print()
    sys.exit(1)
else:
    total = len(scenarios)
    covered = sum(1 for e in scenarios.values() if e["status"] == "covered")
    print(f"✅  Gate '{gate}' passed.  ({covered}/{total} scenarios covered)")
    sys.exit(0)
PYEOF
