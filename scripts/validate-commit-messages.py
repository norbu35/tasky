#!/usr/bin/env python3
import argparse
import os
import re
import subprocess
import sys
from typing import List

ALLOWED_TYPES = ("feat", "fix", "refactor", "test", "docs", "chore", "perf", "security")
SUBJECT_RE = re.compile(rf"^({'|'.join(ALLOWED_TYPES)})\([^)]+\): .+")
RISK_RE = re.compile(r"^Risk:\s*(low|medium|high)\s*$", re.MULTILINE)
REQUIRED_BODY_FIELDS = ("Ticket:", "Spec:", "API:", "Tests:", "Risk:")


def git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def has_head() -> bool:
    return git("rev-parse", "--verify", "HEAD").returncode == 0


def ref_exists(ref: str) -> bool:
    return git("rev-parse", "--verify", ref).returncode == 0


def collect_commits(base_ref: str | None, head_ref: str) -> List[str]:
    if not has_head():
        return []
    if base_ref and ref_exists(base_ref):
        result = git("rev-list", "--reverse", f"{base_ref}..{head_ref}")
        if result.returncode != 0:
            return []
        commits = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        return commits
    result = git("rev-parse", head_ref)
    if result.returncode != 0:
        return []
    return [result.stdout.strip()]


def validate_message(sha: str, message: str) -> List[str]:
    errors: List[str] = []
    lines = message.splitlines()
    if not lines:
        return [f"{sha}: empty commit message"]

    subject = lines[0].strip()
    if not SUBJECT_RE.match(subject):
        errors.append(
            f"{sha}: invalid subject '{subject}'. Expected '<type>(<scope>): <imperative summary>'."
        )

    body = "\n".join(lines[1:]).strip()
    for field in REQUIRED_BODY_FIELDS:
        if field not in body:
            errors.append(f"{sha}: missing required body field '{field}'")
    if "Risk:" in body and not RISK_RE.search(body):
        errors.append(f"{sha}: Risk field must be one of low|medium|high")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate commit message format against AGENTS.md contract."
    )
    parser.add_argument("--base", default=None, help="Optional base ref for commit range linting.")
    parser.add_argument("--head", default="HEAD", help="Head ref to lint. Default: HEAD")
    args = parser.parse_args()

    base_ref = args.base or os.environ.get("COMMIT_LINT_BASE")
    head_ref = os.environ.get("COMMIT_LINT_HEAD", args.head)

    commits = collect_commits(base_ref, head_ref)
    if not commits:
        print("No commits available for linting (bootstrap/no HEAD). Commit message lint passed.")
        return 0

    failures: List[str] = []
    for sha in commits:
        message_res = git("log", "-1", "--pretty=%B", sha)
        if message_res.returncode != 0:
            failures.append(f"{sha}: unable to read commit message")
            continue
        failures.extend(validate_message(sha, message_res.stdout))

    if failures:
        print("Commit message lint failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(f"Commit message lint passed for {len(commits)} commit(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
