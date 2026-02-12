#!/usr/bin/env python3
import re
import sys
from pathlib import Path

MIGRATION_DIR = Path("src/main/resources/db/migration")
VERSIONED_RE = re.compile(r"^V([0-9]+(?:_[0-9]+)*)__[A-Za-z0-9_]+\.sql$")
REPEATABLE_RE = re.compile(r"^R__[A-Za-z0-9_]+\.sql$")


def main() -> int:
    if not MIGRATION_DIR.exists():
        print(f"Migration directory missing: {MIGRATION_DIR}", file=sys.stderr)
        return 1

    files = sorted(p for p in MIGRATION_DIR.glob("*.sql"))
    if not files:
        print("No migration SQL files found. Migration safety check passed.")
        return 0

    errors = []
    seen_versions = set()
    for path in files:
        name = path.name
        versioned = VERSIONED_RE.match(name)
        if versioned:
            version = versioned.group(1)
            if version in seen_versions:
                errors.append(f"Duplicate Flyway version detected: {version} ({name})")
            seen_versions.add(version)
            continue
        if REPEATABLE_RE.match(name):
            continue
        errors.append(f"Invalid Flyway migration naming: {name}")

    if errors:
        print("Migration validation errors:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    print(f"Migration safety check passed. Files checked: {len(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
