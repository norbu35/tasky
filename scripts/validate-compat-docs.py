#!/usr/bin/env python3
"""Validate compatibility-only documentation constraints."""

from __future__ import annotations

import sys
from pathlib import Path


CLAUDE_PATH = Path("CLAUDE.md")
REQUIRED_SNIPPETS = (
    "<!-- COMPATIBILITY_ONLY -->",
    "AGENTS.md",
    "docs/agent/RUNBOOK.md",
)
FORBIDDEN_SNIPPETS = (
    "## Document Precedence",
    "## Development Workflow",
    "## Quality Gates",
    "## Non-Negotiables",
)


def main() -> int:
    if not CLAUDE_PATH.is_file():
        print(f"Missing compatibility document: {CLAUDE_PATH}", file=sys.stderr)
        return 1

    text = CLAUDE_PATH.read_text(encoding="utf-8")
    failures: list[str] = []

    for snippet in REQUIRED_SNIPPETS:
        if snippet not in text:
            failures.append(f"CLAUDE.md missing required snippet: {snippet}")

    for snippet in FORBIDDEN_SNIPPETS:
        if snippet in text:
            failures.append(f"CLAUDE.md contains forbidden authoritative section: {snippet}")

    if failures:
        print("Compatibility-doc validation failed:", file=sys.stderr)
        for item in failures:
            print(f"- {item}", file=sys.stderr)
        return 1

    print("Compatibility-doc validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
