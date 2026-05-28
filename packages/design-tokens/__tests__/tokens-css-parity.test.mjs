import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const tokensCssPath = join(packageRoot, 'src/styles/tokens.css');

test('runtime CSS tokens are generated from the TypeScript token graph', () => {
  const generated = execFileSync('node', ['scripts/generate-tokens-css.mjs'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });

  assert.equal(generated, readFileSync(tokensCssPath, 'utf8'));
  assert.match(generated, /--tenger-canvas: 0 0% 98%;/);
  assert.match(generated, /--font-size-display-xl: 56px;/);
  assert.match(generated, /--letter-spacing-caps: var\(--tenger-letter-spacing-caps\);/);
  assert.doesNotMatch(generated, /^\.dark\s*\{/m);
});
