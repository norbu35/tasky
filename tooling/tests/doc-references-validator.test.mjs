import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const validatorPath = path.join(
  repoRoot,
  'tooling',
  'scripts',
  'governance',
  'validate-doc-references.py',
);

function runPython(code) {
  return spawnSync('python3', ['-c', code, validatorPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('doc references validator treats graphify generated outputs as plugin-owned generated paths', () => {
  const result = runPython(`
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("doc_references", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

refs = module.find_path_refs("""Read graphify-out/GRAPH_REPORT.md. Use graphify-out/wiki/index.md when present.""")
missing = [ref for ref in sorted(refs) if not module.is_allowed_missing_path_ref(ref)]
print(json.dumps(missing))
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), []);
});

test('doc references validator still rejects ordinary missing repo paths', () => {
  const result = runPython(`
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("doc_references", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

refs = module.find_path_refs("Read docs/missing-plugin-output.md before editing.")
missing = [ref for ref in sorted(refs) if not module.is_allowed_missing_path_ref(ref)]
print(json.dumps(missing))
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), ['docs/missing-plugin-output.md']);
});
