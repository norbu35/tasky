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
