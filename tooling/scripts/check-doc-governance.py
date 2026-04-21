#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FAILURES: list[str] = []

REQUIRED_FILES = [
    ROOT / "AGENTS.md",
    ROOT / "CLAUDE.md",
    ROOT / "CODEX.md",
    ROOT / "GEMINI.md",
    ROOT / ".github" / "copilot-instructions.md",
    ROOT / "apps" / "web" / "AGENTS.md",
    ROOT / "apps" / "mobile" / "AGENTS.md",
    ROOT / "services" / "api" / "AGENTS.md",
    ROOT / "docs" / "architecture" / "README.md",
    ROOT / "docs" / "architecture" / "common.md",
    ROOT / "docs" / "architecture" / "web.md",
    ROOT / "docs" / "architecture" / "mobile.md",
    ROOT / "docs" / "maintenance" / "DOCUMENTATION_GOVERNANCE.md",
]

TEXT_FILES = [
    ROOT / "AGENTS.md",
    ROOT / "CLAUDE.md",
    ROOT / "CODEX.md",
    ROOT / "GEMINI.md",
    ROOT / ".github" / "copilot-instructions.md",
    ROOT / "README.md",
    ROOT / "docs" / "maintenance" / "OPERATING_MODEL.md",
    ROOT / "tooling" / "agent" / "AGENTS.md",
]

ADAPTERS = [
    ROOT / "CLAUDE.md",
    ROOT / "CODEX.md",
    ROOT / "GEMINI.md",
    ROOT / ".github" / "copilot-instructions.md",
]

FORBIDDEN_ACTIVE_REF = "docs/plans/"
ADAPTER_NAMES = {"CLAUDE.md", "CODEX.md", "GEMINI.md", "copilot-instructions.md"}

for path in REQUIRED_FILES:
    if not path.exists():
        FAILURES.append(f"missing required file: {path.relative_to(ROOT)}")

for path in TEXT_FILES:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if FORBIDDEN_ACTIVE_REF in text:
        FAILURES.append(f"stale active-doc reference to docs/plans/: {path.relative_to(ROOT)}")

for path in ADAPTERS:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    for name in ADAPTER_NAMES - {path.name}:
        if name in text:
            FAILURES.append(f"adapter {path.relative_to(ROOT)} references another adapter ({name})")

agents_text = (ROOT / "AGENTS.md").read_text(encoding="utf-8") if (ROOT / "AGENTS.md").exists() else ""
for required in [
    "docs/architecture/README.md",
    "apps/web/AGENTS.md",
    "apps/mobile/AGENTS.md",
    "services/api/AGENTS.md",
]:
    if required not in agents_text:
        FAILURES.append(f"AGENTS.md missing required discovery reference: {required}")

pkg = ROOT / "package.json"
if pkg.exists():
    package_json = json.loads(pkg.read_text(encoding="utf-8"))
    scripts = package_json.get("scripts", {})
    for name, needle in {
        "pack:backend": "docs/architecture/common.md",
        "pack:web": "docs/architecture/web.md",
        "pack:mobile": "docs/architecture/mobile.md",
    }.items():
        value = scripts.get(name, "")
        if needle not in value:
            FAILURES.append(f"package.json script {name!r} missing {needle!r}")

repomix = ROOT / "repomix.config.json"
if repomix.exists():
    repomix_json = json.loads(repomix.read_text(encoding="utf-8"))
    patterns = repomix_json.get("ignore", {}).get("customPatterns", [])
    if "docs/plans/**" in patterns:
        FAILURES.append("repomix.config.json still ignores docs/plans/** even though it is no longer a live surface")

if FAILURES:
    print("documentation-governance: FAIL")
    for failure in FAILURES:
        print(f" - {failure}")
    sys.exit(1)

print("documentation-governance: PASS")
