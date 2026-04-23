#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const workspaceRoots = ["apps", "packages", "services", "tooling"];

// Discover package.json files dynamically so new packages are automatically covered.
const packageFiles = workspaceRoots.flatMap((root) => {
    const rootDir = path.join(repoRoot, root);
    if (!existsSync(rootDir)) return [];
    return readdirSync(rootDir)
        .map((entry) => path.join(rootDir, entry, "package.json"))
        .filter((f) => existsSync(f) && statSync(path.dirname(f)).isDirectory());
});

const packageIndex = new Map();

for (const file of packageFiles) {
    if (!existsSync(file)) {
        continue;
    }
    const raw = JSON.parse(readFileSync(file, "utf8"));
    const relativePath = path.relative(repoRoot, path.dirname(file)).replace(/\\/g, "/");
    packageIndex.set(raw.name, {
        name: raw.name,
        location: relativePath,
        dependencies: {
            ...(raw.dependencies ?? {}),
            ...(raw.devDependencies ?? {}),
            ...(raw.peerDependencies ?? {}),
            ...(raw.optionalDependencies ?? {})
        }
    });
}

const getZone = (location) => {
    const first = location.split("/")[0];
    return workspaceRoots.includes(first) ? first : "root";
};

// Config-only packages in the tooling zone that all other zones are allowed to consume
// as devDependencies (tsconfig, eslint presets, etc). These are build-time only and
// do not represent runtime tool or deploy dependencies.
const allowedToolingDeps = new Set([
    "@tasky/tooling-config",
]);

const violations = [];

function printRemediation() {
    console.error("autonomous remediation:");
    console.error(" - move the dependency to an allowed shared package or invert the boundary");
    console.error(" - apps cannot depend on services/tooling, services cannot depend on apps/tooling, and packages stay reusable");
    console.error(" - rerun: pnpm repo:workspace:boundaries");
}

for (const pkg of packageIndex.values()) {
    const fromZone = getZone(pkg.location);
    for (const depName of Object.keys(pkg.dependencies)) {
        const depPkg = packageIndex.get(depName);
        if (!depPkg) {
            continue;
        }

        if (allowedToolingDeps.has(depName)) {
            continue;
        }

        const toZone = getZone(depPkg.location);
        const relation = `${pkg.name} (${pkg.location}) -> ${depName} (${depPkg.location})`;

        if (fromZone === "packages" && (toZone === "apps" || toZone === "services" || toZone === "tooling")) {
            violations.push(`${relation}: packages cannot depend on ${toZone}`);
        }

        if (fromZone === "apps" && (toZone === "services" || toZone === "tooling")) {
            violations.push(`${relation}: apps cannot depend on ${toZone}`);
        }

        if (fromZone === "services" && (toZone === "apps" || toZone === "tooling")) {
            violations.push(`${relation}: services cannot depend on ${toZone}`);
        }
    }
}

if (violations.length > 0) {
    console.error("Workspace boundary violations found:");
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    printRemediation();
    process.exit(1);
}

console.log("Workspace boundary check passed.");
