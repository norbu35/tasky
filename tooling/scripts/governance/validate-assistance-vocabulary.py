#!/usr/bin/env python3
"""Validate assisted-intervention vocabulary across canonical and derived surfaces."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
PRD_FILE = REPO_ROOT / "docs" / "PRD.md"
LIFECYCLES_FILE = REPO_ROOT / "docs" / "design" / "domain-lifecycles.yaml"
EXPECTED_SCHEMA_FILE = REPO_ROOT / "tooling" / "config" / "expected-schema.json"
TASK_ASSISTANCE_SERVICE = (
    REPO_ROOT / "services" / "api" / "src" / "main" / "java" / "mn" / "tasky" / "task" / "application"
    / "TaskAssistanceService.java"
)


def prd_intervention_types() -> set[str]:
    text = PRD_FILE.read_text(encoding="utf-8")
    match = re.search(r"intervention_type\s*=\s*([a-z0-9_ |]+)", text)
    if not match:
        return set()
    return {part.strip() for part in match.group(1).split("|") if part.strip()}


def schema_intervention_types() -> set[str]:
    schema = json.loads(EXPECTED_SCHEMA_FILE.read_text(encoding="utf-8"))
    return set(schema["tables"]["task_rescue_events"]["check_constraints"]["intervention_type"])


def design_intervention_types() -> set[str]:
    text = LIFECYCLES_FILE.read_text(encoding="utf-8")
    return set(re.findall(r"intervention_type=([a-z0-9_]+)", text))


def service_intervention_types() -> set[str]:
    text = TASK_ASSISTANCE_SERVICE.read_text(encoding="utf-8")
    values = set()
    for value in re.findall(r'INTERVENTION_(?:EXTERNAL_DISTRIBUTION|MANUAL_RESCUE)\s*=\s*"([^"]+)"', text):
        values.add(value)
    return values


def main() -> int:
    prd_values = prd_intervention_types()
    schema_values = schema_intervention_types()
    design_values = design_intervention_types()
    service_values = service_intervention_types()

    failures: list[str] = []
    expected = {"manual_rescue", "external_distribution", "ops_override"}
    if prd_values != expected:
        failures.append(f"docs/PRD.md intervention_type vocabulary is {sorted(prd_values)}, expected {sorted(expected)}")
    if schema_values != prd_values:
        failures.append(
            "tooling/config/expected-schema.json task_rescue_events.intervention_type "
            f"is {sorted(schema_values)}, expected {sorted(prd_values)}"
        )
    unknown_design = sorted(design_values - prd_values)
    if unknown_design:
        failures.append(f"docs/design/domain-lifecycles.yaml uses non-PRD intervention_type values: {unknown_design}")
    unknown_service = sorted(service_values - prd_values)
    if unknown_service:
        failures.append(f"TaskAssistanceService uses non-PRD intervention_type values: {unknown_service}")
    missing_service = sorted({"manual_rescue", "external_distribution"} - service_values)
    if missing_service:
        failures.append(f"TaskAssistanceService is missing persisted intervention_type values: {missing_service}")

    if failures:
        print("assistance-vocabulary: FAIL", file=sys.stderr)
        for failure in failures:
            print(f" - {failure}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - keep PRD, design lifecycles, schema CHECK values, and TaskAssistanceService constants aligned", file=sys.stderr)
        print(" - if migrations changed, run validate-schema-parity.py --update-expected", file=sys.stderr)
        return 1

    print("assistance-vocabulary: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
