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
  'validate-design-contracts.py',
);

test('design contract validator recognizes inherited mobile pressable props', () => {
  const result = spawnSync('python3', [validatorPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /COMP-BUTTON Button documented prop\(s\).*onPress/);
});
