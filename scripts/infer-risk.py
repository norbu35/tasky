#!/usr/bin/env python3
import argparse
import fnmatch
import subprocess
import sys
from pathlib import PurePosixPath
from typing import Iterable, List

RISK_ORDER = {"low": 1, "medium": 2, "high": 3}

HIGH_PATTERNS = [
    "docs/API.yaml",
    "src/main/resources/db/migration/*.sql",
    "src/main/java/**/security/**",
    "src/main/java/**/auth/**",
    "src/main/java/**/wallet/**",
    "src/main/java/**/payment/**",
    "src/main/java/**/dispute/**",
    "src/main/java/**/*Security*",
    "src/main/java/**/*Auth*",
    "src/main/java/**/*Payment*",
    "src/main/java/**/*Wallet*",
    "src/main/java/**/*Dispute*",
    "src/main/java/**/*Otp*",
    "src/main/java/**/*Jwt*",
]

LOW_ONLY_PATTERNS = [
    "*.md",
    "docs/**",
    "artifacts/**",
    "scripts/**",
    "config/**",
    ".github/**",
    ".gitignore",
    ".dockerignore",
    ".env.example",
    "src/test/**",
]


def git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def ref_exists(ref: str) -> bool:
    return git("rev-parse", "--verify", ref).returncode == 0


def has_head() -> bool:
    return ref_exists("HEAD")


def get_changed_files(base: str | None, head: str) -> List[str]:
    if not has_head():
        tracked = git("ls-files")
        untracked = git("ls-files", "--others", "--exclude-standard")
        files = [line.strip() for line in tracked.stdout.splitlines() if line.strip()]
        files.extend(line.strip() for line in untracked.stdout.splitlines() if line.strip())
        return sorted(set(files))

    if base and ref_exists(base):
        res = git("diff", "--name-only", f"{base}...{head}")
        files = [line.strip() for line in res.stdout.splitlines() if line.strip()]
        if files:
            return files

    res = git("show", "--pretty=", "--name-only", head)
    files = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    return files


def path_matches(path: str, patterns: Iterable[str]) -> bool:
    normalized = path.replace("\\", "/")
    for pattern in patterns:
        if PurePosixPath(normalized).match(pattern):
            return True
        if fnmatch.fnmatch(normalized, pattern):
            return True
    return False


def infer_risk(files: List[str]) -> tuple[str, List[str]]:
    if not files:
        return "low", ["No changed files detected."]

    reasons: List[str] = []
    for path in files:
        if path_matches(path, HIGH_PATTERNS):
            reasons.append(f"high-risk path matched: {path}")

    if reasons:
        return "high", reasons

    non_low = [path for path in files if not path_matches(path, LOW_ONLY_PATTERNS)]
    if not non_low:
        return "low", ["All changed files are documentation, tests, or non-runtime project config."]

    reasons.append(
        "Runtime or build-impacting files changed without high-risk auth/payment/schema indicators."
    )
    reasons.extend(f"medium-risk file: {path}" for path in non_low[:10])
    return "medium", reasons


def validate_declared_risk(declared: str, inferred: str) -> bool:
    return RISK_ORDER[declared] >= RISK_ORDER[inferred]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Infer risk from changed files and verify declared risk is not under-classified."
    )
    parser.add_argument("--declared", required=True, choices=("low", "medium", "high"))
    parser.add_argument("--base", default=None, help="Optional base git ref (for PRs).")
    parser.add_argument("--head", default="HEAD", help="Head git ref. Default: HEAD.")
    args = parser.parse_args()

    changed_files = get_changed_files(args.base, args.head)
    inferred, reasons = infer_risk(changed_files)

    print(f"Declared risk: {args.declared}")
    print(f"Inferred risk: {inferred}")
    print("Reasons:")
    for reason in reasons:
        print(f"- {reason}")

    if not validate_declared_risk(args.declared, inferred):
        print(
            f"Declared risk '{args.declared}' is lower than inferred risk '{inferred}'.",
            file=sys.stderr,
        )
        return 1

    print("Risk declaration check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
