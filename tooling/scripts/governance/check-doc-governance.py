#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

FAILURES: list[str] = []


def print_remediation() -> None:
    print("autonomous remediation:")
    print(" - fix the live governing doc or routing surface named above; do not suppress active drift")
    print(" - keep AGENTS/doc discovery aligned with docs/PRD.md, docs/STRATEGY.md, and docs/maintenance/DOCUMENTATION_GOVERNANCE.md")
    print(" - rerun: pnpm repo:docs:check")

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
    ROOT / "packages" / "core" / "AGENTS.md",
    ROOT / "packages" / "design-tokens" / "AGENTS.md",
    ROOT / "packages" / "sdk" / "AGENTS.md",
    ROOT / "packages" / "test-utils" / "AGENTS.md",
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
    "packages/core/AGENTS.md",
    "packages/design-tokens/AGENTS.md",
    "packages/sdk/AGENTS.md",
    "packages/test-utils/AGENTS.md",
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

# --- Stale tooling/agent reference scan ---
stale_ref_patterns = ["tooling/agent"]
stale_scan_globs = ["AGENTS.md", "README.md", "package.json", "repomix.config.json"]
for md_path in ROOT.rglob("*.md"):
    if SKIP_DIRS.intersection(md_path.parts):
        continue
    if md_path.name not in stale_scan_globs and md_path.parent.name != "docs":
        continue
    text = md_path.read_text(encoding="utf-8")
    for pattern in stale_ref_patterns:
        if pattern in text:
            FAILURES.append(f"stale '{pattern}' reference in {md_path.relative_to(ROOT)}")

for cfg_name in ["package.json", "repomix.config.json"]:
    cfg_path = ROOT / cfg_name
    if cfg_path.exists():
        text = cfg_path.read_text(encoding="utf-8")
        for pattern in stale_ref_patterns:
            if pattern in text:
                FAILURES.append(f"stale '{pattern}' reference in {cfg_name}")

# --- Pack-script / AGENTS.md consistency checks ---
if pkg.exists():
    web_agents = (ROOT / "apps" / "web" / "AGENTS.md").read_text(encoding="utf-8") if (ROOT / "apps" / "web" / "AGENTS.md").exists() else ""
    mobile_agents = (ROOT / "apps" / "mobile" / "AGENTS.md").read_text(encoding="utf-8") if (ROOT / "apps" / "mobile" / "AGENTS.md").exists() else ""
    pack_web = scripts.get("pack:web", "")
    pack_mobile = scripts.get("pack:mobile", "")
    if "shared-frontend.md" in web_agents and "shared-frontend.md" not in pack_web:
        FAILURES.append("apps/web/AGENTS.md references shared-frontend.md but pack:web script omits it")
    if "shared-frontend.md" in mobile_agents and "shared-frontend.md" not in pack_mobile:
        FAILURES.append("apps/mobile/AGENTS.md references shared-frontend.md but pack:mobile script omits it")

    # README should present openapi.yaml as canonical, not API.yaml as primary API authority
    readme_text = (ROOT / "README.md").read_text(encoding="utf-8") if (ROOT / "README.md").exists() else ""
    readme_api_line = None
    for line in readme_text.splitlines():
        if "API contract" in line:
            readme_api_line = line
            break
    if readme_api_line and "docs/API.yaml" in readme_api_line and "canonical" not in readme_api_line:
        FAILURES.append("README.md presents docs/API.yaml as primary API authority instead of docs/openapi/openapi.yaml")

if FAILURES:
    print("documentation-governance: FAIL")
    for failure in FAILURES:
        print(f" - {failure}")
    print_remediation()
    sys.exit(1)

print("documentation-governance: PASS")
