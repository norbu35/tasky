import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function readRepo(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runPython(modulePath, code) {
  const result = spawnSync('python3', ['-c', code, path.join(repoRoot, modulePath)], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

test('cleanup gate runs cheap structural checks before the heavy docs lane', () => {
  const source = readRepo('tooling/scripts/gates/check-cleanup-gate.sh');
  const docsIndex = source.indexOf('run_step "repo docs lane" pnpm repo:docs:check');

  for (const step of [
    'run_step "migration safety validation"',
    'run_step "schema parity validation"',
    'run_step "gitleaks secret scan"',
  ]) {
    const stepIndex = source.indexOf(step);
    assert.notEqual(stepIndex, -1, `${step} must exist`);
    assert.ok(stepIndex < docsIndex, `${step} should run before repo docs lane`);
  }
});

test('ops config reports member drift as added and removed deltas', () => {
  const source = readRepo('tooling/scripts/gates/check-ops-config.mjs');

  assert.match(source, /function describeMemberDelta/);
  assert.match(source, /removed:/);
  assert.match(source, /added:/);
  assert.doesNotMatch(source, /expected \[\$\{expectedSorted\.join/);
  assert.doesNotMatch(source, /got \[\$\{actualSorted\.join/);
});

test('ops config has registry shape validation and an explicit docker bypass', () => {
  const source = readRepo('tooling/scripts/gates/check-ops-config.mjs');

  assert.match(source, /function validateRegistryShape/);
  assert.match(source, /packageScripts/);
  assert.match(source, /composeFiles/);
  assert.match(source, /NO_DOCKER_COMPOSE_CHECK/);
  assert.match(source, /ops-config: warning: docker compose check skipped/);
});

test('tooling surface uses registered compose files as the executable source', () => {
  const source = readRepo('tooling/scripts/gates/check-tooling-surface.mjs');

  assert.match(source, /registry\.composeFiles/);
  assert.doesNotMatch(source, /readdirSync\(repoRoot\)[\s\S]*startsWith\("docker-compose"\)/);
});

test('ops registry sync compares workflow jobs as sets and can describe --fix changes', async () => {
  const sync = await import('../scripts/gates/sync-ops-registry.mjs');

  assert.equal(sync.sameStringSet(['contracts', 'security'], ['security', 'contracts']), true);
  assert.equal(sync.sameStringSet(['contracts'], ['contracts', 'security']), false);
  assert.deepEqual(sync.describeArrayDelta(['structural-gate', 'backend-quality'], ['backend-quality', 'contracts']), {
    added: ['contracts'],
    removed: ['structural-gate'],
  });
});

test('PRD scenario validator anchors requirement extraction by heading text', () => {
  const output = runPython(
    'tooling/scripts/governance/validate-prd-scenario-links.py',
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("prd_links", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = module
spec.loader.exec_module(module)

text = """# PRD

## 42. Detailed functional requirements
- **REQ-P1-AUTH-01**: Live launch requirement.

## 43. Launch baseline clarifications for derived artifacts
- **REQ-P1-LATE-01**: Outside governed requirement body.
"""
print(json.dumps(module.prd_governed_body(text)))
`,
  );

  const governed = JSON.parse(output);
  assert.match(governed, /REQ-P1-AUTH-01/);
  assert.doesNotMatch(governed, /REQ-P1-LATE-01/);
});

test('PRD scenario validator detects duplicate scenario IDs', () => {
  const output = runPython(
    'tooling/scripts/governance/validate-prd-scenario-links.py',
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("prd_links", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = module
spec.loader.exec_module(module)

scenarios = [
    module.Scenario("SCN-AUTH-001", Path("tests/scenarios/auth.md"), 5, "high", "First", ["REQ-P1-AUTH-01"]),
    module.Scenario("SCN-AUTH-001", Path("tests/scenarios/copy.md"), 8, "high", "Copy", ["REQ-P1-AUTH-01"]),
]
print(json.dumps([finding.as_json() for finding in module.detect_duplicate_scenario_ids(scenarios)]))
`,
  );

  const findings = JSON.parse(output);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /Duplicate scenario id `SCN-AUTH-001`/);
});

test('PRD scenario validator exposes coverage escalation and scans frontend tests for needs-scenario markers', () => {
  const source = readRepo('tooling/scripts/governance/validate-prd-scenario-links.py');

  assert.match(source, /--fail-on-coverage-gap/);
  assert.match(source, /NEEDS_SCENARIO_TEST_ROOTS/);
  assert.match(source, /apps.+web/);
  assert.match(source, /apps.+mobile/);
});

test('i18n validation reports complete key lists and tracks unvalidated dynamic keys', () => {
  const output = runPython(
    'tooling/scripts/governance/validate-i18n.py',
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("i18n_validator", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

payload = {
    "formatted": module.format_key_list([f"key{i:02d}" for i in range(25)]),
    "dynamic": module.dynamic_t_call_count("t('static.key'); t(\`section.\${kind}\`); i18n.t(keyName);"),
    "web_roots": [path.relative_to(module.REPO_ROOT).as_posix() for path in module.source_roots_for_label("web")],
}
print(json.dumps(payload, sort_keys=True))
`,
  );

  const payload = JSON.parse(output);
  assert.match(payload.formatted, /key24/);
  assert.equal(payload.dynamic, 2);
  assert.ok(payload.web_roots.includes('packages/core/src'));
});

test('migration validation recognizes repo-relative versioned paths from git diff output', () => {
  const output = runPython(
    'tooling/scripts/governance/validate-migrations.py',
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("migration_validator", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

print(json.dumps(module.is_versioned_path("services/api/src/main/resources/db/migration/V5__add_user_table.sql")))
`,
  );

  assert.equal(JSON.parse(output), true);
});

test('migration validation allows the baseline reset transition exactly once', () => {
  const output = runPython(
    'tooling/scripts/governance/validate-migrations.py',
    `
import importlib.util
import json
import sys
from pathlib import Path

module_path = Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("migration_validator", module_path)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)

historical_deletes = [f"D\\tservices/api/src/main/resources/db/migration/{name}" for name in sorted(module.BASELINE_RESET_OLD_MIGRATION_NAMES)]
exact_diff = historical_deletes + ["A\\tservices/api/src/main/resources/db/migration/V1__baseline.sql"]
mutated_baseline = ["M\\tservices/api/src/main/resources/db/migration/V1__baseline.sql"]
status_lines = [f" D services/api/src/main/resources/db/migration/{name}" for name in sorted(module.BASELINE_RESET_OLD_MIGRATION_NAMES)]
status_lines.append("?? services/api/src/main/resources/db/migration/V1__baseline.sql")

print(json.dumps({
    "exact_diff": module.baseline_reset_diff_is_exact(exact_diff),
    "mutated_baseline": module.baseline_reset_diff_is_exact(mutated_baseline),
    "exact_status": module.baseline_reset_status_is_exact(status_lines),
}, sort_keys=True))
`,
  );

  assert.deepEqual(JSON.parse(output), {
    exact_diff: true,
    exact_status: true,
    mutated_baseline: false,
  });
});

test('OpenAPI bundler fails unresolved external refs instead of preserving file-relative refs', () => {
  const source = readRepo('tooling/scripts/contracts/bundle-openapi.mjs');

  assert.match(source, /Unmapped external OpenAPI \$ref/);
  assert.match(source, /refStack/);
  assert.doesNotMatch(source, /\?\?\s*child/);
});

test('OpenAPI phase validator resolves the repo root from its own file and does not fail prose-only future references', () => {
  const source = readRepo('tooling/scripts/contracts/validate-openapi-phase.mjs');

  assert.match(source, /fileURLToPath\(import\.meta\.url\)/);
  assert.doesNotMatch(source, /const repoRoot = process\.cwd\(\)/);
  assert.doesNotMatch(source, /collectFutureReferences\(futurePaths, futureSchemas\)/);
});
