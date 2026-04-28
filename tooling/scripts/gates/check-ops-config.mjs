#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import {
    collectStrings,
    listWorkflowFiles,
    loadOpsRegistry,
    readRepoFile,
    repoRoot,
} from "./lib/ops-registry.mjs";

const registry = loadOpsRegistry();
const failures = [];

const composeEnv = {
    ...process.env,
    ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL ?? "http://localhost:9999/alerts",
    APP_DB_PASSWORD: process.env.APP_DB_PASSWORD ?? "tasky_app",
    APP_DB_USER: process.env.APP_DB_USER ?? "tasky_app",
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "{}",
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    MINIO_BUCKET: process.env.MINIO_BUCKET ?? "tasky",
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD ?? "minioadmin",
    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER ?? "minioadmin",
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? "minioadmin",
    POSTGRES_DB: process.env.POSTGRES_DB ?? "tasky",
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "tasky",
    POSTGRES_USER: process.env.POSTGRES_USER ?? "tasky",
    TASKY_BLIND_INDEX_KEY: process.env.TASKY_BLIND_INDEX_KEY ?? "RkVEQ0JBOTg3NjU0MzIxMEZFRENCQTk4NzY1NDMyMTA=",
    TASKY_CORS_ALLOWED_ORIGINS: process.env.TASKY_CORS_ALLOWED_ORIGINS ?? "http://localhost:5173",
    TASKY_DOMAIN: process.env.TASKY_DOMAIN ?? "localhost",
    TASKY_ENCRYPTION_KEY: process.env.TASKY_ENCRYPTION_KEY ?? "MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=",
    TASKY_FACEBOOK_APP_ID: process.env.TASKY_FACEBOOK_APP_ID ?? "test-facebook-app-id",
    TASKY_FACEBOOK_APP_SECRET: process.env.TASKY_FACEBOOK_APP_SECRET ?? "test-facebook-app-secret",
    TASKY_JWT_SECRET: process.env.TASKY_JWT_SECRET ?? "test-jwt-secret-32-chars-minimum!!",
    TASKY_QPAY_WEBHOOK_SECRET: process.env.TASKY_QPAY_WEBHOOK_SECRET ?? "test-qpay-secret",
    TASKY_WEBSOCKET_ALLOWED_ORIGINS: process.env.TASKY_WEBSOCKET_ALLOWED_ORIGINS ?? "http://localhost:5173",
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? "http://localhost:8080",
    VITE_FACEBOOK_APP_ID: process.env.VITE_FACEBOOK_APP_ID ?? "test-facebook-app-id",
};

function printRemediation() {
    console.error("autonomous remediation:");
    console.error(" - update package.json, hooks, workflows, compose files, or tooling/config/ops-registry.yaml so they agree");
    console.error(" - keep docs/ops/diagrams/** out of executable validation semantics");
    console.error(" - rerun the narrow lane: pnpm verify:ops");
}

function parseYaml(relativePath) {
    try {
        return YAML.parse(readRepoFile(relativePath));
    } catch (error) {
        failures.push(`invalid YAML in ${relativePath}: ${error.message}`);
        return null;
    }
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRegistryShape(value) {
    const shapeFailures = [];
    const objectSections = ["policy", "packageScripts", "hooks", "workflows", "toolingScripts"];
    for (const section of objectSections) {
        if (!isPlainObject(value[section])) {
            shapeFailures.push(`ops registry section '${section}' must be an object`);
        }
    }
    if (!Array.isArray(value.composeFiles)) {
        shapeFailures.push("ops registry section 'composeFiles' must be a list");
    } else {
        for (const [index, file] of value.composeFiles.entries()) {
            if (typeof file !== "string" || file.trim() === "") {
                shapeFailures.push(`ops registry composeFiles[${index}] must be a non-empty string`);
            }
        }
    }
    return shapeFailures;
}

function registryRecord(section) {
    return isPlainObject(registry[section]) ? registry[section] : {};
}

function registryList(section) {
    return Array.isArray(registry[section]) ? registry[section] : [];
}

function describeMemberDelta(actual, expected) {
    const actualSet = new Set(actual);
    const expectedSet = new Set(expected);
    return {
        removed: [...expectedSet].filter((item) => !actualSet.has(item)).sort(),
        added: [...actualSet].filter((item) => !expectedSet.has(item)).sort(),
    };
}

function sameMembers(actual, expected, label) {
    const delta = describeMemberDelta(actual, expected);
    if (delta.removed.length > 0 || delta.added.length > 0) {
        failures.push(
            `${label} mismatch: removed: [${delta.removed.join(", ") || "<none>"}]; added: [${delta.added.join(", ") || "<none>"}]`,
        );
    }
}

function resolveDockerBinary() {
    const candidates = [
        process.env.DOCKER_BIN,
        "/usr/bin/docker",
        "/usr/local/bin/docker",
        "docker",
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate.includes("/") && !existsSync(candidate)) {
            continue;
        }
        const probe = spawnSync(candidate, ["compose", "version"], {
            cwd: repoRoot,
            env: process.env,
            encoding: "utf8",
        });
        if (probe.status === 0) {
            return candidate;
        }
    }
    return null;
}

failures.push(...validateRegistryShape(registry));

if (registry.policy?.opsDiagrams !== "ephemeral") {
    failures.push("registry policy must mark docs/ops/diagrams/** as ephemeral");
}

const packageJson = JSON.parse(readRepoFile("package.json"));
for (const [scriptName, expectation] of Object.entries(registryRecord("packageScripts"))) {
    if (packageJson.scripts?.[scriptName] !== expectation.command) {
        failures.push(`package script drift for ${scriptName}: expected '${expectation.command}', got '${packageJson.scripts?.[scriptName] ?? "<missing>"}'`);
    }
}

for (const [hookPath, expectation] of Object.entries(registryRecord("hooks"))) {
    const text = readRepoFile(hookPath);
    for (const fragment of expectation.requiredFragments ?? []) {
        if (!text.includes(fragment)) {
            failures.push(`missing hook fragment '${fragment}' in ${hookPath}`);
        }
    }
}

sameMembers(Object.keys(registryRecord("workflows")), listWorkflowFiles(), "registered workflows");

for (const [workflowPath, expectation] of Object.entries(registryRecord("workflows"))) {
    const parsed = parseYaml(workflowPath);
    if (!parsed) {
        continue;
    }

    const actualJobs = Object.keys(parsed.jobs ?? {});
    sameMembers(actualJobs, expectation.jobs ?? [], `${workflowPath} jobs`);

    const workflowStrings = collectStrings(parsed).join("\n");
    for (const command of expectation.requiredCommands ?? []) {
        if (!workflowStrings.includes(command)) {
            failures.push(`missing workflow command '${command}' in ${workflowPath}`);
        }
    }
}

for (const file of registryList("composeFiles")) {
    parseYaml(file);
}

const dockerBinary = resolveDockerBinary();
if (!dockerBinary) {
    if (process.env.NO_DOCKER_COMPOSE_CHECK === "1") {
        console.warn("ops-config: warning: docker compose check skipped because NO_DOCKER_COMPOSE_CHECK=1");
    } else {
        failures.push("docker compose is required for ops config validation; set NO_DOCKER_COMPOSE_CHECK=1 only on runners that intentionally skip compose validation");
    }
} else {
    for (const file of registryList("composeFiles")) {
        const result = spawnSync(dockerBinary, ["compose", "-f", file, "config"], {
            cwd: repoRoot,
            env: composeEnv,
            encoding: "utf8",
        });

        if (result.status !== 0) {
            const stderr = (result.stderr || result.stdout || "").trim();
            failures.push(`docker compose config failed for ${file}: ${stderr}`);
        }
    }
}

if (failures.length > 0) {
    console.error("ops-config: FAIL");
    for (const failure of failures) {
        console.error(` - ${failure}`);
    }
    printRemediation();
    process.exit(1);
}

console.log("ops-config: PASS");
