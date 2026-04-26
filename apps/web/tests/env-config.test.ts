import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import viteConfig from '../vite.config';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(testsDir, '..');

describe('web env loading', () => {
  it('loads Vite env files from the web app directory', () => {
    expect(viteConfig.envDir).toBe(webRoot);
  });
});
