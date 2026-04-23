#!/usr/bin/env python3
"""validate-doc-references.py

Scans live agent-instruction documents for references that must resolve to real
artifacts. Catches the most common form of agent drift: a doc tells the agent
to run `pnpm verify:foo` or edit `tooling/scripts/old/path.sh` after the script
or command has been renamed or removed.

Validates:
  - pnpm <script> references → must exist in root package.json scripts (or be a
    pnpm built-in command). Wildcards (`pnpm verify:*`) are skipped.
  - File and directory paths in inline backticks (e.g. `tooling/scripts/x.sh`,
    `docs/openapi/openapi.yaml`) → must exist on disk.
  - Fenced code blocks are skipped (those are example commands / outputs, not
    canonical references).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SKIP_DIRS = {"archive", "node_modules", "build", "bin", ".gradle", ".git", "dist", ".turbo"}

# Documents whose references are agent-load-bearing. Adding more docs is cheap;
# err toward more coverage when the doc's job is to tell agents what to do.
ADAPTERS = [
    ROOT / "CLAUDE.md",
    ROOT / "CODEX.md",
    ROOT / "GEMINI.md",
    ROOT / ".github" / "copilot-instructions.md",
]
EXTRA_GOVERNING = [
    ROOT / "README.md",
    ROOT / "docs" / "maintenance" / "DOCUMENTATION_GOVERNANCE.md",
]

# Pnpm built-in commands. References like `pnpm exec lint-staged` or
# `pnpm install --frozen-lockfile` are CLI usage, not script invocations.
PNPM_BUILTINS = {
    "add", "audit", "create", "deploy", "dlx", "doctor", "env", "exec",
    "fetch", "import", "init", "install", "licenses", "link", "list", "ls",
    "outdated", "patch", "prune", "publish", "rebuild", "recursive", "remove",
    "rm", "root", "run", "serve", "setup", "start", "store", "uninstall",
    "unlink", "update", "upgrade", "view", "why",
}

# Script names captured after `pnpm `. Must start with a letter to skip
# `pnpm -r foo` and `pnpm --filter @tasky/web bar`. The `*` is included so
# wildcard shorthand (`pnpm verify:*`) is captured and skipped explicitly.
PNPM_RE = re.compile(r"`?pnpm\s+([a-z][a-z0-9:.*-]*)`?", re.IGNORECASE)

# Path-like references containing at least one slash and a file extension.
# Lookarounds ensure we don't match substrings of URLs or longer paths.
PATH_RE = re.compile(
    r"(?<![\w./:-])([a-z][\w.-]*(?:/[\w.-]+)+\.[a-zA-Z][a-zA-Z0-9]*)(?![\w./:])"
)

# Lines containing these tokens are unreliable as file references (template
# placeholders, glob shorthand, shell variable interpolation, URLs).
SKIP_PATH_TOKENS = ("${", "<", "$(", "**", "://")


def collect_scan_files() -> list[Path]:
    files: list[Path] = []
    for agents in ROOT.rglob("AGENTS.md"):
        if any(part in SKIP_DIRS for part in agents.parts):
            continue
        files.append(agents)
    for adapter in ADAPTERS + EXTRA_GOVERNING:
        if adapter.exists():
            files.append(adapter)
    return files


def load_pnpm_scripts() -> set[str]:
    pkg = ROOT / "package.json"
    data = json.loads(pkg.read_text(encoding="utf-8"))
    return set(data.get("scripts", {}).keys())


def find_pnpm_refs(text: str) -> set[str]:
    refs: set[str] = set()
    in_code_block = False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_code_block = not in_code_block
            # commands inside fenced blocks are still load-bearing for agents:
            # they're literal copy-paste examples. Continue scanning.
        for match in PNPM_RE.finditer(line):
            cmd = match.group(1)
            if cmd.endswith("*"):
                continue
            refs.add(cmd)
    return refs


def find_path_refs(text: str) -> set[str]:
    refs: set[str] = set()
    in_code_block = False
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            # Code blocks contain example commands (find / grep / npx) that
            # often embed glob fragments and shell expansions; scanning them
            # produces false positives that aren't doc-drift signal.
            continue
        if any(tok in line for tok in SKIP_PATH_TOKENS):
            # Skip path candidates that appear alongside template placeholders,
            # globs, or shell expansions on the same line — those are usually
            # patterns rather than concrete refs.
            continue
        for match in PATH_RE.finditer(line):
            ref = match.group(1)
            if "*" in ref or ref.startswith("./") or ref.startswith("../"):
                continue
            refs.add(ref)
    return refs


def main() -> int:
    pkg_scripts = load_pnpm_scripts()
    failures: list[str] = []
    scan_files = collect_scan_files()

    for path in scan_files:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)

        for cmd in sorted(find_pnpm_refs(text)):
            if cmd in PNPM_BUILTINS:
                continue
            if cmd in pkg_scripts:
                continue
            failures.append(f"{rel}: references unknown pnpm script: pnpm {cmd}")

        for ref in sorted(find_path_refs(text)):
            target = ROOT / ref
            if target.exists():
                continue
            failures.append(f"{rel}: references missing path: {ref}")

    if failures:
        print("doc-references: FAIL")
        for failure in failures:
            print(f" - {failure}")
        print("autonomous remediation:")
        print(" - update the stale command or path in the governing doc instead of working around the check")
        print(" - if a script was renamed, refresh package.json and doc references together")
        print(" - rerun: pnpm repo:docs:check")
        return 1

    print(f"doc-references: PASS ({len(scan_files)} files scanned)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
