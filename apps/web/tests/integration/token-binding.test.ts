import { expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  animationPresetTokens,
  colorOpacityTokens,
  contentRuleTokens,
  elevationTokens,
  iconSizeTokens,
  interactionTokens,
  semanticTokens,
  typographyVariantTokens,
  webTokens,
} from '@tasky/design-tokens';
import type { components } from '@tasky/sdk';
import type { ApiClient } from '../../src/lib/apiClient';

const packageRequire = createRequire(import.meta.url);

describe('Token Binding', () => {
  it('TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables', () => {
    const stylesSource = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const sharedTokenSource = readFileSync(
      packageRequire.resolve('@tasky/design-tokens/tokens.css'),
      'utf8',
    );
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), 'tailwind.config.ts'), 'utf8');

    expect(stylesSource).toContain("@import '@tasky/design-tokens/tokens.css'");
    expect(stylesSource).toContain('--background: var(--color-background);');
    expect(stylesSource).toContain('--text-secondary: var(--color-text-secondary);');
    expect(sharedTokenSource).toContain('--color-primary:');
    expect(tailwindConfigSource).toContain('webTokens');
    expect(tailwindConfigSource).toContain("background: 'hsl(var(--color-background))'");
  });

  it('TID-TASK-115-WEB-TOKEN-PLATFORM-OUTPUTS derive web bindings from the canonical semantic graph', () => {
    expect(webTokens.colors.primary.hsl).toBe(semanticTokens.colors.primary.hsl);
    expect(webTokens.cssVariables['--color-primary']).toBe(semanticTokens.colors.primary.hsl);
    expect(webTokens.cssVariables['--font-family-sans']).toBe(
      semanticTokens.typography.families.sans.web,
    );
    expect(webTokens.spacing.lg).toBe('16px');
    expect(webTokens.typography.fontSize.body).toBe('16px');
  });

  it('TID-TASK-115-WEB-TOKEN-ADDITIONS exposes promoted system tokens to CSS and Tailwind', () => {
    const sharedTokenSource = readFileSync(
      packageRequire.resolve('@tasky/design-tokens/tokens.css'),
      'utf8',
    );
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), 'tailwind.config.ts'), 'utf8');

    expect(webTokens.interaction.pressed.opacity).toBe(interactionTokens.pressed.opacity);
    expect(webTokens.iconSizes.md).toBe(`${iconSizeTokens.md}px`);
    expect(webTokens.elevation.modal.zIndex).toBe(elevationTokens.modal.zIndex);
    expect(webTokens.typographyVariants.pageHeading.letterSpacing).toBe('0em');
    expect(webTokens.typographyVariants.pageHeading.fontSize).toBe(
      `${typographyVariantTokens.pageHeading.fontSize}px`,
    );
    expect(webTokens.animationPresets.sheetOpen.duration).toBe(
      `${animationPresetTokens.sheetOpen.duration}ms`,
    );
    expect(webTokens.colorOpacity.primary[10]).toBe(colorOpacityTokens.primary[10]);
    expect(webTokens.contentRules.mongolianCyrillic.minBodySize).toBe(
      contentRuleTokens.mongolianCyrillic.minBodySize,
    );

    expect(sharedTokenSource).toContain('--interaction-pressed-opacity: 0.85;');
    expect(sharedTokenSource).toMatch(
      /--overlay-scrim-modal:\s*rgba\(16,\s*38,\s*56,\s*0\.5(?:0)?\);/,
    );
    expect(sharedTokenSource).toContain('--icon-size-md: 24px;');
    expect(sharedTokenSource).toContain('--z-modal: 40;');
    expect(sharedTokenSource).toContain('--animation-sheet-open-duration: 400ms;');
    expect(sharedTokenSource).toMatch(
      /--color-primary-10:\s*rgba\(27,\s*58,\s*92,\s*0\.1(?:0)?\);/,
    );
    expect(sharedTokenSource).toContain('--typography-page-heading-letter-spacing: 0em;');
    expect(sharedTokenSource).not.toContain('--letter-spacing-tight: -');
    expect(tailwindConfigSource).toContain("pressed: 'var(--interaction-pressed-opacity)'");
    expect(tailwindConfigSource).toContain("disabled: 'var(--interaction-disabled-opacity)'");
    expect(tailwindConfigSource).toContain("modal: 'var(--z-modal)'");
    expect(tailwindConfigSource).toContain("fab: 'var(--shadow-fab)'");
    expect(tailwindConfigSource).toContain("'icon-sm': webTokens.iconSizes.sm");
    expect(tailwindConfigSource).toMatch(/\bbadge:\s*\[/);
  });

  it('TID-TASK-115-WEB-RUNTIME-TOKEN-COMPONENTS bind promoted tokens in runtime UI', () => {
    const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
    const buttonSource = source('src/components/ui/button.tsx');
    const badgeSource = source('src/components/ui/badge.tsx');
    const inputSource = source('src/components/ui/input.tsx');
    const selectSource = source('src/components/ui/select.tsx');
    const dialogSource = source('src/components/ui/dialog.tsx');
    const toastSource = source('src/components/ui/sonner.tsx');
    const headerSource = source('src/layout/Header.tsx');
    const desktopSidebarSource = source('src/layout/DesktopSidebar.tsx');
    const bottomNavSource = source('src/layout/BottomNavBar.tsx');

    expect(buttonSource).toContain('active:opacity-pressed');
    expect(buttonSource).toContain('active:scale-pressed');
    expect(buttonSource).toContain('disabled:opacity-disabled');
    expect(buttonSource).toContain('shadow-fab');
    expect(buttonSource).not.toContain('active:opacity-85');

    expect(badgeSource).toContain('text-badge');
    expect(badgeSource).toContain('tracking-caps');
    expect(inputSource).toContain('text-body');

    expect(selectSource).toContain('z-dropdown');
    expect(selectSource).toContain('h-icon-sm w-icon-sm');
    expect(selectSource).not.toContain('z-50');

    expect(dialogSource).toContain('z-modal');
    expect(dialogSource).toContain('bg-[var(--overlay-scrim-modal)]');
    expect(dialogSource).not.toContain('bg-black/80');
    expect(dialogSource).not.toContain('tracking-tight');

    expect(toastSource).toContain('z-toast');
    expect(headerSource).toContain('z-sticky');
    expect(desktopSidebarSource).toContain('bg-card');
    expect(bottomNavSource).toContain('z-sticky');

    [headerSource, desktopSidebarSource, bottomNavSource].forEach((layoutSource) => {
      expect(layoutSource).not.toContain('fallback:');
      expect(layoutSource).not.toContain('t(label, fallback)');
      expect(layoutSource).not.toContain('backdrop-blur');
      expect(layoutSource).not.toContain('tracking-tight');
    });
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
  });
});
