# Mobile UI Centralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate apps/mobile from bypassed StyleSheet.create to NativeWind v4 class-driven styling, enforced by lint guardrails.

**Architecture:** Foundation-first — Phase 0 wires the Tailwind config + tooling, Phase 1 migrates all primitives/templates/shells to NativeWind internals, Phase 2 migrates 85 screens in risk-tiered waves, Phase 3 promotes lint rules to errors and cleans up.

**Tech Stack:** NativeWind v4.2.3, Tailwind CSS 3.4.17, class-variance-authority, tailwind-merge, React Native 0.76.7, Expo 52, Reanimated 3.16

**Spec:** `docs/superpowers/specs/2026-04-08-mobile-ui-centralization-design.md`

---

## Phase 0 — NativeWind v4 Commitment

### Task 1: Install dependencies

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install cva and tailwind-merge**

```bash
cd apps/mobile && pnpm add class-variance-authority tailwind-merge
```

- [ ] **Step 2: Verify installation**

Run: `cd apps/mobile && node -e "require('class-variance-authority'); require('tailwind-merge'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json apps/mobile/pnpm-lock.yaml
git commit -m "chore(mobile): install cva and tailwind-merge for NativeWind migration"
```

---

### Task 2: Create cn() utility with custom tailwind-merge config

**Files:**
- Create: `apps/mobile/src/lib/cn.ts`

- [ ] **Step 1: Create the cn utility**

```ts
// apps/mobile/src/lib/cn.ts
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [
        {
          font: [
            'sans',
            'sans-medium',
            'sans-semibold',
            'sans-bold',
            'display',
            'display-bold',
          ],
        },
      ],
      gap: [{ gap: ['section', 'block', 'item', 'micro', 'action-buttons', 'header-greeting', 'header-title', 'header-bottom'] }],
      p: [{ p: ['card', 'action-bar'] }],
      px: [{ px: ['screen-x'] }],
      pt: [{ pt: ['header-top'] }],
      pb: [{ pb: ['header-bottom'] }],
    },
  },
});

export const cn = (...inputs: (string | undefined | false)[]) =>
  twMerge(inputs.filter(Boolean).join(' '));
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/mobile && npx tsc --noEmit src/lib/cn.ts 2>&1 || pnpm -r typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/cn.ts
git commit -m "feat(mobile): add cn() utility with custom tailwind-merge config"
```

---

### Task 3: Complete fontFamily mapping in tailwind.config.ts

**Files:**
- Modify: `apps/mobile/tailwind.config.ts`

- [ ] **Step 1: Update tailwind.config.ts**

Replace the existing `fontFamily` block and add the `screenLayout` semantic spacing extensions:

```ts
// apps/mobile/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { nativeTokens } from '@tasky/design-tokens';
import { screenLayout } from './src/design/screenLayout';
import { screenTypographyPlugin } from './src/design/tailwind-screen-typography';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
    './src/store/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: nativeTokens.colors,
      spacing: {
        ...nativeTokens.spacing,
        'screen-x': String(screenLayout.insetX),
        'header-top': String(screenLayout.header.topInset),
        'header-greeting': String(screenLayout.header.greetingGap),
        'header-title': String(screenLayout.header.titleGap),
        'header-bottom': String(screenLayout.header.bottomGap),
        section: String(screenLayout.body.sectionGap),
        block: String(screenLayout.body.blockGap),
        item: String(screenLayout.body.itemGap),
        micro: String(screenLayout.body.microGap),
        card: String(screenLayout.body.cardPadding),
        'action-bar': String(screenLayout.actions.barPadding),
        'action-buttons': String(screenLayout.actions.buttonGap),
        'wizard-step': String(screenLayout.wizard.stepIndicatorGap),
      },
      borderRadius: nativeTokens.radius,
      fontFamily: {
        sans: [nativeTokens.typography.families.sans],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
        display: [nativeTokens.typography.families.display],
        'display-bold': ['Manrope_700Bold'],
      },
      fontSize: nativeTokens.typography.scale,
    },
  },
  plugins: [screenTypographyPlugin],
};

export default config;
```

- [ ] **Step 2: Create the screenTypography Tailwind plugin**

```ts
// apps/mobile/src/design/tailwind-screen-typography.ts
import plugin from 'tailwindcss/plugin';
import { nativeTokens } from '@tasky/design-tokens';

const scale = nativeTokens.typography.scale;

export const screenTypographyPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.font-screen-greeting': {
      fontSize: String(scale.caption),
      fontFamily: 'PlusJakartaSans_600SemiBold',
      letterSpacing: '0.8',
      textTransform: 'uppercase',
    },
    '.font-screen-title': {
      fontSize: String(scale.heroTitle),
      fontFamily: 'Manrope_700Bold',
    },
    '.font-screen-section': {
      fontSize: String(scale.heading),
      fontFamily: 'Manrope_700Bold',
      lineHeight: String(Math.round(scale.heading * 1.25)),
    },
    '.font-screen-card-title': {
      fontSize: String(scale.body),
      fontFamily: 'PlusJakartaSans_700Bold',
      lineHeight: String(Math.round(scale.body * 1.35)),
    },
  });
});
```

- [ ] **Step 3: Verify config loads**

Run: `cd apps/mobile && npx tailwindcss --config tailwind.config.ts --content ./src/app/_layout.tsx -o /dev/null 2>&1 | head -5`
Expected: No fatal errors (warnings about unused classes are fine)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/tailwind.config.ts apps/mobile/src/design/tailwind-screen-typography.ts
git commit -m "feat(mobile): complete tailwind config with all font families, screen layout tokens, and typography plugin"
```

---

### Task 4: Create cssInterop registration file

**Files:**
- Create: `apps/mobile/src/design/nativewind-interop.ts`
- Modify: `apps/mobile/src/app/_layout.tsx`

- [ ] **Step 1: Create the interop registration file**

```ts
// apps/mobile/src/design/nativewind-interop.ts
import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

// NativeWind v4 requires cssInterop() for third-party components.
// Without this, className on Animated.View/Text/ScrollView is silently ignored.

cssInterop(Animated.View, { className: 'style' });
cssInterop(Animated.Text, { className: 'style' });
cssInterop(Animated.ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
```

- [ ] **Step 2: Import in root layout**

In `apps/mobile/src/app/_layout.tsx`, add this import after the existing imports (before `global.css`):

```ts
// Add after line 11 (import '../utils/i18n';)
import '../design/nativewind-interop';
```

- [ ] **Step 3: Verify app still boots**

Run: `cd apps/mobile && pnpm start` (press `i` for iOS simulator)
Expected: App launches without crash. Check Metro logs for no errors related to cssInterop.

- [ ] **Step 4: Verify Animated.View accepts className**

Create a temporary test in any screen — add `<Animated.View className="bg-primary p-lg" />` — confirm it renders with primary background. Remove after verification.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design/nativewind-interop.ts apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): add cssInterop registrations for Reanimated components"
```

---

### Task 5: Verify Phase 0 exit gate

**Files:** None (verification only)

- [ ] **Step 1: Typecheck**

Run: `pnpm -r typecheck`
Expected: PASS

- [ ] **Step 2: App boots on simulator**

Run: `cd apps/mobile && pnpm start` (press `i`)
Expected: App launches, navigates normally

- [ ] **Step 3: Verify custom font families resolve**

In any screen, temporarily add:
```tsx
<Text className="font-sans-bold text-heading text-primary">Test Bold</Text>
<Text className="font-display-bold text-heading text-primary">Test Display Bold</Text>
```
Expected: Both render with correct fonts. Remove after verification.

- [ ] **Step 4: Verify screen typography plugin**

In any screen, temporarily add:
```tsx
<Text className="font-screen-title text-primary-deep">Screen Title Test</Text>
<Text className="font-screen-greeting text-text-secondary">GREETING TEST</Text>
```
Expected: Title renders large with Manrope Bold, greeting renders small uppercase with Jakarta SemiBold. Remove after verification.

- [ ] **Step 5: Tag Phase 0 complete**

```bash
git tag phase-0-nativewind-commitment
```

---

## Phase 1 — Foundation Freeze

### Task 6: Migrate shells (3 files)

**Files:**
- Modify: `apps/mobile/src/components/shells/ScreenContainer.tsx`
- Modify: `apps/mobile/src/components/shells/InsetScrollView.tsx`
- Modify: `apps/mobile/src/components/shells/StickyActionBar.tsx`

- [ ] **Step 1: Migrate ScreenContainer**

```tsx
// apps/mobile/src/components/shells/ScreenContainer.tsx
import React from 'react';
import { type StyleProp, type ViewStyle, View } from 'react-native';
import {
  SafeAreaView,
  type Edge,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';
import { cn } from '../../lib/cn';

type ScreenContainerProps = {
  children: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
  className?: string;
} & Pick<SafeAreaViewProps, 'mode'>;

export function ScreenContainer({
  children,
  testID,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  mode = 'padding',
  className,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      style={style}
      className={cn('flex-1 bg-background', className)}
      edges={edges}
      mode={mode}
      testID={testID}
    >
      <View style={contentStyle} className="flex-1 bg-background">
        {children}
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Migrate InsetScrollView**

```tsx
// apps/mobile/src/components/shells/InsetScrollView.tsx
import React from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';

type InsetScrollViewProps = ScrollViewProps & {
  extraBottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
};

export function InsetScrollView({
  children,
  contentContainerStyle,
  extraBottomInset = 0,
  className,
  ...scrollProps
}: InsetScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className={className ?? 'flex-1'}
      {...scrollProps}
      contentContainerStyle={[
        { flexGrow: 1 },
        { paddingBottom: insets.bottom + extraBottomInset + mobileTheme.spacing.lg },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}
```

Note: `InsetScrollView` keeps imperative `contentContainerStyle` because `paddingBottom` is runtime-computed from `useSafeAreaInsets()`.

- [ ] **Step 3: Migrate StickyActionBar**

```tsx
// apps/mobile/src/components/shells/StickyActionBar.tsx
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenLayout } from '../../design/screenLayout';
import { cn } from '../../lib/cn';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  className?: string;
  insideTabNavigator?: boolean;
};

export function StickyActionBar({
  children,
  style,
  testID,
  className,
  insideTabNavigator = false,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const tabClearance = insideTabNavigator
    ? screenLayout.chrome.tabBarHeight + screenLayout.chrome.tabBarBottom
    : 0;

  return (
    <View
      className={cn('absolute left-0 right-0 bottom-0 px-action-bar pt-action-bar', className)}
      style={[
        { paddingBottom: insets.bottom + screenLayout.actions.barPadding + tabClearance },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
```

Note: `StickyActionBar` keeps imperative `paddingBottom` because it's runtime-computed from `useSafeAreaInsets()` + `tabClearance`.

- [ ] **Step 4: Run tests**

Run: `cd apps/mobile && pnpm test -- --testPathPattern shells 2>&1 || pnpm test`
Expected: All existing tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/shells/
git commit -m "refactor(mobile): migrate shells to NativeWind className"
```

---

### Task 7: Migrate simple primitives (non-cva) — batch 1 of 3

**Files:**
- Modify: `apps/mobile/src/components/ui/Card.tsx`
- Modify: `apps/mobile/src/components/ui/InfoRow.tsx`
- Modify: `apps/mobile/src/components/ui/StatCard.tsx`
- Modify: `apps/mobile/src/components/ui/FormField.tsx`
- Modify: `apps/mobile/src/components/ui/Input.tsx`
- Modify: `apps/mobile/src/components/ui/SkeletonLoader.tsx`
- Modify: `apps/mobile/src/components/ui/Toast.tsx`
- Modify: `apps/mobile/src/components/ui/ModalSheet.tsx`
- Modify: `apps/mobile/src/components/ui/ActionSheet.tsx`

- [ ] **Step 1: Migrate Card.tsx**

```tsx
// apps/mobile/src/components/ui/Card.tsx
import React from 'react';
import { View, Text, ViewProps, TextProps, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

type CardViewProps = ViewProps & { className?: string };
type CardTextProps = TextProps & { className?: string };

export function Card({ style, className, ...props }: CardViewProps) {
  return (
    <View
      style={[elevations.card, style]}
      className={cn('bg-card rounded-lg border border-border overflow-hidden', className)}
      {...props}
    />
  );
}

export function CardHeader({ style, className, ...props }: CardViewProps) {
  return <View style={style} className={cn('p-lg pb-sm', className)} {...props} />;
}

export function CardTitle({ style, className, ...props }: CardTextProps) {
  return (
    <Text
      style={style}
      className={cn('text-title font-sans-bold text-card-foreground tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({ style, className, ...props }: CardTextProps) {
  return (
    <Text
      style={style}
      className={cn('text-body font-sans text-muted-foreground mt-xs', className)}
      {...props}
    />
  );
}

export function CardContent({ style, className, ...props }: CardViewProps) {
  return <View style={style} className={cn('p-lg pt-sm', className)} {...props} />;
}

export function CardFooter({ style, className, ...props }: CardViewProps) {
  return <View style={style} className={cn('p-lg pt-0 flex-row items-center', className)} {...props} />;
}
```

- [ ] **Step 2: Migrate remaining simple primitives**

Follow the same pattern for each file: replace `StyleSheet.create` with `className`, keep `style` prop for imperative exceptions (shadows, animated, runtime-computed). Use `cn()` to merge `className` prop. Each file follows the Card pattern — I won't repeat the full code for each, but the transformation is mechanical:

For each component:
1. Remove `StyleSheet.create` block
2. Remove `import { StyleSheet }` (keep if needed for other uses)
3. Add `import { cn } from '../../lib/cn'`
4. Add `className?: string` to props interface
5. Replace `style={[styles.foo, style]}` with `style={imperative_only}` + `className={cn('tailwind classes', className)}`
6. Keep `style={elevations.*}` imperative

- [ ] **Step 3: Run tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/
git commit -m "refactor(mobile): migrate simple primitives batch 1 to NativeWind"
```

---

### Task 8: Migrate simple primitives — batch 2 of 3

**Files:**
- Modify: `apps/mobile/src/components/ui/VerifiedBadge.tsx`
- Modify: `apps/mobile/src/components/ui/TrustBanner.tsx`
- Modify: `apps/mobile/src/components/ui/RatingStars.tsx`
- Modify: `apps/mobile/src/components/ui/ProfileAvatar.tsx`
- Modify: `apps/mobile/src/components/ui/ReviewCard.tsx`
- Modify: `apps/mobile/src/components/ui/SplitCard.tsx`
- Modify: `apps/mobile/src/components/ui/PriceTag.tsx`
- Modify: `apps/mobile/src/components/ui/LocationPin.tsx`
- Modify: `apps/mobile/src/components/ui/PhotoGrid.tsx`

- [ ] **Step 1: Apply mechanical migration to each file**

Same pattern as Task 7: replace StyleSheet.create with className, add `cn()`, keep imperative exceptions.

- [ ] **Step 2: Run tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/ui/
git commit -m "refactor(mobile): migrate simple primitives batch 2 to NativeWind"
```

---

### Task 9: Migrate simple primitives — batch 3 of 3

**Files:**
- Modify: `apps/mobile/src/components/ui/StepIndicator.tsx`
- Modify: `apps/mobile/src/components/ui/TimelineStepper.tsx`
- Modify: `apps/mobile/src/components/ui/ConfirmSheet.tsx`
- Modify: `apps/mobile/src/components/ui/HandDrawnCheck.tsx`
- Modify: `apps/mobile/src/components/ui/PermissionPrimer.tsx`
- Modify: `apps/mobile/src/components/ui/LanguageSwitcher.tsx`
- Modify: `apps/mobile/src/components/ui/LoginRequiredCTA.tsx`
- Modify: `apps/mobile/src/components/ui/OfflineBanner.tsx`
- Modify: `apps/mobile/src/components/ui/FAB.tsx`

- [ ] **Step 1: Apply mechanical migration to each file**

Same pattern. `HandDrawnCheck` may use Reanimated — animated styles stay `style={}`, static styles move to `className`.

- [ ] **Step 2: Run tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/ui/
git commit -m "refactor(mobile): migrate simple primitives batch 3 to NativeWind"
```

---

### Task 10: Migrate cva primitives — Button

**Files:**
- Modify: `apps/mobile/src/components/ui/Button.tsx`

- [ ] **Step 1: Rewrite Button with cva**

```tsx
// apps/mobile/src/components/ui/Button.tsx
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

const buttonVariants = cva('flex-row items-center justify-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      outline: 'bg-transparent border border-input',
      ghost: 'bg-transparent',
      destructive: 'bg-danger',
    },
    size: {
      default: 'px-lg py-sm min-h-[48px]',
      sm: 'px-md min-h-[36px]',
      lg: 'px-xl min-h-[52px]',
      icon: 'w-[36px] h-[36px] p-0',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const textVariants = cva('text-center font-sans-bold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-danger-foreground',
    },
    size: {
      default: 'text-label',
      sm: 'text-caption',
      lg: 'text-body',
      icon: 'hidden',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  labelClassName?: string;
  children?: React.ReactNode;
}

function getTextColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'secondary':
      return colors.secondaryForeground;
    case 'outline':
    case 'ghost':
      return colors.foreground;
    case 'destructive':
      return colors.dangerForeground;
    case 'default':
    default:
      return colors.primaryForeground;
  }
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      label,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      style,
      className,
      labelClassName,
      children,
      ...props
    },
    ref,
  ) => {
    const isInteractive = !disabled && !isLoading;
    const textColor = getTextColor(variant);

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      props.onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      props.onPressOut?.(e);
    };

    return (
      <Pressable
        ref={ref}
        style={[variant === 'default' && elevations.card, style]}
        className={cn(
          buttonVariants({ variant, size }),
          !isInteractive && 'opacity-50',
          className,
        )}
        disabled={!isInteractive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <Animated.View style={animatedStyle} className="flex-row items-center justify-center">
          {isLoading ? (
            <ActivityIndicator color={textColor} />
          ) : children ? (
            children
          ) : (
            <Text className={cn(textVariants({ variant, size }), labelClassName)}>
              {label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';
```

- [ ] **Step 2: Run tests**

Run: `cd apps/mobile && pnpm test -- --testPathPattern Button`
Expected: Tests pass. If `StyleSheet.flatten` assertions fail, update them per the test migration strategy (assert behavior/testID instead of style objects).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/ui/Button.tsx
git commit -m "refactor(mobile): migrate Button to cva + NativeWind"
```

---

### Task 11: Migrate remaining cva primitives

**Files:**
- Modify: `apps/mobile/src/components/ui/StatusBadge.tsx`
- Modify: `apps/mobile/src/components/ui/CategoryChip.tsx`
- Modify: `apps/mobile/src/components/ui/PressableCard.tsx`
- Modify: `apps/mobile/src/components/ui/FilterBar.tsx`

- [ ] **Step 1: Migrate StatusBadge with cva**

```tsx
// apps/mobile/src/components/ui/StatusBadge.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

type StatusType = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

const badgeVariants = cva('self-start px-md py-xs rounded-full', {
  variants: {
    status: {
      open: 'bg-status-open',
      assigned: 'bg-status-assigned',
      completed: 'bg-verified',
      cancelled: 'bg-muted',
      no_show: 'bg-danger',
    },
  },
});

const textVariants = cva('text-micro font-sans-bold uppercase tracking-widest', {
  variants: {
    status: {
      open: 'text-status-open-foreground',
      assigned: 'text-status-assigned-foreground',
      completed: 'text-verified-foreground',
      cancelled: 'text-muted-foreground',
      no_show: 'text-danger-foreground',
    },
  },
});

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <View className={cn(badgeVariants({ status }), className)}>
      <Text className={textVariants({ status })}>{t(`status.${status}`)}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Migrate CategoryChip, PressableCard, FilterBar**

Same cva pattern for each. Each component's variants map from the existing style conditionals. Keep `style={elevations.*}` imperative where used.

- [ ] **Step 3: Run tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/StatusBadge.tsx apps/mobile/src/components/ui/CategoryChip.tsx apps/mobile/src/components/ui/PressableCard.tsx apps/mobile/src/components/ui/FilterBar.tsx
git commit -m "refactor(mobile): migrate cva primitives (StatusBadge, CategoryChip, PressableCard, FilterBar)"
```

---

### Task 12: Create Touchable primitive

**Files:**
- Create: `apps/mobile/src/components/ui/Touchable.tsx`
- Modify: `apps/mobile/src/components/ui/index.ts`

- [ ] **Step 1: Create Touchable wrapper**

```tsx
// apps/mobile/src/components/ui/Touchable.tsx
import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';

export interface TouchableProps extends PressableProps {
  className?: string;
}

/**
 * Thin Pressable wrapper for non-button tap targets (list items, card areas, swipe zones).
 * Screens should use <Touchable> instead of raw <Pressable> — enforced by lint rule
 * `no-raw-pressable-in-screens`.
 */
export function Touchable({ className, style, children, testID, ...props }: TouchableProps) {
  if (__DEV__ && !testID) {
    console.warn('Touchable: testID is required for all interactive elements');
  }
  return (
    <Pressable className={cn(className)} style={style} testID={testID} {...props}>
      {children}
    </Pressable>
  );
}
```

- [ ] **Step 2: Add to index**

Add to `apps/mobile/src/components/ui/index.ts`:

```ts
export * from './Touchable';
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/ui/Touchable.tsx apps/mobile/src/components/ui/index.ts
git commit -m "feat(mobile): add Touchable primitive for non-button tap targets"
```

---

### Task 13: Migrate templates

**Files:**
- Modify: `apps/mobile/src/components/templates/DetailTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/AuthTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/EmptyStateTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/ErrorStateTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/ModalSheetTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/SettingsTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/SuccessCelebrationTemplate.tsx`

- [ ] **Step 1: Migrate DetailTemplate**

Replace `StyleSheet.create` block with `className`. Key points:
- Skeleton views keep `style={{ height: N, width: '70%' }}` for dynamic sizing
- `Pressable` in `rightActionsRow` is internal to a template, not a screen — can stay as `Pressable` (lint rule only applies to `src/app/**`)
- `BlurView` may need `cssInterop` — check if it accepts `className`; if not, keep `style={}`
- `screenLayout` runtime values stay imperative where computed

```tsx
// Example of the key migration pattern for DetailTemplate:
// Before: <View style={[styles.scrollContent, ...]}> 
// After:  <View className="pt-header-top px-screen-x">

// Before: <View style={styles.rightActionsRow}>
// After:  <View className="absolute right-screen-x flex-row gap-micro z-10" style={{ top: screenLayout.header.topInset }}>
```

Apply the full mechanical transformation to each template file.

- [ ] **Step 2: Run tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/templates/
git commit -m "refactor(mobile): migrate all 9 templates to NativeWind"
```

---

### Task 14: Migrate RTL test style assertions

**Files:**
- Modify: `apps/mobile/__tests__/App.test.tsx`
- Modify: `apps/mobile/__tests__/screens/auth/RoleSelectScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/auth/OnboardingScreen.test.tsx`
- Modify: `apps/mobile/__tests__/components/ui/Input.test.tsx`

- [ ] **Step 1: Update RoleSelectScreen test**

Replace `StyleSheet.flatten` assertions with behavior-based assertions:

```tsx
// Before:
const selectedCard = StyleSheet.flatten(screen.getByTestId('role-card-customer').props.style);
expect(selectedCard.backgroundColor).toBe('#ffffff');

// After:
// Assert selection state via the check indicator that only appears when selected
expect(screen.getByTestId('role-card-customer-check')).toBeTruthy();
expect(screen.queryByTestId('role-card-tasker-check')).toBeNull();
```

- [ ] **Step 2: Update OnboardingScreen test**

Replace pagination dot style assertions with behavior-based:

```tsx
// Before:
const activeDash = StyleSheet.flatten(screen.getByTestId('pagination-dot-0').props.style);
expect(activeDash.backgroundColor).toBe(/*...*/);

// After: Assert the active dot has a testID or accessibility state indicating active
expect(screen.getByTestId('pagination-dot-0-active')).toBeTruthy();
```

If testIDs don't distinguish active/inactive, add `testID={`pagination-dot-${i}${i === currentPage ? '-active' : ''}`}` to the component.

- [ ] **Step 3: Update App.test.tsx and Input.test.tsx**

Same approach: replace `StyleSheet.flatten` assertions with `toHaveAccessibilityState`, `testID` presence, or `toHaveTextContent` assertions.

- [ ] **Step 4: Run all tests**

Run: `cd apps/mobile && pnpm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/__tests__/
git commit -m "test(mobile): migrate RTL style assertions for NativeWind compatibility"
```

---

### Task 15: Update component-contract.yaml and verify Phase 1 exit gate

**Files:**
- Modify: `docs/design/component-contract.yaml`

- [ ] **Step 1: Update component-contract.yaml**

Update the contract to reflect NativeWind APIs: note that components accept `className`, use `cva` for variants, and shadows are applied via `style={elevations.*}`.

- [ ] **Step 2: Verify Phase 1 exit gate**

Run:
```bash
# Zero StyleSheet.create in components (except animated partials)
grep -r "StyleSheet.create" apps/mobile/src/components/ | grep -v "// animated-partial"
# Should return empty

# All tests pass
cd apps/mobile && pnpm test

# Typecheck passes
pnpm -r typecheck

# App boots
cd apps/mobile && pnpm start
```

- [ ] **Step 3: Commit and tag**

```bash
git add docs/design/component-contract.yaml
git commit -m "docs: update component-contract.yaml for NativeWind APIs"
git tag phase-1-foundation-freeze
```

---

## Phase 2 — Screen Migration

### Task 16: Install lint guardrails (warning mode)

**Files:**
- Modify: `apps/mobile/.eslintrc.cjs`

- [ ] **Step 1: Update eslint config**

```js
// apps/mobile/.eslintrc.cjs
module.exports = {
    root: true,
    extends: ["expo"],
    ignorePatterns: [".expo", "dist", "coverage"],
    rules: {
        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_"
        }]
    },
    overrides: [
        {
            // Screen-level rules (Phase 2: warnings, Phase 3: errors)
            files: ["src/app/**/*.{ts,tsx}"],
            rules: {
                "no-restricted-imports": ["warn", {
                    paths: [
                        {
                            name: "react-native",
                            importNames: ["SafeAreaView", "TextInput", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "Pressable"],
                            message: "Use shared primitives (ScreenContainer, Input, Button, Touchable, PressableCard) instead of raw RN components."
                        }
                    ]
                }],
                "no-restricted-syntax": ["warn",
                    {
                        selector: "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
                        message: "Screens must use NativeWind className instead of StyleSheet.create. See docs/superpowers/specs/2026-04-08-mobile-ui-centralization-design.md"
                    }
                ]
            }
        },
        {
            // Escape hatches for known false positives
            files: ["src/app/(tabs)/_layout.tsx"],
            rules: {
                "no-restricted-imports": "off"
            }
        },
        {
            files: ["src/app/(auth)/otp.tsx"],
            rules: {
                "no-restricted-imports": "off"
            }
        },
        {
            files: ["__tests__/**/*.{ts,tsx}"],
            rules: {
                "@typescript-eslint/no-require-imports": "off"
            }
        }
    ]
};
```

- [ ] **Step 2: Verify lint runs (warnings expected)**

Run: `cd apps/mobile && pnpm lint 2>&1 | tail -20`
Expected: Many warnings from unmigrated screens, zero errors from new rules (they're warnings)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/.eslintrc.cjs
git commit -m "chore(mobile): install NativeWind lint guardrails in warning mode"
```

---

### Task 17: Capture Maestro screenshot baselines

**Files:**
- Create: `apps/mobile/maestro/baselines/DEVICE.md`

- [ ] **Step 1: Record baseline device**

```bash
mkdir -p apps/mobile/maestro/baselines
cat > apps/mobile/maestro/baselines/DEVICE.md << 'EOF'
# Maestro Screenshot Baselines

**Device:** iPhone 15 Pro
**OS:** iOS 17.4
**Simulator:** Xcode 16

All baselines captured on this device/OS combination.
Regenerate baselines when changing device or OS version.
EOF
```

- [ ] **Step 2: Capture baselines for Wave 1 screens**

Run Maestro flows that touch Wave 1 screens and capture screenshots. This is done locally before each migration batch.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/maestro/baselines/
git commit -m "chore(mobile): add Maestro screenshot baseline device record"
```

---

### Task 18–24: Wave 1 screen migration batches (1a through 1g)

Each batch follows the per-batch contract from the spec. The autonomous agent for each batch receives:

1. `apps/mobile/tailwind.config.ts`
2. `docs/design/component-contract.yaml`
3. `apps/mobile/src/components/ui/index.ts` + `apps/mobile/src/components/templates/index.ts`
4. `apps/mobile/src/design/screenLayout.ts`
5. `apps/mobile/src/design/elevations.ts`
6. `apps/mobile/src/lib/cn.ts`
7. `apps/mobile/src/components/ui/Touchable.tsx`
8. The specific screen files for this batch
9. Figma node spec from `figma:get_design_context` per screen

**Task 18:** Batch 1a — `wallet/payout` (81L), `verification/consent` (174L), `tasks/new/success` (196L)
**Task 19:** Batch 1b — `auth/index` (230L), `role-select` (235L), `tabs/index` (262L), `onboarding` (272L)
**Task 20:** Batch 1c — `otp` (322L), `tasks/new/category` (342L), `legal/terms` (391L)
**Task 21:** Batch 1d — `bookings/confirmed` (402L), `tasks/[taskId]/applicants` (492L)
**Task 22:** Batch 1e — `help` (547L)
**Task 23:** Batch 1f — `bookings/[bookingId]/reschedule` (651L)
**Task 24:** Batch 1g — `disputes/[disputeId]/index` (759L)

For each batch:

- [ ] **Step 1: Fetch Figma context**

Call `figma:get_design_context` for each screen's node in file `IljfnTQPkq7vpkmK1NN1NC`.

- [ ] **Step 2: Run Maestro to capture before-screenshots**

```bash
cd apps/mobile && maestro test maestro/flows/<relevant-flow>.yaml --screenshots baselines/<screen-id>/before.png
```

- [ ] **Step 3: Apply migration**

For each screen file:
- Remove `StyleSheet.create` block
- Replace with `className` using semantic tokens
- Replace inline primitives with `<Button>`, `<Card>`, `<StatusBadge>`, `<EmptyStateTemplate>`, etc.
- Keep imperative exceptions (shadows, dynamic opacity, animated, runtime-computed)
- Reconcile to Figma where current code deviates — log each change
- For >300L screens: produce behavior-preservation checklist (all hooks, navigation calls, conditionals)

- [ ] **Step 4: Run tests + lint + typecheck**

```bash
cd apps/mobile && pnpm test && pnpm lint && pnpm -r typecheck
```

- [ ] **Step 5: Run Maestro to capture after-screenshots**

Compare with before-screenshots. Log any differences in PR.

- [ ] **Step 6: Update parity audit**

Mark the migrated routes as "validated" in `docs/design/parity-post-restructure-2026-04-04.md`.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/<batch-files> docs/design/parity-post-restructure-2026-04-04.md
git commit -m "refactor(mobile): migrate Wave 1 batch N screens to NativeWind"
```

---

### Tasks 25–39: Wave 2 screen migration (57 routes in ~12 batches of 5)

Same per-batch contract as Wave 1, minus Figma reconciliation (code-is-floor). Group by route family:

**Task 25:** `(auth)/*` remaining (~3 files)
**Task 26:** `(customer)/bookings/*` remaining (~5 files)
**Task 27:** `(customer)/bookings/*` remaining batch 2 (~5 files)
**Task 28:** `(customer)/tasks/*` remaining (~5 files)
**Task 29:** `(customer)/business/*` (~10 files)
**Task 30:** `(customer)/business/*` batch 2 (~5 files)
**Task 31:** `(tasker)/*` remaining (~5 files)
**Task 32:** `(tasker)/*` remaining batch 2 (~5 files)
**Task 33:** `(tasker)/*` remaining batch 3 (~5 files)
**Task 34:** `(shared)/*` remaining (~5 files)
**Task 35:** `(tabs)/*` remaining (~3 files)
**Task 36:** Layout files + root (~5 files)

For each: same steps as Wave 1 (minus Figma fetch). Each batch produces a PR with changelog.

---

### Tasks 37–43: Wave 3 screen migration (13 mega-screens in 7 batches)

Same per-batch contract, code-is-floor, batches of 1–2. Behavior-preservation checklist mandatory.

**Task 37:** `tasks/new/location` (327L), `tasks/new/intake` (401L)
**Task 38:** `profile/polish` (394L), `notifications` (404L)
**Task 39:** `bookings/[bookingId]/timeline` (409L), `bookings/[bookingId]/index` (427L)
**Task 40:** `tasks/new/schedule` (442L), `inbox/[id]` (473L)
**Task 41:** `tasks/[taskId]/index` (502L)
**Task 42:** `bookings/index` (586L), `tasks/index` (594L)
**Task 43:** `tasks/new/review` (603L)

---

### Task 44: Verify auto-pass files

**Files:** 16 trivial files (<20L)

- [ ] **Step 1: Verify all auto-pass files are lint-clean**

```bash
cd apps/mobile && npx eslint src/app/create.tsx src/app/profile/\[id\].tsx src/app/task/_layout.tsx src/app/task/\[id\]/applicants.tsx src/app/\(auth\)/_layout.tsx src/app/\(tabs\)/bookings.tsx 2>&1
```

Expected: No StyleSheet.create warnings (these files have no styles)

- [ ] **Step 2: Commit if any needed adjustment**

---

## Phase 3 — Lint Ratchet & Cleanup

### Task 45: Promote lint rules to errors

**Files:**
- Modify: `apps/mobile/.eslintrc.cjs`

- [ ] **Step 1: Change all Phase 2 warnings to errors**

In `.eslintrc.cjs`, change `"warn"` to `"error"` for `no-restricted-imports` and `no-restricted-syntax` in the `src/app/**` override.

- [ ] **Step 2: Verify lint passes**

Run: `cd apps/mobile && pnpm lint`
Expected: Zero errors, zero warnings from the migration rules

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/.eslintrc.cjs
git commit -m "chore(mobile): promote NativeWind lint rules from warning to error"
```

---

### Task 46: Final cleanup

**Files:**
- Possibly modify: `apps/mobile/src/design/screenLayout.ts` (remove screenRhythm references if any)
- Multiple files: remove orphaned `StyleSheet` imports

- [ ] **Step 1: Find and remove orphaned StyleSheet imports in screens**

```bash
cd apps/mobile && grep -rn "import.*StyleSheet.*from.*react-native" src/app/ | head -20
```

Remove any remaining `StyleSheet` imports in `src/app/` that are no longer used.

- [ ] **Step 2: Verify zero StyleSheet.create in screens**

```bash
grep -r "StyleSheet.create" apps/mobile/src/app/
```

Expected: Zero results

- [ ] **Step 3: Final verification**

```bash
cd apps/mobile && pnpm lint && pnpm test && pnpm -r typecheck
```

Expected: All pass

- [ ] **Step 4: Archive parity audit**

Mark `docs/design/parity-post-restructure-2026-04-04.md` as complete.

- [ ] **Step 5: Regenerate Maestro baselines**

Run all Maestro flows and capture final canonical screenshot set.

- [ ] **Step 6: Commit and tag**

```bash
git add -A
git commit -m "chore(mobile): complete UI centralization — promote lint, clean orphans, archive parity audit"
git tag phase-3-ui-centralization-complete
```

---

## Summary

| Phase | Tasks | Commits |
|---|---|---|
| Phase 0 | Tasks 1–5 | 5 commits |
| Phase 1 | Tasks 6–15 | 10 commits |
| Phase 2 | Tasks 16–44 | ~30 commits |
| Phase 3 | Tasks 45–46 | 2 commits |
| **Total** | **46 tasks** | **~47 commits** |

---

## Appendix A — Additional Primitive Rewrites

The main plan shows Card.tsx and Button.tsx as representative examples. This appendix provides full rewrites for three additional primitives that cover the remaining edge cases: TextInput binding (Input), error state variants (FormField), and heavily-animated components (FAB).

### Input.tsx — full rewrite

Edge case: `TextInput` needs `cssInterop` OR keeps `style={}` because `placeholderTextColor` is a prop, not a style. NativeWind v4 does NOT support `placeholderTextColor` via className. Keep imperative for placeholder color.

```tsx
// apps/mobile/src/components/ui/Input.tsx
import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

type Props = TextInputProps & {
  invalid?: boolean;
  readOnly?: boolean;
  className?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { invalid = false, editable = true, readOnly = false, style, className, ...props },
  ref,
) {
  const isEditable = editable && !readOnly;

  return (
    <TextInput
      ref={ref}
      editable={isEditable}
      placeholderTextColor={mobileTheme.colors.mutedForeground}
      style={style}
      className={cn(
        'min-h-[44px] rounded-md border border-input bg-card text-foreground px-md py-sm text-body font-sans',
        invalid && 'border-danger',
        !isEditable && 'opacity-60',
        className,
      )}
      {...props}
    />
  );
});
```

**Key decisions:**
- `placeholderTextColor` stays as prop (no Tailwind equivalent)
- `style` prop kept for consumer overrides (runtime-computed only)
- `min-h-[44px]` is an arbitrary value — acceptable in primitives (lint rule only bans these in `src/app/**`)
- `opacity-60` replaces `opacity: 0.6`

### FormField.tsx — full rewrite

```tsx
// apps/mobile/src/components/ui/FormField.tsx
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

type Props = {
  label: string;
  helperText?: string;
  errorText?: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function FormField({ label, helperText, errorText, children, className, style }: Props) {
  const hasError = Boolean(errorText);

  return (
    <View style={style} className={cn('gap-sm', className)}>
      <Text className="text-body font-sans-semibold text-foreground">{label}</Text>
      {children}
      {hasError ? (
        <Text accessibilityLiveRegion="polite" className="text-caption font-sans-medium text-danger">
          {errorText}
        </Text>
      ) : null}
      {!hasError && helperText ? (
        <Text className="text-caption font-sans-medium text-muted-foreground">{helperText}</Text>
      ) : null}
    </View>
  );
}
```

### FAB.tsx — full rewrite (heavily animated)

Edge case: FAB is almost entirely animated — position, scale, drag gestures. Most styles MUST stay imperative. Only the static visual properties (background, border-radius, z-index) move to className.

```tsx
// apps/mobile/src/components/ui/FAB.tsx
import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { screenLayout } from '../../design/screenLayout';

const { colors } = mobileTheme;
const { fabSize, fabInsetRight, fabBottom, tabBarHeight, tabBarBottom } = screenLayout.chrome;
const DRAG_THRESHOLD = 8;
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

type FABProps = {
  testID?: string;
  authGuard?: boolean;
};

export function FAB({ testID = 'global-fab', authGuard = true }: FABProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const defaultX = screenWidth - fabSize - fabInsetRight;
  const defaultY = screenHeight - insets.bottom - fabBottom - fabSize;

  const minX = fabInsetRight;
  const maxX = screenWidth - fabSize - fabInsetRight;
  const minY = insets.top + mobileTheme.spacing.md;
  const maxY = screenHeight - insets.bottom - tabBarHeight - tabBarBottom - fabSize;

  const translateX = useSharedValue(defaultX);
  const translateY = useSharedValue(defaultY);
  const startX = useSharedValue(defaultX);
  const startY = useSharedValue(defaultY);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const navigateToNewTask = () => {
    if (authGuard && !session) {
      router.push('/(auth)');
    } else {
      router.push('/(customer)/tasks/new');
    }
  };

  const tap = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) runOnJS(navigateToNewTask)();
  });

  const pan = Gesture.Pan()
    .minDistance(DRAG_THRESHOLD)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = false;
      scale.value = withSpring(0.95, SPRING_CONFIG);
    })
    .onUpdate((event) => {
      isDragging.value = true;
      translateX.value = Math.max(minX, Math.min(maxX, startX.value + event.translationX));
      translateY.value = Math.max(minY, Math.min(maxY, startY.value + event.translationY));
    })
    .onEnd(() => {
      const midX = screenWidth / 2;
      const snapX = translateX.value + fabSize / 2 < midX ? minX : maxX;
      translateX.value = withSpring(snapX, SPRING_CONFIG);
      scale.value = withSpring(1, SPRING_CONFIG);
      isDragging.value = false;
    });

  const composed = Gesture.Race(pan, tap);

  // animated-partial: entire position + scale is animated, stays on style={}
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: fabSize,
            height: fabSize,
          },
          elevations.elevated,
          animatedStyle,
        ]}
        className="rounded-full bg-primary items-center justify-center z-[999]"
        testID={testID}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </Animated.View>
    </GestureDetector>
  );
}
```

**Key decisions:**
- `position: absolute`, `left: 0`, `top: 0`, `width`, `height` stay imperative — they're the base for animated transforms
- `elevations.elevated` stays imperative (shadow exception)
- `animatedStyle` stays imperative (animated exception)
- Only `rounded-full`, `bg-primary`, `items-center`, `justify-center`, `z-[999]` move to className
- This is the pattern for ALL heavily-animated components: static visuals → className, dynamic geometry → style

---

## Appendix B — Template Rewrites

### EmptyStateTemplate.tsx — full rewrite

```tsx
// apps/mobile/src/components/templates/EmptyStateTemplate.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

export interface EmptyStateTemplateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  icon?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function EmptyStateTemplate({
  title,
  description,
  ctaLabel,
  ctaOnPress,
  icon,
  testID,
  className,
}: EmptyStateTemplateProps) {
  return (
    <View className={cn('flex-1 justify-center items-center px-lg', className)} testID={testID}>
      {icon && (
        <View className="w-[80px] h-[80px] rounded-full bg-muted justify-center items-center mb-xl">
          {icon}
        </View>
      )}
      <Text className="text-title font-sans-bold text-primary text-center">{title}</Text>
      {description && (
        <Text className="text-body font-sans text-text-secondary text-center mt-sm leading-[25.6px]">
          {description}
        </Text>
      )}
      {ctaLabel && ctaOnPress && (
        <Button
          label={ctaLabel}
          onPress={ctaOnPress}
          className="mt-xl self-stretch"
          testID={testID ? `${testID}-cta` : undefined}
        />
      )}
    </View>
  );
}
```

**Note:** `leading-[25.6px]` comes from `typography.body * 1.6 = 16 * 1.6 = 25.6`. This could also be expressed as a custom Tailwind `lineHeight` token if the computed lineHeight pattern recurs in more than 3 places.

### DetailTemplate.tsx — full rewrite

```tsx
// apps/mobile/src/components/templates/DetailTemplate.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';
import { ErrorStateTemplate } from './ErrorStateTemplate';
import { useTranslation } from 'react-i18next';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { screenLayout } from '../../design/screenLayout';

export interface DetailTemplateProps {
  children: React.ReactNode;
  /** @deprecated Title is now set via Stack.Screen options in the layout. */
  headerTitle?: string;
  /** @deprecated Back navigation is now handled by the native Stack header. */
  onBack?: () => void;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
  /** @deprecated Use rightActions instead. */
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  rightActions?: Array<{ icon: React.ReactNode; onPress: () => void; testID?: string }>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  testID?: string;
  hideHeader?: boolean;
  insideTabNavigator?: boolean;
  className?: string;
}

function DetailSkeleton() {
  return (
    <View className="flex-1 px-screen-x pt-header-top gap-block">
      <View style={{ height: 200 }} className="bg-muted rounded-md" />
      <View style={{ height: 40, width: '70%' }} className="bg-muted rounded-md" />
      <View style={{ height: 24, width: '45%' }} className="bg-muted rounded-md" />
      <View style={{ height: 40, width: '70%' }} className="bg-muted rounded-md" />
    </View>
  );
}

export function DetailTemplate({
  children,
  headerTitle: _headerTitle,
  onBack: _onBack,
  ctaLabel,
  ctaOnPress,
  ctaLoading = false,
  ctaDisabled = false,
  secondaryCtaLabel,
  secondaryCtaOnPress,
  rightAction,
  rightActions,
  isLoading = false,
  isError = false,
  onRetry,
  errorMessage,
  testID,
  hideHeader = false,
  insideTabNavigator = false,
}: DetailTemplateProps) {
  const { t } = useTranslation();
  const hasBottomBar = !!(ctaLabel && ctaOnPress);
  const effectiveActions = rightActions ?? (rightAction ? [rightAction] : null);

  return (
    <ScreenContainer
      style={hideHeader ? { paddingTop: 0 } : undefined}
      testID={testID}
      edges={hideHeader ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      {/* Right action icons — absolute overlay */}
      {effectiveActions && !isLoading && !isError && (
        <View
          className="absolute right-screen-x flex-row gap-micro z-10"
          style={{ top: screenLayout.header.topInset }}
          pointerEvents="box-none"
        >
          {effectiveActions.map((action, i) => (
            <Pressable
              key={i}
              onPress={action.onPress}
              className="w-[44px] h-[44px] items-center justify-center"
              testID={(action as { testID?: string }).testID}
              hitSlop={8}
            >
              {action.icon}
            </Pressable>
          ))}
        </View>
      )}

      {/* Body */}
      {isError ? (
        <ErrorStateTemplate
          message={errorMessage ?? t('detail.errorMessage', 'Could not load details')}
          onRetry={onRetry}
          testID={testID ? `${testID}-error` : undefined}
        />
      ) : isLoading ? (
        <DetailSkeleton />
      ) : (
        <InsetScrollView
          className="flex-1"
          contentContainerStyle={[
            {
              paddingTop: screenLayout.header.topInset,
              paddingHorizontal: screenLayout.insetX,
            },
            hasBottomBar && { paddingBottom: screenLayout.body.sectionGap },
          ]}
          extraBottomInset={hasBottomBar ? screenLayout.chrome.tabBarHeight : 0}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </InsetScrollView>
      )}

      {/* Sticky Bottom CTA */}
      {hasBottomBar && !isLoading && !isError && (
        <StickyActionBar
          testID={testID ? `${testID}-bottom-bar` : undefined}
          insideTabNavigator={insideTabNavigator}
        >
          <BlurView
            intensity={40}
            tint="light"
            style={{
              padding: screenLayout.actions.barPadding,
              borderRadius: mobileTheme.radius.lg,
              overflow: 'hidden',
            }}
          >
            {secondaryCtaLabel && secondaryCtaOnPress && (
              <Button
                label={secondaryCtaLabel}
                variant="outline"
                onPress={secondaryCtaOnPress}
                className="self-stretch mb-action-buttons"
                testID={testID ? `${testID}-secondary-cta` : undefined}
              />
            )}
            <Button
              label={ctaLabel}
              onPress={ctaOnPress}
              isLoading={ctaLoading}
              disabled={ctaDisabled}
              className="self-stretch"
              testID={testID ? `${testID}-cta` : undefined}
            />
          </BlurView>
        </StickyActionBar>
      )}
    </ScreenContainer>
  );
}
```

**Key decisions:**
- `BlurView` keeps `style={}` — it's a third-party component without `cssInterop` registered (could add it in Phase 0 but low value since it's only used in 2 templates)
- `InsetScrollView.contentContainerStyle` stays imperative — runtime-computed conditional
- `rightActionsRow` uses `className` for layout + `style={{ top: ... }}` for the runtime value from `screenLayout`
- Skeleton block heights stay as `style={{ height: N }}` — these are fixed visual sizes, not tokens
- `Pressable` is acceptable inside templates (lint rule only applies to `src/app/**`)

### FeedListTemplate.tsx — migration notes (not full rewrite)

FeedListTemplate is the most complex template (180+ lines) with Reanimated skeleton animations, FlatList with runtime `contentContainerStyle`, and multiple conditional branches. Key migration decisions:

1. **SkeletonCard** — animated opacity stays `style={[animatedStyle]}`, static card shape moves to `className="bg-muted rounded-md p-card gap-sm"`
2. **FlatList contentContainerStyle** — stays imperative: `{ paddingHorizontal, paddingTop, paddingBottom }` because `paddingBottom` comes from `screenLayout.chrome.contentBottomClearance` (runtime getter)
3. **Container** — `className="flex-1 bg-background"` replaces `styles.container`
4. **ItemSeparator** — `className="h-item"` replaces `styles.separator` (custom spacing token)
5. **RefreshControl** — `tintColor` and `colors` are props, not styles — stay imperative

The remaining 6 templates (AuthTemplate, FormWizardTemplate, ModalSheetTemplate, SettingsTemplate, SuccessCelebrationTemplate, ErrorStateTemplate) follow the same patterns. The agent executing Task 13 should read each file and apply based on these established patterns.

---

## Appendix C — Assessment Context & Design Decisions

This section preserves the full assessment context from the brainstorming session so it is available across sessions.

### Initial assessment (before spec)

The codebase was evaluated using repomix on `apps/mobile/` (254 files, ~75k tokens). Key findings:

- **Design tokens already exist:** `packages/design-tokens/` with colors, layout, motion, semantic, primitives. Mobile has `tokenAdapter.ts`.
- **Layout system already exists:** `screenLayout.ts` with header/body/actions/chrome/wizard rhythm tokens.
- **33 primitives exist** in `components/ui/`, **9 templates** in `components/templates/`, **3 shells** in `components/shells/`.
- **Component contract exists:** `docs/design/component-contract.yaml`.
- **Parity audit started:** `docs/design/parity-post-restructure-2026-04-04.md` — 15 routes still `pending`.
- **81% of `.tsx` files (144/177) define `StyleSheet.create` inline**, including 73 screen files in `src/app/`.
- **NativeWind v4.2.3 was half-installed** — config files present, zero screen adoption, zero `className` usage in screens.
- **A `screenRhythm → screenLayout` migration was in-flight** per recent git commits.

The failure mode: **"LLMs bypassed the design system because `StyleSheet.create` is easier to generate than learning the primitive API."**

### User's proposed methodology evaluation

The user shared a React Native UI refactoring methodology for LLM-driven work. Assessment:
- **~60% of the methodology was already done** (tokens, primitives, templates, shells, component contract)
- The actual problem was **adoption**, not **extraction**
- The methodology was reframed from "extract a design system" to "enforce adoption of the design system that already exists"
- NativeWind v4 was chosen over staying on StyleSheet because **LLMs produce Tailwind more reliably than StyleSheet patterns**, and the co-location benefit eliminates the failure mode

### NativeWind decision rationale

Initially recommended ripping NativeWind out (Option B). Changed recommendation to committing to NativeWind v4 (Option A) because:
1. The existing investment (tokens, primitives, templates, screenLayout) is **not NativeWind-incompatible** — only primitive internals change
2. LLMs are dramatically better at producing Tailwind class strings than coordinating StyleSheet objects
3. Diffs are more reviewable (className changes vs. style property reshuffling)
4. `cva` + Tailwind is the de facto pattern for variant-heavy component libraries
5. Web parity is possible (`apps/web/` exists in the same monorepo)

### Two code review passes

**First review (8 real issues, 3 blocking):**
1. B1: `cssInterop` missing for `Animated.View` — `className` silently ignored → fixed in Phase 0 Task 4
2. B2: Shadow tokens are RN-native format, not CSS box-shadow → shadows stay imperative
3. B3: Only 2 of 6 font families registered → all 6 registered in Phase 0 Task 3
4. S1: Color opacity suffix (`${colors.primary}14`) has no Tailwind equivalent → imperative exception
5. S2: `screenTypography` conflicts with `nativeTokens.typography.styles` → resolved: screen-level override
6. S3: RTL tests using `StyleSheet.flatten` will break → test migration strategy in Phase 1 Task 14
7. S4: No `twMerge` strategy → `cn()` utility with `extendTailwindMerge` in Phase 0 Task 2
8. S5: Lint Rule 3 too broad → `Touchable` wrapper + escape hatch

**Second review (2 factual errors, 2 contradictions, 3 gaps):**
1. Wave 2 count: 73 → 57 (after auto-pass classification removed 16 files)
2. Phase 1 exit gate included features (which are explicitly out of scope) → corrected
3. `Touchable` wrapper referenced in lint rule but not created → added to Phase 1 Task 12
4. Per-batch contract rules omitted imperative exceptions → added to contract
5. `tailwind-merge` needs `extendTailwindMerge` for custom keys → added to `cn()` utility
6. Per-batch contract inputs missing `cn.ts`, `elevations.ts`, `Touchable.tsx` → added
7. `screenLayout` import path into `tailwind.config.ts` unspecified → direct import, pick static fields

### Key invariants for future sessions

- **No screen work until Phase 1 exit gate passes** (hard phase gate)
- **Shadows stay imperative** (`style={elevations.*}`) — NativeWind shadow utilities produce different values
- **Dynamic color opacity stays imperative** — `${colors.primary}14` pattern has no className equivalent
- **Animated styles stay imperative** — Reanimated `useAnimatedStyle` can't be driven by NativeWind
- **Font weight uses font-family** in RN — `font-sans-bold` (not `font-bold`) because each weight is a separate font file
- **`cn()` merges classNames** — every component accepting `className` must use it
- **`cssInterop` required** for `Animated.View/Text/ScrollView` before they can accept `className`
- **Lint rules are warnings in Phase 2, errors in Phase 3** — ratchet mechanism
- **Figma reconciliation only in Wave 1** (15 audit rows) — all other waves use code-is-floor
- **Maestro screenshots are local-only** (not in CI) — run before/after each batch merge
