#!/usr/bin/env python3
"""Validate line coverage for changed runtime Java sources only."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from defusedxml import ElementTree as ET


HUNK_RE = re.compile(r"@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")
EXCLUDED_PREFIXES = (
    "mn.tasky.api.generated",
    "mn.tasky.payment",
    "mn.tasky.wallet",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--changed-files", required=True)
    parser.add_argument("--jacoco-xml", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--min-line-ratio", type=float, default=0.80)
    return parser.parse_args()


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip())


def run_git_diff(repo: Path, path: str, cached: bool) -> set[int]:
    command = ["git", "diff", "--unified=0", "--no-color"]
    if cached:
        command.append("--cached")
    command.extend(["--", path])
    result = subprocess.run(command, cwd=repo, check=False, capture_output=True, text=True)
    if result.returncode not in (0, 1):
        raise RuntimeError(result.stderr.strip() or f"git diff failed for {path}")

    changed_lines: set[int] = set()
    for line in result.stdout.splitlines():
        match = HUNK_RE.match(line)
        if not match:
            continue
        start = int(match.group(1))
        count = int(match.group(2) or "1")
        if count == 0:
            continue
        changed_lines.update(range(start, start + count))
    return changed_lines


def is_tracked(repo: Path, path: str) -> bool:
    result = subprocess.run(
        ["git", "ls-files", "--error-unmatch", path],
        cwd=repo,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def load_jacoco_lines(xml_path: Path) -> dict[str, dict[int, bool]]:
    root = ET.parse(xml_path).getroot()
    coverage: dict[str, dict[int, bool]] = {}
    for package in root.findall("package"):
        package_path = package.attrib["name"]
        for source_file in package.findall("sourcefile"):
            path = f"src/main/java/{package_path}/{source_file.attrib['name']}"
            coverage[path] = {
                int(line.attrib["nr"]): int(line.attrib["ci"]) > 0 for line in source_file.findall("line")
            }
    return coverage


def fqcn_for(path: str) -> str | None:
    prefix = "src/main/java/"
    if not path.startswith(prefix) or not path.endswith(".java"):
        return None
    return path[len(prefix) : -len(".java")].replace("/", ".")


def in_scope(path: str) -> bool:
    fqcn = fqcn_for(path)
    if fqcn is None or not fqcn.startswith("mn.tasky."):
        return False
    if ".dto." in fqcn or fqcn.endswith(".dto"):
        return False
    if fqcn == "mn.tasky":
        return False
    return not fqcn.startswith(EXCLUDED_PREFIXES)


def changed_runtime_paths(changed_files_path: Path) -> list[str]:
    paths = []
    for raw_line in changed_files_path.read_text(encoding="utf-8").splitlines():
        path = raw_line.strip()
        if path and in_scope(path):
            paths.append(path)
    return sorted(dict.fromkeys(paths))


def changed_executable_lines(repo: Path, path: str, executable_lines: dict[int, bool]) -> list[int]:
    if not executable_lines:
        return []
    if not is_tracked(repo, path):
        return sorted(executable_lines.keys())
    changed_lines = run_git_diff(repo, path, cached=False) | run_git_diff(repo, path, cached=True)
    return sorted(line for line in changed_lines if line in executable_lines)


def main() -> int:
    args = parse_args()
    repo = repo_root()
    changed_files_path = Path(args.changed_files)
    jacoco_xml_path = Path(args.jacoco_xml)
    out_path = Path(args.out)

    coverage_by_file = load_jacoco_lines(jacoco_xml_path)
    failures: list[str] = []
    file_results: list[dict[str, object]] = []

    for path in changed_runtime_paths(changed_files_path):
        executable_lines = coverage_by_file.get(path, {})
        changed_lines = changed_executable_lines(repo, path, executable_lines)
        if not changed_lines:
            file_results.append(
                {
                    "path": path,
                    "status": "SKIPPED",
                    "reason": "No changed executable lines.",
                    "covered_changed_lines": 0,
                    "total_changed_lines": 0,
                    "line_ratio": 1.0,
                    "uncovered_lines": [],
                }
            )
            continue

        uncovered_lines = [line for line in changed_lines if not executable_lines[line]]
        covered_lines = len(changed_lines) - len(uncovered_lines)
        ratio = covered_lines / len(changed_lines)
        status = "PASS" if ratio >= args.min_line_ratio else "FAIL"
        file_results.append(
            {
                "path": path,
                "status": status,
                "covered_changed_lines": covered_lines,
                "total_changed_lines": len(changed_lines),
                "line_ratio": ratio,
                "uncovered_lines": uncovered_lines,
            }
        )
        if status == "FAIL":
            failures.append(
                f"{path}: covered {covered_lines}/{len(changed_lines)} changed executable lines "
                f"({ratio:.0%}); uncovered lines {uncovered_lines}"
            )

    payload = {
        "overall_status": "FAIL" if failures else "PASS",
        "minimum_line_ratio": args.min_line_ratio,
        "files": file_results,
        "failures": failures,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if failures:
        print("Touched coverage validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
