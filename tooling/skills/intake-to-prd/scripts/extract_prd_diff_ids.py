#!/usr/bin/env python3
"""Extract changed requirement IDs from a PRD diff.

Supports:
  --staged           diff the git staging area (default: HEAD)
  --base <git-ref>   base ref for comparison (default: HEAD~1)
  --head <git-ref>   head ref for comparison (default: HEAD)

Output: JSON with {added, modified, removed} sets of REQ-P1-* and NFR-* IDs.

Identifier convention (from identifier-consistency audit):
  - REQ-P1-[A-Z]+-\\d{2}  (2-digit zero-padded)
  - NFR-[A-Z]+-\\d{2}     (2-digit zero-padded)

The tool uses a tolerant regex (\\d+ not \\d{2}) so it catches IDs regardless
of padding, then normalizes to 2-digit zero-padded form for output.

Exit 0 always (even with empty sets), unless the tool itself fails.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
PRD_FILE = "docs/PRD.md"

# Tolerant regex: catches both REQ-P1-AUTH-1 and REQ-P1-AUTH-01
REQ_ID_RE = re.compile(r"\b(REQ-P1-[A-Z]+-\d+)\b")
NFR_ID_RE = re.compile(r"\b(NFR-[A-Z]+-\d+)\b")

ALL_ID_RE = re.compile(r"\b((?:REQ-P1|NFR)-[A-Z]+-\d+)\b")


def normalize_id(raw: str) -> str:
    """Normalize an ID to canonical 2-digit zero-padded form.

    REQ-P1-AUTH-1 -> REQ-P1-AUTH-01
    REQ-P1-AUTH-01 -> REQ-P1-AUTH-01
    NFR-SEC-1 -> NFR-SEC-01
    """
    parts = raw.rsplit("-", 1)
    if len(parts) == 2:
        prefix, num = parts
        try:
            return f"{prefix}-{int(num):02d}"
        except ValueError:
            return raw
    return raw


def git_diff(args: list[str]) -> str:
    """Run git diff and return stdout."""
    cmd = ["git", "-C", str(REPO_ROOT)] + args + ["--", PRD_FILE]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"extract_prd_diff_ids: git error: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def extract_ids(text: str) -> set[str]:
    """Extract and normalize all requirement IDs from text."""
    raw_ids = ALL_ID_RE.findall(text)
    return {normalize_id(rid) for rid in raw_ids}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract changed requirement IDs from a PRD diff"
    )
    parser.add_argument(
        "--staged", action="store_true",
        help="Diff the git staging area against HEAD"
    )
    parser.add_argument(
        "--base", metavar="GIT_REF",
        help="Base ref for comparison (default: HEAD~1)"
    )
    parser.add_argument(
        "--head", metavar="GIT_REF",
        help="Head ref for comparison (default: HEAD)"
    )
    args = parser.parse_args()

    # Determine diff mode
    if args.staged:
        diff_text = git_diff(["diff", "--cached"])
    elif args.base:
        head = args.head or "HEAD"
        diff_text = git_diff(["diff", args.base, head])
    else:
        # Default: HEAD~1..HEAD
        diff_text = git_diff(["diff", "HEAD~1", "HEAD"])

    # Parse diff into added and removed lines
    added_ids: set[str] = set()
    removed_ids: set[str] = set()

    for line in diff_text.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            added_ids.update(extract_ids(line))
        elif line.startswith("-") and not line.startswith("---"):
            removed_ids.update(extract_ids(line))

    # Classify: added = in new but not in old, removed = in old but not in new
    # modified = in both (the line moved but the ID is still present)
    added = sorted(added_ids - removed_ids)
    removed = sorted(removed_ids - added_ids)
    modified = sorted(added_ids & removed_ids)

    output = {
        "added": added,
        "modified": modified,
        "removed": removed,
    }

    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
