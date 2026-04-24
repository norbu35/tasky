#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const repoRoot = process.cwd();

const yamlFiles = [
    ".github/workflows/build-and-push.yml",
    ".github/workflows/deploy-production.yml",
    ".github/workflows/deploy-staging.yml",
    ".github/workflows/nightly-mobile.yml",
    ".github/workflows/nightly-regression.yml",
    ".github/workflows/quality-gates.yml",
    ".github/workflows/release-gate.yml",
    "docker-compose.observability.yml",
    "docker-compose.private-staging.yml",
    "docker-compose.production.yml",
    "docker-compose.web.yml",
    "docker-compose.yml",
];

const textExpectations = [
    {
        file: ".husky/pre-commit",
        needs: [
            "gitleaks git --pre-commit --staged --config .gitleaks.toml",
            "pnpm exec lint-staged",
        ],
    },
    {
        file: ".husky/pre-push",
        needs: [
            "tests/scenarios/",
            "pnpm verify:cleanup",
            "pnpm verify:ops",
            "pnpm verify:backend",
            "pnpm verify:frontend",
            "pnpm verify:scenario:smoke",
            "pnpm verify:drift",
        ],
    },
    {
        file: "package.json",
        needs: [
            "\"verify:i18n\": \"python3 tooling/scripts/governance/validate-i18n.py\"",
            "\"verify:frontend\": \"pnpm verify:i18n && turbo run lint typecheck test\"",
            "\"verify:frontend:affected\": \"pnpm verify:i18n && turbo run lint typecheck test --affected\"",
        ],
    },
    {
        file: ".github/workflows/quality-gates.yml",
        needs: [
            "push:",
            "staging",
            "pnpm verify:cleanup",
            "pnpm verify:ops",
            "pnpm repo:docs:check",
            "pnpm verify:backend",
            "pnpm verify:scenario:smoke",
            "includes i18n",
            "pnpm verify:frontend",
            "pnpm verify:drift",
        ],
    },
    {
        file: ".github/workflows/release-gate.yml",
        needs: [
            "python3 tooling/scripts/governance/validate-migrations.py",
            ":services:api:dependencyCheckAnalyze",
            ":services:api:gateRegression",
            "bash tooling/scripts/deploy/performance-smoke.sh",
        ],
    },
    {
        file: ".github/workflows/nightly-regression.yml",
        needs: [
            ":services:api:gateRegression",
            ":services:api:dependencyCheckAnalyze",
        ],
    },
    {
        file: ".github/workflows/build-and-push.yml",
        needs: [
            "short_sha=${GITHUB_SHA::7}",
            "steps.tag.outputs.short_sha",
        ],
    },
];

const composeFiles = [
    "docker-compose.yml",
    "docker-compose.web.yml",
    "docker-compose.observability.yml",
    "docker-compose.private-staging.yml",
    "docker-compose.production.yml",
];

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

const failures = [];

function printRemediation() {
    console.error("autonomous remediation:");
    console.error(" - inspect the failing file/path above and update the canonical workflow or compose surface there");
    console.error(" - if wiring drift is unclear, compare package.json, .husky/pre-push, and .github/workflows/quality-gates.yml");
    console.error(" - rerun the narrow lane: pnpm verify:ops");
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

for (const file of yamlFiles) {
    const fullPath = path.join(repoRoot, file);
    try {
        YAML.parse(readFileSync(fullPath, "utf8"));
    } catch (error) {
        failures.push(`invalid YAML in ${file}: ${error.message}`);
    }
}

for (const { file, needs } of textExpectations) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    for (const needle of needs) {
        if (!text.includes(needle)) {
            failures.push(`missing expected wiring '${needle}' in ${file}`);
        }
    }
}

const dockerBinary = resolveDockerBinary();

if (!dockerBinary) {
    failures.push("docker compose is required for ops config validation");
} else {
    for (const file of composeFiles) {
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
