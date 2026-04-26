import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const validatorPath = path.join(
  repoRoot,
  'tooling',
  'scripts',
  'governance',
  'validate-doc-claims.py',
);
const validatorSource = readFileSync(validatorPath, 'utf8');

function runPython(code, args = []) {
  const result = spawnSync('python3', ['-c', code, validatorPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

test('doc claims validator does not keep the unused symbol-claim stub', () => {
  assert.equal(/def validate_symbol_claim\(/.test(validatorSource), false);
});

test('doc claims validator does not build unused frontend inventory', () => {
  assert.equal(/class FrontendInventory\b/.test(validatorSource), false);
  assert.equal(/def build_frontend_inventory\(/.test(validatorSource), false);
  assert.equal(/_frontend_inventory\s*=/.test(validatorSource), false);
});

test('doc claims validator accepts an explicit changed-file scope', () => {
  assert.match(validatorSource, /--files/);

  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("doc_claims", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = module
spec.loader.exec_module(module)

paths = module.collect_scan_files([Path("docs/architecture/common.md")])
print(json.dumps([path.relative_to(module.REPO_ROOT).as_posix() for path in paths]))
`,
  );

  assert.deepEqual(JSON.parse(output), ['docs/architecture/common.md']);
});

test('doc claims validator reports generic unscoped columns only as warnings', () => {
  const output = runPython(
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("doc_claims", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = module
spec.loader.exec_module(module)

inventory = module.SchemaInventory(tables={"tasks": {"id", "status"}, "bookings": {"id"}})
ref = module.Reference("db-column", "status", Path("docs/architecture/common.md"), 7)
warning = module.generic_unscoped_db_column_warning(ref, inventory)
print(json.dumps(None if warning is None else warning.message))
`,
  );

  assert.match(JSON.parse(output), /Generic DB column `status` is referenced without table context/);
});
