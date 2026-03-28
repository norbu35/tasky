#!/usr/bin/env python3
"""Validate canonical ticket backlog state from tickets/STATUS.json and ticket specs."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


TICKET_RE = re.compile(r"^TASK-[0-9]{3}$")
BRANCH_RE = re.compile(r"^agent/(TASK-[0-9]{3})-[a-z0-9-]+$")
VALID_STATUSES = {"pending", "in_progress", "done"}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    status_path = repo_root / "tickets" / "STATUS.json"
    tickets_dir = repo_root / "tickets"

    if not status_path.is_file():
        print(f"Ticket coordination file not found: {status_path}", file=sys.stderr)
        return 1
    if not tickets_dir.is_dir():
        print(f"Ticket directory not found: {tickets_dir}", file=sys.stderr)
        return 1

    failures: list[str] = []

    try:
        status_payload = load_json(status_path)
    except Exception as exc:
        print(f"Failed to parse {status_path}: {exc}", file=sys.stderr)
        return 1

    if status_payload.get("schema_version") != "1.0.0":
        failures.append("tickets/STATUS.json must declare schema_version 1.0.0.")

    tickets_map = status_payload.get("tickets")
    if not isinstance(tickets_map, dict) or not tickets_map:
        failures.append("tickets/STATUS.json must contain a non-empty tickets object.")
        tickets_map = {}

    status_ticket_ids = set()
    for ticket_id, meta in sorted(tickets_map.items()):
        status_ticket_ids.add(ticket_id)
        if not TICKET_RE.match(ticket_id):
            failures.append(f"STATUS entry has invalid ticket id: {ticket_id}")
        if not isinstance(meta, dict):
            failures.append(f"{ticket_id}: status entry must be an object.")
            continue
        status = meta.get("status")
        if status not in VALID_STATUSES:
            failures.append(f"{ticket_id}: invalid status '{status}'.")
            continue

        branch = meta.get("branch")
        if status == "pending":
            if branch is not None:
                failures.append(f"{ticket_id}: pending ticket must not declare a branch.")
            continue

        if status == "in_progress" and not isinstance(branch, str):
            failures.append(f"{ticket_id}: {status} ticket must declare a branch.")
        elif isinstance(branch, str):
            branch_match = BRANCH_RE.match(branch)
            if not branch_match:
                failures.append(f"{ticket_id}: branch is invalid: {branch}")
            elif branch_match.group(1) != ticket_id:
                failures.append(f"{ticket_id}: branch ticket prefix does not match entry: {branch}")

        claimed_at = meta.get("claimed_at")
        completed_at = meta.get("completed_at")
        if status == "in_progress" and not isinstance(claimed_at, str):
            failures.append(f"{ticket_id}: in_progress ticket must declare claimed_at.")
        if status == "done" and not isinstance(completed_at, str):
            failures.append(f"{ticket_id}: done ticket must declare completed_at.")

    spec_ticket_ids = set()
    spec_files = sorted(tickets_dir.glob("TASK-*.json"))
    if not spec_files:
        failures.append("No ticket specs found under tickets/TASK-*.json.")

    for spec_path in spec_files:
        ticket_id = spec_path.stem
        spec_ticket_ids.add(ticket_id)
        if ticket_id not in tickets_map:
            failures.append(f"{ticket_id}: ticket spec exists but STATUS.json has no entry.")
            continue
        try:
            payload = load_json(spec_path)
        except Exception as exc:
            failures.append(f"{ticket_id}: failed to parse ticket spec: {exc}")
            continue
        if payload.get("ticket") != ticket_id:
            failures.append(f"{ticket_id}: ticket field does not match filename.")

        depends_on = payload.get("depends_on")
        if not isinstance(depends_on, list):
            failures.append(f"{ticket_id}: depends_on must be an array.")
            continue
        for dep in depends_on:
            if dep not in tickets_map:
                failures.append(f"{ticket_id}: depends_on references unknown ticket '{dep}'.")

    missing_specs = sorted(status_ticket_ids - spec_ticket_ids)
    if missing_specs:
        failures.append(f"STATUS tickets missing specs: {missing_specs}")

    print("Ticket backlog validation summary:")
    print(f"- STATUS entries: {len(status_ticket_ids)}")
    print(f"- Ticket specs: {len(spec_ticket_ids)}")
    print(f"- Coordination file: {status_path}")

    if failures:
        print("Ticket backlog validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Ticket backlog validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
