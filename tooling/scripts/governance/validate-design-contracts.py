#!/usr/bin/env python3
"""Validate active design component contracts against the mobile implementation.

The design contract includes both implemented primitives and future component
intent. This checker fails only when an implemented contract entry points at a
missing or non-exported component, and reports future/spec prop drift as warnings
so the doc remains useful during staged UI buildout.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("design-contracts: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    print("autonomous remediation:", file=sys.stderr)
    print(" - install the missing dependency in the active environment", file=sys.stderr)
    print(" - rerun the narrow lane: python3 tooling/scripts/governance/validate-design-contracts.py", file=sys.stderr)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parents[3]
CONTRACT = REPO_ROOT / "docs" / "design" / "component-contract.yaml"


@dataclass(frozen=True)
class Finding:
    level: str
    message: str


def load_contract() -> dict[str, Any]:
    with CONTRACT.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def prop_names(raw: Any) -> list[str]:
    if not raw:
        return []
    if not isinstance(raw, list):
        return []
    return [str(item).strip("'\"") for item in raw if str(item).strip()]


def exports_component(source: str, name: str) -> bool:
    patterns = [
        rf"\bexport\s+default\s+function\s+{re.escape(name)}\b",
        rf"\bexport\s+function\s+{re.escape(name)}\b",
        rf"\bexport\s+const\s+{re.escape(name)}\b",
        rf"\bexport\s+class\s+{re.escape(name)}\b",
        rf"\bexport\s+interface\s+{re.escape(name)}Props\b",
        rf"\b{name}\s*=\s*React\.forwardRef\b",
    ]
    return any(re.search(pattern, source) for pattern in patterns)


def validate_component(entry: dict[str, Any], group: str) -> list[Finding]:
    findings: list[Finding] = []
    component_id = entry.get("id", "<missing id>")
    name = entry.get("name", "<missing name>")
    runtime_name = entry.get("runtime_name", name)
    implementation_status = str(entry.get("implementation_status", "active"))
    path_value = entry.get("path")
    required = group == "existing_components"

    if not path_value:
        if implementation_status == "deferred":
            return findings
        level = "FAIL" if required else "WARN"
        findings.append(Finding(level, f"{component_id} {name} has no implementation path."))
        return findings

    implementation = REPO_ROOT / str(path_value)
    if not implementation.exists():
        level = "FAIL" if required else "WARN"
        findings.append(Finding(level, f"{component_id} path does not exist: {path_value}"))
        return findings

    source = implementation.read_text(encoding="utf-8")
    if not exports_component(source, str(runtime_name)):
        level = "FAIL" if required else "WARN"
        findings.append(
            Finding(
                level,
                f"{component_id} {name} runtime export {runtime_name} is not exported from "
                f"{relative(implementation)}.",
            )
        )

    missing_props = []
    for prop in prop_names(entry.get("props")):
        if prop.startswith("..."):
            continue
        if prop not in source:
            missing_props.append(prop)
    if missing_props:
        findings.append(
            Finding(
                "WARN",
                f"{component_id} {name} documented prop(s) not found in {relative(implementation)}: "
                + ", ".join(missing_props),
            )
        )

    return findings


def main() -> int:
    contract = load_contract()
    findings: list[Finding] = []

    for group in ("existing_components", "new_components"):
        for entry in contract.get(group) or []:
            findings.extend(validate_component(entry, group))

    failures = [finding for finding in findings if finding.level == "FAIL"]
    warnings = [finding for finding in findings if finding.level == "WARN"]

    if failures:
        print("design-contracts: FAIL")
        for finding in failures:
            print(f" - {finding.message}")
        for finding in warnings:
            print(f" - warning: {finding.message}")
        print("autonomous remediation:")
        print(" - fix docs/design/component-contract.yaml or the exported component path it names")
        print(" - implemented entries must resolve to a real exported component; future entries may stay warning-only")
        print(" - rerun: pnpm repo:docs:check")
        return 1

    print(f"design-contracts: PASS ({len(warnings)} warning(s))")
    for finding in warnings:
        print(f" - warning: {finding.message}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
