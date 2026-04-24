#!/usr/bin/env python3
"""Validate live REQ/NFR references against docs/PRD.md."""

from __future__ import annotations

import difflib
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
PRD_FILE = REPO_ROOT / "docs" / "PRD.md"
CANONICAL_ID_RE = re.compile(r"\b(?:REQ-P1|NFR)-[A-Z]+-\d{2}\b")
REFERENCE_RE = re.compile(r"\b(?:(?:REQ-P1|NFR)-[A-Z]+-\d{2}[A-Z]?|REQ-[A-Z]+-\d{2}[A-Z]?)\b")

SCAN_PATHS = [
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / ".github" / "copilot-instructions.md",
    REPO_ROOT / ".github" / "PULL_REQUEST_TEMPLATE.md",
    REPO_ROOT / "docs" / "LAUNCH_ROADMAP.md",
    REPO_ROOT / "docs" / "maintenance",
    REPO_ROOT / "docs" / "identifiers",
    REPO_ROOT / "docs" / "architecture",
    REPO_ROOT / "docs" / "openapi",
    REPO_ROOT / "docs" / "design",
    REPO_ROOT / "services" / "api" / "src" / "main",
    REPO_ROOT / "apps",
    REPO_ROOT / "packages",
    REPO_ROOT / "tests" / "scenarios",
]

SKIP_DIRS = {"build", "dist", "generated", "node_modules", ".gradle", ".turbo"}
TEXT_SUFFIXES = {".java", ".kt", ".md", ".yaml", ".yml", ".json", ".ts", ".tsx", ".js", ".mjs", ".sh", ".py"}


@dataclass(frozen=True)
class Finding:
    path: Path
    line: int
    token: str
    message: str


def relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def canonical_ids() -> set[str]:
    return set(CANONICAL_ID_RE.findall(PRD_FILE.read_text(encoding="utf-8")))


def iter_files() -> list[Path]:
    files: list[Path] = []
    for path in SCAN_PATHS:
        if not path.exists():
            continue
        if path.is_file():
            files.append(path)
            continue
        for candidate in path.rglob("*"):
            if not candidate.is_file():
                continue
            if any(part in SKIP_DIRS for part in candidate.parts):
                continue
            if candidate.suffix not in TEXT_SUFFIXES:
                continue
            files.append(candidate)
    return sorted(set(files))


def main() -> int:
    live_ids = canonical_ids()
    findings: list[Finding] = []
    for path in iter_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in REFERENCE_RE.finditer(text):
            token = match.group(0)
            if token in live_ids:
                continue
            line = text.count("\n", 0, match.start()) + 1
            if token.startswith("REQ-") and not token.startswith("REQ-P1-"):
                message = "uses legacy requirement ID format; use a live REQ-P1/NFR ID from docs/PRD.md"
            else:
                suggestion = difflib.get_close_matches(token, sorted(live_ids), n=1, cutoff=0.55)
                message = "does not resolve to a live ID in docs/PRD.md"
                if suggestion:
                    message += f"; did you mean {suggestion[0]}?"
            findings.append(Finding(path, line, token, message))

    if findings:
        print("requirement-references: FAIL", file=sys.stderr)
        for finding in findings:
            print(
                f" - {relative(finding.path)}:{finding.line}: `{finding.token}` {finding.message}",
                file=sys.stderr,
            )
        print("autonomous remediation:", file=sys.stderr)
        print(" - replace stale implementation/doc references with live IDs from docs/PRD.md", file=sys.stderr)
        print(" - keep historical IDs only in explicitly historical surfaces outside this validator", file=sys.stderr)
        return 1

    print(f"requirement-references: PASS ({len(iter_files())} live file(s) scanned)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
