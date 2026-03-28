import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Design Token Boundaries', () => {
  it('TID-TASK-115-MOBILE-TOKEN-PACKAGE-BOUNDARY consumes exported token surfaces without repo-path deep imports', () => {
    const tokenAdapterSource = readFileSync(
      resolve(process.cwd(), 'src/design/tokenAdapter.ts'),
      'utf8',
    );
    const elevationsSource = readFileSync(resolve(process.cwd(), 'src/design/elevations.ts'), 'utf8');

    expect(tokenAdapterSource).toContain("from '@tasky/design-tokens'");
    expect(tokenAdapterSource).not.toContain('packages/design-tokens');
    expect(elevationsSource).toContain("from '@tasky/design-tokens'");
    expect(elevationsSource).not.toContain('packages/design-tokens');
    expect(tokenAdapterSource).toContain('designTokens.colors.primary.hex');
    expect(tokenAdapterSource).toContain('motionTokens');
  });
});
