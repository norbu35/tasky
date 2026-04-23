#!/usr/bin/env python3
"""Proactive doc-claims audit: find load-bearing references that lack a claim block.

Scans the same files as validate-doc-claims.py and emits candidate references
that look load-bearing but are currently relying on prose extraction alone.

This is an authoring aid, not a replacement for the blocking validator.

Output: JSON array of candidates with file, line, candidate text, and kind_guess.
Exit 0 always (even with no candidates), unless the tool itself crashes.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("audit_unclaimed_refs: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[4]
JAVA_ROOT = REPO_ROOT / "services" / "api" / "src" / "main" / "java"

# Patterns that suggest load-bearing references in prose
JAVA_CLASS_RE = re.compile(r"\b([A-Z][A-Za-z0-9_]*(?:Service|Repository|Controller|Config|Filter|Interceptor|Provider|Client|Handler|Validator|Listener|Exception|Dto|Request|Response|Entity|Mapper|Converter|Util|Helper|Builder|Factory|Wrapper|Adapter|Strategy|Resolver|Aspect|Bean|Component))\b")
DB_TABLE_RE = re.compile(r"\b(?:table|tables?|column|columns?)\s+[`\"']?(\w+)[`\"']?", re.IGNORECASE)
ENV_VAR_RE = re.compile(r"\b([A-Z][A-Z0-9_]{2,})\b")
ENDPOINT_RE = re.compile(r"(?:GET|POST|PUT|PATCH|DELETE|OPTIONS)\s+(/[^\s,;\)]+)")
WORKFLOW_RE = re.compile(r"\b([a-z][a-z0-9_-]+\.yml)\b")

# Fenced claim block detection
FENCED_CLAIM_START_RE = re.compile(r"^\s*```claim\s+([\w-]+)\s*$")
FENCED_CLAIM_END_RE = re.compile(r"^\s*```\s*$")

# High-signal Java suffixes (these are likely real code references, not casual words)
HIGH_SIGNAL_SUFFIXES = (
    "Service", "Repository", "Controller", "Config", "Filter",
    "Interceptor", "Provider", "Client", "Handler", "Validator",
    "Listener", "Exception", "Dto", "Request", "Response", "Entity",
    "Mapper", "Converter",
)


@dataclass
class Candidate:
    file: str
    line: int
    candidate: str
    kind_guess: str


def collect_scan_files() -> list[Path]:
    """Same file set as validate-doc-claims.py."""
    files: list[Path] = []
    for path in sorted((REPO_ROOT / "docs" / "architecture").rglob("*.md")):
        files.append(path)
    for path in sorted((REPO_ROOT / "docs" / "maintenance").glob("*.md")):
        files.append(path)
    for path in sorted((JAVA_ROOT / "mn" / "tasky").glob("*/AGENTS.md")):
        files.append(path)
    return files


def has_nearby_claim_block(lines: list[str], line_idx: int, window: int = 15) -> bool:
    """Check if there's a fenced claim block within window lines of the given line."""
    start = max(0, line_idx - window)
    end = min(len(lines), line_idx + window)
    in_claim = False
    for i in range(start, end):
        if FENCED_CLAIM_START_RE.match(lines[i]):
            in_claim = True
        elif in_claim and FENCED_CLAIM_END_RE.match(lines[i]):
            in_claim = False
            return True
    return False


def extract_candidates_from_line(line: str) -> list[tuple[str, str]]:
    """Extract candidate references and their kind guesses from a prose line.

    Returns list of (candidate_text, kind_guess) tuples.
    """
    candidates = []

    # Java classes with high-signal suffixes
    for m in JAVA_CLASS_RE.finditer(line):
        name = m.group(1)
        if name.endswith(HIGH_SIGNAL_SUFFIXES):
            candidates.append((name, "java_class"))

    # HTTP endpoints
    for m in ENDPOINT_RE.finditer(line):
        candidates.append((m.group(0), "endpoint"))

    # GitHub workflow filenames
    for m in WORKFLOW_RE.finditer(line):
        if m.group(1) not in ("docker-compose.yml", "docker-compose.observability.yml"):
            candidates.append((m.group(1), "workflow"))

    return candidates


def scan_file(path: Path) -> list[Candidate]:
    """Scan a file for load-bearing references that lack a nearby claim block."""
    candidates = []

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return candidates

    rel = path.relative_to(REPO_ROOT).as_posix()

    for idx, line in enumerate(lines):
        # Skip code blocks (non-claim fenced blocks)
        stripped = line.strip()
        if stripped.startswith("```") and not FENCED_CLAIM_START_RE.match(stripped):
            continue

        # Skip lines that are inside a claim block
        if FENCED_CLAIM_START_RE.match(stripped):
            continue

        line_candidates = extract_candidates_from_line(line)
        if not line_candidates:
            continue

        # Check if there's a nearby claim block covering this area
        if has_nearby_claim_block(lines, idx):
            continue

        for text, kind in line_candidates:
            candidates.append(Candidate(
                file=rel,
                line=idx + 1,
                candidate=text,
                kind_guess=kind,
            ))

    return candidates


def main() -> int:
    files = collect_scan_files()
    all_candidates: list[Candidate] = []

    for path in files:
        all_candidates.extend(scan_file(path))

    # Deduplicate by (file, line, candidate)
    seen: set[tuple[str, int, str]] = set()
    unique: list[Candidate] = []
    for c in all_candidates:
        key = (c.file, c.line, c.candidate)
        if key not in seen:
            seen.add(key)
            unique.append(c)

    output = [
        {
            "file": c.file,
            "line": c.line,
            "candidate": c.candidate,
            "kind_guess": c.kind_guess,
        }
        for c in sorted(unique, key=lambda x: (x.file, x.line))
    ]

    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
