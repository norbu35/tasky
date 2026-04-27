#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

package_spec="${GRAPHIFY_PACKAGE_SPEC:-graphifyy}"
selected_python="${GRAPHIFY_PYTHON:-}"

python_is_supported() {
  "$1" - <<'PY' >/dev/null 2>&1
import sys
raise SystemExit(0 if (3, 10) <= sys.version_info[:2] < (3, 14) else 1)
PY
}

select_python() {
  if [ -n "$selected_python" ]; then
    if [ ! -x "$selected_python" ]; then
      printf 'graphify setup: GRAPHIFY_PYTHON is not executable: %s\n' "$selected_python" >&2
      exit 1
    fi
    if ! python_is_supported "$selected_python"; then
      printf 'graphify setup: GRAPHIFY_PYTHON must be Python >=3.10,<3.14: %s\n' "$selected_python" >&2
      exit 1
    fi
    printf '%s\n' "$selected_python"
    return
  fi

  if command -v python3 >/dev/null 2>&1 && python_is_supported "$(command -v python3)"; then
    command -v python3
    return
  fi

  if command -v uv >/dev/null 2>&1; then
    uv python install 3.13 >/dev/null
    uv python find 3.13
    return
  fi

  cat >&2 <<'EOF'
graphify setup: graphifyy requires Python >=3.10,<3.14.
Install Python 3.13, or install uv and rerun: pnpm repo:graph:setup
EOF
  exit 1
}

python_bin="$(select_python)"

if ! command -v uv >/dev/null 2>&1; then
  cat >&2 <<'EOF'
graphify setup: uv is required to install graphifyy.
EOF
  exit 1
fi

if command -v pipx >/dev/null 2>&1 && { pipx list 2>/dev/null || true; } | grep -q 'package graphifyy '; then
  pipx uninstall graphifyy >/dev/null
  echo "graphify setup: removed pipx graphifyy installation"
fi

uv tool install --upgrade --python "$python_bin" "$package_spec"
hash -r

if ! command -v graphify >/dev/null 2>&1; then
  cat >&2 <<'EOF'
graphify setup: graphify was installed, but the graphify executable is not on PATH.
Check uv's tool bin directory and rerun: pnpm repo:graph:setup
EOF
  exit 1
fi

graphify codex install

node <<'NODE'
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const configPath = path.join(os.homedir(), ".codex", "config.toml");
fs.mkdirSync(path.dirname(configPath), { recursive: true });
const current = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";

function ensureMultiAgent(content) {
  const lines = content.split(/\r?\n/);
  const featuresIndex = lines.findIndex((line) => /^\s*\[features\]\s*$/.test(line));
  if (featuresIndex === -1) {
    const prefix = content.trimEnd();
    return `${prefix}${prefix ? "\n\n" : ""}[features]\nmulti_agent = true\n`;
  }

  let end = lines.length;
  for (let i = featuresIndex + 1; i < lines.length; i += 1) {
    if (/^\s*\[[^\]]+\]\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }

  for (let i = featuresIndex + 1; i < end; i += 1) {
    if (/^\s*multi_agent\s*=/.test(lines[i])) {
      lines[i] = "multi_agent = true";
      return `${lines.join("\n").replace(/\n*$/, "")}\n`;
    }
  }

  lines.splice(end, 0, "multi_agent = true");
  return `${lines.join("\n").replace(/\n*$/, "")}\n`;
}

const next = ensureMultiAgent(current);
if (next !== current) {
  fs.writeFileSync(configPath, next);
  console.log("graphify setup: enabled Codex features.multi_agent in ~/.codex/config.toml");
} else {
  console.log("graphify setup: Codex features.multi_agent already enabled");
}
NODE

node <<'NODE'
const fs = require("node:fs");
const path = ".codex/hooks.json";
const hookCommand = `[ -f graphify-out/graph.json ] && echo '{"systemMessage":"graphify: Knowledge graph exists. Read graphify-out/GRAPH_REPORT.md for god nodes and community structure before searching raw files."}' || true`;
if (!fs.existsSync(path)) {
  console.log("graphify setup: no .codex/hooks.json to refresh");
  process.exit(0);
}

let config;
if (fs.existsSync(path)) {
  try {
    config = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    console.log("graphify setup: ignored invalid .codex/hooks.json");
    process.exit(0);
  }
}

const preTool = Array.isArray(config?.hooks?.PreToolUse) ? config.hooks.PreToolUse : [];
let normalized = false;
for (const entry of preTool) {
  if (!JSON.stringify(entry).includes("graphify")) {
    continue;
  }
  if (!Array.isArray(entry.hooks)) {
    continue;
  }
  for (const hook of entry.hooks) {
    if (hook && typeof hook.command === "string" && hook.command.includes("graphify")) {
      hook.command = hookCommand;
      normalized = true;
    }
  }
}

if (!normalized) {
  console.log("graphify setup: no Graphify Codex PreToolUse hook to normalize");
  process.exit(0);
}

fs.writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
console.log("graphify setup: normalized Graphify Codex PreToolUse hook to systemMessage");
NODE

node <<'NODE'
const fs = require("node:fs");
const path = "AGENTS.md";
const repoSection = `## Graphify

This project tracks a Graphify knowledge graph in \`graphify-out/\` as advisory navigation context. Governing docs in
the discovery path still win; Graphify never overrides \`docs/PRD.md\`, maintenance policy, area \`AGENTS.md\`, OpenAPI, or
design contracts.

Rules:
- Run \`pnpm repo:graph:setup\` after installing or upgrading Graphify. The wrapper uses uv, runs
  \`graphify codex install\`, enables Codex \`multi_agent\` for parallel extraction, and normalizes the generated
  PreToolUse hook to the Codex-supported top-level \`systemMessage\` payload.
- For architecture or codebase orientation, start with \`graphify-out/GRAPH_REPORT.md\`. If \`graphify-out/wiki/index.md\`
  exists, use the wiki for graph navigation before broad raw-file reads.
- Use \`pnpm repo:graph:query -- "<question>" [--budget N]\` for focused graph lookups.
- After modifying code or tooling source in this session, run \`pnpm repo:graph:update\` to refresh
  \`graphify-out/GRAPH_REPORT.md\`, \`graphify-out/graph.json\`, and \`graphify-out/wiki/**\`.
- Do not install Graphify git hooks by default. This repo uses explicit \`repo:graph:*\` commands to avoid
  post-commit/post-checkout dirty-tree churn.
`;

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, `${repoSection}\n`);
  console.log("graphify setup: wrote repo-native AGENTS.md Graphify section");
  process.exit(0);
}

const content = fs.readFileSync(path, "utf8").replace(/\n*## [Gg]raphify\n[\s\S]*$/, "");
fs.writeFileSync(path, `${content.trimEnd()}\n\n${repoSection}`);
console.log("graphify setup: refreshed repo-native AGENTS.md Graphify section");
NODE

graphify hook status || true
echo "graphify setup: git hooks are intentionally not installed; use pnpm repo:graph:update manually."
