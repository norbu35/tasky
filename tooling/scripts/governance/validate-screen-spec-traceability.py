#!/usr/bin/env python3
"""Validate screen-spec traceability wiring.

The validator checks the structural chain from active screen specs back to the
governing and derived product docs:

  PRD requirements -> journey refs -> screen graph node -> screen spec

It deliberately does not audit whether each chosen reference is semantically
complete. `pending_audit` specs may keep empty reference lists only as an
explicit temporary marker while a scoped follow-up audit is still in progress.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("screen-spec-traceability: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    print("autonomous remediation:", file=sys.stderr)
    print(" - install the missing dependency in the active environment", file=sys.stderr)
    print(
        " - rerun the narrow lane: python3 tooling/scripts/governance/validate-screen-spec-traceability.py",
        file=sys.stderr,
    )
    sys.exit(1)


DEFAULT_REPO_ROOT = Path(__file__).resolve().parents[3]
PRD_ID_RE = re.compile(r"\b(?:REQ-P1|NFR)-[A-Z]+-\d{2}\b")
VALID_STATUSES = {"validated", "pending_audit"}


@dataclass(frozen=True)
class Finding:
    level: str
    path: Path
    message: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate docs/design/screen-specs traceability fields.")
    parser.add_argument(
        "--root",
        type=Path,
        default=DEFAULT_REPO_ROOT,
        help="Repository root. Defaults to the current checkout root.",
    )
    return parser.parse_args()


def load_yaml(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def relative(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def collect_prd_ids(root: Path) -> set[str]:
    path = root / "docs" / "PRD.md"
    if not path.exists():
        return set()
    return set(PRD_ID_RE.findall(path.read_text(encoding="utf-8")))


def collect_screen_ids(root: Path) -> set[str]:
    path = root / "docs" / "design" / "screen-graph.yaml"
    if not path.exists():
        return set()
    data = load_yaml(path) or {}
    nodes = data.get("nodes")
    if not isinstance(nodes, dict):
        return set()
    return {str(screen_id) for screen_id in nodes.keys()}


def collect_journey_refs(root: Path) -> set[str]:
    path = root / "docs" / "design" / "journey-catalog.yaml"
    if not path.exists():
        return set()
    data = load_yaml(path) or {}
    refs: set[str] = set()
    journeys = data.get("journeys")
    if not isinstance(journeys, list):
        return refs

    for journey in journeys:
        if not isinstance(journey, dict) or not journey.get("id"):
            continue
        journey_id = str(journey["id"])
        refs.add(journey_id)

        happy_path = journey.get("happy_path")
        if isinstance(happy_path, list):
            for step in happy_path:
                if not isinstance(step, dict) or step.get("step") is None:
                    continue
                refs.add(f"{journey_id}:step-{step['step']}")

        alternate_paths = journey.get("alternate_paths")
        if isinstance(alternate_paths, list):
            for alternate in alternate_paths:
                if isinstance(alternate, dict) and alternate.get("id"):
                    refs.add(str(alternate["id"]))

        paths = journey.get("paths")
        if isinstance(paths, list):
            for path in paths:
                if isinstance(path, dict) and path.get("id"):
                    refs.add(str(path["id"]))

    return refs


def collect_scenario_ids(root: Path) -> set[str]:
    path = root / "tests" / "registry.yaml"
    if not path.exists():
        return set()
    data = load_yaml(path) or {}
    scenarios = data.get("scenarios")
    if not isinstance(scenarios, dict):
        return set()
    return {str(scenario_id) for scenario_id in scenarios.keys()}


def required_list(traceability: dict[str, Any], key: str, spec_path: Path) -> tuple[list[str], list[Finding]]:
    raw = traceability.get(key)
    if raw is None:
        return [], [Finding("FAIL", spec_path, f"traceability.{key} is missing")]
    if not isinstance(raw, list):
        return [], [Finding("FAIL", spec_path, f"traceability.{key} must be a list")]
    return [str(item) for item in raw], []


def validate_refs(
    refs: list[str],
    live_refs: set[str],
    key: str,
    spec_path: Path,
) -> list[Finding]:
    findings: list[Finding] = []
    for ref in refs:
        if ref in live_refs:
            continue
        findings.append(Finding("FAIL", spec_path, f"traceability.{key} references unknown id `{ref}`"))
    return findings


def validate_screen_spec(
    root: Path,
    spec_path: Path,
    prd_ids: set[str],
    screen_ids: set[str],
    journey_refs: set[str],
    scenario_ids: set[str],
) -> tuple[list[Finding], str | None]:
    findings: list[Finding] = []
    data = load_yaml(spec_path)
    if not isinstance(data, dict):
        return [Finding("FAIL", spec_path, "screen spec is not a YAML mapping")], None

    screen_id = data.get("screen_id")
    if not isinstance(screen_id, str) or not screen_id:
        return [Finding("FAIL", spec_path, "screen_id is missing")], None

    if spec_path.stem != screen_id:
        findings.append(Finding("FAIL", spec_path, f"filename stem must match screen_id `{screen_id}`"))

    traceability = data.get("traceability")
    if not isinstance(traceability, dict):
        findings.append(Finding("FAIL", spec_path, "traceability block is missing or not a mapping"))
        return findings, None

    status = traceability.get("status")
    if status not in VALID_STATUSES:
        findings.append(
            Finding(
                "FAIL",
                spec_path,
                f"traceability.status must be one of {', '.join(sorted(VALID_STATUSES))}",
            )
        )

    graph_node = traceability.get("screen_graph_node")
    if graph_node != screen_id:
        findings.append(
            Finding("FAIL", spec_path, f"traceability.screen_graph_node must equal screen_id `{screen_id}`")
        )
    elif screen_ids and str(graph_node) not in screen_ids:
        findings.append(
            Finding("FAIL", spec_path, f"traceability.screen_graph_node `{graph_node}` is not in screen-graph.yaml")
        )

    prd_refs, list_findings = required_list(traceability, "prd_refs", spec_path)
    findings.extend(list_findings)
    journey_ref_values, list_findings = required_list(traceability, "journey_refs", spec_path)
    findings.extend(list_findings)
    scenario_refs, list_findings = required_list(traceability, "scenario_refs", spec_path)
    findings.extend(list_findings)

    if status == "validated":
        if not prd_refs:
            findings.append(Finding("FAIL", spec_path, "validated specs require at least one prd_ref"))
        if not journey_ref_values:
            findings.append(Finding("FAIL", spec_path, "validated specs require at least one journey_ref"))

    findings.extend(validate_refs(prd_refs, prd_ids, "prd_refs", spec_path))
    findings.extend(validate_refs(journey_ref_values, journey_refs, "journey_refs", spec_path))
    findings.extend(validate_refs(scenario_refs, scenario_ids, "scenario_refs", spec_path))

    return findings, screen_id if status == "pending_audit" else None


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    specs_dir = root / "docs" / "design" / "screen-specs"

    if not specs_dir.exists():
        print("screen-spec-traceability: FAIL", file=sys.stderr)
        print(f" - docs/design/screen-specs directory does not exist under {root}", file=sys.stderr)
        return 1

    prd_ids = collect_prd_ids(root)
    screen_ids = collect_screen_ids(root)
    journey_refs = collect_journey_refs(root)
    scenario_ids = collect_scenario_ids(root)

    findings: list[Finding] = []
    pending_screen_ids: list[str] = []

    for spec_path in sorted(specs_dir.glob("SCR-*.yaml")):
        spec_findings, pending_screen_id = validate_screen_spec(
            root,
            spec_path,
            prd_ids,
            screen_ids,
            journey_refs,
            scenario_ids,
        )
        findings.extend(spec_findings)
        if pending_screen_id:
            pending_screen_ids.append(pending_screen_id)

    failures = [finding for finding in findings if finding.level == "FAIL"]
    warnings: list[str] = []
    if pending_screen_ids:
        preview = ", ".join(sorted(pending_screen_ids)[:12])
        suffix = "" if len(pending_screen_ids) <= 12 else f", +{len(pending_screen_ids) - 12} more"
        warnings.append(
            f"{len(pending_screen_ids)} screen spec(s) pending traceability audit: {preview}{suffix}"
        )

    if failures:
        print("screen-spec-traceability: FAIL", file=sys.stderr)
        for finding in failures:
            print(f" - {relative(root, finding.path)}: {finding.message}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - add or correct each screen spec traceability block", file=sys.stderr)
        print(" - use live REQ-P1/NFR ids from docs/PRD.md", file=sys.stderr)
        print(" - use JRN-* refs from docs/design/journey-catalog.yaml", file=sys.stderr)
        print(" - use SCN-* refs from tests/registry.yaml when a scenario-backed test exists", file=sys.stderr)
        print(" - rerun: pnpm repo:docs:check", file=sys.stderr)
        return 1

    print(f"screen-spec-traceability: PASS ({len(warnings)} warning(s))")
    for warning in warnings:
        print(f" - warning: {warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
