#!/usr/bin/env python3
"""Validate scenario-to-PRD traceability.

This guard keeps the scenario registry anchored to live PRD requirement IDs.
It fails on stale scenario `**PRD:**` references and warns when a Phase 1
requirement has no high-or-critical scenario coverage.
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
PRD_FILE = REPO_ROOT / "docs" / "PRD.md"
SCENARIOS_DIR = REPO_ROOT / "tests" / "scenarios"
BACKEND_TEST_DIR = REPO_ROOT / "services" / "api" / "src" / "test" / "java"

PRD_SECTION_START_RE = re.compile(r"^## 11\. ", re.MULTILINE)
PRD_SECTION_END_RE = re.compile(r"^## 16\. ", re.MULTILINE)
CANONICAL_PRD_ID_RE = re.compile(r"\b(?:REQ-P1|NFR)-[A-Z]+-\d{2}\b")
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d{2}\b")  # Enforce 2-digit zero-padded
SCENARIO_PRD_TOKEN_RE = re.compile(r"\b(?:REQ-P1|NFR)-[A-Z]+-\d{2}\b")
SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+-\d{3})\s*$", re.MULTILINE)  # Enforce 3-digit
RISK_RE = re.compile(r"^\*\*Risk:\*\*\s*(Critical|High|Medium)\s*$", re.MULTILINE)  # Enforce capitalization
PRD_LINE_RE = re.compile(r"^\*\*PRD:\*\*\s*(.+?)\s*$", re.MULTILINE)
TITLE_RE = re.compile(r"^\*\*Title:\*\*\s*(.+?)\s*$", re.MULTILINE)
DEFERRED_MARKER_RE = re.compile(r"tasky:req-deferred\s+((?:REQ-P1|NFR)-[A-Z]+-\d{2})")
NEEDS_SCENARIO_RE = re.compile(r"needs-scenario:", re.IGNORECASE)

HIGH_COVERAGE_RISKS = {"critical", "high"}
VALID_RISKS = {"critical", "high", "medium"}  # Phase 1: no "low" risk tier


@dataclass(frozen=True)
class PrdInventory:
    ids: set[str]
    launch_requirement_ids: set[str]
    deferred_ids: set[str]


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    source_file: Path
    line: int
    risk: str
    title: str
    prd_refs: list[str]


@dataclass(frozen=True)
class Finding:
    source_file: Path
    line: int
    message: str
    suggestion: str | None = None

    def as_json(self) -> dict[str, Any]:
        payload = {
            "file": self.source_file.as_posix(),
            "line": self.line,
            "message": self.message,
        }
        if self.suggestion:
            payload["suggestion"] = self.suggestion
        return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate tests/scenarios/** PRD references.")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON.")
    return parser.parse_args()


def relative(path: Path) -> Path:
    return path.relative_to(REPO_ROOT)


def closest(value: str, choices: set[str]) -> str | None:
    matches = difflib.get_close_matches(value, sorted(choices), n=1, cutoff=0.55)
    return matches[0] if matches else None


def prd_governed_body(text: str) -> str:
    start_match = PRD_SECTION_START_RE.search(text)
    if not start_match:
        return text
    end_match = PRD_SECTION_END_RE.search(text, start_match.end())
    end = end_match.start() if end_match else len(text)
    return text[start_match.start() : end]


def build_prd_inventory() -> PrdInventory:
    text = PRD_FILE.read_text(encoding="utf-8")
    governed = prd_governed_body(text)
    ids = set(CANONICAL_PRD_ID_RE.findall(governed))
    launch_requirement_ids = set(REQ_P1_RE.findall(governed))
    deferred_ids = set(DEFERRED_MARKER_RE.findall(text))

    # Existing PRD lines use this explicit prose marker for deferred slices.
    for line in governed.splitlines():
        if "deferred" not in line.lower() and "phase 2+" not in line.lower():
            continue
        deferred_ids.update(REQ_P1_RE.findall(line))

    return PrdInventory(ids=ids, launch_requirement_ids=launch_requirement_ids, deferred_ids=deferred_ids)


def parse_scenario_block(block: str, source_file: Path, line: int) -> tuple[Scenario | None, Finding | None]:
    header = re.match(r"## (SCN-[A-Z]+-\d{3})", block)
    if not header:
        return None, None

    risk_match = RISK_RE.search(block)
    prd_match = PRD_LINE_RE.search(block)
    title_match = TITLE_RE.search(block)
    missing = []
    if not risk_match:
        missing.append("Risk")
    if not prd_match:
        missing.append("PRD")
    if not title_match:
        missing.append("Title")
    if missing:
        return None, Finding(
            relative(source_file),
            line,
            f"{header.group(1)} is missing required field(s): {', '.join(missing)}.",
        )

    risk = risk_match.group(1).strip().lower()
    if risk not in VALID_RISKS:
        return None, Finding(
            relative(source_file),
            line,
            f"{header.group(1)} has invalid risk `{risk}`.",
            f"Use one of: {', '.join(sorted(VALID_RISKS))}",
        )

    prd_refs = SCENARIO_PRD_TOKEN_RE.findall(prd_match.group(1))
    if not prd_refs:
        return None, Finding(
            relative(source_file),
            line,
            f"{header.group(1)} has no parseable PRD requirement ID on its `**PRD:**` line.",
        )

    return Scenario(
        scenario_id=header.group(1),
        source_file=relative(source_file),
        line=line,
        risk=risk,
        title=title_match.group(1).strip(),
        prd_refs=prd_refs,
    ), None


def parse_scenarios() -> tuple[list[Scenario], list[Finding]]:
    scenarios: list[Scenario] = []
    failures: list[Finding] = []

    for path in sorted(SCENARIOS_DIR.glob("*.md")):
        if path.name == "README.md":
            continue
        text = path.read_text(encoding="utf-8")
        starts = [(match.start(), match.group(1)) for match in SCENARIO_HEADER_RE.finditer(text)]
        for index, (start, _) in enumerate(starts):
            end = starts[index + 1][0] if index + 1 < len(starts) else len(text)
            block = text[start:end]
            line = text.count("\n", 0, start) + 1
            scenario, failure = parse_scenario_block(block, path, line)
            if failure:
                failures.append(failure)
            if scenario:
                scenarios.append(scenario)

    return scenarios, failures


def validate_refs(scenarios: list[Scenario], prd: PrdInventory) -> list[Finding]:
    failures: list[Finding] = []
    for scenario in scenarios:
        for ref in scenario.prd_refs:
            if ref in prd.ids:
                continue
            suggestion = closest(ref, prd.ids)
            failures.append(
                Finding(
                    scenario.source_file,
                    scenario.line,
                    f"{scenario.scenario_id} references PRD id `{ref}`, which is not live in docs/PRD.md.",
                    f"Did you mean `{suggestion}`?" if suggestion else None,
                )
            )
    return failures


def coverage_warnings(scenarios: list[Scenario], prd: PrdInventory) -> list[Finding]:
    covered: set[str] = set()
    for scenario in scenarios:
        if scenario.risk not in HIGH_COVERAGE_RISKS:
            continue
        covered.update(ref for ref in scenario.prd_refs if ref in prd.launch_requirement_ids)

    missing = sorted(prd.launch_requirement_ids - prd.deferred_ids - covered)
    if not missing:
        return []

    return [
        Finding(
            Path("docs/PRD.md"),
            11,
            "REQ-P1 requirements without high-or-critical scenario coverage: " + ", ".join(missing),
        )
    ]


def validate_backend_tests_do_not_use_needs_scenario() -> list[Finding]:
    failures: list[Finding] = []
    if not BACKEND_TEST_DIR.exists():
        return failures
    for path in sorted(BACKEND_TEST_DIR.rglob("*.java")):
        text = path.read_text(encoding="utf-8")
        for match in NEEDS_SCENARIO_RE.finditer(text):
            failures.append(
                Finding(
                    relative(path),
                    text.count("\n", 0, match.start()) + 1,
                    "`needs-scenario:` markers are not allowed in backend tests; add a curated SCN entry first.",
                )
            )
    return failures


def main() -> int:
    args = parse_args()
    prd = build_prd_inventory()
    scenarios, parse_failures = parse_scenarios()
    failures = parse_failures + validate_refs(scenarios, prd) + validate_backend_tests_do_not_use_needs_scenario()
    warnings = coverage_warnings(scenarios, prd)

    failures = sorted(failures, key=lambda item: (item.source_file.as_posix(), item.line, item.message))
    warnings = sorted(warnings, key=lambda item: (item.source_file.as_posix(), item.line, item.message))

    if args.json:
        print(
            json.dumps(
                {
                    "status": "fail" if failures else "pass",
                    "failures": [failure.as_json() for failure in failures],
                    "warnings": [warning.as_json() for warning in warnings],
                    "requirements": len(prd.ids),
                    "launch_requirements": len(prd.launch_requirement_ids),
                    "scenarios": len(scenarios),
                },
                indent=2,
            )
        )
        return 1 if failures else 0

    status = "FAIL" if failures else "PASS"
    print(f"prd-scenario-links: {status}")
    for failure in failures:
        print(f" - {failure.source_file.as_posix()}:{failure.line}: {failure.message}")
        if failure.suggestion:
            print(f"     {failure.suggestion}")
    for warning in warnings:
        print(f" - {warning.source_file.as_posix()}:{warning.line}: warning: {warning.message}")
    if failures:
        print(f"prd-scenario-links: {len(failures)} failure(s)")
        print("autonomous remediation:")
        print(" - reconcile tests/scenarios/** with live IDs in docs/PRD.md before writing new backend tests")
        print(" - if the issue is scenario structure, fix the scenario file; if the PRD changed, re-route through the active PRD baseline")
        print(" - rerun: python3 tooling/scripts/governance/validate-prd-scenario-links.py")
        print(" - if registry drift is involved, then run: bash services/api/scripts/sync-registry.sh")
    else:
        print(
            "prd-scenario-links: "
            f"{len(scenarios)} scenario(s), {len(prd.launch_requirement_ids)} launch requirement(s)"
        )

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
