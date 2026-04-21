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
    ROOT / "docs" / "openapi" / "AGENTS.md",
    ROOT / "docs" / "openapi" / "README.md",
    ROOT / "docs" / "openapi" / "openapi.yaml",
    ROOT / "tooling" / "agent" / "AGENTS.md",
    ROOT / "docs" / "architecture" / "AGENTS.md",
    ROOT / "docs" / "architecture" / "common.md",
    ROOT / "docs" / "architecture" / "api.md",
    ROOT / "docs" / "architecture" / "web.md",
    ROOT / "docs" / "architecture" / "mobile.md",
    ROOT / "docs" / "architecture" / "shared-frontend.md",
    ROOT / "docs" / "maintenance" / "DOCUMENTATION_GOVERNANCE.md",
    ROOT / "tests" / "registry.yaml",
    ROOT / "services" / "api" / "scripts" / "sync-registry.sh",
]

ADAPTERS = [
    ROOT / "CLAUDE.md",
    ROOT / "CODEX.md",
    ROOT / "GEMINI.md",
    ROOT / ".github" / "copilot-instructions.md",
]

FORBIDDEN_ACTIVE_REF = "docs/plans/"
ADAPTER_NAMES = {p.name for p in ADAPTERS}
SKIP_DIRS = {"archive", "node_modules", "build", "bin", ".gradle", ".git"}

for path in REQUIRED_FILES:
    if not path.exists():
        FAILURES.append(f"missing required file: {path.relative_to(ROOT)}")

# Scan every live AGENTS.md plus the adapters and README for stale plan-dir refs.
scan_targets: list[Path] = [
    p for p in ROOT.rglob("AGENTS.md") if not SKIP_DIRS.intersection(p.parts)
]
scan_targets.extend(ADAPTERS)
scan_targets.append(ROOT / "README.md")

for path in scan_targets:
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
    "docs/architecture/AGENTS.md",
    "apps/web/AGENTS.md",
    "apps/mobile/AGENTS.md",
    "services/api/AGENTS.md",
    "docs/openapi/AGENTS.md",
    "tooling/agent/AGENTS.md",
]:
    if required not in agents_text:
        FAILURES.append(f"AGENTS.md missing required discovery reference: {required}")

pkg = ROOT / "package.json"
if pkg.exists():
    package_json = json.loads(pkg.read_text(encoding="utf-8"))
    scripts = package_json.get("scripts", {})
    for name, needle in {
        "pack:backend": "docs/openapi/**",
        "pack:web": "docs/openapi/**",
        "pack:mobile": "docs/openapi/**",
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
