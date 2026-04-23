#!/usr/bin/env bash
# check-gates.sh
# Reads tests/registry.yaml and enforces quality gates.
#
# Usage: ./tooling/scripts/gates/check-gates.sh <gate>
#   gate: smoke | regression | full
#
# Exit code: 0 = pass, 1 = fail
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

GATE="${1:-smoke}"
REGISTRY="${ROOT_DIR}/tests/registry.yaml"

if [ ! -f "$REGISTRY" ]; then
    echo "[gate] ERROR: $REGISTRY not found. Run ${ROOT_DIR}/services/api/scripts/sync-registry.sh first."
    echo "[gate] autonomous remediation: regenerate tests/registry.yaml, commit it, then rerun pnpm verify:scenario:smoke."
    exit 1
fi

python3 - "$GATE" "$REGISTRY" <<'PYEOF'
import sys, yaml, re, subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

gate = sys.argv[1]
registry_path = sys.argv[2]

# Maximum age for PIT data before Gate 2 treats it as stale.
# Nightly CI refreshes PIT; allow up to 25 hours to cover scheduling drift.
# Override via env: MUTATION_STALENESS_HOURS=N
import os
PIT_STALENESS_HOURS = int(os.environ.get("MUTATION_STALENESS_HOURS", "25"))
NEEDS_SCENARIO_MAX_DAYS = int(os.environ.get("NEEDS_SCENARIO_MAX_DAYS", "30"))
SMOKE_MUTATION_DIFF_BASE = os.environ.get("MUTATION_DIFF_BASE", "").strip()
SMOKE_MUTATION_CRITICAL_FLOOR = int(os.environ.get("SMOKE_MUTATION_CRITICAL_FLOOR", "75"))

if gate not in ("smoke", "regression", "full"):
    print(f"[gate] ERROR: unknown gate '{gate}'. Use: smoke | regression | full")
    print("[gate] autonomous remediation: rerun with one of the supported gates or use the pnpm verify:scenario:smoke entrypoint.")
    sys.exit(1)

with open(registry_path) as f:
    data = yaml.safe_load(f)
scenarios = data.get("scenarios") or {}

failures = []

def run_git(args):
    return subprocess.run(
        ["git", *args],
        cwd=Path(registry_path).resolve().parents[1],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )

def changed_production_domains(diff_base):
    if not diff_base:
        return set()
    merge_base = run_git(["merge-base", diff_base, "HEAD"])
    if merge_base.returncode != 0 or not merge_base.stdout.strip():
        return set()
    changed = run_git(["diff", "--name-only", merge_base.stdout.strip(), "HEAD"])
    if changed.returncode != 0:
        return set()
    domains = set()
    pattern = re.compile(r"^services/api/src/main/java/mn/tasky/([^/]+)/")
    for line in changed.stdout.splitlines():
        match = pattern.match(line.strip())
        if match:
            domains.add(match.group(1))
    return domains

def mutation_timestamp_is_fresh(raw):
    if not raw:
        return False
    try:
        parsed = datetime.strptime(str(raw), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return False
    return datetime.now(timezone.utc) - parsed <= timedelta(hours=PIT_STALENESS_HOURS)

def domain_mutation_inventory():
    tier_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    domain_tier = {}
    domain_kill = {}
    domain_updated_at = {}
    for entry in scenarios.values():
        domain = entry["domain"]
        risk = entry["risk"]
        current = domain_tier.get(domain, "low")
        if tier_order.get(risk, 3) < tier_order.get(current, 3):
            domain_tier[domain] = risk

        rate = entry.get("mutation_kill_rate")
        if rate is None:
            continue
        if domain not in domain_kill or rate < domain_kill[domain]:
            domain_kill[domain] = rate
            domain_updated_at[domain] = entry.get("mutation_kill_rate_updated_at")
    return domain_tier, domain_kill, domain_updated_at

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

    if gate == "smoke" and SMOKE_MUTATION_DIFF_BASE:
        changed_domains = changed_production_domains(SMOKE_MUTATION_DIFF_BASE)
        domain_tier, domain_kill, domain_updated_at = domain_mutation_inventory()
        for domain in sorted(changed_domains):
            if domain_tier.get(domain) != "critical":
                continue
            if domain not in domain_kill:
                failures.append(
                    f"[SMOKE-MUTATION] No PIT data for changed critical domain '{domain}'"
                )
                continue
            if not mutation_timestamp_is_fresh(domain_updated_at.get(domain)):
                failures.append(
                    f"[SMOKE-MUTATION] Stale PIT data for changed critical domain '{domain}'"
                )
                continue
            rate = domain_kill[domain]
            if rate < SMOKE_MUTATION_CRITICAL_FLOOR:
                failures.append(
                    f"[SMOKE-MUTATION] Changed critical domain '{domain}' mutation kill "
                    f"{rate}% < floor {SMOKE_MUTATION_CRITICAL_FLOOR}%"
                )

# ── Gate 2 (Regression): High scenarios + API contract truth ───────────────────
# Broad mutation enforcement is intentionally deferred to Gate 3 (nightly/full).
# Gate 2 stays behavior-first so it can block deploys on scenario truth instead of
# broad coverage optics or long-running mutation infrastructure.
if gate in ("regression", "full"):
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] != "high":
            continue
        override = (entry.get("override_status") or "").strip()
        if entry["status"] != "covered" and not override.startswith("waived"):
            failures.append(
                f"[REGRESSION] High scenario not covered: {scn_id} — {entry['title']}"
            )

    needs_scenario_pattern = re.compile(r"needs-scenario:\s*(\d{4}-\d{2}-\d{2})", re.IGNORECASE)
    today = datetime.now(timezone.utc).date()
    for scn_id, entry in sorted(scenarios.items()):
        notes = (entry.get("notes") or "").strip()
        match = needs_scenario_pattern.search(notes)
        if not match:
            continue
        opened_at = datetime.strptime(match.group(1), "%Y-%m-%d").date()
        age_days = (today - opened_at).days
        if age_days > NEEDS_SCENARIO_MAX_DAYS:
            failures.append(
                f"[REGRESSION] needs-scenario note older than {NEEDS_SCENARIO_MAX_DAYS} days: "
                f"{scn_id} ({age_days} days)"
            )

# ── Gate 3 (Full): Mutation floors + no silent untested high/critical ─────────
# This is the gate that enforces mutation kill-rate floors. It runs nightly via
# ./gradlew gateFull which depends on pitest, so PIT data is always fresh here.
if gate == "full":
    for scn_id, entry in sorted(scenarios.items()):
        if entry["risk"] not in ("critical", "high", "medium"):
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
    DOMAINS_WITHOUT_PRODUCTION_CODE = {"integration"}
    domain_tier = {}
    domain_kill = {}
    for entry in scenarios.values():
        d, r = entry["domain"], entry["risk"]
        if d in DOMAINS_WITHOUT_PRODUCTION_CODE:
            continue
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
    print("\nautonomous remediation:")
    print("  •  update tests/registry.yaml or the backing scenarios/tests so the failing coverage claim becomes true")
    print("  •  if scenarios changed, run bash services/api/scripts/sync-registry.sh before rerunning the gate")
    print(f"  •  rerun the narrow gate: bash tooling/scripts/gates/check-gates.sh {gate}")
    print()
    sys.exit(1)
else:
    total = len(scenarios)
    covered = sum(1 for e in scenarios.values() if e["status"] == "covered")
    print(f"✅  Gate '{gate}' passed.  ({covered}/{total} scenarios covered)")
    sys.exit(0)
PYEOF
