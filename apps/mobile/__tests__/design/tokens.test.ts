import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nativeTokens, semanticTokens } from '@tasky/design-tokens';

describe('Design Token Boundaries', () => {
  it('TID-TASK-115-MOBILE-TOKEN-PACKAGE-BOUNDARY consumes exported token surfaces without repo-path deep imports', () => {
    const tokenAdapterSource = readFileSync(
      resolve(process.cwd(), 'src/design/tokenAdapter.ts'),
      'utf8',
    );
    const elevationsSource = readFileSync(resolve(process.cwd(), 'src/design/elevations.ts'), 'utf8');
    const animationsSource = readFileSync(resolve(process.cwd(), 'src/design/animations.ts'), 'utf8');

    expect(tokenAdapterSource).toContain("from '@tasky/design-tokens'");
    expect(tokenAdapterSource).not.toContain('packages/design-tokens');
    expect(elevationsSource).toContain("from '@tasky/design-tokens'");
    expect(elevationsSource).not.toContain('packages/design-tokens');
    expect(animationsSource).toContain("from '@tasky/design-tokens'");
    expect(animationsSource).not.toContain('packages/design-tokens');
    expect(tokenAdapterSource).toContain('nativeTokens');
    expect(elevationsSource).toContain('nativeTokens');
    expect(animationsSource).toContain('motionTokens');
    expect(tokenAdapterSource).not.toContain('designTokens.colors.primary.hex');
  });

  it('TID-TASK-115-MOBILE-NATIVE-TOKENS are derived from the canonical semantic token graph', () => {
    expect(nativeTokens.colors.primary).toBe(semanticTokens.colors.primary.hex);
    expect(nativeTokens.colors.background).toBe(semanticTokens.colors.background.hex);
    expect(nativeTokens.spacing.lg).toBe(semanticTokens.spacing.lg);
    expect(nativeTokens.radius.md).toBe(semanticTokens.radius.md);
    expect(nativeTokens.typography.styles.body.fontSize).toBe(
      semanticTokens.typography.fontSizes.body,
    );
    expect(nativeTokens.typography.styles.body.fontFamily).toBe(
      semanticTokens.typography.families.sans.native,
    );
  });
});
