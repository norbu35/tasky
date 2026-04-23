#!/usr/bin/env python3
"""Group doc-claim failures into an agent-friendly repair worklist."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[4]
VALIDATOR = REPO_ROOT / "tooling" / "scripts" / "governance" / "validate-doc-claims.py"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize validate-doc-claims failures by file and surface kind.")
    parser.add_argument("--report-only", action="store_true", help="Pass through to the underlying validator.")
    parser.add_argument("--json", action="store_true", help="Emit grouped JSON instead of text.")
    return parser.parse_args()


def classify(message: str) -> str:
    mapping = (
        ("Java class", "java-symbol"),
        ("Java FQN", "java-symbol"),
        ("DB table", "schema"),
        ("DB column", "schema"),
        ("Env var", "env-var"),
        ("Config key", "config-key"),
        ("OpenAPI operationId", "endpoint"),
        ("Endpoint `", "endpoint"),
        ("Flyway migration", "flyway"),
        ("Workflow `", "workflow"),
        ("Claim ", "claim-block"),
        ("Allowlist entry", "allowlist"),
    )
    for prefix, label in mapping:
        if prefix in message:
            return label
    return "other"


def recommended_action(kind: str, message: str) -> str:
    if kind == "claim-block":
        return "fix or add the structured claim block"
    if kind == "allowlist":
        return "refresh, justify, or delete the stale allowlist entry"
    if "Use a claim block" in message:
        return "add a claim block or add table context"
    return "fix the doc first; update allowlist only if the reference is intentionally external or historical"


def run_validator(report_only: bool) -> tuple[int, dict[str, Any]]:
    cmd = ["python3", str(VALIDATOR), "--json"]
    if report_only:
        cmd.append("--report-only")
    result = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True, check=False)
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        print(result.stdout, file=sys.stderr, end="")
        print(result.stderr, file=sys.stderr, end="")
        raise SystemExit(f"Could not parse validator JSON output: {exc}") from exc
    return result.returncode, payload


def grouped_summary(payload: dict[str, Any]) -> dict[str, Any]:
    by_file: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for failure in payload.get("failures", []):
        by_file[str(failure["file"])].append(failure)

    summary_files = []
    for file_path in sorted(by_file):
        failures = by_file[file_path]
        kinds: dict[str, int] = defaultdict(int)
        items = []
        for failure in failures:
            kind = classify(str(failure["message"]))
            kinds[kind] += 1
            items.append(
                {
                    "line": failure["line"],
                    "kind": kind,
                    "message": failure["message"],
                    "suggestion": failure.get("suggestion"),
                    "recommended_action": recommended_action(kind, str(failure["message"])),
                }
            )
        summary_files.append(
            {
                "file": file_path,
                "failure_count": len(failures),
                "kinds": dict(sorted(kinds.items())),
                "items": items,
            }
        )
    return {
        "status": payload.get("status", "unknown"),
        "files_scanned": payload.get("files_scanned", 0),
        "warnings": payload.get("warnings", []),
        "files": summary_files,
    }


def print_text(summary: dict[str, Any]) -> None:
    files = summary["files"]
    if not files:
        print(f"doc-claims-triage: PASS ({summary['files_scanned']} files scanned)")
        return

    print("doc-claims-triage: FAIL")
    for file_info in files:
        kinds = ", ".join(f"{kind}={count}" for kind, count in file_info["kinds"].items())
        print(f" - {file_info['file']}: {file_info['failure_count']} failure(s) [{kinds}]")
        for item in file_info["items"]:
            print(f"     {item['line']}: [{item['kind']}] {item['message']}")
            if item["suggestion"]:
                print(f"       {item['suggestion']}")
            print(f"       action: {item['recommended_action']}")
    if summary["warnings"]:
        print("warnings:")
        for warning in summary["warnings"]:
            print(f" - {warning['file']}:{warning['line']}: {warning['message']}")
    print("repair order: fix doc -> add claim block -> update source-of-truth -> allowlist only if intentional")


def main() -> int:
    args = parse_args()
    return_code, payload = run_validator(report_only=args.report_only)
    summary = grouped_summary(payload)
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print_text(summary)
    return 0 if args.report_only or return_code == 0 else return_code


if __name__ == "__main__":
    sys.exit(main())
