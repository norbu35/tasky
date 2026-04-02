#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const workspaceRoots = ["apps", "packages", "services", "tooling"];

const packageFiles = [
    path.join(repoRoot, "apps/mobile/package.json"),
    path.join(repoRoot, "apps/web/package.json"),
    path.join(repoRoot, "packages/core/package.json"),
    path.join(repoRoot, "packages/design-tokens/package.json"),
    path.join(repoRoot, "packages/sdk/package.json")
];

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

const violations = [];

for (const pkg of packageIndex.values()) {
    const fromZone = getZone(pkg.location);
    for (const depName of Object.keys(pkg.dependencies)) {
        const depPkg = packageIndex.get(depName);
        if (!depPkg) {
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
    process.exit(1);
}

console.log("Workspace boundary check passed.");
