#!/usr/bin/env python3
"""Validate PRD requirement traceability and backlog ticket coverage."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REQ_RE = re.compile(r"\b(?:REQ|NFR)-[A-Z]+-[0-9]+\b")
TASK_RE = re.compile(r"\bTASK-[0-9]{3}\b")
TABLE_ROW_RE = re.compile(r"^\|\s*([^|]+?)\s*\|(.+)$")
BACKLOG_HEADING_RE = re.compile(r"^###\s+(TASK-[0-9]{3})\b")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate docs traceability coverage.")
    parser.add_argument("--prd", default="docs/PRD.md", help="Path to PRD markdown")
    parser.add_argument(
        "--traceability",
        default="docs/TRACEABILITY.md",
        help="Path to traceability markdown",
    )
    parser.add_argument(
        "--backlog",
        default="docs/BACKLOG_MVP.md",
        help="Path to backlog markdown",
    )
    return parser.parse_args()


def load_text(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    return path.read_text(encoding="utf-8")


def extract_prd_requirement_ids(prd_text: str) -> set[str]:
    return set(REQ_RE.findall(prd_text))


def extract_traceability_rows(traceability_text: str) -> dict[str, set[str]]:
    rows: dict[str, set[str]] = {}
    for raw_line in traceability_text.splitlines():
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        if line.startswith("|---"):
            continue
        m = TABLE_ROW_RE.match(line)
        if not m:
            continue
        first_col = m.group(1).strip()
        if not REQ_RE.fullmatch(first_col):
            continue
        ticket_ids = set(TASK_RE.findall(line))
        rows[first_col] = ticket_ids
    return rows


def extract_backlog_ticket_ids(backlog_text: str) -> set[str]:
    ticket_ids: set[str] = set()
    for raw_line in backlog_text.splitlines():
        m = BACKLOG_HEADING_RE.match(raw_line.strip())
        if m:
            ticket_ids.add(m.group(1))
    return ticket_ids


def main() -> int:
    args = parse_args()
    prd_path = Path(args.prd)
    traceability_path = Path(args.traceability)
    backlog_path = Path(args.backlog)

    try:
        prd_text = load_text(prd_path)
        traceability_text = load_text(traceability_path)
        backlog_text = load_text(backlog_path)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    prd_reqs = extract_prd_requirement_ids(prd_text)
    trace_rows = extract_traceability_rows(traceability_text)
    backlog_tickets = extract_backlog_ticket_ids(backlog_text)

    trace_reqs = set(trace_rows.keys())

    missing_in_trace = sorted(prd_reqs - trace_reqs)
    extra_in_trace = sorted(trace_reqs - prd_reqs)
    reqs_without_tickets = sorted([req for req, tickets in trace_rows.items() if not tickets])

    all_trace_tickets: set[str] = set()
    for tickets in trace_rows.values():
        all_trace_tickets.update(tickets)
    trace_tickets_missing_backlog = sorted(all_trace_tickets - backlog_tickets)

    failures: list[str] = []
    if missing_in_trace:
        failures.append(f"Requirements missing in traceability: {missing_in_trace}")
    if extra_in_trace:
        failures.append(f"Traceability contains unknown requirement IDs: {extra_in_trace}")
    if reqs_without_tickets:
        failures.append(f"Requirements without mapped ticket IDs: {reqs_without_tickets}")
    if trace_tickets_missing_backlog:
        failures.append(
            "Traceability references tickets not defined in backlog headings: "
            f"{trace_tickets_missing_backlog}"
        )

    print("Traceability validation summary:")
    print(f"- PRD requirement IDs: {len(prd_reqs)}")
    print(f"- Traceability rows: {len(trace_reqs)}")
    print(f"- Backlog ticket definitions: {len(backlog_tickets)}")
    print(f"- Tickets referenced by traceability: {len(all_trace_tickets)}")

    if failures:
        print("Traceability validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Traceability validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
