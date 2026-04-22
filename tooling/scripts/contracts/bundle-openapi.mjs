#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const sourceRoot = path.join(repoRoot, "docs", "openapi", "openapi.yaml");
const bundlePath = path.join(repoRoot, "docs", "API.yaml");
const bundleHeader = [
    "# GENERATED FILE. Do not edit directly.",
    "# Edit docs/openapi/** and run `pnpm openapi:bundle`.",
    "",
].join("\n");

function readYaml(filePath) {
    return YAML.parse(fs.readFileSync(filePath, "utf8"));
}

function resolvePointer(document, pointer = "") {
    if (!pointer || pointer === "#") {
        return document;
    }

    const normalizedPointer = pointer.startsWith("#") ? pointer.slice(1) : pointer;
    if (!normalizedPointer.startsWith("/")) {
        throw new Error(`Unsupported JSON pointer: ${pointer}`);
    }

    let current = document;
    for (const rawToken of normalizedPointer.slice(1).split("/")) {
        const token = rawToken.replace(/~1/g, "/").replace(/~0/g, "~");
        if (current == null || !(token in current)) {
            throw new Error(`Could not resolve pointer ${pointer}`);
        }
        current = current[token];
    }
    return current;
}

function resolveRef(fromFile, ref) {
    const [filePart, pointer = ""] = ref.split("#");
    const targetFile = filePart ? path.resolve(path.dirname(fromFile), filePart) : fromFile;
    const document = readYaml(targetFile);
    const resolved = pointer ? resolvePointer(document, `#${pointer}`) : document;
    return { targetFile, resolved };
}

function normalizeRef(fromFile, ref) {
    const [filePart, pointer = ""] = ref.split("#");
    const targetFile = filePart ? path.resolve(path.dirname(fromFile), filePart) : fromFile;
    return `${targetFile}#${pointer}`;
}

function escapePointerToken(value) {
    return value.replace(/~/g, "~0").replace(/\//g, "~1");
}

function buildInternalRefMap(rootDocument, rootFile) {
    const internalRefs = new Map();

    for (const [section, entries] of Object.entries(rootDocument.components ?? {})) {
        for (const [name, entry] of Object.entries(entries ?? {})) {
            if (!entry?.$ref) {
                continue;
            }
            internalRefs.set(
                normalizeRef(rootFile, entry.$ref),
                `#/components/${section}/${escapePointerToken(name)}`
            );
        }
    }

    for (const [apiPath, entry] of Object.entries(rootDocument.paths ?? {})) {
        if (!entry?.$ref) {
            continue;
        }
        internalRefs.set(normalizeRef(rootFile, entry.$ref), `#/paths/${escapePointerToken(apiPath)}`);
    }

    return internalRefs;
}

function rewriteRefs(value, currentFile, internalRefs) {
    if (Array.isArray(value)) {
        return value.map((item) => rewriteRefs(item, currentFile, internalRefs));
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const next = {};
    for (const [key, child] of Object.entries(value)) {
        if (key === "$ref" && typeof child === "string" && !child.startsWith("#/")) {
            next[key] = internalRefs.get(normalizeRef(currentFile, child)) ?? child;
            continue;
        }
        next[key] = rewriteRefs(child, currentFile, internalRefs);
    }
    return next;
}

function materializeRefEntry(rootFile, entry, internalRefs) {
    if (!entry?.$ref) {
        return entry;
    }

    const { targetFile, resolved } = resolveRef(rootFile, entry.$ref);
    return rewriteRefs(resolved, targetFile, internalRefs);
}

function buildBundleDocument() {
    const rootDocument = readYaml(sourceRoot);
    const internalRefs = buildInternalRefMap(rootDocument, sourceRoot);

    const { components = {}, paths = {}, ...rest } = rootDocument;
    const bundled = { ...rest, components: {}, paths: {} };

    for (const [section, entries] of Object.entries(components)) {
        bundled.components[section] = {};
        for (const [name, entry] of Object.entries(entries ?? {})) {
            bundled.components[section][name] = materializeRefEntry(sourceRoot, entry, internalRefs);
        }
    }

    for (const [apiPath, entry] of Object.entries(paths)) {
        bundled.paths[apiPath] = materializeRefEntry(sourceRoot, entry, internalRefs);
    }

    return bundled;
}

function renderBundle(document) {
    return `${bundleHeader}${YAML.stringify(document, { lineWidth: 0 })}`;
}

function main() {
    const bundle = renderBundle(buildBundleDocument());
    const checkOnly = process.argv.includes("--check");

    if (checkOnly) {
        const existing = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, "utf8") : "";
        if (existing !== bundle) {
            console.error("OpenAPI bundle drift detected. Run `pnpm openapi:bundle`.");
            process.exit(1);
        }
        console.log("OpenAPI bundle is up to date.");
        return;
    }

    fs.writeFileSync(bundlePath, bundle);
    console.log(`Bundled ${path.relative(repoRoot, sourceRoot)} -> ${path.relative(repoRoot, bundlePath)}`);
}

main();
