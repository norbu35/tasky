import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";
import { generatedInventoryPath, renderOpsInventory } from "../scripts/gates/sync-ops-registry.mjs";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "tooling", "config", "ops-registry.yaml");

function readYaml(filePath) {
    return YAML.parse(readFileSync(filePath, "utf8"));
}

function readRegistry() {
    assert.ok(existsSync(registryPath), "tooling/config/ops-registry.yaml must exist");
    return readYaml(registryPath);
}

function walkToolingScripts(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "__pycache__") {
                return [];
            }
            return walkToolingScripts(fullPath);
        }
        if (![".mjs", ".py", ".sh"].includes(path.extname(entry.name))) {
            return [];
        }
        return [path.relative(path.join(repoRoot, "tooling", "scripts"), fullPath).replaceAll(path.sep, "/")];
    });
}

test("ops registry covers every GitHub workflow and treats ops diagrams as ephemeral", () => {
    const registry = readRegistry();
    const expectedWorkflows = readdirSync(path.join(repoRoot, ".github", "workflows"))
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
        .map((file) => `.github/workflows/${file}`)
        .sort();
    const registryWorkflows = Object.keys(registry.workflows ?? {}).sort();

    assert.deepEqual(registryWorkflows, expectedWorkflows);
    assert.equal(registry.policy?.opsDiagrams, "ephemeral");
    assert.ok(!(registry.docs ?? []).includes("docs/ops/diagrams"));
});

test("ops registry classifies every tooling script with an explicit lifecycle", () => {
    const registry = readRegistry();
    const scripts = walkToolingScripts(path.join(repoRoot, "tooling", "scripts")).sort();
    const registryScripts = Object.keys(registry.toolingScripts ?? {}).sort();
    const allowedLifecycles = new Set(["blocking", "called_by_script", "manual", "report_only", "deprecated"]);

    assert.deepEqual(registryScripts, scripts);
    for (const [scriptPath, entry] of Object.entries(registry.toolingScripts ?? {})) {
        assert.ok(allowedLifecycles.has(entry.lifecycle), `${scriptPath} has invalid lifecycle ${entry.lifecycle}`);
    }
});

test("registry package command expectations match package.json exactly", () => {
    const registry = readRegistry();
    const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    const allowedLifecycles = new Set(["blocking", "manual", "report_only", "deprecated"]);
    const packageScripts = packageJson.scripts ?? {};
    const registryScripts = registry.packageScripts ?? {};

    assert.deepEqual(
        Object.keys(registryScripts).sort(),
        Object.keys(packageScripts).sort(),
        "every root package.json script must be classified in tooling/config/ops-registry.yaml",
    );
    for (const [scriptName, expected] of Object.entries(registryScripts)) {
        assert.ok(
            allowedLifecycles.has(expected.lifecycle),
            `${scriptName} has invalid lifecycle ${expected.lifecycle}`,
        );
        assert.equal(packageJson.scripts?.[scriptName], expected.command, `${scriptName} package script drifted`);
    }
});

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rootScriptDependencies(scriptName, command, scriptNames) {
    return scriptNames.filter((candidate) => {
        if (candidate === scriptName) {
            return false;
        }
        const pattern = new RegExp(`(^|[;&|()\\s])pnpm\\s+${escapeRegExp(candidate)}(?=\\s|$)`);
        return pattern.test(command);
    });
}

function findScriptCycles(scripts) {
    const scriptNames = Object.keys(scripts);
    const graph = new Map(scriptNames.map((name) => [name, rootScriptDependencies(name, scripts[name], scriptNames)]));
    const cycles = [];
    const visiting = new Set();
    const visited = new Set();

    function visit(name, stack) {
        if (visiting.has(name)) {
            const cycleStart = stack.indexOf(name);
            cycles.push([...stack.slice(cycleStart), name].join(" -> "));
            return;
        }
        if (visited.has(name)) {
            return;
        }
        visiting.add(name);
        for (const dependency of graph.get(name) ?? []) {
            visit(dependency, [...stack, name]);
        }
        visiting.delete(name);
        visited.add(name);
    }

    for (const name of scriptNames) {
        visit(name, []);
    }
    return cycles;
}

test("root package scripts avoid retired aliases and circular dependencies", () => {
    const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    const scripts = packageJson.scripts ?? {};
    const retiredAliases = [
        "verify:main-prepush",
        "prepare:push",
        "contract:generated:verify",
        "openapi:bundle",
        "openapi:check",
        "sdk:generate",
        "sdk:drift",
        "generated:verify",
        "docs:check",
        "tooling:check",
        "workspace:boundaries",
    ];

    assert.deepEqual(
        retiredAliases.filter((scriptName) => scriptName in scripts),
        [],
        "retired root aliases should stay removed; use canonical verify:, contract:, and repo: lanes",
    );
    assert.deepEqual(findScriptCycles(scripts), [], "root package scripts must not call each other cyclically");
});

test("ops inventory documentation is generated from the registry", () => {
    const registry = readRegistry();
    const expected = renderOpsInventory(registry);
    const inventoryPath = path.join(repoRoot, generatedInventoryPath);

    assert.ok(existsSync(inventoryPath), `${generatedInventoryPath} must exist`);
    assert.equal(readFileSync(inventoryPath, "utf8"), expected);
    assert.match(expected, /Generated by `pnpm repo:ops:sync --fix`/);
    assert.match(expected, /security-review\.yml/);
    assert.match(expected, /`docs\/ops\/diagrams\/\*\*` are ephemeral/);
});
