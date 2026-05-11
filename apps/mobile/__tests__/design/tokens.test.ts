import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  animationPresetTokens,
  colorOpacityTokens,
  contentRuleTokens,
  densityTokens,
  elevationTokens,
  iconSizeTokens,
  interactionTokens,
  nativeTokens,
  overlayTokens,
  semanticTokens,
  typographyVariantTokens,
} from '@tasky/design-tokens';

describe('Design Token Boundaries', () => {
  it('TID-TASK-115-MOBILE-TOKEN-PACKAGE-BOUNDARY consumes exported token surfaces without repo-path deep imports', () => {
    const tokenAdapterSource = readFileSync(
      resolve(process.cwd(), 'src/design/tokenAdapter.ts'),
      'utf8',
    );
    const elevationsSource = readFileSync(
      resolve(process.cwd(), 'src/design/elevations.ts'),
      'utf8',
    );
    const animationsSource = readFileSync(
      resolve(process.cwd(), 'src/design/animations.ts'),
      'utf8',
    );

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

  it('TID-TASK-115-MOBILE-TOKEN-ADDITIONS exposes promoted system tokens to native consumers', () => {
    expect(nativeTokens.interaction.pressed.opacity).toBe(interactionTokens.pressed.opacity);
    expect(nativeTokens.overlays.scrim.modal).toBe(overlayTokens.scrim.modal);
    expect(nativeTokens.iconSizes.semantic.fab).toBe(iconSizeTokens.semantic.fab);
    expect(nativeTokens.elevation.modal.zIndex).toBe(elevationTokens.modal.zIndex);
    expect(nativeTokens.typographyVariants.pageHeading.fontFamily).toBe(
      semanticTokens.typography.families.displayBold.native,
    );
    expect(nativeTokens.typographyVariants.pageHeading.fontSize).toBe(
      typographyVariantTokens.pageHeading.fontSize,
    );
    expect(nativeTokens.typographyVariants.pageHeading.letterSpacing).toBe(0);
    expect(nativeTokens.density.compact.spacing.lg).toBe(densityTokens.compact.spacing.lg);
    expect(nativeTokens.animationPresets.sheetOpen.duration).toBe(
      animationPresetTokens.sheetOpen.duration,
    );
    expect(nativeTokens.colorOpacity.primary[10]).toBe(colorOpacityTokens.primary[10]);
    expect(nativeTokens.contentRules.mongolianCyrillic.minBodySize).toBe(
      contentRuleTokens.mongolianCyrillic.minBodySize,
    );
  });

  it('TID-TASK-115-MOBILE-DESIGN-ADAPTERS consume promoted native token categories', () => {
    const tokenAdapterSource = readFileSync(
      resolve(process.cwd(), 'src/design/tokenAdapter.ts'),
      'utf8',
    );
    const animationsSource = readFileSync(
      resolve(process.cwd(), 'src/design/animations.ts'),
      'utf8',
    );
    const elevationsSource = readFileSync(
      resolve(process.cwd(), 'src/design/elevations.ts'),
      'utf8',
    );
    const surfacesSource = readFileSync(resolve(process.cwd(), 'src/design/surfaces.ts'), 'utf8');
    const typographySource = readFileSync(
      resolve(process.cwd(), 'src/design/tailwind-screen-typography.ts'),
      'utf8',
    );

    expect(tokenAdapterSource).toContain('interactionTokens');
    expect(tokenAdapterSource).toContain('iconSizeTokens');
    expect(animationsSource).toContain('nativeTokens.animationPresets');
    expect(animationsSource).toContain('nativeTokens.interaction');
    expect(elevationsSource).toContain('nativeTokens.elevation');
    expect(elevationsSource).toContain('nativeTokens.overlays');
    expect(surfacesSource).toContain('nativeTokens.colorOpacity');
    expect(surfacesSource).toContain('nativeTokens.iconSizes');
    expect(typographySource).toContain('nativeTokens.typographyVariants');
    expect(typographySource).not.toContain("letterSpacing: '-");
  });
});
