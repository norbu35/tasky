#!/usr/bin/env python3
"""Validate all canonical ticket specs against the ticket spec contract."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    tickets_dir = repo_root / "tickets"
    status_path = tickets_dir / "STATUS.json"
    validate_script = repo_root / "scripts" / "validate-ticket-spec.py"
    out_dir = repo_root / "artifacts" / "checks" / "spec-validation"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not tickets_dir.is_dir():
        print(f"Ticket directory not found: {tickets_dir}", file=sys.stderr)
        return 1
    if not status_path.is_file():
        print(f"Ticket coordination file not found: {status_path}", file=sys.stderr)
        return 1
    if not validate_script.is_file():
        print(f"Validator not found: {validate_script}", file=sys.stderr)
        return 1

    status_payload = load_json(status_path)
    status_tickets = status_payload.get("tickets")
    if not isinstance(status_tickets, dict):
        print("tickets/STATUS.json must contain a tickets object.", file=sys.stderr)
        return 1

    failures: list[str] = []
    validated = 0

    for spec_path in sorted(tickets_dir.glob("TASK-*.json")):
        ticket = spec_path.stem
        if ticket not in status_tickets:
            failures.append(f"{ticket}: missing coordination entry in tickets/STATUS.json")
            continue

        payload = load_json(spec_path)
        risk = payload.get("risk_level")
        req_ids = payload.get("req_ids", [])
        if not isinstance(risk, str) or not isinstance(req_ids, list):
            failures.append(f"{ticket}: risk_level and req_ids must be present before validation.")
            continue

        status_meta = status_tickets[ticket]
        branch = status_meta.get("branch") or f"agent/{ticket}-autovalidate"
        normalized_out = out_dir / f"{ticket}.normalized.json"
        cmd = [
            sys.executable,
            str(validate_script),
            "--spec",
            str(spec_path),
            "--ticket",
            ticket,
            "--risk",
            risk,
            "--req",
            ",".join(req_ids),
            "--branch",
            branch,
            "--out",
            str(normalized_out),
        ]

        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            failures.append(f"{ticket}: {proc.stderr.strip() or proc.stdout.strip()}")
            continue
        validated += 1

    print("Ticket spec validation summary:")
    print(f"- Ticket specs validated: {validated}")
    print(f"- Coordination source: {status_path}")

    if failures:
        print("Ticket spec set validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Ticket spec set validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
