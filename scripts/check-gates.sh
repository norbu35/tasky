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

gate = sys.argv[1]
registry_path = sys.argv[2]

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

# ── Gate 2 (Regression): High scenarios + mutation floors ────────────────────
if gate in ("regression", "full"):
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] != "high":
            continue
        override = (entry.get("override_status") or "").strip()
        if entry["status"] != "covered" and not override.startswith("waived"):
            failures.append(
                f"[REGRESSION] High scenario not covered: {scn_id} — {entry['title']}"
            )

    # Determine effective risk tier per domain (worst tier wins)
    TIER_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    FLOORS = {"critical": 75, "high": 60}
    domain_tier = {}
    domain_kill = {}
    for entry in scenarios.values():
        d = entry["domain"]
        r = entry["risk"]
        current = domain_tier.get(d, "low")
        if TIER_ORDER.get(r, 3) < TIER_ORDER.get(current, 3):
            domain_tier[d] = r
        rate = entry.get("mutation_kill_rate")
        if rate is not None:
            # Use lowest kill rate seen for the domain across scenario entries
            if d not in domain_kill or rate < domain_kill[d]:
                domain_kill[d] = rate

    reported_domains = set()
    for d, tier in domain_tier.items():
        floor = FLOORS.get(tier)
        if floor is None:
            continue
        if d not in domain_kill:
            continue  # no PIT data yet — not a failure, just missing
        rate = domain_kill[d]
        if rate < floor and d not in reported_domains:
            reported_domains.add(d)
            failures.append(
                f"[REGRESSION] Domain '{d}' mutation kill {rate}% < floor {floor}% (tier: {tier})"
            )

# ── Gate 3 (Full): Medium floor + no silent untested high/critical ────────────
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

    MEDIUM_FLOOR = 40
    reported_medium = set()
    for entry in scenarios.values():
        d = entry["domain"]
        if entry["risk"] != "medium":
            continue
        rate = entry.get("mutation_kill_rate")
        if rate is not None and rate < MEDIUM_FLOOR and d not in reported_medium:
            reported_medium.add(d)
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
