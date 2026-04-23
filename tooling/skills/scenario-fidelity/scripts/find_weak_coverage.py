#!/usr/bin/env python3
"""Report-only scenario fidelity triage: find likely weak tests behind covered scenarios.

Uses a combination of heuristic signals:
  - scenario status == covered
  - domain mutation data is low, stale, or missing for the scenario risk tier
  - assertion count is suspiciously low relative to Then/And lines in the scenario

This is NOT a blocking gate. It produces report-only JSON for manual triage.

Exit 0 always (even with no candidates), unless the tool itself crashes.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

try:
    import yaml
except ImportError:
    print("find_weak_coverage: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    print("autonomous remediation:", file=sys.stderr)
    print(" - install the missing dependency in the current environment", file=sys.stderr)
    print(" - rerun: pnpm verify:scenario:fidelity", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[4]
REGISTRY_FILE = REPO_ROOT / "tests" / "registry.yaml"
SCENARIOS_DIR = REPO_ROOT / "tests" / "scenarios"
TEST_ROOT = REPO_ROOT / "services" / "api" / "src" / "test" / "java"

SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+-\d+)")
THEN_RE = re.compile(r"^\s*Then\b", re.IGNORECASE)
AND_RE = re.compile(r"^\s*And\b", re.IGNORECASE)
DISPLAY_NAME_RE = re.compile(r'@DisplayName\("SCN-([A-Z]+-\d+)')
ASSERTION_RE = re.compile(r"\b(?:assertThat|assertEquals|assertTrue|assertFalse|assertNotNull|assertNull|assertThrows|verify|assertAll)\b")


@dataclass
class WeakCandidate:
    scenario_id: str
    domain: str
    test_file: Optional[str]
    test_method: Optional[str]
    signals: list[str]
    then_count: int
    and_count: int
    assertion_count: int
    mutation_kill_rate: Optional[float]
    risk: str


def load_registry() -> dict[str, Any]:
    with REGISTRY_FILE.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data.get("scenarios", {})


def parse_scenario_file(path: Path) -> dict[str, dict]:
    """Parse a scenario file into {scn_id: {then_count, and_count}}."""
    result: dict[str, dict] = {}
    current_id = None
    then_count = 0
    and_count = 0

    for line in path.read_text(encoding="utf-8").splitlines():
        header_match = SCENARIO_HEADER_RE.match(line)
        if header_match:
            if current_id:
                result[current_id] = {"then_count": then_count, "and_count": and_count}
            current_id = header_match.group(1)
            then_count = 0
            and_count = 0
        elif current_id:
            if THEN_RE.match(line):
                then_count += 1
            elif AND_RE.match(line):
                and_count += 1

    if current_id:
        result[current_id] = {"then_count": then_count, "and_count": and_count}
    return result


def build_display_name_index() -> dict[str, list[tuple[str, str]]]:
    """Index SCN IDs -> [(test_file, method_name)]."""
    index: dict[str, list[tuple[str, str]]] = {}
    java_method_re = re.compile(r"^\s*(?:public\s+)?void\s+(\w+)\s*\(")

    for java_file in TEST_ROOT.rglob("*.java"):
        try:
            lines = java_file.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue

        current_method = None
        current_display = None

        for line in lines:
            dn_match = DISPLAY_NAME_RE.search(line)
            if dn_match:
                current_display = dn_match.group(1)

            method_match = java_method_re.match(line)
            if method_match:
                current_method = method_match.group(1)

            # Associate display name with the method that follows
            if current_display and current_method:
                scn_id = f"SCN-{current_display}"
                rel = java_file.relative_to(REPO_ROOT).as_posix()
                index.setdefault(scn_id, []).append((rel, current_method))
                current_display = None
                current_method = None

    return index


def count_assertions_in_test(test_file: str, test_method: str) -> int:
    """Rough count of assertion calls inside a test method."""
    java_path = REPO_ROOT / test_file
    if not java_path.exists():
        return 0

    try:
        source = java_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return 0

    # Find the method and count assertions until the next method or closing brace
    method_re = re.compile(
        rf"void\s+{re.escape(test_method)}\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{{"
    )
    match = method_re.search(source)
    if not match:
        return 0

    # Count from method start, tracking brace depth
    pos = match.end()
    depth = 1
    count = 0
    while pos < len(source) and depth > 0:
        if source[pos] == "{":
            depth += 1
        elif source[pos] == "}":
            depth -= 1
        pos += 1

    method_body = source[match.end():pos - 1]
    count = len(ASSERTION_RE.findall(method_body))
    return count


def main() -> int:
    if not REGISTRY_FILE.exists():
        print("[]")
        return 0

    registry = load_registry()
    display_index = build_display_name_index()

    # Parse all scenario files for Then/And counts
    scenario_counts: dict[str, dict] = {}
    if SCENARIOS_DIR.exists():
        for sf in SCENARIOS_DIR.glob("*.md"):
            scenario_counts.update(parse_scenario_file(sf))

    candidates: list[WeakCandidate] = []

    for scn_id, entry in sorted(registry.items()):
        status = entry.get("status")
        if status != "covered":
            continue

        risk = str(entry.get("risk", "medium")).lower()
        domain = str(entry.get("domain", "unknown"))
        mutation_rate = entry.get("mutation_kill_rate")
        if mutation_rate is not None:
            try:
                mutation_rate = float(mutation_rate)
            except (ValueError, TypeError):
                mutation_rate = None

        # Get test file and method
        test_matches = display_index.get(scn_id, [])
        test_file = test_matches[0][0] if test_matches else None
        test_method = test_matches[0][1] if test_matches else None

        # Get scenario Then/And counts
        counts = scenario_counts.get(scn_id, {})
        then_count = counts.get("then_count", 0)
        and_count = counts.get("and_count", 0)

        # Count assertions in test
        assertion_count = 0
        if test_file and test_method:
            assertion_count = count_assertions_in_test(test_file, test_method)

        # Heuristic signals
        signals: list[str] = []

        # Signal: low mutation kill rate for risk tier
        if mutation_rate is not None and mutation_rate < 50:
            if risk in ("critical", "high"):
                signals.append("low_domain_mutation")
        elif mutation_rate is None:
            if risk in ("critical", "high"):
                signals.append("missing_domain_mutation")

        # Signal: stale mutation data
        updated_at = entry.get("mutation_kill_rate_updated_at")
        if mutation_rate is not None and updated_at is None:
            signals.append("stale_mutation_data")

        # Signal: assertion scarcity
        expected_min = then_count + and_count
        if expected_min > 0 and assertion_count < max(1, expected_min // 2):
            signals.append("assertion_scarcity")

        # Signal: zero assertions for covered scenario
        if assertion_count == 0 and (then_count + and_count) > 0:
            signals.append("zero_assertions")

        if signals:
            candidates.append(WeakCandidate(
                scenario_id=scn_id,
                domain=domain,
                test_file=test_file,
                test_method=test_method,
                signals=signals,
                then_count=then_count,
                and_count=and_count,
                assertion_count=assertion_count,
                mutation_kill_rate=mutation_rate,
                risk=risk,
            ))

    output = [
        {
            "scenario_id": c.scenario_id,
            "domain": c.domain,
            "risk": c.risk,
            "test_file": c.test_file,
            "test_method": c.test_method,
            "signals": c.signals,
            "then_count": c.then_count,
            "and_count": c.and_count,
            "assertion_count": c.assertion_count,
            "mutation_kill_rate": c.mutation_kill_rate,
        }
        for c in candidates
    ]

    print(json.dumps(output, indent=2))
    print(f"\nscenario-fidelity: {len(output)} candidate(s) found", file=sys.stderr)
    if output:
        print("autonomous remediation:", file=sys.stderr)
        print(" - treat each candidate as a test-strengthening queue, not an automatic production-code change", file=sys.stderr)
        print(" - confirm an existing scenario covers the behavior before editing backend tests", file=sys.stderr)
        print(" - rerun: pnpm verify:scenario:fidelity after strengthening the affected tests/registry data", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
