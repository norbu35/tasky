#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
    allowedToolingScriptLifecycles,
    listToolingScriptFiles,
    listWorkflowFiles,
    loadOpsRegistry,
    repoRoot,
} from "./lib/ops-registry.mjs";

const scriptsDir = path.join(repoRoot, "tooling", "scripts");
const registry = loadOpsRegistry();
const failures = [];

function printRemediation() {
    console.error("autonomous remediation:");
    console.error(" - classify every tooling script in tooling/config/ops-registry.yaml");
    console.error(" - keep blocking and called_by_script entries wired from package.json, workflows, hooks, Gradle, compose, or another script");
    console.error(" - rerun the narrow lane: pnpm repo:tooling:check");
}

function readIfExists(relativePath) {
    const fullPath = path.join(repoRoot, relativePath);
    if (!existsSync(fullPath)) {
        return null;
    }
    return readFileSync(fullPath, "utf8");
}

function listFiles(dir, prefix) {
    if (!existsSync(dir)) {
        return [];
    }
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        const relative = path.join(prefix, entry.name).replaceAll(path.sep, "/");
        if (entry.isDirectory()) {
            if (entry.name === "__pycache__") {
                return [];
            }
            return listFiles(fullPath, relative);
        }
        return [relative];
    });
}

function executableReferenceFiles() {
    return [
        "package.json",
        "services/api/build.gradle.kts",
        ...listFiles(path.join(repoRoot, ".husky"), ".husky"),
        ...listWorkflowFiles(),
        ...listFiles(path.join(repoRoot, "tooling", "scripts"), "tooling/scripts"),
        ...readdirSync(repoRoot)
            .filter((file) => file.startsWith("docker-compose") && (file.endsWith(".yml") || file.endsWith(".yaml")))
            .map((file) => file),
    ];
}

if (!existsSync(scriptsDir)) {
    console.error("tooling-surface: FAIL (tooling/scripts directory missing)");
    printRemediation();
    process.exit(1);
}

const registryScripts = registry.toolingScripts ?? {};
const scriptFiles = listToolingScriptFiles();

for (const file of scriptFiles) {
    if (!(file in registryScripts)) {
        failures.push(`tooling script is not classified in tooling/config/ops-registry.yaml: ${file}`);
    }
}

for (const [file, entry] of Object.entries(registryScripts)) {
    if (!existsSync(path.join(scriptsDir, file))) {
        failures.push(`tooling script declared but missing from tooling/scripts: ${file}`);
        continue;
    }
    if (!allowedToolingScriptLifecycles.has(entry?.lifecycle)) {
        failures.push(`tooling script has invalid lifecycle '${entry?.lifecycle}': ${file}`);
    }
}

const executableTexts = executableReferenceFiles()
    .map((file) => [file, readIfExists(file)])
    .filter(([, text]) => text !== null);

for (const [scriptName, entry] of Object.entries(registryScripts)) {
    if (!["blocking", "called_by_script"].includes(entry.lifecycle)) {
        continue;
    }

    const needles = [`tooling/scripts/${scriptName}`, ...(entry.referencePatterns ?? [])];
    const refs = executableTexts
        .filter(([file, text]) => file !== `tooling/scripts/${scriptName}` && needles.some((needle) => text.includes(needle)))
        .map(([file]) => file);

    if (refs.length === 0) {
        failures.push(`${entry.lifecycle} tooling script has no executable caller/reference: ${scriptName}`);
    }
}

if (failures.length > 0) {
    console.error("tooling-surface: FAIL");
    for (const failure of failures) {
        console.error(` - ${failure}`);
    }
    printRemediation();
    process.exit(1);
}

console.log("tooling-surface: PASS");
