#!/usr/bin/env python3
"""Validate PRD requirement traceability against canonical ticket specs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REQ_RE = re.compile(r"\b(?:REQ|NFR)-[A-Z]+-[0-9]+\b")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate PRD requirement traceability.")
    parser.add_argument("--prd", default="docs/PRD.md", help="Path to PRD markdown")
    parser.add_argument(
        "--tickets-dir",
        default="tickets",
        help="Path to canonical ticket spec directory",
    )
    parser.add_argument(
        "--traceability",
        default="docs/TRACEABILITY.md",
        help="Optional supplemental traceability matrix",
    )
    return parser.parse_args()


def load_text(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    args = parse_args()
    prd_path = Path(args.prd)
    tickets_dir = Path(args.tickets_dir)
    traceability_path = Path(args.traceability)

    try:
        prd_text = load_text(prd_path)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if not tickets_dir.is_dir():
        print(f"Ticket directory not found: {tickets_dir}", file=sys.stderr)
        return 1

    prd_reqs = set(REQ_RE.findall(prd_text))
    ticket_reqs: dict[str, set[str]] = {}
    failures: list[str] = []

    for spec_path in sorted(tickets_dir.glob("TASK-*.json")):
        try:
            payload = load_json(spec_path)
        except Exception as exc:
            failures.append(f"{spec_path.name}: failed to parse JSON: {exc}")
            continue
        ticket_id = spec_path.stem
        req_ids = payload.get("req_ids", [])
        if not isinstance(req_ids, list):
            failures.append(f"{ticket_id}: req_ids must be an array.")
            continue
        ticket_reqs[ticket_id] = set(req_ids)

    referenced_reqs = set().union(*ticket_reqs.values()) if ticket_reqs else set()
    missing_in_tickets = sorted(prd_reqs - referenced_reqs)
    extra_in_tickets = sorted(referenced_reqs - prd_reqs)

    if missing_in_tickets:
        failures.append(f"Requirements missing from ticket specs: {missing_in_tickets}")
    if extra_in_tickets:
        failures.append(f"Ticket specs reference unknown requirement IDs: {extra_in_tickets}")

    supplemental_trace_rows = 0
    if traceability_path.is_file():
        trace_text = traceability_path.read_text(encoding="utf-8")
        trace_reqs = set(REQ_RE.findall(trace_text))
        extra_in_trace = sorted(trace_reqs - prd_reqs)
        if extra_in_trace:
            failures.append(
                f"Supplemental traceability matrix references unknown requirement IDs: {extra_in_trace}"
            )
        supplemental_trace_rows = len(trace_reqs)

    print("Traceability validation summary:")
    print("- Coverage source: canonical ticket specs under tickets/*.json")
    print(f"- PRD requirement IDs: {len(prd_reqs)}")
    print(f"- Ticket specs scanned: {len(ticket_reqs)}")
    print(f"- Requirement IDs referenced by tickets: {len(referenced_reqs)}")
    print(f"- Supplemental traceability rows: {supplemental_trace_rows}")

    if failures:
        print("Traceability validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Traceability validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
