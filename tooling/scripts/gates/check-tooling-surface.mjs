#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const scriptsDir = path.join(repoRoot, "tooling", "scripts");

const registry = {
    "contracts/bundle-openapi.mjs": "active",
    "contracts/validate-sdk-contract-drift.sh": "active",
    "deploy/bootstrap-private-staging-vps.sh": "active",
    "deploy/deploy-private-staging.sh": "active",
    "deploy/performance-smoke.sh": "active",
    "deploy/push-private-staging.sh": "active",
    "deploy/smoke-private-staging.sh": "active",
    "gates/check-cleanup-gate.sh": "active",
    "gates/check-gates.sh": "active",
    "gates/check-ops-config.mjs": "active",
    "gates/check-tooling-surface.mjs": "active",
    "governance/check-doc-governance.py": "active",
    "governance/check-gitleaks-secret-scan.sh": "active",
    "governance/check-trivyignore-expiry.sh": "active",
    "governance/scan-backend-doc-drift.sh": "active",
    "governance/validate-doc-references.py": "active",
    "governance/validate-migrations.py": "active",
    "governance/validate-schema-parity.py": "active",
    "governance/validate-workspace-boundaries.mjs": "active",
    "manual/analyze_i18n.py": "manual",
    "observability/start-alertmanager.sh": "active",
};

const skipDirs = new Set([
    ".git",
    ".gradle",
    "archive",
    "build",
    "dist",
    "node_modules",
]);

const textExtensions = new Set([
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
]);

function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(repoRoot, fullPath);
        const topLevel = relative.split(path.sep)[0];
        if (skipDirs.has(topLevel)) {
            continue;
        }
        if (entry.isDirectory() && entry.name === "__pycache__") {
            continue;
        }
        if (entry.isDirectory()) {
            files = files.concat(walk(fullPath));
            continue;
        }
        if (!textExtensions.has(path.extname(entry.name))) {
            continue;
        }
        files.push(fullPath);
    }
    return files;
}

function relativeRef(filePath) {
    return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

if (!existsSync(scriptsDir)) {
    console.error("tooling surface check failed: tooling/scripts directory missing");
    process.exit(1);
}

const failures = [];

const scriptFiles = walk(scriptsDir)
    .filter((filePath) => {
        const ext = path.extname(filePath);
        return ext === ".mjs" || ext === ".py" || ext === ".sh";
    })
    .map((filePath) => relativeRef(filePath).replace("tooling/scripts/", ""))
    .sort();

for (const file of scriptFiles) {
    if (!(file in registry)) {
        failures.push(`tooling script is not classified in check-tooling-surface.mjs: ${file}`);
    }
}

for (const file of Object.keys(registry)) {
    if (!existsSync(path.join(scriptsDir, file))) {
        failures.push(`tooling script declared but missing from tooling/scripts: ${file}`);
    }
}

const searchFiles = walk(repoRoot);
for (const [scriptName, classification] of Object.entries(registry)) {
    if (classification !== "active") {
        continue;
    }

    const needle = `tooling/scripts/${scriptName}`;
    const refs = [];

    for (const file of searchFiles) {
        const relative = relativeRef(file);
        if (relative === needle) {
            continue;
        }
        const text = readFileSync(file, "utf8");
        if (text.includes(needle)) {
            refs.push(relative);
        }
    }

    if (refs.length === 0) {
        failures.push(`active tooling script has no live caller/reference: ${scriptName}`);
    }
}

if (failures.length > 0) {
    console.error("tooling-surface: FAIL");
    for (const failure of failures) {
        console.error(` - ${failure}`);
    }
    process.exit(1);
}

console.log("tooling-surface: PASS");
