import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const schemaParityPath = path.join(
  repoRoot,
  'tooling',
  'scripts',
  'governance',
  'validate-schema-parity.py',
);

function writeMigration(dir, name, sql) {
  const filePath = path.join(dir, name);
  writeFileSync(filePath, `${sql.trim()}\n`);
  return filePath;
}

function runPython(code, args) {
  const result = spawnSync('python3', ['-c', code, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

test('schema parser applies ALTER TABLE RENAME TO before later table changes', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tasky-schema-parity-'));
  const migrations = [
    writeMigration(
      dir,
      'V1__create_old_tasks.sql',
      `
      CREATE TABLE old_tasks (
        id UUID PRIMARY KEY,
        status TEXT NOT NULL
      );
      `,
    ),
    writeMigration(dir, 'V2__rename_old_tasks.sql', 'ALTER TABLE old_tasks RENAME TO renamed_tasks;'),
    writeMigration(dir, 'V3__alter_renamed_tasks.sql', 'ALTER TABLE renamed_tasks ADD COLUMN created_at TIMESTAMPTZ;'),
  ];

  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("schema_parity", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

tables = module.parse_schema([Path(item) for item in sys.argv[2:]])
print(json.dumps({name: sorted(data["columns"]) for name, data in tables.items()}, sort_keys=True))
`,
    [schemaParityPath, ...migrations],
  );

  assert.deepEqual(JSON.parse(output), {
    renamed_tasks: ['created_at', 'id', 'status'],
  });
});

test('migration collection includes repeatable migrations after versioned migrations', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tasky-schema-parity-'));
  writeMigration(dir, 'V2__second.sql', 'CREATE TABLE second_table (id UUID);');
  writeMigration(dir, 'R__refresh_projection.sql', 'CREATE TABLE projection_table (id UUID);');
  writeMigration(dir, 'V1__first.sql', 'CREATE TABLE first_table (id UUID);');
  writeMigration(dir, 'R__apply_grants.sql', 'CREATE TABLE grants_table (id UUID);');

  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
migration_dir = Path(sys.argv[2])
spec = importlib.util.spec_from_file_location("schema_parity", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

print(json.dumps([path.name for path in module.collect_migration_files(migration_dir)]))
`,
    [schemaParityPath, dir],
  );

  assert.deepEqual(JSON.parse(output), [
    'V1__first.sql',
    'V2__second.sql',
    'R__apply_grants.sql',
    'R__refresh_projection.sql',
  ]);
});

test('schema parser handles pg_dump schema-qualified tables and ANY array checks', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tasky-schema-parity-'));
  const migrations = [
    writeMigration(
      dir,
      'V1__baseline.sql',
      `
      CREATE TABLE public.tasks (
        id UUID NOT NULL,
        status TEXT NOT NULL,
        pricing_mode TEXT DEFAULT 'BUDGET'::text NOT NULL,
        badge_type TEXT NOT NULL,
        CONSTRAINT tasker_badges_badge_type_check CHECK ((badge_type = 'PRO'::text)),
        CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'COMPLETED'::text]))),
        CONSTRAINT tasks_pricing_mode_check CHECK ((pricing_mode = ANY (ARRAY['BUDGET'::text, 'QUOTE'::text])))
      );

      ALTER TABLE ONLY public.tasks
        ADD CONSTRAINT tasks_scope_summary_source_check
        CHECK (((scope_summary_source IS NULL) OR (scope_summary_source = ANY (ARRAY['TEMPLATE'::text, 'USER_EDITED'::text]))));
      `,
    ),
  ];

  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("schema_parity", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

tables = module.schema_to_json(module.parse_schema([Path(item) for item in sys.argv[2:]]), "test")
print(json.dumps(tables["tables"], sort_keys=True))
`,
    [schemaParityPath, ...migrations],
  );

  assert.deepEqual(JSON.parse(output), {
    tasks: {
      check_constraints: {
        badge_type: ['PRO'],
        pricing_mode: ['BUDGET', 'QUOTE'],
        scope_summary_source: ['TEMPLATE', 'USER_EDITED'],
        status: ['COMPLETED', 'OPEN'],
      },
      columns: ['badge_type', 'id', 'pricing_mode', 'status'],
    },
  });
});

test('schema diff summarizes expected-schema changes without writing', () => {
  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("schema_parity", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

expected = {
    "tables": {
        "tasks": {
            "columns": ["id", "status"],
            "check_constraints": {"status": ["OPEN"]},
        },
        "legacy_jobs": {"columns": ["id"]},
    }
}
actual = {
    "tables": {
        "tasks": {
            "columns": ["created_at", "id"],
            "check_constraints": {"status": ["OPEN", "POSTED"]},
        },
        "bookings": {"columns": ["id"]},
    }
}
print(json.dumps(module.schema_diff(actual, expected), sort_keys=True))
`,
    [schemaParityPath],
  );

  assert.deepEqual(JSON.parse(output), {
    status: 'changes',
    tables_added: ['bookings'],
    tables_removed: ['legacy_jobs'],
    tables_changed: {
      tasks: {
        check_constraints_changed: {
          status: {
            actual: ['OPEN', 'POSTED'],
            expected: ['OPEN'],
          },
        },
        columns_added: ['created_at'],
        columns_removed: ['status'],
      },
    },
  });
});
