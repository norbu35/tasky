#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'src');

// ── Helpers ──────────────────────────────────────────────────────────────
function walk(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      results.push(...walk(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function rel(filePath) {
  return path.relative(path.resolve(__dirname, '..'), filePath);
}

function lineCount(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n').length;
}

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n');
}

// ── Collectors ───────────────────────────────────────────────────────────
const routeFiles = walk(path.join(ROOT, 'app'), ['.ts', '.tsx']).filter(
  (f) => !path.basename(f).startsWith('_layout.'),
);

const componentFiles = walk(path.join(ROOT, 'components'), ['.ts', '.tsx']);
const designFiles = walk(path.join(ROOT, 'design'), ['.ts', '.tsx']);
const providerFiles = walk(path.join(ROOT, 'providers'), ['.ts', '.tsx']);
const storeFiles = walk(path.join(ROOT, 'store'), ['.ts', '.tsx']);
const libFiles = walk(path.join(ROOT, 'lib'), ['.ts', '.tsx']).filter(
  (f) => !f.includes(path.join('src', 'lib', '__tests__') + path.sep),
);
const utilsFiles = walk(path.join(ROOT, 'utils'), ['.ts', '.tsx']);
const allSrcFiles = walk(ROOT, ['.ts', '.tsx']).filter(
  (f) => !f.includes(path.join('src', 'future') + path.sep),
);

const featureScreenFiles = [];
const featuresDir = path.join(ROOT, 'features');
if (fs.existsSync(featuresDir)) {
  for (const feat of fs.readdirSync(featuresDir, { withFileTypes: true })) {
    if (!feat.isDirectory()) continue;
    const screensDir = path.join(featuresDir, feat.name, 'screens');
    if (fs.existsSync(screensDir)) {
      featureScreenFiles.push(
        ...walk(screensDir, ['.ts', '.tsx']).map((f) => ({
          file: f,
          feature: feat.name,
        })),
      );
    }
  }
}

// ── Checks ───────────────────────────────────────────────────────────────
const results = [];

function report(status, category, message) {
  results.push({ status, category, message });
}

function lineViolates(lines, predicate, reporter) {
  for (let i = 0; i < lines.length; i++) {
    if (predicate(lines[i])) reporter(i);
  }
}

// 1. Route file line budgets
for (const f of routeFiles) {
  const lines = lineCount(f);
  const p = rel(f);
  if (lines > 100) {
    report('fail', 'route-budget', `${p} is ${lines} lines (limit 100)`);
  } else if (lines > 60) {
    report('warn', 'route-budget', `${p} is ${lines} lines (warn threshold 60)`);
  }
}

if (!routeFiles.some((f) => lineCount(f) > 60) && routeFiles.length > 0) {
  report('pass', 'route-budget', `All ${routeFiles.length} route files within 60 lines`);
}

// 2. Banned imports in route files
const bannedRouteImports = [
  { pattern: /createMobileApiClient/, label: 'createMobileApiClient' },
  { pattern: /from\s+['"]@\/features\/[^'"]*\/api['"]/, label: '@/features/*/api' },
  { pattern: /from\s+['"]@\/future['"]/, label: '@/future' },
];

for (const f of routeFiles) {
  const lines = readLines(f);
  const p = rel(f);
  for (const { pattern, label } of bannedRouteImports) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        report('fail', 'route-banned-import', `${p}:${i + 1} imports ${label}`);
      }
    }
  }
}

// 3. Components importing from features
for (const f of componentFiles) {
  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    if (/from\s+['"]@\/features\//.test(lines[i])) {
      report('fail', 'component-layer-violation', `${p}:${i + 1} imports from @/features/`);
    }
  }
}

// 4. Design layer importing from app or features
for (const f of designFiles) {
  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    if (/from\s+['"]@\/app\//.test(lines[i])) {
      report('fail', 'design-layer-violation', `${p}:${i + 1} imports from @/app/`);
    }
    if (/from\s+['"]@\/features\//.test(lines[i])) {
      report('fail', 'design-layer-violation', `${p}:${i + 1} imports from @/features/`);
    }
  }
}

// 5. Production code importing from @/future/
for (const f of allSrcFiles) {
  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    if (
      /from\s+['"]@\/future/.test(lines[i]) ||
      /from\s+['"]\.\.\/future/.test(lines[i]) ||
      /from\s+['"]\.\/future/.test(lines[i])
    ) {
      report('fail', 'future-import', `${p}:${i + 1} imports from future/`);
    }
  }
}

// 6. Providers importing from routes or feature screens
for (const f of providerFiles) {
  const lines = readLines(f);
  const p = rel(f);
  lineViolates(
    lines,
    (line) =>
      /from\s+['"]@\/app\//.test(line) ||
      /from\s+['"][^'"]*\/app\//.test(line) ||
      /from\s+['"]@\/features\/[^'"]*\/screens\//.test(line) ||
      /from\s+['"][^'"]*\/features\/[^'"]*\/screens\//.test(line),
    (i) => report('fail', 'provider-layer-violation', `${p}:${i + 1} violates provider boundary`),
  );
}

// 7. Stores importing feature code, transport, or query ownership
for (const f of storeFiles) {
  const lines = readLines(f);
  const p = rel(f);
  lineViolates(
    lines,
    (line) =>
      /from\s+['"]@\/app\//.test(line) ||
      /from\s+['"][^'"]*\/app\//.test(line) ||
      /from\s+['"]@\/features\//.test(line) ||
      /from\s+['"][^'"]*\/features\//.test(line) ||
      /from\s+['"]@\/providers\//.test(line) ||
      /from\s+['"][^'"]*\/providers\//.test(line) ||
      /mobileApiClient/.test(line) ||
      /@tanstack\/react-query/.test(line) ||
      /\buseQuery\(/.test(line) ||
      /\buseMutation\(/.test(line) ||
      /\buseInfiniteQuery\(/.test(line),
    (i) => report('fail', 'store-layer-violation', `${p}:${i + 1} violates store boundary`),
  );
}

// 8. Shared lib importing feature, route, or store code
for (const f of libFiles) {
  const lines = readLines(f);
  const p = rel(f);
  lineViolates(
    lines,
    (line) =>
      /from\s+['"]@\/app\//.test(line) ||
      /from\s+['"][^'"]*\/app\//.test(line) ||
      /from\s+['"]@\/features\//.test(line) ||
      /from\s+['"][^'"]*\/features\//.test(line) ||
      /from\s+['"]@\/store\//.test(line) ||
      /from\s+['"][^'"]*\/store\//.test(line),
    (i) => report('fail', 'lib-layer-violation', `${p}:${i + 1} violates lib boundary`),
  );
}

// 9. Utils importing React/query/store/feature/transport code
for (const f of utilsFiles) {
  const lines = readLines(f);
  const p = rel(f);
  lineViolates(
    lines,
    (line) =>
      /from\s+['"]react['"]/.test(line) ||
      /from\s+['"]@tanstack\/react-query['"]/.test(line) ||
      /from\s+['"]@\/app\//.test(line) ||
      /from\s+['"][^'"]*\/app\//.test(line) ||
      /from\s+['"]@\/features\//.test(line) ||
      /from\s+['"][^'"]*\/features\//.test(line) ||
      /from\s+['"]@\/store\//.test(line) ||
      /from\s+['"][^'"]*\/store\//.test(line) ||
      /mobileApiClient/.test(line) ||
      /\buseQuery\(/.test(line) ||
      /\buseMutation\(/.test(line) ||
      /\buseInfiniteQuery\(/.test(line),
    (i) => report('fail', 'utils-layer-violation', `${p}:${i + 1} violates utils boundary`),
  );
}

// 10. Feature screen-family size budgets (role-aware)
function getRoleBudget(filename) {
  if (filename.endsWith('Screen.tsx')) return { warn: 220, fail: 280, role: 'Screen' };
  // Semantic section files: <ScreenName>.<SectionName>.tsx (e.g. CustomerTaskDetail.Header.tsx)
  // Match files with at least two dot-separated segments before .tsx, excluding known roles
  if (
    !filename.endsWith('.model.ts') &&
    !filename.endsWith('.parts.tsx') &&
    !/^use.*\.ts$/.test(filename) &&
    /\.tsx$/.test(filename) &&
    filename.includes('.')
  ) {
    return { warn: 260, fail: 340, role: 'Section' };
  }
  if (filename.endsWith('.parts.tsx')) return { warn: 260, fail: 340, role: 'Parts (legacy)' };
  if (filename.endsWith('.model.ts')) return { warn: 180, fail: 240, role: 'Model' };
  if (/^use.*\.ts$/.test(filename)) return { warn: 180, fail: 240, role: 'Hook' };
  return { warn: 220, fail: Infinity, role: 'Other' };
}

let screenFamilyWithinBudget = 0;
let legacyPartsFiles = 0;
for (const { file, feature } of featureScreenFiles) {
  const lines = lineCount(file);
  const p = rel(file);
  const filename = path.basename(file);
  const { warn, fail, role } = getRoleBudget(filename);
  // Track legacy *.parts.tsx files as migration artifacts
  if (filename.endsWith('.parts.tsx')) {
    report(
      'warn',
      'legacy-parts-file',
      `${p} is a legacy *.parts.tsx file — migrate to semantic section filenames`,
    );
    legacyPartsFiles++;
  }
  if (lines > fail) {
    report(
      'fail',
      `screen-family-${role.toLowerCase().replace(/[^a-z]/g, '')}`,
      `${p} is ${lines} lines (fail limit ${fail}, role: ${role}, feature: ${feature})`,
    );
  } else if (lines > warn) {
    report(
      'warn',
      `screen-family-${role.toLowerCase().replace(/[^a-z]/g, '')}`,
      `${p} is ${lines} lines (warn threshold ${warn}, role: ${role}, feature: ${feature})`,
    );
  } else {
    screenFamilyWithinBudget++;
  }
}
if (screenFamilyWithinBudget > 0) {
  report('pass', 'screen-family', `${screenFamilyWithinBudget} screen-family files within budget`);
}
if (legacyPartsFiles > 0) {
  report(
    'warn',
    'legacy-parts-file',
    `${legacyPartsFiles} legacy *.parts.tsx file(s) remain — see remediation spec`,
  );
}

// 11. Route-to-route import check (route files should not import @/app/)
const allRouteFiles = walk(path.join(ROOT, 'app'), ['.ts', '.tsx']);
for (const f of allRouteFiles) {
  if (path.basename(f).startsWith('_layout.')) continue;
  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    if (/from\s+['"]@\/app\//.test(lines[i]) || /from\s+['"][^'"]*\/app\//.test(lines[i])) {
      const match = lines[i].match(/from\s+['"]([^'"]*)['"]/);
      if (match) {
        report(
          'warn',
          'route-to-route-import',
          `${p}:${i + 1} imports from route layer: ${match[1]}`,
        );
      }
    }
  }
}

// ── Summary ──────────────────────────────────────────────────────────────
const failCount = results.filter((r) => r.status === 'fail').length;
const warnCount = results.filter((r) => r.status === 'warn').length;
const passCount = results.filter((r) => r.status === 'pass').length;

const categoryOrder = [
  'route-budget',
  'route-banned-import',
  'route-to-route-import',
  'legacy-parts-file',
  'screen-family',
  'screen-family-screen',
  'screen-family-section',
  'screen-family-partslegacy',
  'screen-family-model',
  'screen-family-hook',
  'component-layer-violation',
  'design-layer-violation',
  'provider-layer-violation',
  'store-layer-violation',
  'lib-layer-violation',
  'utils-layer-violation',
  'future-import',
];

const categoryLabels = {
  'route-budget': 'Route Budget',
  'route-banned-import': 'Route Banned Imports',
  'route-to-route-import': 'Route-to-Route Imports',
  'legacy-parts-file': 'Legacy Parts Files',
  'screen-family': 'Screen Family',
  'screen-family-screen': 'Screen Family — Screen',
  'screen-family-section': 'Screen Family — Section',
  'screen-family-partslegacy': 'Screen Family — Parts (Legacy)',
  'screen-family-model': 'Screen Family — Model',
  'screen-family-hook': 'Screen Family — Hook',
  'component-layer-violation': 'Layer Violations',
  'design-layer-violation': 'Design Layer Violations',
  'provider-layer-violation': 'Provider Layer Violations',
  'store-layer-violation': 'Store Layer Violations',
  'lib-layer-violation': 'Lib Layer Violations',
  'utils-layer-violation': 'Utils Layer Violations',
  'future-import': 'Future Import Violations',
};

function formatResult(r) {
  const tag = r.status === 'fail' ? 'FAIL' : r.status === 'warn' ? 'WARN' : 'PASS';
  return `  [${tag}] ${r.message}`;
}

console.log('\n═══ Mobile Structure Check ═══\n');

for (const cat of categoryOrder) {
  const catResults = results.filter((r) => r.category === cat);
  if (catResults.length === 0) continue;
  const label = categoryLabels[cat] || cat;
  console.log(`── ${label} ──`);
  for (const r of catResults) console.log(formatResult(r));
  console.log();
}

const otherResults = results.filter((r) => !categoryOrder.includes(r.category));
if (otherResults.length > 0) {
  console.log('── Other ──');
  for (const r of otherResults) console.log(formatResult(r));
  console.log();
}

console.log('── Summary ──');
console.log(`  Pass: ${passCount}  Warn: ${warnCount}  Fail: ${failCount}`);
console.log();

if (failCount > 0) {
  console.log('✗ Structure check failed — fix FAIL items above.\n');
  process.exitCode = 1;
} else {
  console.log('✓ Structure check passed.\n');
}
