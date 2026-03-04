#!/usr/bin/env python3
"""Generate ticket specs from backlog and traceability docs."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

RISK_ROW_RE = re.compile(
    r"^\|\s*(TASK-[0-9]{3})\s*\|\s*[^|]+\|\s*(low|medium|high)\s*\|\s*([^|]+)\|\s*([^|]+)\|",
    re.IGNORECASE,
)
HEADING_RE = re.compile(r"^###\s+(TASK-[0-9]{3})\b")
AC_LINE_RE = re.compile(r"^\s{2,}[0-9]+\.\s+(.+?)\s*$")
TEST_LINE_RE = re.compile(r"^\s*-\s+`(TID-[A-Z0-9_-]+)`\s*$")
REQ_ID_RE = re.compile(r"\b(?:REQ|NFR)-[A-Z]+-[0-9]+\b")
TICKET_ID_RE = re.compile(r"\bTASK-[0-9]{3}\b")
TRACE_ROW_RE = re.compile(r"^\|\s*((?:REQ|NFR)-[A-Z]+-[0-9]+)\s*\|.*\|\s*(.+?)\s*\|\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate backlog ticket specs.")
    parser.add_argument("--backlog", default="docs/BACKLOG.md")
    parser.add_argument(
        "--traceability",
        default="docs/TRACEABILITY.md",
        help="Optional traceability matrix. Falls back to backlog coverage column when missing.",
    )
    parser.add_argument("--out-dir", default="tickets")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing ticket specs")
    return parser.parse_args()


def parse_risk_coverage_and_dependencies(
    backlog_text: str,
) -> tuple[dict[str, str], dict[str, list[str]], dict[str, list[str]]]:
    risks: dict[str, str] = {}
    coverage_ids: dict[str, list[str]] = {}
    dependencies: dict[str, list[str]] = {}
    for line in backlog_text.splitlines():
        m = RISK_ROW_RE.match(line)
        if not m:
            continue
        ticket = m.group(1)
        risk = m.group(2).lower()
        coverage_col = m.group(3)
        depends_col = m.group(4).strip()
        req_ids = sorted(set(REQ_ID_RE.findall(coverage_col)))
        depends_on = [
            dep.strip()
            for dep in depends_col.split(",")
            if dep.strip() and dep.strip() != "-"
        ]
        risks[ticket] = risk
        coverage_ids[ticket] = req_ids
        dependencies[ticket] = depends_on
    return risks, coverage_ids, dependencies


def parse_sections(backlog_text: str) -> dict[str, dict[str, list[str]]]:
    lines = backlog_text.splitlines()
    sections: dict[str, dict[str, list[str]]] = {}
    idx = 0
    while idx < len(lines):
        heading = HEADING_RE.match(lines[idx])
        if not heading:
            idx += 1
            continue
        ticket = heading.group(1)
        idx += 1

        acceptance: list[str] = []
        tests: list[str] = []

        mode = None
        while idx < len(lines) and not HEADING_RE.match(lines[idx]):
            line = lines[idx]
            if line.strip() == "- Acceptance criteria:":
                mode = "ac"
                idx += 1
                continue
            if line.strip() == "- Required tests:":
                mode = "tests"
                idx += 1
                continue

            if mode == "ac":
                ac_m = AC_LINE_RE.match(line)
                if ac_m:
                    acceptance.append(ac_m.group(1).strip())
                elif line.strip().startswith("-") and not line.strip().startswith("- `"):
                    # end AC block
                    mode = None
            elif mode == "tests":
                test_m = TEST_LINE_RE.match(line)
                if test_m:
                    tests.append(test_m.group(1).strip())
                elif line.strip().startswith("### "):
                    break
            idx += 1

        sections[ticket] = {
            "acceptance": acceptance,
            "tests": tests,
        }

    return sections


def parse_traceability(trace_text: str) -> dict[str, list[str]]:
    reqs_by_ticket: dict[str, set[str]] = {}
    for line in trace_text.splitlines():
        m = TRACE_ROW_RE.match(line)
        if not m:
            continue
        req_id = m.group(1)
        tickets_col = m.group(2)
        for ticket in TICKET_ID_RE.findall(tickets_col):
            reqs_by_ticket.setdefault(ticket, set()).add(req_id)
    return {ticket: sorted(reqs) for ticket, reqs in reqs_by_ticket.items()}


def classify_ac_type(statement: str) -> str:
    s = statement.lower()
    if any(k in s for k in ["p95", "latency", "performance", "query plan", "under target"]):
        return "performance"
    if any(k in s for k in ["idempotent", "retry", "offline", "cache", "reliable", "availability"]):
        return "reliability"
    if any(
        k in s
        for k in [
            "rbac",
            "banned",
            "jwt",
            "signature",
            "encryption",
            "rate-limit",
            "rate limit",
            "auth",
            "authorization",
            "denied",
        ]
    ):
        return "security"
    return "functional"


def map_tests_to_ac(acceptance: list[str], tests: list[str], ticket: str) -> list[list[str]]:
    if not acceptance:
        return []
    if not tests:
        tests = [f"TID-{ticket}-AUTO-DEFAULT"]

    mapped: list[list[str]] = []
    for idx, _ in enumerate(acceptance, start=1):
        if idx <= len(tests):
            mapped.append([tests[idx - 1]])
        else:
            mapped.append([f"TID-{ticket}-AUTO-AC-{idx:02d}"])

    # Deduplicate while preserving order.
    deduped: list[list[str]] = []
    for bucket in mapped:
        seen: set[str] = set()
        ordered: list[str] = []
        for tid in bucket:
            if tid not in seen:
                seen.add(tid)
                ordered.append(tid)
        deduped.append(ordered)
    return deduped


def build_spec(
    ticket: str,
    risk: str,
    req_ids: list[str],
    depends_on: list[str],
    acceptance: list[str],
    tests: list[str],
) -> dict:
    mapped_tests = map_tests_to_ac(acceptance, tests, ticket)

    ac_items: list[dict] = []
    for idx, statement in enumerate(acceptance, start=1):
        ac_id = f"AC-{ticket}-{idx:02d}"
        ac_type = classify_ac_type(statement)
        test_ids = mapped_tests[idx - 1]

        item = {
            "id": ac_id,
            "type": ac_type,
            "statement": statement,
            "test_ids": test_ids,
        }

        # High-risk security/abuse criteria require negative tests in this workflow.
        if risk == "high" and ac_type in {"security", "abuse"}:
            item["negative_test_ids"] = [test_ids[0]]

        ac_items.append(item)

    return {
        "schema_version": "1.0.0",
        "ticket": ticket,
        "risk_level": risk,
        "req_ids": req_ids,
        "depends_on": depends_on,
        "acceptance_criteria": ac_items,
    }


def main() -> int:
    args = parse_args()
    backlog_path = Path(args.backlog)
    trace_path = Path(args.traceability)
    out_dir = Path(args.out_dir)

    if not backlog_path.is_file():
        raise FileNotFoundError(f"Backlog file not found: {backlog_path}")

    backlog_text = backlog_path.read_text(encoding="utf-8")

    risks, coverage_ids, dependencies = parse_risk_coverage_and_dependencies(backlog_text)
    sections = parse_sections(backlog_text)
    if trace_path.is_file():
        trace_text = trace_path.read_text(encoding="utf-8")
        reqs_by_ticket = parse_traceability(trace_text)
    else:
        reqs_by_ticket = {}

    out_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    for ticket in sorted(sections.keys()):
        risk = risks.get(ticket)
        if risk is None:
            raise ValueError(f"Missing risk mapping for {ticket} in backlog index table")

        req_ids = reqs_by_ticket.get(ticket, [])
        if not req_ids:
            req_ids = coverage_ids.get(ticket, [])
        if not req_ids:
            raise ValueError(f"No REQ/NFR mapping found for {ticket} (traceability + backlog coverage empty)")

        acceptance = sections[ticket]["acceptance"]
        tests = sections[ticket]["tests"]
        if not acceptance:
            raise ValueError(f"No acceptance criteria found for {ticket}")
        if not tests:
            raise ValueError(f"No required tests found for {ticket}")

        depends_on = dependencies.get(ticket, [])
        spec = build_spec(
            ticket=ticket,
            risk=risk,
            req_ids=req_ids,
            depends_on=depends_on,
            acceptance=acceptance,
            tests=tests,
        )
        out_path = out_dir / f"{ticket}.json"

        if out_path.exists() and not args.overwrite:
            skipped += 1
            continue

        out_path.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
        generated += 1

    print(f"Generated {generated} ticket specs; skipped {skipped} existing files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
