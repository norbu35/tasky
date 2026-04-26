#!/usr/bin/env python3
"""Flyway schema parity drift guard.

Parses all Flyway SQL migrations in version order, builds a canonical
{table_name: sorted_column_list} map, and compares against an expected
schema inventory file.

Exit codes:
    0 - schema parity
    1 - drift detected
    2 - error (file not found, parse error)
"""

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MIGRATION_DIR = (
    REPO_ROOT
    / "services"
    / "api"
    / "src"
    / "main"
    / "resources"
    / "db"
    / "migration"
)
EXPECTED_SCHEMA_FILE = REPO_ROOT / "tooling" / "config" / "expected-schema.json"

VERSION_RE = re.compile(r"^V(\d+)__")
REPEATABLE_RE = re.compile(r"^R__[A-Za-z0-9_]+\.sql$")

CREATE_TABLE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*)\)",
    re.IGNORECASE | re.DOTALL,
)
DROP_TABLE_RE = re.compile(
    r"DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)",
    re.IGNORECASE,
)
ALTER_TABLE_RE = re.compile(
    r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)\s+(.*)",
    re.IGNORECASE | re.DOTALL,
)
RENAME_TABLE_RE = re.compile(
    r"RENAME\s+TO\s+(\w+)",
    re.IGNORECASE,
)
ADD_COLUMN_RE = re.compile(
    r"ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s",
    re.IGNORECASE,
)
DROP_COLUMN_RE = re.compile(
    r"DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?(\w+)",
    re.IGNORECASE,
)
RENAME_COLUMN_RE = re.compile(
    r"RENAME\s+COLUMN\s+(\w+)\s+TO\s+(\w+)",
    re.IGNORECASE,
)
ADD_CONSTRAINT_RE = re.compile(
    r"ADD\s+CONSTRAINT\s+\w+\s+",
    re.IGNORECASE,
)
CHECK_IN_RE = re.compile(
    r"CHECK\s*\(\s*(\w+)\s+(?:IS\s+NULL\s+OR\s+\1\s+)?IN\s*\(\s*([^)]+?)\s*\)",
    re.IGNORECASE,
)

SKIP_PREFIXES = (
    "CREATE INDEX",
    "CREATE UNIQUE INDEX",
    "CREATE VIEW",
    "CREATE OR REPLACE",
    "CREATE TRIGGER",
    "CREATE EXTENSION",
    "CREATE TEMP",
    "INSERT INTO",
    "UPDATE ",
    "DROP INDEX",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Flyway migration schema parity against expected inventory.",
    )
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        "--update-expected",
        action="store_true",
        help="Regenerate expected-schema.json from current migrations.",
    )
    mode_group.add_argument(
        "--diff",
        action="store_true",
        help="Print the expected-schema.json changes implied by current migrations without writing.",
    )
    return parser.parse_args()


def migration_version(path: Path) -> int:
    m = VERSION_RE.match(path.name)
    return int(m.group(1)) if m else 0


def collect_migration_files(migration_dir: Path) -> list[Path]:
    versioned = sorted(
        [p for p in migration_dir.glob("V*.sql") if VERSION_RE.match(p.name)],
        key=migration_version,
    )
    repeatable = sorted(
        [p for p in migration_dir.glob("R__*.sql") if REPEATABLE_RE.match(p.name)],
        key=lambda path: path.name,
    )
    return versioned + repeatable


def migration_range_label(migration_files: list[Path]) -> str:
    versioned = [path for path in migration_files if VERSION_RE.match(path.name)]
    repeatable_count = sum(1 for path in migration_files if REPEATABLE_RE.match(path.name))

    if versioned:
        v_first = VERSION_RE.match(versioned[0].name).group(1)
        v_last = VERSION_RE.match(versioned[-1].name).group(1)
        label = f"V{v_first} through V{v_last}"
    else:
        label = "repeatable migrations only"

    if repeatable_count:
        label = f"{label} plus {repeatable_count} repeatable"
    return label


def strip_comments(sql: str) -> str:
    lines = []
    for line in sql.split("\n"):
        idx = line.find("--")
        lines.append(line[:idx] if idx >= 0 else line)
    return "\n".join(lines)


def split_top_level_commas(text: str) -> list[str]:
    """Split *text* by commas at parenthesis depth 0."""
    parts: list[str] = []
    depth = 0
    buf: list[str] = []
    for ch in text:
        if ch == "(":
            depth += 1
            buf.append(ch)
        elif ch == ")":
            depth -= 1
            buf.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return [p for p in parts if p]


def column_name_from_def(col_def: str) -> str | None:
    """Return the column name from a column definition, or *None* for
    standalone table-level constraints."""
    s = col_def.strip()
    up = s.upper()
    if re.match(
        r"^(CONSTRAINT\s|PRIMARY\s+KEY|UNIQUE\s*[\(]|CHECK\s*[\(]|EXCLUDE\s)",
        up,
    ):
        return None
    tokens = s.split()
    return tokens[0].strip('"').lower() if tokens else None


def extract_check_in_values(text: str) -> list[tuple[str, list[str]]]:
    """Find all ``CHECK (col IN ('A','B',...))`` patterns in *text*.

    Returns a list of ``(column_name, sorted_values)``.
    """
    results: list[tuple[str, list[str]]] = []
    for m in CHECK_IN_RE.finditer(text):
        col = m.group(1).lower()
        raw = m.group(2)
        values = sorted(
            v.strip().strip("'") for v in raw.split(",") if v.strip()
        )
        results.append((col, values))
    return results


# ---------------------------------------------------------------------------
# Schema parser
# ---------------------------------------------------------------------------

def parse_schema(migrations: list[Path]) -> dict[str, dict]:
    """Walk *migrations* in order and return the final schema state.

    Returns ``{table_name: {"columns": set, "check_constraints": {col: [vals]}}}``
    """
    tables: dict[str, dict] = {}

    for mig_path in migrations:
        sql = strip_comments(mig_path.read_text(encoding="utf-8"))
        statements = [s.strip() for s in sql.split(";") if s.strip()]

        for stmt in statements:
            up = stmt.lstrip().upper()

            # Skip non-structural DML / indexes / views / functions etc.
            if up.startswith(SKIP_PREFIXES):
                continue

            # --- DROP TABLE ------------------------------------------------
            drop_m = DROP_TABLE_RE.match(stmt)
            if drop_m:
                tables.pop(drop_m.group(1).lower(), None)
                continue

            # --- CREATE TABLE -----------------------------------------------
            create_m = CREATE_TABLE_RE.match(stmt)
            if create_m:
                tname = create_m.group(1).lower()
                body = create_m.group(2)
                columns: set[str] = set()
                checks: dict[str, list[str]] = {}

                for col_def in split_top_level_commas(body):
                    cname = column_name_from_def(col_def)
                    if cname is None:
                        continue
                    columns.add(cname)
                    for chk_col, vals in extract_check_in_values(col_def):
                        checks[chk_col] = vals

                tables[tname] = {"columns": columns, "check_constraints": checks}
                continue

            # --- ALTER TABLE ------------------------------------------------
            alter_m = ALTER_TABLE_RE.match(stmt)
            if alter_m:
                tname = alter_m.group(1).lower()
                action_text = alter_m.group(2).strip()

                rename_table_m = RENAME_TABLE_RE.fullmatch(action_text)
                if rename_table_m:
                    if tname in tables:
                        new_name = rename_table_m.group(1).lower()
                        tables[new_name] = tables.pop(tname)
                    continue

                if tname not in tables:
                    # ALTER before CREATE (shouldn't happen in well-ordered
                    # migrations) — skip gracefully.
                    continue

                actions = split_top_level_commas(action_text)

                for action in actions:
                    action_stripped = action.strip()

                    # ADD COLUMN
                    add_m = ADD_COLUMN_RE.match(action_stripped)
                    if add_m:
                        cname = add_m.group(1).lower()
                        tables[tname]["columns"].add(cname)
                        for chk_col, vals in extract_check_in_values(action_stripped):
                            tables[tname]["check_constraints"][chk_col] = vals
                        continue

                    # DROP COLUMN
                    drop_m2 = DROP_COLUMN_RE.match(action_stripped)
                    if drop_m2:
                        cname = drop_m2.group(1).lower()
                        tables[tname]["columns"].discard(cname)
                        tables[tname]["check_constraints"].pop(cname, None)
                        continue

                    # RENAME COLUMN
                    rename_m = RENAME_COLUMN_RE.match(action_stripped)
                    if rename_m:
                        old = rename_m.group(1).lower()
                        new = rename_m.group(2).lower()
                        cols = tables[tname]["columns"]
                        if old in cols:
                            cols.discard(old)
                            cols.add(new)
                        continue

                    # ADD CONSTRAINT (may carry CHECK)
                    if ADD_CONSTRAINT_RE.match(action_stripped):
                        for chk_col, vals in extract_check_in_values(action_stripped):
                            tables[tname]["check_constraints"][chk_col] = vals
                        continue

                    # Everything else (ALTER COLUMN, DROP CONSTRAINT, …) — skip.
    return tables


# ---------------------------------------------------------------------------
# Serialisation / comparison
# ---------------------------------------------------------------------------

def schema_to_json(
    tables: dict[str, dict],
    version_range: str,
) -> dict:
    result: dict = {
        "_generated_from_migrations": version_range,
        "_description": (
            "Canonical schema inventory. Regenerate with: "
            "python3 tooling/scripts/governance/validate-schema-parity.py --update-expected"
        ),
        "tables": {},
    }
    for tname in sorted(tables):
        tdata = tables[tname]
        entry: dict = {"columns": sorted(tdata["columns"])}
        if tdata["check_constraints"]:
            entry["check_constraints"] = dict(
                sorted(tdata["check_constraints"].items())
            )
        result["tables"][tname] = entry
    return result


def compare_schemas(
    actual: dict,
    expected: dict,
) -> tuple[list[str], list[str]]:
    """Return ``(errors, warnings)``."""
    errors: list[str] = []
    warnings: list[str] = []

    actual_t = actual.get("tables", {})
    expected_t = expected.get("tables", {})
    actual_names = set(actual_t)
    expected_names = set(expected_t)

    for t in sorted(actual_names - expected_names):
        errors.append(
            f"New table '{t}' in migrations but not in expected schema "
            f"(run --update-expected)"
        )
    for t in sorted(expected_names - actual_names):
        errors.append(
            f"Stale table '{t}' in expected schema but not in migrations"
        )

    for t in sorted(actual_names & expected_names):
        ac = set(actual_t[t]["columns"])
        ec = set(expected_t[t]["columns"])

        missing = ec - ac
        extra = ac - ec
        if missing:
            errors.append(f"Table '{t}': missing columns {sorted(missing)}")
        if extra:
            errors.append(f"Table '{t}': extra columns {sorted(extra)}")

        a_checks = actual_t[t].get("check_constraints", {})
        e_checks = expected_t[t].get("check_constraints", {})
        for col in sorted(set(a_checks) | set(e_checks)):
            av = a_checks.get(col, [])
            ev = e_checks.get(col, [])
            if av != ev:
                errors.append(
                    f"Table '{t}': CHECK on '{col}' differs — "
                    f"expected {ev}, got {av}"
                )

    return errors, warnings


def schema_diff(actual: dict, expected: dict) -> dict:
    actual_tables = actual.get("tables", {})
    expected_tables = expected.get("tables", {})
    actual_names = set(actual_tables)
    expected_names = set(expected_tables)
    changed: dict[str, dict] = {}

    for table in sorted(actual_names & expected_names):
        actual_columns = set(actual_tables[table].get("columns", []))
        expected_columns = set(expected_tables[table].get("columns", []))
        actual_checks = actual_tables[table].get("check_constraints", {})
        expected_checks = expected_tables[table].get("check_constraints", {})
        table_diff: dict[str, object] = {}

        added_columns = sorted(actual_columns - expected_columns)
        removed_columns = sorted(expected_columns - actual_columns)
        if added_columns:
            table_diff["columns_added"] = added_columns
        if removed_columns:
            table_diff["columns_removed"] = removed_columns

        checks_changed = {}
        for column in sorted(set(actual_checks) | set(expected_checks)):
            actual_values = actual_checks.get(column, [])
            expected_values = expected_checks.get(column, [])
            if actual_values != expected_values:
                checks_changed[column] = {
                    "actual": actual_values,
                    "expected": expected_values,
                }
        if checks_changed:
            table_diff["check_constraints_changed"] = checks_changed

        if table_diff:
            changed[table] = table_diff

    diff = {
        "status": "changes" if actual_tables != expected_tables else "up_to_date",
        "tables_added": sorted(actual_names - expected_names),
        "tables_removed": sorted(expected_names - actual_names),
        "tables_changed": changed,
    }
    return diff


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    args = parse_args()

    if not MIGRATION_DIR.exists():
        print(f"Migration directory not found: {MIGRATION_DIR}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - restore the Flyway migration directory before running schema parity", file=sys.stderr)
        return 2

    migration_files = collect_migration_files(MIGRATION_DIR)
    if not migration_files:
        print("No migration files found.", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - schema parity expects Flyway migrations under services/api/src/main/resources/db/migration", file=sys.stderr)
        return 2

    version_range = migration_range_label(migration_files)

    print(f"Parsing {len(migration_files)} migrations ({version_range})...")

    tables = parse_schema(migration_files)

    total_cols = sum(len(t["columns"]) for t in tables.values())
    total_checks = sum(len(t["check_constraints"]) for t in tables.values())
    print(
        f"Found {len(tables)} tables, {total_cols} columns, "
        f"{total_checks} CHECK constraints"
    )

    actual_json = schema_to_json(tables, version_range)

    # --update-expected: regenerate the inventory and exit.
    if args.update_expected:
        EXPECTED_SCHEMA_FILE.parent.mkdir(parents=True, exist_ok=True)

        old_json: dict = {}
        if EXPECTED_SCHEMA_FILE.exists():
            try:
                old_json = json.loads(EXPECTED_SCHEMA_FILE.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                old_json = {}

        new_content = json.dumps(actual_json, indent=2) + "\n"
        EXPECTED_SCHEMA_FILE.write_text(new_content, encoding="utf-8")

        old_tables = old_json.get("tables", {})
        new_tables = actual_json.get("tables", {})

        if old_tables == new_tables:
            print("Expected schema already up to date.")
        else:
            added = sorted(set(new_tables) - set(old_tables))
            removed = sorted(set(old_tables) - set(new_tables))
            if added:
                print(f"  Tables added: {added}")
            if removed:
                print(f"  Tables removed: {removed}")
            for t in sorted(set(old_tables) & set(new_tables)):
                if old_tables[t] != new_tables[t]:
                    print(f"  Table '{t}' changed")
            print(f"Wrote {EXPECTED_SCHEMA_FILE}")

        return 0

    if args.diff:
        if not EXPECTED_SCHEMA_FILE.exists():
            print(
                f"Expected schema file not found: {EXPECTED_SCHEMA_FILE}",
                file=sys.stderr,
            )
            print("Run with --update-expected to generate it.", file=sys.stderr)
            return 2
        try:
            expected_json = json.loads(
                EXPECTED_SCHEMA_FILE.read_text(encoding="utf-8")
            )
        except json.JSONDecodeError as exc:
            print(f"Invalid JSON in {EXPECTED_SCHEMA_FILE}: {exc}", file=sys.stderr)
            print("autonomous remediation:", file=sys.stderr)
            print(" - regenerate the expected inventory from current migrations with --update-expected", file=sys.stderr)
            return 2
        print(json.dumps(schema_diff(actual_json, expected_json), indent=2))
        return 0

    # Normal mode: compare against expected.
    if not EXPECTED_SCHEMA_FILE.exists():
        print(
            f"Expected schema file not found: {EXPECTED_SCHEMA_FILE}",
            file=sys.stderr,
        )
        print("Run with --update-expected to generate it.", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - if a migration changed the schema inventory, run: python3 tooling/scripts/governance/validate-schema-parity.py --update-expected", file=sys.stderr)
        print(" - commit the refreshed tooling/config/expected-schema.json in the same change", file=sys.stderr)
        return 2

    try:
        expected_json = json.loads(
            EXPECTED_SCHEMA_FILE.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON in {EXPECTED_SCHEMA_FILE}: {exc}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - regenerate the expected inventory from current migrations with --update-expected", file=sys.stderr)
        return 2

    errors, warnings = compare_schemas(actual_json, expected_json)

    if warnings:
        print("\nWARNINGS (CHECK constraint differences):")
        for w in warnings:
            print(f"  WARNING: {w}")

    if errors:
        print("\nDRIFT DETECTED:", file=sys.stderr)
        for e in errors:
            print(f"  ERROR: {e}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - if the migration intentionally changed schema shape, run: python3 tooling/scripts/governance/validate-schema-parity.py --update-expected", file=sys.stderr)
        print(" - otherwise fix the migration so it matches the committed expected inventory", file=sys.stderr)
        return 1

    print("Schema parity check PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
