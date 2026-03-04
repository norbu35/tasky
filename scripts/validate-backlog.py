#!/usr/bin/env python3
"""Validate backlog structure, dependency graph, and ticket-spec coherence."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

INDEX_ROW_RE = re.compile(
    r"^\|\s*(TASK-[0-9]{3})\s*\|\s*[^|]+\|\s*(low|medium|high)\s*\|\s*([^|]+)\|\s*([^|]+)\|",
    re.IGNORECASE,
)
HEADING_RE = re.compile(r"^###\s+(TASK-[0-9]{3})\b")
REQ_RE = re.compile(r"\b(?:REQ|NFR)-[A-Z]+-[0-9]+\b")
TRACE_ROW_RE = re.compile(r"^\|\s*((?:REQ|NFR)-[A-Z]+-[0-9]+)\s*\|.*\|\s*(.+?)\s*\|\s*$")
TICKET_RE = re.compile(r"\bTASK-[0-9]{3}\b")


def parse_index(backlog_text: str) -> dict[str, dict[str, object]]:
    index: dict[str, dict[str, object]] = {}
    for line in backlog_text.splitlines():
        match = INDEX_ROW_RE.match(line)
        if not match:
            continue
        ticket = match.group(1)
        risk = match.group(2).lower()
        req_ids = sorted(set(REQ_RE.findall(match.group(3))))
        deps = [dep.strip() for dep in match.group(4).split(",") if dep.strip() and dep.strip() != "-"]
        index[ticket] = {"risk": risk, "req_ids": req_ids, "depends_on": deps}
    return index


def parse_definitions(backlog_text: str) -> set[str]:
    found: set[str] = set()
    for line in backlog_text.splitlines():
        match = HEADING_RE.match(line)
        if match:
            found.add(match.group(1))
    return found


def parse_traceability_requirements(trace_text: str) -> dict[str, list[str]]:
    mapping: dict[str, set[str]] = {}
    for line in trace_text.splitlines():
        match = TRACE_ROW_RE.match(line)
        if not match:
            continue
        req_id = match.group(1)
        ticket_col = match.group(2)
        for ticket in TICKET_RE.findall(ticket_col):
            mapping.setdefault(ticket, set()).add(req_id)
    return {ticket: sorted(req_ids) for ticket, req_ids in mapping.items()}


def detect_cycles(index: dict[str, dict[str, object]]) -> list[list[str]]:
    graph = {ticket: data["depends_on"] for ticket, data in index.items()}
    state: dict[str, int] = {}
    stack: list[str] = []
    cycles: list[list[str]] = []

    def dfs(node: str) -> None:
        state[node] = 1
        stack.append(node)
        for nxt in graph[node]:
            if nxt not in graph:
                continue
            if state.get(nxt, 0) == 0:
                dfs(nxt)
            elif state[nxt] == 1:
                start = stack.index(nxt)
                cycles.append(stack[start:] + [nxt])
        stack.pop()
        state[node] = 2

    for ticket in graph:
        if state.get(ticket, 0) == 0:
            dfs(ticket)
    return cycles


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    backlog_path = repo_root / "docs/BACKLOG.md"
    traceability_path = repo_root / "docs/TRACEABILITY.md"
    tickets_dir = repo_root / "tickets"

    if not backlog_path.is_file():
        print(f"Backlog file not found: {backlog_path}", file=sys.stderr)
        return 1
    if not tickets_dir.is_dir():
        print(f"Ticket directory not found: {tickets_dir}", file=sys.stderr)
        return 1

    backlog_text = backlog_path.read_text(encoding="utf-8")
    index = parse_index(backlog_text)
    definitions = parse_definitions(backlog_text)
    if traceability_path.is_file():
        traceability_text = traceability_path.read_text(encoding="utf-8")
        reqs_by_ticket = parse_traceability_requirements(traceability_text)
        req_source = f"{traceability_path}"
    else:
        reqs_by_ticket = {}
        req_source = "backlog index coverage column (traceability file missing)"
    failures: list[str] = []

    if not index:
        failures.append("No ticket index rows found in docs/BACKLOG.md.")

    for ticket in sorted(index):
        if ticket not in definitions:
            failures.append(f"{ticket}: missing ticket definition heading in backlog document.")

    for ticket, meta in sorted(index.items()):
        spec_path = tickets_dir / f"{ticket}.json"
        if not spec_path.is_file():
            failures.append(f"{ticket}: missing ticket spec file at {spec_path}.")
            continue
        payload = json.loads(spec_path.read_text(encoding="utf-8"))
        spec_risk = payload.get("risk_level")
        spec_req_ids = sorted(payload.get("req_ids", []))
        spec_depends_on = payload.get("depends_on", [])
        expected_req_ids = reqs_by_ticket.get(ticket, meta["req_ids"])

        if spec_risk != meta["risk"]:
            failures.append(f"{ticket}: risk mismatch spec={spec_risk} backlog={meta['risk']}")
        if spec_req_ids != expected_req_ids:
            failures.append(
                f"{ticket}: req_ids mismatch spec={spec_req_ids} expected={expected_req_ids}"
            )
        if spec_depends_on != meta["depends_on"]:
            failures.append(
                f"{ticket}: depends_on mismatch spec={spec_depends_on} backlog={meta['depends_on']}"
            )

    for ticket, meta in sorted(index.items()):
        for dep in meta["depends_on"]:
            if dep not in index:
                failures.append(f"{ticket}: dependency '{dep}' is not declared in backlog index.")

    cycles = detect_cycles(index)
    if cycles:
        for cycle in cycles:
            failures.append(f"Dependency cycle detected: {' -> '.join(cycle)}")

    if failures:
        print("Backlog validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Backlog validation summary:")
    print(f"- Indexed tickets: {len(index)}")
    print(f"- Definitions found: {len(definitions)}")
    print(f"- Spec files validated: {len(index)}")
    print(f"- REQ source: {req_source}")
    print("- Dependency graph: acyclic")
    print("Backlog validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
