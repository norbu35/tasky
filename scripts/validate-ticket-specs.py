#!/usr/bin/env python3
"""Validate all backlog ticket specs against contract rules."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

INDEX_ROW_RE = re.compile(
    r"^\|\s*(TASK-[0-9]{3})\s*\|\s*[^|]+\|\s*(low|medium|high)\s*\|\s*([^|]+)\|",
    re.IGNORECASE,
)
TRACE_ROW_RE = re.compile(r"^\|\s*((?:REQ|NFR)-[A-Z]+-[0-9]+)\s*\|.*\|\s*(.+?)\s*\|\s*$")
TICKET_RE = re.compile(r"\bTASK-[0-9]{3}\b")


def parse_backlog_index(backlog_path: Path) -> dict[str, dict[str, str]]:
    mapping: dict[str, dict[str, str]] = {}
    for line in backlog_path.read_text(encoding="utf-8").splitlines():
        match = INDEX_ROW_RE.match(line)
        if not match:
            continue
        ticket = match.group(1)
        risk = match.group(2).lower()
        req_col = match.group(3)
        req_ids = sorted(set(re.findall(r"\b(?:REQ|NFR)-[A-Z]+-[0-9]+\b", req_col)))
        mapping[ticket] = {"risk": risk, "req_csv": ",".join(req_ids)}
    return mapping


def parse_traceability_reqs(traceability_path: Path) -> dict[str, list[str]]:
    mapping: dict[str, set[str]] = {}
    for line in traceability_path.read_text(encoding="utf-8").splitlines():
        match = TRACE_ROW_RE.match(line)
        if not match:
            continue
        req_id = match.group(1)
        tickets_col = match.group(2)
        for ticket in TICKET_RE.findall(tickets_col):
            mapping.setdefault(ticket, set()).add(req_id)
    return {ticket: sorted(req_ids) for ticket, req_ids in mapping.items()}


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    backlog_path = repo_root / "docs/BACKLOG.md"
    traceability_path = repo_root / "docs/TRACEABILITY.md"
    validate_script = repo_root / "scripts/validate-ticket-spec.py"
    out_dir = repo_root / "artifacts/checks/spec-validation"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not backlog_path.is_file():
        print(f"Backlog not found: {backlog_path}", file=sys.stderr)
        return 1
    if not validate_script.is_file():
        print(f"Validator not found: {validate_script}", file=sys.stderr)
        return 1

    backlog_index = parse_backlog_index(backlog_path)
    if traceability_path.is_file():
        reqs_by_ticket = parse_traceability_reqs(traceability_path)
        req_source = f"{traceability_path}"
    else:
        reqs_by_ticket = {}
        req_source = "backlog index coverage column (traceability file missing)"
    failures: list[str] = []

    for ticket, meta in sorted(backlog_index.items()):
        spec_path = repo_root / "tickets" / f"{ticket}.json"
        if not spec_path.is_file():
            failures.append(f"{ticket}: missing ticket spec at {spec_path}")
            continue

        normalized_out = out_dir / f"{ticket}.normalized.json"
        req_csv = ",".join(reqs_by_ticket.get(ticket, meta["req_csv"].split(",")))
        cmd = [
            sys.executable,
            str(validate_script),
            "--spec",
            str(spec_path),
            "--ticket",
            ticket,
            "--risk",
            meta["risk"],
            "--req",
            req_csv,
            "--branch",
            f"agent/{ticket}-autovalidate",
            "--out",
            str(normalized_out),
        ]

        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            failures.append(f"{ticket}: {proc.stderr.strip() or proc.stdout.strip()}")

    if failures:
        print("Ticket spec set validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(f"Validated {len(backlog_index)} ticket specs successfully.")
    print(f"REQ source: {req_source}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
