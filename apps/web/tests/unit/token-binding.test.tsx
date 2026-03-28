import { expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { components } from '@tasky/sdk';
import type { ApiClient } from '../../src/lib/apiClient';
import type { MobileApiClient } from '../../../mobile/src/lib/mobileApiClient';

describe('Token Binding', () => {
  it('TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables', () => {
    const stylesSource = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const sharedTokenSource = readFileSync(
      resolve(process.cwd(), '../../packages/design-tokens/tokens.css'),
      'utf8',
    );
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), 'tailwind.config.ts'), 'utf8');

    expect(stylesSource).toContain("@import '@tasky/design-tokens/tokens.css'");
    expect(stylesSource).toContain('--background: var(--tasky-color-background);');
    expect(sharedTokenSource).toContain('--tasky-color-primary:');
    expect(tailwindConfigSource).toContain('background: "hsl(var(--background))"');
  });

  it('TID-TASK-115-WEB-TOKEN-PACKAGE-BOUNDARY imports shared token CSS through the package boundary', () => {
    const stylesSource = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    expect(stylesSource).toContain("@import '@tasky/design-tokens/tokens.css';");
    expect(stylesSource).not.toContain('../../../packages/design-tokens/tokens.css');
  });

  it('TID-TASK-115-CLIENT-SDK-REQUEST-TYPES derives create-task payloads from generated SDK schemas', () => {
    expectTypeOf<Parameters<ApiClient['createTask']>[1]>().toEqualTypeOf<
      components['schemas']['CreateTaskRequest']
    >();
    expectTypeOf<Parameters<MobileApiClient['createTask']>[1]>().toEqualTypeOf<
      components['schemas']['CreateTaskRequest']
    >();
  });
});
