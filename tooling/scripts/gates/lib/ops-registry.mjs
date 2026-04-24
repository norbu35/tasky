import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const repoRoot = process.cwd();
export const registryPath = path.join(repoRoot, "tooling", "config", "ops-registry.yaml");
export const allowedToolingScriptLifecycles = new Set([
    "blocking",
    "called_by_script",
    "manual",
    "report_only",
    "deprecated",
]);

export function readRepoFile(relativePath) {
    return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

export function loadOpsRegistry() {
    if (!existsSync(registryPath)) {
        throw new Error("tooling/config/ops-registry.yaml is missing");
    }
    const registry = YAML.parse(readFileSync(registryPath, "utf8"));
    if (!registry || typeof registry !== "object") {
        throw new Error("tooling/config/ops-registry.yaml must parse to an object");
    }
    return registry;
}

export function listWorkflowFiles() {
    return readdirSync(path.join(repoRoot, ".github", "workflows"))
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
        .map((file) => `.github/workflows/${file}`)
        .sort();
}

export function listToolingScriptFiles(dir = path.join(repoRoot, "tooling", "scripts")) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "__pycache__") {
                return [];
            }
            return listToolingScriptFiles(fullPath);
        }
        if (![".mjs", ".py", ".sh"].includes(path.extname(entry.name))) {
            return [];
        }
        return [path.relative(path.join(repoRoot, "tooling", "scripts"), fullPath).replaceAll(path.sep, "/")];
    }).sort();
}

export function collectStrings(value) {
    if (typeof value === "string") {
        return [value];
    }
    if (Array.isArray(value)) {
        return value.flatMap((item) => collectStrings(item));
    }
    if (value && typeof value === "object") {
        return Object.entries(value).flatMap(([key, item]) => [key, ...collectStrings(item)]);
    }
    return [];
}
