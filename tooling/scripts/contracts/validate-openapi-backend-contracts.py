#!/usr/bin/env python3
"""Validate backend request DTO fields against the bundled OpenAPI contract."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


REPO_ROOT = Path(__file__).resolve().parents[3]
SOURCE_ROOT = REPO_ROOT / "services" / "api" / "src" / "main" / "java"
OPENAPI_BUNDLE = REPO_ROOT / "docs" / "API.yaml"

HTTP_METHODS = {
    "PostMapping": "post",
    "PutMapping": "put",
    "PatchMapping": "patch",
}

MAPPING_RE = re.compile(r"@(PostMapping|PutMapping|PatchMapping)\s*(?:\(([^)]*)\))?", re.MULTILINE)
REQUEST_MAPPING_RE = re.compile(r"@RequestMapping\s*\(\s*\"([^\"]*)\"")
PACKAGE_RE = re.compile(r"^package\s+([\w.]+);", re.MULTILINE)
IMPORT_RE = re.compile(r"^import\s+([\w.]+);", re.MULTILINE)
REQUEST_BODY_RE = re.compile(r"@RequestBody\s+([\w.<>?,\s]+?)\s+\w+(?:\s*[),])", re.MULTILINE)
RECORD_RE = re.compile(r"public\s+record\s+\w+\s*\((.*?)\)\s*(?:\{|$)", re.DOTALL)
JSON_PROPERTY_RE = re.compile(r"@JsonProperty\s*\(\s*\"([^\"]+)\"")
ANNOTATION_RE = re.compile(r"@\w+(?:\([^()]*\))?")


@dataclass(frozen=True)
class EndpointDto:
    controller: Path
    line: int
    method: str
    path: str
    dto_type: str


@dataclass(frozen=True)
class DtoShape:
    properties: set[str]
    required: set[str]


def relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def normalize_path(path: str) -> str:
    normalized = "/" + path.strip().strip("/")
    if normalized == "/":
        return ""
    if normalized.startswith("/api/v1/"):
        normalized = normalized.removeprefix("/api/v1")
    elif normalized == "/api/v1":
        normalized = ""
    return normalized or "/"


def join_paths(prefix: str, suffix: str) -> str:
    joined = "/".join(part.strip("/") for part in (prefix, suffix) if part.strip("/"))
    return normalize_path(joined)


def parse_annotation_path(args: str | None) -> str:
    if not args:
        return ""
    match = re.search(r"\"([^\"]*)\"", args)
    return match.group(1) if match else ""


def resolve_type(type_name: str, package_name: str, imports: dict[str, str]) -> str | None:
    cleaned = " ".join(type_name.split())
    cleaned = cleaned.replace("? extends ", "").replace("? super ", "")
    cleaned = cleaned.split("<", 1)[0].strip()
    if "." in cleaned:
        return cleaned
    if cleaned in imports:
        return imports[cleaned]
    if cleaned.startswith(("Map", "List", "Set")):
        return None
    return f"{package_name}.{cleaned}"


def controller_endpoints(controller: Path) -> list[EndpointDto]:
    text = controller.read_text(encoding="utf-8")
    package_match = PACKAGE_RE.search(text)
    package_name = package_match.group(1) if package_match else ""
    imports = {item.rsplit(".", 1)[-1]: item for item in IMPORT_RE.findall(text)}
    class_match = REQUEST_MAPPING_RE.search(text)
    class_prefix = class_match.group(1) if class_match else ""

    endpoints: list[EndpointDto] = []
    matches = list(MAPPING_RE.finditer(text))
    for index, match in enumerate(matches):
        method = HTTP_METHODS[match.group(1)]
        path = join_paths(class_prefix, parse_annotation_path(match.group(2)))
        chunk_end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunk = text[match.end() : chunk_end]
        body_match = REQUEST_BODY_RE.search(chunk)
        if not body_match:
            continue
        resolved = resolve_type(body_match.group(1), package_name, imports)
        if not resolved or resolved.startswith("mn.tasky.api.generated.model."):
            continue
        dto_file = SOURCE_ROOT / Path(resolved.replace(".", "/") + ".java")
        if not dto_file.exists():
            continue
        line = text.count("\n", 0, match.start()) + 1
        endpoints.append(EndpointDto(controller=controller, line=line, method=method, path=path, dto_type=resolved))
    return endpoints


def split_record_components(raw: str) -> list[str]:
    components: list[str] = []
    start = 0
    depth = 0
    for index, char in enumerate(raw):
        if char in "(<[{":
            depth += 1
        elif char in ")>]}":
            depth = max(0, depth - 1)
        elif char == "," and depth == 0:
            components.append(raw[start:index].strip())
            start = index + 1
    tail = raw[start:].strip()
    if tail:
        components.append(tail)
    return components


def parse_dto_shape(fqcn: str) -> DtoShape | None:
    dto_file = SOURCE_ROOT / Path(fqcn.replace(".", "/") + ".java")
    text = dto_file.read_text(encoding="utf-8")
    record_match = RECORD_RE.search(text)
    if not record_match:
        return None

    properties: set[str] = set()
    required: set[str] = set()
    for component in split_record_components(record_match.group(1)):
        json_match = JSON_PROPERTY_RE.search(component)
        without_annotations = ANNOTATION_RE.sub(" ", component)
        tokens = without_annotations.split()
        if len(tokens) < 2:
            continue
        java_name = tokens[-1]
        property_name = json_match.group(1) if json_match else java_name
        properties.add(property_name)
        if "@NotNull" in component or "@NotBlank" in component:
            required.add(property_name)
    return DtoShape(properties=properties, required=required)


def resolve_ref(document: dict[str, Any], ref: str) -> dict[str, Any]:
    if not ref.startswith("#/"):
        raise ValueError(f"external refs are not supported in bundled OpenAPI: {ref}")
    value: Any = document
    for part in ref.removeprefix("#/").split("/"):
        value = value[part]
    return value


def collect_schema_shape(document: dict[str, Any], schema: dict[str, Any]) -> DtoShape:
    if "$ref" in schema:
        return collect_schema_shape(document, resolve_ref(document, schema["$ref"]))

    properties = set(schema.get("properties", {}).keys())
    required = set(schema.get("required", []) or [])

    for key in ("allOf", "anyOf", "oneOf"):
        for child in schema.get(key, []) or []:
            child_shape = collect_schema_shape(document, child)
            properties.update(child_shape.properties)
            required.update(child_shape.required)

    return DtoShape(properties=properties, required=required)


def operation_request_shape(document: dict[str, Any], endpoint: EndpointDto) -> DtoShape | None:
    path_item = document.get("paths", {}).get(endpoint.path)
    if not path_item:
        return None
    operation = path_item.get(endpoint.method)
    if not operation:
        return None
    request_body = operation.get("requestBody", {})
    content = request_body.get("content", {})
    media = content.get("application/json")
    if not media:
        return None
    schema = media.get("schema")
    if not isinstance(schema, dict):
        return None
    return collect_schema_shape(document, schema)


def main() -> int:
    document = yaml.safe_load(OPENAPI_BUNDLE.read_text(encoding="utf-8"))
    endpoints = [
        endpoint
        for controller in sorted(SOURCE_ROOT.glob("mn/tasky/**/api/*Controller.java"))
        for endpoint in controller_endpoints(controller)
    ]

    failures: list[str] = []
    for endpoint in endpoints:
        dto_shape = parse_dto_shape(endpoint.dto_type)
        if not dto_shape:
            continue
        contract_shape = operation_request_shape(document, endpoint)
        location = f"{relative(endpoint.controller)}:{endpoint.line}"
        label = f"{endpoint.method.upper()} {endpoint.path} ({endpoint.dto_type.rsplit('.', 1)[-1]})"
        if contract_shape is None:
            failures.append(f"{location}: no bundled OpenAPI JSON request body found for {label}")
            continue
        missing = sorted(dto_shape.properties - contract_shape.properties)
        if missing:
            failures.append(f"{location}: OpenAPI request body for {label} is missing DTO field(s): {', '.join(missing)}")
        missing_required = sorted(dto_shape.required - contract_shape.required)
        if missing_required:
            failures.append(
                f"{location}: OpenAPI request body for {label} does not mark required DTO field(s): "
                + ", ".join(missing_required)
            )

    if failures:
        print("openapi-backend-contracts: FAIL", file=sys.stderr)
        for failure in failures:
            print(f" - {failure}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - update docs/openapi/** request schemas to include backend request DTO JSON fields", file=sys.stderr)
        print(" - run: pnpm openapi:bundle && pnpm sdk:generate", file=sys.stderr)
        return 1

    print(f"openapi-backend-contracts: PASS ({len(endpoints)} request DTO endpoint(s) checked)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
