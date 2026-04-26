import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const additionsSource = readFileSync(join(packageRoot, 'src/core/additions.ts'), 'utf8');
const indexSource = readFileSync(join(packageRoot, 'src/index.ts'), 'utf8');
const nativeSource = readFileSync(join(packageRoot, 'src/platform/native.ts'), 'utf8');
const webSource = readFileSync(join(packageRoot, 'src/platform/web.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));

const promotedTokenExports = [
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

const promotedTokenTypes = [
  'InteractionTokens',
  'OverlayTokens',
  'IconSizeTokens',
  'ElevationTokens',
  'TypographyVariantTokens',
  'DensityTokens',
  'AnimationPresetTokens',
  'ColorOpacityTokens',
  'ContentRuleTokens',
];

test('package test command runs promoted token additions tests', () => {
  assert.match(packageJson.scripts?.test ?? '', /node --test __tests__\/\*\.test\.mjs/);
});

test('promoted system token additions are exported from the package root', () => {
  for (const exportName of promotedTokenExports) {
    assert.match(additionsSource, new RegExp(`export const ${exportName}\\b`));
    assert.match(indexSource, new RegExp(`\\b${exportName}\\b`));
  }

  for (const typeName of promotedTokenTypes) {
    assert.match(additionsSource, new RegExp(`export type ${typeName}\\b`));
    assert.match(indexSource, new RegExp(`\\b${typeName}\\b`));
  }
});

test('web and native platform outputs expose promoted system token categories', () => {
  const platformFields = [
    'interaction',
    'overlays',
    'iconSizes',
    'elevation',
    'typographyVariants',
    'density',
    'animationPresets',
    'colorOpacity',
    'contentRules',
  ];

  for (const field of platformFields) {
    assert.match(webSource, new RegExp(`\\b${field}:`));
    assert.match(nativeSource, new RegExp(`\\b${field}:`));
  }
});
