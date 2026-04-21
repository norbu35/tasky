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

// ── Additional Collectors for Checks 13–22 ───────────────────────────────

// Feature hook files (for check 13 complementary half)
const featureHookFiles = [];
if (fs.existsSync(featuresDir)) {
  for (const feat of fs.readdirSync(featuresDir, { withFileTypes: true })) {
    if (!feat.isDirectory()) continue;
    const hooksDir = path.join(featuresDir, feat.name, 'hooks');
    if (fs.existsSync(hooksDir)) {
      featureHookFiles.push(
        ...walk(hooksDir, ['.ts', '.tsx']).map((f) => ({
          file: f,
          feature: feat.name,
        })),
      );
    }
  }
}

// Helper: check if a file path is directly under screens/ (flat form) or inside screens/<Screen>/ (folder form)
function getScreenPathInfo(filePath, screensDir) {
  const relToScreens = path.relative(screensDir, filePath);
  const parts = relToScreens.split(path.sep);
  if (parts.length === 1) {
    // Flat form: directly under screens/
    return { form: 'flat', screenName: null };
  } else if (parts.length === 2) {
    // Folder form: inside screens/<Screen>/
    return { form: 'folder', screenName: parts[0] };
  }
  // Deeper nesting — skip
  return { form: 'deep', screenName: null };
}

// Helper: extract screen root name from a flat-form filename
function extractScreenRoot(filename) {
  // <Screen>Screen.tsx → Screen root
  if (filename.endsWith('Screen.tsx')) {
    return filename.slice(0, -'Screen.tsx'.length);
  }
  // use<Screen>Screen.ts → Screen root
  const hookMatch = filename.match(/^use(.+)Screen\.ts$/);
  if (hookMatch) return hookMatch[1];
  // <Screen>.model.ts → Screen root
  const modelMatch = filename.match(/^(.+)\.model\.ts$/);
  if (modelMatch) return modelMatch[1];
  // <Screen>.<Section>.tsx → Screen root
  const sectionMatch = filename.match(/^([A-Z][A-Za-z0-9]*)\.[A-Z][A-Za-z0-9]*\.tsx$/);
  if (sectionMatch) return sectionMatch[1];
  // <Screen>.<anything>.tsx (relaxed for section check)
  const dotSection = filename.match(/^([A-Z][A-Za-z0-9]*)\..+\.tsx$/);
  if (dotSection) return dotSection[1];
  return null;
}

// 13. Orchestration-hook naming (§7.7.5.7, §7.7.5.10)
for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  // Determine if this file is directly under screens/ or inside screens/<Screen>/
  const screensDir = path.join(featuresDir, feature, 'screens');
  const info = getScreenPathInfo(file, screensDir);
  if (info.form === 'deep') continue; // skip deeply nested

  // use*.ts files under screens/ MUST end in Screen.ts
  if (/^use.*\.ts$/.test(filename) && !filename.endsWith('Screen.ts')) {
    report(
      'warn',
      'orchestration-hook-naming',
      `${rel(file)}: orchestration hook missing Screen suffix (§7.7.5.7)`,
    );
  }
}

for (const { file, feature } of featureHookFiles) {
  const filename = path.basename(file);
  // use*.ts files under hooks/ MUST NOT end in Screen.ts
  if (/^use.*\.ts$/.test(filename) && filename.endsWith('Screen.ts')) {
    report(
      'warn',
      'orchestration-hook-naming',
      `${rel(file)}: domain hook incorrectly carries Screen suffix (§7.7.5.10)`,
    );
  }
}

// 14. Section-file name pattern (§7.7.5.8)
for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  const screensDir = path.join(featuresDir, feature, 'screens');
  const info = getScreenPathInfo(file, screensDir);
  if (info.form === 'deep') continue;

  // Skip non-tsx files
  if (!filename.endsWith('.tsx')) continue;
  // Skip *.parts.tsx (tracked by check 12)
  if (filename.endsWith('.parts.tsx')) continue;

  if (info.form === 'flat') {
    // Skip Screen.tsx and <Screen>Screen.tsx (compositions)
    if (filename === 'Screen.tsx' || filename.endsWith('Screen.tsx')) continue;
    // Check flat section pattern: <Pascal>.<Pascal>.tsx
    // Must have exactly one internal dot before .tsx and both segments start uppercase
    const flatSectionRe = /^[A-Z][A-Za-z0-9]*\.[A-Z][A-Za-z0-9]*\.tsx$/;
    // If it has dots (potential section file)
    const dotCount = (filename.match(/\./g) || []).length;
    if (dotCount >= 2) {
      // Has internal dots — could be a section file
      if (!flatSectionRe.test(filename)) {
        report(
          'warn',
          'section-file-naming',
          `${rel(file)}: section file violates PascalCase.PascalCase.tsx pattern (§7.7.5.8)`,
        );
      }
    }
  } else if (info.form === 'folder') {
    // Inside screens/<Screen>/, section files are just <PascalCase>.tsx
    // Skip Screen.tsx, model.ts, index.ts — those are folder-form roles, not sections
    if (filename === 'Screen.tsx' || filename === 'model.ts' || filename === 'index.ts') continue;
    // Skip use<Screen>Screen.ts
    if (/^use.+Screen\.ts$/.test(filename)) continue;
    // Skip *.parts.tsx
    if (filename.endsWith('.parts.tsx')) continue;
    // Remaining .tsx files are sections — must be PascalCase
    if (!/^[A-Z][A-Za-z0-9]*\.tsx$/.test(filename)) {
      report(
        'warn',
        'section-file-naming',
        `${rel(file)}: section file violates PascalCase.tsx pattern (§7.7.5.8)`,
      );
    }
  }
}

// 15. File-role allowlist under screens/ (§7.7.5.1)
for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  const screensDir = path.join(featuresDir, feature, 'screens');
  const info = getScreenPathInfo(file, screensDir);
  if (info.form === 'deep') continue;

  let allowed = false;

  if (info.form === 'flat') {
    // Flat form allowed roles:
    // <Screen>Screen.tsx
    if (/^[A-Z][A-Za-z0-9]*Screen\.tsx$/.test(filename)) allowed = true;
    // use<Screen>Screen.ts
    if (/^use[A-Z][A-Za-z0-9]*Screen\.ts$/.test(filename)) allowed = true;
    // <Screen>.model.ts
    if (/^[A-Z][A-Za-z0-9]*\.model\.ts$/.test(filename)) allowed = true;
    // <Screen>.<Section>.tsx (Pascal.Pascal.tsx)
    if (/^[A-Z][A-Za-z0-9]*\.[A-Z][A-Za-z0-9]*\.tsx$/.test(filename)) allowed = true;
    // *.parts.tsx (legacy, tracked by check 12)
    if (filename.endsWith('.parts.tsx')) allowed = true;
  } else if (info.form === 'folder') {
    // Folder form allowed roles:
    // Screen.tsx
    if (filename === 'Screen.tsx') allowed = true;
    // use<Screen>Screen.ts
    if (/^use[A-Z][A-Za-z0-9]*Screen\.ts$/.test(filename)) allowed = true;
    // model.ts
    if (filename === 'model.ts') allowed = true;
    // <Section>.tsx
    if (/^[A-Z][A-Za-z0-9]*\.tsx$/.test(filename)) allowed = true;
    // index.ts
    if (filename === 'index.ts') allowed = true;
    // *.parts.tsx (legacy)
    if (filename.endsWith('.parts.tsx')) allowed = true;
  }

  if (!allowed) {
    report(
      'warn',
      'screen-file-role',
      `${rel(file)}: file does not match an allowed screen-family role (§7.7.5.1)`,
    );
  }
}

// 16. Model purity (§7.7.5.9)
const modelBannedImports = [
  { pattern: /from\s+['"]react['"]/, label: 'react' },
  { pattern: /from\s+['"]react-native['"]/, label: 'react-native' },
  { pattern: /from\s+['"]@tanstack\/react-query['"]/, label: '@tanstack/react-query' },
  { pattern: /from\s+['"]@\/features\/[^'"]*\/api['"]/, label: '@/features/*/api' },
  { pattern: /mobileApiClient/, label: 'mobileApiClient' },
  { pattern: /from\s+['"]@\/store\//, label: '@/store/*' },
  { pattern: /from\s+['"][^'"]*\/store\//, label: '*/store/*' },
];

for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  const isModel =
    filename.endsWith('.model.ts') || filename === 'model.ts';
  if (!isModel) continue;

  const lines = readLines(file);
  const p = rel(file);
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, label } of modelBannedImports) {
      if (pattern.test(lines[i])) {
        report(
          'warn',
          'model-purity',
          `${p}:${i + 1} model file imports ${label} (§7.7.5.9)`,
        );
      }
    }
  }
}

// 17. Deep relative-import ban (§7.7.6.3)
for (const f of allSrcFiles) {
  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    if (/from\s+['"][^'"]*\.\.\/\.\.\/(.*\.\.\/)?[^'"]*['"]/.test(lines[i])) {
      // Matches any import with ../../ or deeper
      const importMatch = lines[i].match(/from\s+['"]([^'"]*)['"]/);
      const importPath = importMatch ? importMatch[1] : lines[i].trim();
      report(
        'warn',
        'deep-relative-import',
        `${p}:${i + 1} uses deep relative import: ${importPath} (§7.7.6.3)`,
      );
    }
  }
}

// 18. Screen-family aggregation (§7.7.5.2, §7.7.6.2)
const screenFamilies = new Map(); // key: "feature:screenRoot" → { files, totalLines, sectionCount, isFolder }

for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  const screensDir = path.join(featuresDir, feature, 'screens');
  const info = getScreenPathInfo(file, screensDir);

  let familyKey;
  let isFolder = false;

  if (info.form === 'folder') {
    familyKey = `${feature}:${info.screenName}`;
    isFolder = true;
  } else if (info.form === 'flat') {
    const root = extractScreenRoot(filename);
    if (root) {
      familyKey = `${feature}:${root}`;
    } else {
      continue; // Can't determine family
    }
  } else {
    continue;
  }

  if (!screenFamilies.has(familyKey)) {
    screenFamilies.set(familyKey, {
      files: [],
      totalLines: 0,
      sectionCount: 0,
      isFolder,
      feature,
    });
  }
  const family = screenFamilies.get(familyKey);
  family.files.push(file);

  const lines = lineCount(file);
  family.totalLines += lines;

  // Count section files
  const isSection =
    info.form === 'flat'
      ? /^[A-Z][A-Za-z0-9]*\.[A-Z][A-Za-z0-9]*\.tsx$/.test(filename) ||
        (/^[A-Z][A-Za-z0-9]*\..+\.tsx$/.test(filename) &&
          !filename.endsWith('Screen.tsx') &&
          !filename.endsWith('.parts.tsx'))
      : info.form === 'folder' &&
        filename !== 'Screen.tsx' &&
        filename !== 'model.ts' &&
        filename !== 'index.ts' &&
        !/^use.+Screen\.ts$/.test(filename) &&
        !filename.endsWith('.parts.tsx') &&
        filename.endsWith('.tsx');
  if (isSection) family.sectionCount++;
}

for (const [familyKey, family] of screenFamilies) {
  const [feature, screenRoot] = familyKey.split(':');

  // Section cap (≥ 8)
  if (family.sectionCount >= 8) {
    report(
      'warn',
      'screen-family-section-cap',
      `${feature}/${screenRoot} has ${family.sectionCount} sections (cap 8) (§7.7.6.2)`,
    );
  }

  // Folder promotion thresholds (only warn for flat form)
  if (!family.isFolder) {
    const fileCount = family.files.length;
    if (family.sectionCount >= 4) {
      report(
        'warn',
        'screen-family-aggregation',
        `${feature}/${screenRoot}: ${family.sectionCount} sections in flat form (promote at ≥ 4) (§7.7.5.2)`,
      );
    }
    if (fileCount >= 6) {
      report(
        'warn',
        'screen-family-aggregation',
        `${feature}/${screenRoot}: ${fileCount} files in flat form (promote at ≥ 6) (§7.7.5.2)`,
      );
    }
    if (family.totalLines >= 600) {
      report(
        'warn',
        'screen-family-aggregation',
        `${feature}/${screenRoot}: ${family.totalLines} total lines in flat form (promote at ≥ 600) (§7.7.5.2)`,
      );
    }
  }
}

// 19. Feature-to-feature boundary (§7.7.2.1)
for (const f of allSrcFiles) {
  const relPath = path.relative(ROOT, f);
  const featuresMatch = relPath.match(/^features[/\\]([^/\\]+)[/\\]/);
  if (!featuresMatch) continue;
  const ownDomain = featuresMatch[1];

  const lines = readLines(f);
  const p = rel(f);
  for (let i = 0; i < lines.length; i++) {
    // Check for direct imports into another feature's internal structure
    const importMatch = lines[i].match(
      /from\s+['"]@\/features\/([^/]+)\/(api|screens|hooks|draft)[/'"]/,
    );
    if (importMatch && importMatch[1] !== ownDomain) {
      report(
        'warn',
        'feature-boundary',
        `${p}:${i + 1} directly imports internal of feature "${importMatch[1]}" (§7.7.2.1)`,
      );
    }
  }
}

// 20. Cross-screen ban within a feature (§7.7.2.4, §7.7.5.3)
for (const { file, feature } of featureScreenFiles) {
  const filename = path.basename(file);
  const screensDir = path.join(featuresDir, feature, 'screens');
  const info = getScreenPathInfo(file, screensDir);

  // Determine own screen root
  let ownScreenRoot;
  if (info.form === 'folder') {
    ownScreenRoot = info.screenName;
  } else if (info.form === 'flat') {
    ownScreenRoot = extractScreenRoot(filename);
  }
  if (!ownScreenRoot) continue;

  const lines = readLines(file);
  const p = rel(file);
  for (let i = 0; i < lines.length; i++) {
    if (info.form === 'flat') {
      // Flat form: ./<DifferentScreenRoot>.* imports are cross-screen
      const importMatch = lines[i].match(
        /from\s+['"]\.\/([A-Z][A-Za-z0-9]*)/,
      );
      if (importMatch) {
        const importedRoot = importMatch[1];
        if (importedRoot !== ownScreenRoot) {
          report(
            'warn',
            'cross-screen-import',
            `${p}:${i + 1} imports from sibling screen "${importedRoot}" (§7.7.2.4)`,
          );
        }
      }
    }
    if (info.form === 'folder') {
      // Folder form: ../<DifferentScreen> or imports outside own folder
      const relativeOutMatch = lines[i].match(
        /from\s+['"]\.\.\/([A-Z][A-Za-z0-9]*)/,
      );
      if (relativeOutMatch) {
        const importedName = relativeOutMatch[1];
        // ../<Name> could be another screen folder or a flat-form sibling
        if (importedName !== ownScreenRoot) {
          report(
            'warn',
            'cross-screen-import',
            `${p}:${i + 1} imports from sibling screen "${importedName}" (§7.7.2.4)`,
          );
        }
      }
    }
    // Both forms: check @/features/<domain>/screens/<OtherScreen> patterns
    const absImportMatch = lines[i].match(
      new RegExp(
        `from\\s+['"]@/features/${feature}/screens/([A-Z][A-Za-z0-9]*)`,
      ),
    );
    if (absImportMatch) {
      const importedRoot = absImportMatch[1];
      if (importedRoot !== ownScreenRoot) {
        report(
          'warn',
          'cross-screen-import',
          `${p}:${i + 1} imports from sibling screen "${importedRoot}" (§7.7.2.4)`,
        );
      }
    }
  }
}

// 21. screens/ barrel ban (§7.7.5.4)
if (fs.existsSync(featuresDir)) {
  for (const feat of fs.readdirSync(featuresDir, { withFileTypes: true })) {
    if (!feat.isDirectory()) continue;
    const screensIndex = path.join(featuresDir, feat.name, 'screens', 'index.ts');
    if (fs.existsSync(screensIndex)) {
      report(
        'warn',
        'screen-barrel-ban',
        `${rel(screensIndex)}: screens/ barrel file is forbidden (§7.7.5.4)`,
      );
    }
  }
}

// 22. Test-path mirror (§7.7.12.1)
const testRoot = path.resolve(__dirname, '..', '__tests__');
if (fs.existsSync(testRoot)) {
  const testFiles = walk(testRoot, ['.ts', '.tsx']).filter(
    (f) => !f.includes(path.join('__tests__', 'integration') + path.sep) &&
           !f.includes(path.join('__tests__', 'test-utils') + path.sep),
  );

  const importScanCache = new Map();

  function fileExistsWithExt(filePath) {
    if (fs.existsSync(filePath)) return filePath;
    const ext = path.extname(filePath);
    const base = filePath.slice(0, -ext.length) || filePath;
    if (ext === '.tsx') {
      const alt = base + '.ts';
      if (fs.existsSync(alt)) return alt;
    } else if (ext === '.ts') {
      const alt = base + '.tsx';
      if (fs.existsSync(alt)) return alt;
    }
    return null;
  }

  function extractSourcePathsFromTest(testFile) {
    if (importScanCache.has(testFile)) return importScanCache.get(testFile);
    const results = [];
    try {
      const content = fs.readFileSync(testFile, 'utf8');
      const testDir = path.dirname(testFile);
      // Static import: import X from 'path' / import { X } from 'path'
      const importRe = /import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
      // require('path') / require("path")
      const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
      // readFileSync(resolve(process.cwd(), 'path')) / readFileSync(resolve(__dirname, 'path'))
      const readFileSyncRe = /readFileSync\(\s*resolve\(\s*(?:process\.cwd\(\)|__dirname)\s*,\s*['"]([^'"]+)['"]\s*\)/g;

      const relativeImports = new Set();
      const cwdPaths = new Set();
      let m;
      while ((m = importRe.exec(content)) !== null) {
        relativeImports.add(m[1]);
      }
      while ((m = requireRe.exec(content)) !== null) {
        relativeImports.add(m[1]);
      }
      while ((m = readFileSyncRe.exec(content)) !== null) {
        cwdPaths.add(m[1]);
      }

      const mobileAppRoot = path.resolve(__dirname, '..');

      for (const p of relativeImports) {
        // Only consider relative paths that point into src/
        if (!p.startsWith('.')) continue;
        const resolved = path.resolve(testDir, p);
        // Check if it's under ROOT (src/)
        if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) continue;
        const found = fileExistsWithExt(resolved) || fileExistsWithExt(resolved + '.ts') || fileExistsWithExt(resolved + '.tsx');
        if (found) {
          results.push(found);
        } else {
          // Try index resolution (directory imports)
          const indexPath = path.join(resolved, 'index.ts');
          const foundIdx = fileExistsWithExt(indexPath);
          if (foundIdx) results.push(foundIdx);
        }
      }

      for (const p of cwdPaths) {
        // readFileSync(resolve(process.cwd(), ...)) paths resolve from mobile app root
        const resolved = path.resolve(mobileAppRoot, p);
        const found = fileExistsWithExt(resolved);
        if (found) results.push(found);
      }
    } catch (_) { /* ignore read errors */ }
    importScanCache.set(testFile, results);
    return results;
  }

  function resolveSourcePath(relToTestRoot, testFile) {
    const sourceRelPath = relToTestRoot.replace(/\.(test|spec)\./, '.');

    // 1. Direct path: src/{category}/{module}/File.tsx
    const directPath = fileExistsWithExt(path.join(ROOT, sourceRelPath));
    if (directPath) return directPath;

    // Also try without stripping .test./.spec.
    const originalPath = fileExistsWithExt(path.join(ROOT, relToTestRoot));
    if (originalPath) return originalPath;

    // 2. Feature-based path: src/{category}/{module}/... → src/features/{module}/{category}/...
    //    e.g. screens/auth/LoginScreen.tsx → features/auth/screens/LoginScreen.tsx
    const parts = sourceRelPath.split(path.sep);
    if (parts.length >= 2) {
      const category = parts[0]; // e.g. "screens", "hooks", "components"
      const module = parts[1];   // e.g. "auth", "bookings", "tasks"
      const rest = parts.slice(2).join(path.sep);
      const featurePath = fileExistsWithExt(path.join(ROOT, 'features', module, category, rest));
      if (featurePath) return featurePath;
      // Also try without the category nesting (hooks → features/auth/hooks/...)
      if (parts.length >= 3) {
        const flatFeaturePath = path.join(ROOT, 'features', module, category, rest);
        const flatFound = fileExistsWithExt(flatFeaturePath);
        if (flatFound) return flatFound;
      }
    }

    // 3. Import-scanning fallback: read the test file and extract source paths
    if (testFile) {
      const sourcePaths = extractSourcePathsFromTest(testFile);
      if (sourcePaths.length > 0) return sourcePaths[0];
    }

    return null;
  }

  for (const testFile of testFiles) {
    const relToTestRoot = path.relative(testRoot, testFile);
    const sourceRelPath = relToTestRoot.replace(/\.(test|spec)\./, '.');

    if (!resolveSourcePath(relToTestRoot, testFile)) {
      report(
        'warn',
        'test-path-mirror',
        `${rel(testFile)}: no corresponding source file at src/${sourceRelPath} (§7.7.12.1)`,
      );
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
  'orchestration-hook-naming',
  'section-file-naming',
  'screen-file-role',
  'model-purity',
  'deep-relative-import',
  'screen-family-aggregation',
  'screen-family-section-cap',
  'feature-boundary',
  'cross-screen-import',
  'screen-barrel-ban',
  'test-path-mirror',
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
  'orchestration-hook-naming': 'Orchestration Hook Naming',
  'section-file-naming': 'Section File Naming',
  'screen-file-role': 'Screen File Role',
  'model-purity': 'Model Purity',
  'deep-relative-import': 'Deep Relative Imports',
  'screen-family-aggregation': 'Screen Family Aggregation',
  'screen-family-section-cap': 'Screen Family Section Cap',
  'feature-boundary': 'Feature-to-Feature Boundary',
  'cross-screen-import': 'Cross-Screen Import',
  'screen-barrel-ban': 'Screen Barrel Ban',
  'test-path-mirror': 'Test Path Mirror',
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
