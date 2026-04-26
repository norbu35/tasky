import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const gatePath = path.join(repoRoot, 'tooling', 'scripts', 'gates', 'check-tdd-gate.sh');
const gateSource = readFileSync(gatePath, 'utf8');

function extractSingleQuotedAssignment(name) {
  const match = gateSource.match(new RegExp(`^${name}='([^']+)'`, 'm'));
  assert.ok(match, `${name} must be defined as a single-quoted assignment`);
  return match[1];
}

test('frontend production matching includes package src files', () => {
  const productionPattern = new RegExp(extractSingleQuotedAssignment('FRONTEND_PROD_PATTERN'));

  assert.match('apps/web/src/components/Button.tsx', productionPattern);
  assert.match('apps/mobile/src/screens/Home.tsx', productionPattern);
  assert.match('packages/core/src/index.ts', productionPattern);
  assert.match('packages/sdk/src/client.ts', productionPattern);
  assert.match('packages/design-tokens/src/tokens.ts', productionPattern);
  assert.doesNotMatch('packages/core/__tests__/index.test.ts', productionPattern);
});

test('jq prerequisite is reported before evidence parsing uses jq', () => {
  const guardIndex = gateSource.indexOf('command -v jq');
  const jqParseIndex = gateSource.indexOf("jq -r '.red.exit // empty'");

  assert.notEqual(guardIndex, -1, 'check-tdd-gate.sh must guard the jq dependency');
  assert.notEqual(jqParseIndex, -1, 'check-tdd-gate.sh must parse tdd evidence with jq');
  assert.ok(guardIndex < jqParseIndex, 'jq dependency check must run before jq parses evidence');
  assert.match(gateSource, /tdd-gate: error: 'jq' is required/);
});

test('commit ordering language reflects first production commit policy', () => {
  assert.match(
    gateSource,
    /Gate 3: First-production ordering — branch production code must not appear before tests\./,
  );
  assert.match(gateSource, /checking first production commit ordering/);
  assert.match(gateSource, /first production commit appears before any test commit/);
});

test('tdd evidence fallback emits an ambiguity warning', () => {
  const fallbackIndex = gateSource.indexOf("find .pi/sessions -name 'tdd-evidence.json'");
  const warningIndex = gateSource.indexOf('gate-4: using most recently modified tdd evidence fallback');

  assert.notEqual(fallbackIndex, -1, 'check-tdd-gate.sh must retain evidence fallback lookup');
  assert.notEqual(warningIndex, -1, 'fallback evidence resolution must emit a warning');
  assert.ok(fallbackIndex < warningIndex, 'fallback warning must be tied to fallback lookup');
  assert.match(gateSource, /TDD_EVIDENCE_FILE/);
  assert.match(gateSource, /TDD_SESSION_ID/);
});
