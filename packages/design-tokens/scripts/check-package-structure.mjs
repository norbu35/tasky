import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const failures = [];

const requiredFiles = [
  'src/index.ts',
  'src/core/primitives.ts',
  'src/core/semantic.ts',
  'src/core/motion.ts',
  'src/core/additions.ts',
  'src/platform/native.ts',
  'src/platform/web.ts',
  'src/compat/colors.ts',
  'src/compat/layout.ts',
  'src/compat/tokens.ts',
  'src/styles/tokens.css',
];

for (const requiredFile of requiredFiles) {
  if (!existsSync(join(packageRoot, requiredFile))) {
    failures.push(`Missing expected package file: ${requiredFile}`);
  }
}

const disallowedRootFiles = ['colors_and_type.css', 'tokens.css', 'tokens.ts'];

for (const disallowedFile of disallowedRootFiles) {
  if (existsSync(join(packageRoot, disallowedFile))) {
    failures.push(
      `Move or remove root-level ${disallowedFile}; package code must live under src/.`,
    );
  }
}

const ignoredDirectories = new Set(['.turbo', 'dist', 'node_modules']);

const findFiles = (directory) => {
  const results = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        results.push(...findFiles(join(directory, entry.name)));
      }
      continue;
    }

    results.push(join(directory, entry.name));
  }

  return results;
};

for (const filePath of findFiles(packageRoot)) {
  if (filePath.endsWith('colors_and_type.css')) {
    failures.push(
      `Pure design documentation CSS belongs under docs/design, not ${relative(
        packageRoot,
        filePath,
      )}.`,
    );
  }
}

const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const indexSource = readFileSync(join(packageRoot, 'src/index.ts'), 'utf8');
const tokenCssSource = readFileSync(join(packageRoot, 'src/styles/tokens.css'), 'utf8');

const expectedExports = {
  '.': './src/index.ts',
  './primitives': './src/core/primitives.ts',
  './semantic': './src/core/semantic.ts',
  './platform/native': './src/platform/native.ts',
  './platform/web': './src/platform/web.ts',
  './motion': './src/core/motion.ts',
  './tokens.css': './src/styles/tokens.css',
};

for (const [exportName, expectedTarget] of Object.entries(expectedExports)) {
  if (packageJson.exports?.[exportName] !== expectedTarget) {
    failures.push(`package.json export ${exportName} must point to ${expectedTarget}.`);
  }
}

const unexpectedExports = Object.keys(packageJson.exports ?? {}).filter(
  (exportName) => !Object.hasOwn(expectedExports, exportName),
);

if (unexpectedExports.length > 0) {
  failures.push(`Unexpected package exports: ${unexpectedExports.join(', ')}`);
}

const requiredRootExports = [
  'interactionTokens',
  'overlayTokens',
  'iconSizeTokens',
  'elevationTokens',
  'typographyVariantTokens',
  'densityTokens',
  'animationPresetTokens',
  'colorOpacityTokens',
  'contentRuleTokens',
];

for (const exportName of requiredRootExports) {
  if (!indexSource.includes(exportName)) {
    failures.push(`Root package export must include ${exportName}.`);
  }
}

const requiredCssVariables = [
  '--interaction-pressed-opacity',
  '--overlay-scrim-modal',
  '--icon-size-md',
  '--z-modal',
  '--animation-sheet-open-duration',
  '--color-primary-10',
  '--typography-page-heading-letter-spacing',
  '--content-mongolian-min-body-size',
];

for (const variableName of requiredCssVariables) {
  if (!tokenCssSource.includes(variableName)) {
    failures.push(`Runtime token CSS must expose ${variableName}.`);
  }
}

if (tokenCssSource.includes('--letter-spacing-tight: -')) {
  failures.push('Runtime token CSS must not expose negative letter spacing.');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
