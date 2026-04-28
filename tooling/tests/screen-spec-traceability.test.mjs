import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const validator = path.join(
  repoRoot,
  'tooling',
  'scripts',
  'governance',
  'validate-screen-spec-traceability.py',
);

function writeFixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'tasky-screen-traceability-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return root;
}

function runValidator(root) {
  return spawnSync('python3', [validator, '--root', root], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function baseFiles(specTraceability) {
  return {
    'docs/PRD.md': [
      '# Product Requirements Document',
      '',
      '## 11. Detailed functional requirements',
      '',
      '- **REQ-P1-TASK-01**: The task create flow MUST require structured scope fields.',
      '',
      '## 16. Appendix',
      '',
    ].join('\n'),
    'docs/design/screen-graph.yaml': [
      'nodes:',
      '  SCR-CUST-001:',
      '    label: Customer Home',
      '    edges: []',
      '    data_deps: []',
      '',
    ].join('\n'),
    'docs/design/journey-catalog.yaml': [
      'journeys:',
      '  - id: JRN-CUST-01',
      '    name: Post a Task',
      '    actor: [customer]',
      '    phase: 0-1',
      '    goal: Create and publish a task',
      '    entry: SCR-CUST-001',
      '    exit: [SCR-CUST-001]',
      '    happy_path:',
      '      - step: 1',
      '        screen: SCR-CUST-001',
      '        action: Start posting',
      '        next: SCR-CUST-001',
      '    alternate_paths:',
      '      - id: JRN-CUST-01-A1',
      '        name: Validation error',
      '        branch_at: 1',
      '        condition: Invalid data',
      '        screens: [SCR-CUST-001]',
      '        outcome: Inline errors',
      '',
    ].join('\n'),
    'tests/registry.yaml': [
      'scenarios:',
      '  SCN-SMOKE-001:',
      '    title: Task creation and retrieval end-to-end against real database',
      '    prd_ref: REQ-P1-TASK-01',
      '    risk: high',
      '    status: covered',
      '    test_type: integration',
      '',
    ].join('\n'),
    'docs/design/screen-specs/SCR-CUST-001.yaml': [
      'screen_id: SCR-CUST-001',
      "name: 'Customer Home'",
      "route: '/(tabs)'",
      'role: [customer]',
      "phase: '0-1'",
      'traceability:',
      ...specTraceability.map((line) => `  ${line}`),
      'layout:',
      '  template: task_list',
      '',
    ].join('\n'),
  };
}

test('screen spec traceability validator accepts a validated spec with live references', () => {
  const root = writeFixture(
    baseFiles([
      'status: validated',
      'screen_graph_node: SCR-CUST-001',
      'prd_refs: [REQ-P1-TASK-01]',
      "journey_refs: ['JRN-CUST-01:step-1', 'JRN-CUST-01-A1']",
      'scenario_refs: [SCN-SMOKE-001]',
    ]),
  );

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /screen-spec-traceability: PASS/);
});

test('screen spec traceability validator rejects stale references in validated specs', () => {
  const root = writeFixture(
    baseFiles([
      'status: validated',
      'screen_graph_node: SCR-CUST-001',
      'prd_refs: [REQ-P1-TASK-99]',
      'journey_refs: [JRN-CUST-99]',
      'scenario_refs: [SCN-SMOKE-999]',
    ]),
  );

  const result = runValidator(root);

  assert.notEqual(result.status, 0, 'validator should fail on stale traceability refs');
  assert.match(result.stderr, /REQ-P1-TASK-99/);
  assert.match(result.stderr, /JRN-CUST-99/);
  assert.match(result.stderr, /SCN-SMOKE-999/);
});

test('screen spec traceability validator accepts path refs from operational journeys', () => {
  const files = baseFiles([
    'status: validated',
    'screen_graph_node: SCR-CUST-001',
    'prd_refs: [REQ-P1-TASK-01]',
    'journey_refs: [JRN-INFRA-01-P1]',
    'scenario_refs: []',
  ]);
  files['docs/design/journey-catalog.yaml'] = [
    'journeys:',
    '  - id: JRN-INFRA-01',
    '    name: Error Recovery',
    '    actor: [customer, tasker]',
    '    phase: 0-1',
    '    goal: Recover from network/session errors',
    '    entry: SCR-CUST-001',
    '    exit: [SCR-CUST-001]',
    '    paths:',
    '      - id: JRN-INFRA-01-P1',
    '        name: Network error',
    '        screens: [SCR-CUST-001]',
    '        outcome: Retry',
    '',
  ].join('\n');
  const root = writeFixture(files);

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /screen-spec-traceability: PASS/);
});

test('screen spec traceability validator allows pending-audit specs with a summary warning', () => {
  const root = writeFixture(
    baseFiles([
      'status: pending_audit',
      'screen_graph_node: SCR-CUST-001',
      'prd_refs: []',
      'journey_refs: []',
      'scenario_refs: []',
    ]),
  );

  const result = runValidator(root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /screen-spec-traceability: PASS \(1 warning\(s\)\)/);
  assert.match(result.stdout, /1 screen spec\(s\) pending traceability audit/);
});
