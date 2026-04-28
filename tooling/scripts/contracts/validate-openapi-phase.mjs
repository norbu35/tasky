#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const bundlePath = path.join(repoRoot, "docs", "API.yaml");
const schemaSourceDir = path.join(repoRoot, "docs", "openapi", "components", "schemas");

const validPhases = new Set(["phase_1", "phase_2", "phase_3", "phase_4", "dev_only"]);
const activePhases = new Set(["phase_1"]);
const deferredSignals = [
    "phase-gated",
    "not yet implemented",
    "forward reference",
    "disabled for current rollout phase",
    "disabled for the current rollout phase",
    "deferred during the liquidity-first mvp phase",
    "escrow_enabled",
];

function normalizePhase(value) {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim().toLowerCase().replaceAll("-", "_");
    if (normalized === "1" || normalized === "p1") return "phase_1";
    if (normalized === "2" || normalized === "p2") return "phase_2";
    if (normalized === "3" || normalized === "p3") return "phase_3";
    if (normalized === "4" || normalized === "p4") return "phase_4";
    return normalized;
}

function relative(filePath) {
    return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function readYaml(filePath) {
    return YAML.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceSchemas() {
    if (!fs.existsSync(schemaSourceDir)) return [];
    const schemas = [];
    for (const entry of fs.readdirSync(schemaSourceDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
        const filePath = path.join(schemaSourceDir, entry.name);
        const document = readYaml(filePath) ?? {};
        for (const [schemaName, schema] of Object.entries(document)) {
            schemas.push({ schemaName, schema, filePath });
        }
    }
    return schemas;
}

function hasDeferredLanguage(value) {
    const text = YAML.stringify(value).toLowerCase();
    return deferredSignals.some((signal) => text.includes(signal));
}

function validatePhaseMetadata(label, item, failures) {
    const phase = normalizePhase(item?.["x-tasky-phase"]);
    const targetPhase = normalizePhase(item?.["x-tasky-target-phase"]);
    const status = String(item?.["x-tasky-status"] ?? "").trim().toLowerCase();

    if (targetPhase && !phase) {
        failures.push(`${label} declares x-tasky-target-phase but is missing x-tasky-phase.`);
    }

    const effectivePhase = phase ?? targetPhase;
    if (effectivePhase && !validPhases.has(effectivePhase)) {
        failures.push(`${label} has unsupported x-tasky-phase value '${effectivePhase}'.`);
    }

    if (status === "deferred" && !effectivePhase) {
        failures.push(`${label} is deferred but does not declare x-tasky-phase.`);
    }

    if (effectivePhase && !activePhases.has(effectivePhase) && status !== "deferred") {
        failures.push(`${label} is marked ${effectivePhase} but is not explicitly x-tasky-status: deferred.`);
    }

    if (!effectivePhase && hasDeferredLanguage(item)) {
        failures.push(`${label} uses deferred/phase-gated language but has no x-tasky-phase metadata.`);
    }

    return { phase: effectivePhase, status };
}

function main() {
    const document = readYaml(bundlePath);
    const failures = [];
    const futurePaths = new Set();
    const futureSchemas = new Set();

    for (const [apiPath, pathItem] of Object.entries(document.paths ?? {})) {
        const { phase } = validatePhaseMetadata(`path ${apiPath}`, pathItem, failures);
        if (phase && !activePhases.has(phase)) {
            futurePaths.add(apiPath);
        }
    }

    for (const { schemaName, schema, filePath } of sourceSchemas()) {
        const { phase } = validatePhaseMetadata(`schema ${schemaName} (${relative(filePath)})`, schema, failures);
        if (phase && !activePhases.has(phase)) {
            futureSchemas.add(schemaName);
        }
    }

    if (failures.length > 0) {
        console.error("openapi-phase: FAIL");
        for (const failure of failures) {
            console.error(` - ${failure}`);
        }
        process.exit(1);
    }

    console.log(
        `openapi-phase: PASS (${futurePaths.size} deferred path(s), ${futureSchemas.size} deferred schema(s))`
    );
}

main();
