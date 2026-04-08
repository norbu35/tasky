# UI Consistency & Journey Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all UI inconsistencies across the mobile app and scaffold every missing screen so that all 29 journey happy paths are navigable end-to-end.

**Architecture:** Three sequential layers — Sweep (fix violations in existing screens), Scaffold (create missing screens from template matrix), Wire (verify/fix navigation chains). Within each layer, tasks are parallelisable across journeys.

**Tech Stack:** React Native (Expo Router), react-native-reanimated, lucide-react-native, react-i18next, @gorhom/bottom-sheet

**Spec:** `docs/superpowers/specs/2026-04-05-ui-consistency-design.md`

---

## Layer Dependencies

```
Layer 1 (Tasks 1–8)  →  Layer 2 (Tasks 9–14)  →  Layer 3 (Tasks 15–17)
                                                    Task 18: Quality Gate
```

Within each layer, tasks are independent and can run in parallel.

---

## LAYER 1: SWEEP

### Task 1: Extend AuthTemplate with footerSlot prop

**Files:**
- Modify: `apps/mobile/src/components/templates/AuthTemplate.tsx`

- [ ] **Step 1: Add `footerSlot` to the interface and render it**

In `apps/mobile/src/components/templates/AuthTemplate.tsx`, add the prop and render section:

```tsx
// Add to AuthTemplateProps interface (after bottomSlot):
  footerSlot?: React.ReactNode;

// Add to destructured props:
  footerSlot,

// Add render block after the InsetScrollView closing tag, before {bottomSlot ? ...}:
        {footerSlot ? <View style={styles.footer}>{footerSlot}</View> : null}
```

Add the style:

```tsx
// Add to StyleSheet.create:
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/templates/AuthTemplate.tsx
git commit -m "feat(mobile): add footerSlot prop to AuthTemplate"
```

---

### Task 2: Fix login screen (V1, V2, V4)

**Files:**
- Modify: `apps/mobile/src/app/(auth)/index.tsx`

This is the biggest single-screen refactor: remove Figma URLs, adopt AuthTemplate, replace raw Pressable with Button.

- [ ] **Step 1: Rewrite login screen**

Replace the entire content of `apps/mobile/src/app/(auth)/index.tsx` with:

```tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Facebook, Zap } from 'lucide-react-native';
import { useDevLogin } from '../../features/auth/hooks/useAuth';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

type LoginState = 'default' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devLogin = useDevLogin();
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;

  const devAuthEnabled = runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const isFacebookLoading = state === 'facebook_loading';
  const busy = devLogin.isPending;

  const handleFacebookLogin = async () => {
    setState('facebook_loading');
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Facebook SDK not configured')), 100),
      );
    } catch {
      setState('error');
      setErrorMessage(t('auth.login.error', 'Login failed. Please try again.'));
    }
  };

  const handleDevLoginAs = (role: 'CUSTOMER' | 'TASKER') => {
    const phone = role === 'CUSTOMER' ? '+97699999999' : '+97699988888';
    devLogin.mutate({ phone, role });
  };

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'mn' ? 'en' : 'mn');
  };

  return (
    <AuthTemplate
      testID="SCR-SHARED-002"
      showLogo
      headline={t('auth.login.title', 'Tasky-д тавтай морил')}
      subtitle={t(
        'auth.login.description',
        'Найдвартай гүйцэтгэгчтэй холбогдож, ажлаа хялбар захиалаарай',
      )}
      topRightSlot={
        <Pressable
          testID="language-switcher"
          onPress={toggleLanguage}
          style={styles.languagePill}
          accessibilityRole="button"
          accessibilityLabel={t('auth.login.languageSwitcher', 'MN/EN')}
        >
          <Text style={styles.languagePillText}>MN/EN</Text>
        </Pressable>
      }
      bottomSlot={
        <View style={styles.actions}>
          <Button
            testID="facebook-login-button"
            label={t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
            onPress={() => { void handleFacebookLogin(); }}
            disabled={isFacebookLoading}
            isLoading={isFacebookLoading}
            style={styles.facebookButton}
          >
            {!isFacebookLoading ? (
              <View style={styles.facebookContent}>
                <Facebook size={20} color={colors.primaryForeground} />
                <Text style={styles.facebookText}>
                  {t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
                </Text>
              </View>
            ) : undefined}
          </Button>

          {state === 'error' && errorMessage ? (
            <Text testID="login-error" style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {devAuthEnabled ? (
            <View style={styles.devSection}>
              <Text style={styles.devLabel}>{t('auth.devBypass', 'Dev bypass')}</Text>
              <Button
                testID="dev-login-customer"
                label={t('auth.loginAsCustomer', 'Login as Customer')}
                variant="secondary"
                onPress={() => handleDevLoginAs('CUSTOMER')}
                disabled={busy}
              />
              <Button
                testID="dev-login-tasker"
                label={t('auth.loginAsTasker', 'Login as Tasker')}
                variant="secondary"
                onPress={() => handleDevLoginAs('TASKER')}
                disabled={busy}
              />
              {devLogin.error ? (
                <Text style={styles.errorText}>{devLogin.error.message}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      }
      footerSlot={
        <View style={styles.footerLinks}>
          <Pressable
            onPress={() => router.push('/(shared)/legal/terms')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>
              {t('auth.login.terms', 'Үйлчилгээний нөхцөл')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(shared)/legal/privacy')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>
              {t('auth.login.privacy', 'Нууцлалын бодлого')}
            </Text>
          </Pressable>
          <Text style={styles.copyright}>
            {t('auth.login.copyright', '© 2024 Tasky. Бүх эрх хуулиар хамгаалагдсан.')}
          </Text>
        </View>
      }
    >
      {/* Brand icon — replaces Figma asset */}
      <View style={styles.brandIconWrap}>
        <View style={styles.brandIconCard}>
          <Zap size={32} color={colors.primaryForeground} />
        </View>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  languagePill: {
    borderWidth: 1,
    borderColor: 'rgba(195,198,207,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.background,
  },
  languagePillText: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  brandIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandIconCard: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevations.card,
  },
  actions: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  facebookButton: {
    minHeight: 56,
    backgroundColor: colors.primaryDeep,
  },
  facebookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  facebookText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.body,
    textAlign: 'center',
  },
  devSection: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  devLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerLinks: {
    alignItems: 'center',
    gap: spacing.md,
  },
  footerLink: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  copyright: {
    color: colors.textSecondary,
    fontSize: typography.body,
    opacity: 0.6,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/\(auth\)/index.tsx
git commit -m "fix(mobile): adopt AuthTemplate + Button on login screen (V1,V2,V4)"
```

---

### Task 3: Fix onboarding screen (V1, V2)

**Files:**
- Modify: `apps/mobile/src/app/onboarding.tsx`

- [ ] **Step 1: Replace Figma URLs with Lucide icons and raw Pressables with Button**

In `apps/mobile/src/app/onboarding.tsx`:

1. Remove the `ONBOARDING_IMAGES` array and `Image` import entirely.

2. Replace imports — add `Button` and Lucide icons, remove `Image`:

```tsx
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Shield, Sparkles, Users } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
```

3. Replace `imageUri` in `SLIDES` with `icon` field:

```tsx
const SLIDES = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    bodyKey: 'auth.onboarding.slide1Body',
    icon: Users,
    iconColor: colors.primary,
    titleFallback: 'Найдвартай гүйцэтгэгч олох',
    bodyFallback: 'Баталгаажсан, итгэлтэй гүйцэтгэгчидтэй холбогдоорой',
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    bodyKey: 'auth.onboarding.slide2Body',
    icon: Sparkles,
    iconColor: colors.secondary,
    titleFallback: 'Захиалга хийх амархан',
    bodyFallback: 'Ажлаа нийтэлж, хэдхэн товшилтоор захиалга хийгээрэй',
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    bodyKey: 'auth.onboarding.slide3Body',
    icon: Shield,
    iconColor: colors.verified,
    titleFallback: 'Аюулгүй, итгэлтэй',
    bodyFallback: 'Үнэлгээ, баталгаажуулалтаар хамгаалагдсан нийгэмлэг',
  },
];
```

4. Replace the `renderItem` illustration section — replace the `<Image>` block inside `illustrationCard` with:

```tsx
<View style={[styles.illustrationCard, { backgroundColor: `${item.iconColor}15` }]}>
  <item.icon size={80} color={item.iconColor} />
</View>
```

Remove the `heroImage` style. Update `illustrationCard` style to add centering:

```tsx
illustrationCard: {
  alignSelf: 'stretch',
  height: '100%',
  borderRadius: 32,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
},
```

5. Replace footer buttons with `Button` component:

```tsx
<View style={styles.footer}>
  <View style={styles.pagination}>
    {SLIDES.map((_, index) => (
      <View
        key={index}
        testID={`pagination-dot-${index}`}
        style={[
          styles.dot,
          {
            backgroundColor: currentIndex === index ? colors.primary : colors.border,
            width: currentIndex === index ? 10 : 6,
          },
        ]}
      />
    ))}
  </View>
  <Button
    testID="onboarding-next"
    label={isLastSlide
      ? t('auth.onboarding.getStarted', 'Эхлэх')
      : t('auth.onboarding.next', 'Дараагийх')}
    onPress={handleNext}
    style={styles.nextButton}
  />
</View>
```

Update `nextButton` style (remove the old manual styling, keep only layout):

```tsx
nextButton: {
  alignSelf: 'stretch',
},
```

Remove `nextButtonText` style entirely.

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/onboarding.tsx
git commit -m "fix(mobile): replace Figma URLs with Lucide icons, adopt Button on onboarding (V1,V2)"
```

---

### Task 4: Fix permission screens (V3, V5)

**Files:**
- Modify: `apps/mobile/src/app/(auth)/permission-camera.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-location.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`

All three files have the same two violations: bare `<View>` root (V3) and hardcoded Mongolian strings (V5). Fix pattern is identical.

- [ ] **Step 1: Fix permission-camera.tsx**

In `apps/mobile/src/app/(auth)/permission-camera.tsx`:

1. Add import for `ScreenContainer`:

```tsx
import { ScreenContainer } from '../../components/shells';
```

2. Replace the render return — change the bare `<View>` to `ScreenContainer` and add `t()` calls:

```tsx
return (
  <ScreenContainer testID="SCR-SHARED-007">
    <PermissionPrimer
      icon={<Camera size={48} color={colors.primaryDeep} />}
      title={t('auth.permissions.camera.title', 'Камер ашиглах зөвшөөрөл')}
      description={t('auth.permissions.camera.description', 'Зураг оруулах, баталгаажуулалт хийхэд камер хэрэгтэй')}
      deniedMessage={t('auth.permissions.camera.denied', 'Камерын зөвшөөрөл хаагдсан')}
      settingsHint={t('auth.permissions.camera.settingsHint', 'Тохиргооноос камерыг нээх боломжтой')}
      continueLabel={t('auth.permissions.continueLabel', 'Үргэлжлүүлэх')}
      allowLabel={t('auth.permissions.allowLabel', 'Зөвшөөрөх')}
      skipLabel={t('auth.permissions.skipLabel', 'Дараа хийх')}
      isDenied={isDenied}
      onGrant={() => { void handleGrant(); }}
      onSkip={goNext}
      onContinue={goNext}
      testID="permission-camera-primer"
    />
  </ScreenContainer>
);
```

3. Remove the `styles` `StyleSheet.create` block entirely — `ScreenContainer` handles the container.

4. Add `useTranslation` import and hook:

```tsx
import { useTranslation } from 'react-i18next';
// inside the component:
const { t } = useTranslation();
```

- [ ] **Step 2: Fix permission-location.tsx — same pattern**

Same changes as Step 1 but with:
- `testID="SCR-SHARED-008"`
- `MapPin` icon (already correct)
- `t('auth.permissions.location.title', 'Байршил ашиглах зөвшөөрөл')`
- `t('auth.permissions.location.description', 'Ойролцоох даалгавруудыг харуулах, байршил тодорхойлоход хэрэгтэй')`
- `t('auth.permissions.location.denied', 'Байршлын зөвшөөрөл хаагдсан')`
- `t('auth.permissions.location.settingsHint', 'Тохиргооноос байршлыг нээх боломжтой')`

- [ ] **Step 3: Fix permission-notifications.tsx — same pattern**

Same changes with:
- `testID="SCR-SHARED-009"`
- `Bell` icon
- `t('auth.permissions.notifications.title', ...)` etc.
- Read the file first to get the exact current Mongolian strings for fallbacks.

- [ ] **Step 4: Add i18n keys to translation files**

In `apps/mobile/src/locales/en/translation.json`, add under `"auth"`:

```json
"permissions": {
  "continueLabel": "Continue",
  "allowLabel": "Allow",
  "skipLabel": "Skip for now",
  "camera": {
    "title": "Camera Permission",
    "description": "Camera is needed for photos and verification",
    "denied": "Camera permission denied",
    "settingsHint": "You can enable camera in Settings"
  },
  "location": {
    "title": "Location Permission",
    "description": "Needed to show nearby tasks and set location",
    "denied": "Location permission denied",
    "settingsHint": "You can enable location in Settings"
  },
  "notifications": {
    "title": "Notification Permission",
    "description": "Get notified about task updates and messages",
    "denied": "Notification permission denied",
    "settingsHint": "You can enable notifications in Settings"
  }
}
```

In `apps/mobile/src/locales/mn/translation.json`, add the same structure with the Mongolian strings from the original hardcoded values.

- [ ] **Step 5: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/\(auth\)/permission-camera.tsx apps/mobile/src/app/\(auth\)/permission-location.tsx apps/mobile/src/app/\(auth\)/permission-notifications.tsx apps/mobile/src/locales/en/translation.json apps/mobile/src/locales/mn/translation.json
git commit -m "fix(mobile): wrap permission screens in ScreenContainer, add i18n (V3,V5)"
```

---

### Task 5: Fix wizard step labels (V6) — intake, photos, location, schedule

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`

In each file, remove the manual "Step X of Y" `<Text>` element and its associated `stepLabel` style. The `FormWizardTemplate`'s progress bar is the sole step indicator.

- [ ] **Step 1: Fix intake.tsx**

1. Remove the `stepLabel` text block from the `headerBlock` View:

```tsx
// REMOVE this block:
<Text style={styles.stepLabel}>
  {t('taskPost.step', 'Step {{current}} of {{total}}')
    .replace('{{current}}', '2')
    .replace('{{total}}', '7')}
</Text>
```

2. Remove `stepLabel` from the `StyleSheet.create` block.

3. Also fix V5 — replace hardcoded `'Yes'`/`'No'` in the `YesNo` component:

```tsx
// In the YesNo component, replace:
const label = opt ? 'Yes' : 'No';
// With:
const { t } = useTranslation();
// (add t to the component's scope — either pass it as a prop or call useTranslation inside YesNo)
const label = opt ? t('common.yes', 'Тийм') : t('common.no', 'Үгүй');
```

Since `YesNo` is a file-local component, the simplest fix is to call `useTranslation()` inside it.

- [ ] **Step 2: Fix photos.tsx — remove stepLabel**

Same pattern: remove the `<Text style={styles.stepLabel}>` block and `stepLabel` style.

- [ ] **Step 3: Fix location.tsx — remove stepLabel**

Same pattern.

- [ ] **Step 4: Fix schedule.tsx — remove stepLabel**

Same pattern.

- [ ] **Step 5: Add i18n keys for Yes/No**

In `apps/mobile/src/locales/en/translation.json` under `"common"`:
```json
"yes": "Yes",
"no": "No"
```

In `apps/mobile/src/locales/mn/translation.json` under `"common"`:
```json
"yes": "Тийм",
"no": "Үгүй"
```

- [ ] **Step 6: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/intake.tsx apps/mobile/src/app/\(customer\)/tasks/new/photos.tsx apps/mobile/src/app/\(customer\)/tasks/new/location.tsx apps/mobile/src/app/\(customer\)/tasks/new/schedule.tsx apps/mobile/src/locales/en/translation.json apps/mobile/src/locales/mn/translation.json
git commit -m "fix(mobile): remove duplicate step labels from wizard screens, i18n Yes/No (V5,V6)"
```

---

### Task 6: Fix review screen (V5, V7) — switch to FormWizardTemplate

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`

- [ ] **Step 1: Replace DetailTemplate with FormWizardTemplate**

1. Change the import:

```tsx
// Replace:
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
// With:
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
```

2. Replace the template wrapper. The review screen currently wraps in `<DetailTemplate>`. Change to:

```tsx
<FormWizardTemplate
  currentStep={5}
  totalSteps={7}
  onNext={handlePostTask}
  onBack={() => router.back()}
  nextLabel={t('customer.postTask.postButton', 'Post Task')}
  nextLoading={isSubmitting}
  nextDisabled={isSubmitting}
  testID="SCR-CUST-007"
>
  {/* existing review content (summary cards, edit links, etc.) */}
</FormWizardTemplate>
```

3. Remove any existing submit button from the review screen's content — the `FormWizardTemplate` bottom bar now handles it.

4. Fix V5 — replace hardcoded `'Flexible'`:

```tsx
// Replace:
return 'Flexible';
// With:
return t('customer.postTask.flexibleSchedule', 'Flexible');
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/review.tsx
git commit -m "fix(mobile): adopt FormWizardTemplate on review screen, i18n 'Flexible' (V5,V7)"
```

---

### Task 7: Fix category screen (V8) — adopt FormWizardTemplate

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/category.tsx`

- [ ] **Step 1: Replace ScreenContainer + StepIndicator with FormWizardTemplate**

1. Read the file fully first to understand the current structure.

2. Replace imports:

```tsx
// Remove: StepIndicator import, InsetScrollView/ScreenContainer imports
// Add:
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
```

3. Wrap the screen content in `FormWizardTemplate`:

```tsx
<FormWizardTemplate
  currentStep={0}
  totalSteps={7}
  onNext={handleCategorySelect}
  showBack={false}
  nextLabel={t('common.continue', 'Continue')}
  nextDisabled={!selectedCategory}
  testID="SCR-CUST-002"
>
  {/* category grid, search, editorial intro — existing children */}
</FormWizardTemplate>
```

4. Remove the manual `<StepIndicator>` and `<Text style={styles.stepLabel}>` blocks.

5. Remove the `stepLabel`, `stepIndicatorBlock` styles and any now-unused styles.

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/category.tsx
git commit -m "fix(mobile): adopt FormWizardTemplate on category screen (V8)"
```

---

### Task 8: Layer 1 Gate 1 verification

- [ ] **Step 1: Verify zero Figma URLs**

Run: `grep -r "figma.com/api/mcp" apps/mobile/src/`
Expected: No output (zero matches)

- [ ] **Step 2: Verify no bare Pressable CTAs remain**

Spot-check the fixed files — open each one and confirm no raw `<Pressable>` is used as a primary CTA button. Selection tiles, back arrows, and link-style pressables are allowed.

- [ ] **Step 3: Commit any locale file additions missed**

If any `t()` calls were added without corresponding locale entries, add them now.

```bash
git add apps/mobile/src/locales/
git commit -m "fix(mobile): add missing i18n keys for sweep (V9)"
```

---

## LAYER 2: SCAFFOLD

### Task 9: Scaffold Phase 0-1 route screens

**Files (create):**
- `apps/mobile/src/app/(shared)/review/hard-lock.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/rescue.tsx`
- `apps/mobile/src/app/(tasker)/tasks/applied.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/cancel.tsx`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/cancel.tsx`

Each screen follows the template matrix from the spec. All use `t()` for strings and include `// TODO: wire real data`.

- [ ] **Step 1: Create review hard-lock screen (SCR-SHARED-019)**

Create `apps/mobile/src/app/(shared)/review/hard-lock.tsx`:

```tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../../components/shells';
import { ErrorStateTemplate } from '../../../components/templates/ErrorStateTemplate';

export default function ReviewHardLockScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ScreenContainer testID="SCR-SHARED-019">
      <ErrorStateTemplate
        message={t(
          'review.hardLock.message',
          'You must submit your pending review before continuing. This is required for platform trust.',
        )}
        onRetry={() => {
          // TODO: wire real data — navigate to the pending review
          router.back();
        }}
        retryLabel={t('review.hardLock.reviewNow', 'Review Now')}
        testID="review-hard-lock"
      />
    </ScreenContainer>
  );
}
```

- [ ] **Step 2: Create no-applicant rescue screen (SCR-CUST-026)**

Create `apps/mobile/src/app/(customer)/tasks/[taskId]/rescue.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function NoApplicantRescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  // TODO: wire real data — fetch task details, provide rescue actions

  return (
    <DetailTemplate testID="SCR-CUST-026">
      <View style={styles.content}>
        <Lightbulb size={48} color={colors.secondary} />
        <Text style={styles.headline}>
          {t('customer.rescue.headline', 'No applicants yet')}
        </Text>
        <Text style={styles.body}>
          {t('customer.rescue.body', 'Try adjusting your budget or schedule to attract more taskers.')}
        </Text>
        <Button
          label={t('customer.rescue.adjustTask', 'Adjust Task')}
          onPress={() => router.back()}
          style={styles.cta}
        />
        <Button
          label={t('customer.rescue.contactSupport', 'Contact Concierge')}
          variant="outline"
          onPress={() => {
            // TODO: wire concierge support
          }}
          style={styles.cta}
        />
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  headline: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
```

- [ ] **Step 3: Create application submitted success (SCR-TASK-011)**

Create `apps/mobile/src/app/(tasker)/tasks/applied.tsx`:

```tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

export default function ApplicationSubmittedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SuccessCelebrationTemplate
      testID="SCR-TASK-011"
      headline={t('tasker.applied.headline', 'Application Sent!')}
      body={t('tasker.applied.body', 'The customer will review your application and respond soon.')}
      nextSteps={[
        t('tasker.applied.step1', 'Customer reviews applicants'),
        t('tasker.applied.step2', 'You get notified if selected'),
        t('tasker.applied.step3', 'Booking is confirmed automatically'),
      ]}
      ctaLabel={t('tasker.applied.cta', 'Browse More Tasks')}
      ctaOnPress={() => router.replace('/(tabs)')}
      secondaryCtaLabel={t('tasker.applied.secondaryCta', 'View My Applications')}
      secondaryCtaOnPress={() => router.push('/(tasker)/jobs')}
    />
  );
}
```

- [ ] **Step 4: Create customer booking cancel screen (SCR-CUST-022)**

Create `apps/mobile/src/app/(customer)/bookings/[bookingId]/cancel.tsx`:

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenContainer } from '../../../../components/shells';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function CustomerCancelBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — check cancellation policy, submit cancellation

  const handleCancel = () => {
    // TODO: wire real cancellation API call
    setIsOpen(false);
    router.back();
  };

  return (
    <ScreenContainer testID="SCR-CUST-022">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); router.back(); }}
        title={t('customer.cancelBooking.title', 'Cancel Booking')}
        testID="cancel-booking-sheet"
      >
        <View style={styles.content}>
          <AlertTriangle size={32} color={colors.danger} />
          <Text style={styles.warning}>
            {t('customer.cancelBooking.warning', 'Late cancellations may incur a fee. Free cancellation is available up to 2 hours before the scheduled time.')}
          </Text>
          <Button
            label={t('customer.cancelBooking.confirm', 'Confirm Cancellation')}
            variant="destructive"
            onPress={handleCancel}
            style={styles.button}
          />
          <Button
            label={t('common.goBack', 'Go Back')}
            variant="ghost"
            onPress={() => { setIsOpen(false); router.back(); }}
            style={styles.button}
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  warning: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  button: {
    alignSelf: 'stretch',
  },
});
```

- [ ] **Step 5: Create tasker cancel booking screen (SCR-TASK-015)**

Create `apps/mobile/src/app/(tasker)/jobs/[bookingId]/cancel.tsx` — same pattern as SCR-CUST-022 but with tasker-specific copy and a strike warning:

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { ScreenContainer } from '../../../../components/shells';
import { ModalSheetTemplate } from '../../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function TaskerCancelBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — check strike policy, submit cancellation with reason

  const handleCancel = () => {
    // TODO: wire real cancellation API call
    setIsOpen(false);
    router.back();
  };

  return (
    <ScreenContainer testID="SCR-TASK-015">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); router.back(); }}
        title={t('tasker.cancelBooking.title', 'Cancel Booking')}
        testID="tasker-cancel-booking-sheet"
      >
        <View style={styles.content}>
          <AlertTriangle size={32} color={colors.danger} />
          <Text style={styles.warning}>
            {t('tasker.cancelBooking.warning', 'Cancelling a confirmed booking will add a strike to your account. Select Safety/Fraud if applicable to avoid a strike.')}
          </Text>
          <Button
            label={t('tasker.cancelBooking.confirm', 'Cancel Booking')}
            variant="destructive"
            onPress={handleCancel}
            style={styles.button}
          />
          <Button
            label={t('common.goBack', 'Go Back')}
            variant="ghost"
            onPress={() => { setIsOpen(false); router.back(); }}
            style={styles.button}
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  warning: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  button: {
    alignSelf: 'stretch',
  },
});
```

- [ ] **Step 6: Verify typecheck**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/\(shared\)/review/hard-lock.tsx apps/mobile/src/app/\(customer\)/tasks/\[taskId\]/rescue.tsx apps/mobile/src/app/\(tasker\)/tasks/applied.tsx apps/mobile/src/app/\(customer\)/bookings/\[bookingId\]/cancel.tsx apps/mobile/src/app/\(tasker\)/jobs/\[bookingId\]/cancel.tsx
git commit -m "feat(mobile): scaffold Phase 0-1 route screens (SCR-SHARED-019, SCR-CUST-022/026, SCR-TASK-011/015)"
```

---

### Task 10: Add inline ConfirmSheet instances to existing parent screens

**Files (modify):**
- `apps/mobile/src/app/(shared)/review/[bookingId].tsx` — add SCR-SHARED-018 (review reminder)
- `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx` — add SCR-CUST-010 (cancel task)
- `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx` — add SCR-CUST-012 (decline notification)
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx` — add SCR-CUST-018 + SCR-CUST-021
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx` — add SCR-TASK-014 (no-show)

For each file, the pattern is:
1. Import `ConfirmSheet` from `'../../components/ui/ConfirmSheet'`
2. Add a `useState<boolean>` for `showSheet`
3. Render `<ConfirmSheet testID="SCR-xxx" isOpen={showSheet} ... />` at the end of the component's JSX
4. Add a trigger button or state that opens the sheet

- [ ] **Step 1: Read each parent screen to understand where to insert the ConfirmSheet**

Read all 5 files listed above to understand their current structure before making changes.

- [ ] **Step 2: Add SCR-CUST-010 (cancel task) to task detail**

In `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`:

```tsx
// Add import:
import { ConfirmSheet } from '../../../../components/ui/ConfirmSheet';

// Add state:
const [showCancelSheet, setShowCancelSheet] = useState(false);

// Add to JSX, before closing template tag:
<ConfirmSheet
  testID="SCR-CUST-010"
  isOpen={showCancelSheet}
  onClose={() => setShowCancelSheet(false)}
  title={t('customer.cancelTask.title', 'Cancel Task')}
  description={t('customer.cancelTask.description', 'This will remove the task and notify all applicants. This cannot be undone.')}
  confirmLabel={t('customer.cancelTask.confirm', 'Cancel Task')}
  onConfirm={() => {
    // TODO: wire real cancellation API
    setShowCancelSheet(false);
  }}
  isDestructive
/>
```

- [ ] **Step 3: Add SCR-CUST-018 and SCR-CUST-021 to booking detail**

In `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`, add two ConfirmSheet instances:

```tsx
// SCR-CUST-018: Confirm completion
const [showCompleteSheet, setShowCompleteSheet] = useState(false);

<ConfirmSheet
  testID="SCR-CUST-018"
  isOpen={showCompleteSheet}
  onClose={() => setShowCompleteSheet(false)}
  title={t('customer.confirmComplete.title', 'Confirm Completion')}
  description={t('customer.confirmComplete.description', 'Confirm that the work has been completed satisfactorily. You will be asked to leave a review.')}
  confirmLabel={t('customer.confirmComplete.confirm', 'Confirm Complete')}
  onConfirm={() => {
    // TODO: wire real completion API
    setShowCompleteSheet(false);
  }}
/>

// SCR-CUST-021: No-show flag
const [showNoShowSheet, setShowNoShowSheet] = useState(false);

<ConfirmSheet
  testID="SCR-CUST-021"
  isOpen={showNoShowSheet}
  onClose={() => setShowNoShowSheet(false)}
  title={t('customer.noShow.title', 'Report No-Show')}
  description={t('customer.noShow.description', 'Report that the tasker did not arrive. This should only be used after waiting at least 15 minutes past the scheduled time.')}
  confirmLabel={t('customer.noShow.confirm', 'Report No-Show')}
  onConfirm={() => {
    // TODO: wire real no-show API
    setShowNoShowSheet(false);
  }}
  isDestructive
/>
```

- [ ] **Step 4: Add SCR-SHARED-018 (review reminder) to review screen**

In `apps/mobile/src/app/(shared)/review/[bookingId].tsx`:

```tsx
<ConfirmSheet
  testID="SCR-SHARED-018"
  isOpen={showReminderSheet}
  onClose={() => setShowReminderSheet(false)}
  title={t('review.reminder.title', 'Review Required')}
  description={t('review.reminder.description', 'Please submit your review for this booking. Reviews help maintain trust in the community.')}
  confirmLabel={t('review.reminder.confirm', 'Write Review')}
  onConfirm={() => setShowReminderSheet(false)}
/>
```

- [ ] **Step 5: Add SCR-CUST-012 (decline notification) inline state to applicants list**

In `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`, add a conditional banner or toast state (not a ConfirmSheet, since this is a notification, not a confirmation):

```tsx
// Add state:
const [declineNotification, setDeclineNotification] = useState<string | null>(null);

// Add inline notification banner in JSX:
{declineNotification ? (
  <View testID="SCR-CUST-012" style={styles.declineBanner}>
    <Text style={styles.declineText}>{declineNotification}</Text>
    <Button
      label={t('common.dismiss', 'Dismiss')}
      variant="ghost"
      size="sm"
      onPress={() => setDeclineNotification(null)}
    />
  </View>
) : null}
```

- [ ] **Step 6: Add SCR-TASK-014 (tasker no-show flag) to job detail**

In `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`:

```tsx
<ConfirmSheet
  testID="SCR-TASK-014"
  isOpen={showNoShowSheet}
  onClose={() => setShowNoShowSheet(false)}
  title={t('tasker.noShow.title', 'Report Customer No-Show')}
  description={t('tasker.noShow.description', 'Report that the customer was not present. Only use this after waiting at least 15 minutes.')}
  confirmLabel={t('tasker.noShow.confirm', 'Report No-Show')}
  onConfirm={() => {
    // TODO: wire real no-show API
    setShowNoShowSheet(false);
  }}
  isDestructive
/>
```

- [ ] **Step 7: Verify typecheck and commit**

```bash
cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30
git add apps/mobile/src/app/
git commit -m "feat(mobile): add inline ConfirmSheet instances for 6 catalog screens"
```

---

### Task 11: Scaffold Phase 2 non-B2B screens

**Files (create):**
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/lead-unlock.tsx` (SCR-TASK-017)
- `apps/mobile/src/app/(customer)/tasks/[taskId]/boost.tsx` (SCR-CUST-028)
- `apps/mobile/src/app/(customer)/tasks/[taskId]/boost-pay.tsx` (SCR-CUST-029)

All three use `DetailTemplate`. Follow the same pattern as SCR-CUST-026 (rescue screen) from Task 9 Step 2, adjusting the content for each screen's purpose.

- [ ] **Step 1: Create lead-unlock screen (SCR-TASK-017)**

Create `apps/mobile/src/app/(tasker)/jobs/[bookingId]/lead-unlock.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Unlock } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function LeadUnlockScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  // TODO: wire real data — fetch lead details, credit balance, accept/decline handlers

  return (
    <DetailTemplate testID="SCR-TASK-017">
      <View style={styles.content}>
        <Unlock size={48} color={colors.primary} />
        <Text style={styles.headline}>
          {t('tasker.leadUnlock.headline', 'Lead Unlock Request')}
        </Text>
        <Text style={styles.body}>
          {t('tasker.leadUnlock.body', 'A customer has selected you. Accept to unlock the lead using credits, or decline.')}
        </Text>
        <Button
          label={t('tasker.leadUnlock.accept', 'Accept & Unlock')}
          onPress={() => {
            // TODO: wire accept + credit deduction
            router.back();
          }}
          style={styles.button}
        />
        <Button
          label={t('tasker.leadUnlock.decline', 'Decline')}
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  headline: { fontSize: typography.heading, fontWeight: '600', color: colors.primaryDeep, textAlign: 'center' },
  body: { fontSize: typography.body, color: colors.mutedForeground, textAlign: 'center', lineHeight: typography.body * 1.6 },
  button: { alignSelf: 'stretch' },
});
```

- [ ] **Step 2: Create boost selection screen (SCR-CUST-028)**

Create `apps/mobile/src/app/(customer)/tasks/[taskId]/boost.tsx` — same `DetailTemplate` pattern with two boost options (Promoted / Urgent) as `PressableCard` or `Button` choices. Include `testID="SCR-CUST-028"`.

- [ ] **Step 3: Create boost payment screen (SCR-CUST-029)**

Create `apps/mobile/src/app/(customer)/tasks/[taskId]/boost-pay.tsx` — `DetailTemplate` with QPay integration placeholder. Include `testID="SCR-CUST-029"`.

- [ ] **Step 4: Verify typecheck and commit**

```bash
cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30
git add apps/mobile/src/app/\(tasker\)/jobs/\[bookingId\]/lead-unlock.tsx apps/mobile/src/app/\(customer\)/tasks/\[taskId\]/boost.tsx apps/mobile/src/app/\(customer\)/tasks/\[taskId\]/boost-pay.tsx
git commit -m "feat(mobile): scaffold Phase 2 screens (SCR-TASK-017, SCR-CUST-028/029)"
```

---

### Task 12: Create B2B route group layouts

**Files (create):**
- `apps/mobile/src/app/(customer)/business/_layout.tsx`
- `apps/mobile/src/app/(customer)/business/new/_layout.tsx`
- `apps/mobile/src/app/(customer)/business/[businessId]/_layout.tsx`

- [ ] **Step 1: Create all three layout files**

Each is a simple `Stack` navigator. Create `apps/mobile/src/app/(customer)/business/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function BusinessLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Create `apps/mobile/src/app/(customer)/business/new/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function BusinessNewLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Create `apps/mobile/src/app/(customer)/business/[businessId]/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function BusinessDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/business/
git commit -m "feat(mobile): add B2B route group layouts for Expo Router"
```

---

### Task 13: Scaffold B2B screens

**Files (create):**
- `apps/mobile/src/app/(customer)/business/index.tsx` (SCR-B2B-001)
- `apps/mobile/src/app/(customer)/business/new/details.tsx` (SCR-B2B-002)
- `apps/mobile/src/app/(customer)/business/new/location.tsx` (SCR-B2B-003)
- `apps/mobile/src/app/(customer)/business/new/invite.tsx` (SCR-B2B-004)
- `apps/mobile/src/app/(customer)/business/select.tsx` (SCR-B2B-005)
- `apps/mobile/src/app/(customer)/business/[businessId]/tasks.tsx` (SCR-B2B-006)
- `apps/mobile/src/app/(customer)/business/[businessId]/billing.tsx` (SCR-B2B-007)

- [ ] **Step 1: Create business dashboard (SCR-B2B-001)**

Create `apps/mobile/src/app/(customer)/business/index.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react-native';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { Button } from '../../../components/ui/Button';
import { EmptyStateTemplate } from '../../../components/templates/EmptyStateTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing } = mobileTheme;

export default function BusinessDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch business accounts list

  return (
    <FeedListTemplate
      testID="SCR-B2B-001"
      data={[]}
      renderItem={() => null}
      ListEmptyComponent={
        <EmptyStateTemplate
          message={t('b2b.dashboard.empty', 'No business accounts yet')}
        />
      }
      headerSlot={
        <Button
          label={t('b2b.dashboard.createAccount', 'Create Business Account')}
          onPress={() => router.push('/(customer)/business/new/details')}
          style={{ alignSelf: 'stretch' }}
        />
      }
    />
  );
}
```

- [ ] **Step 2: Create business setup wizard screens (SCR-B2B-002, 003, 004)**

Create `apps/mobile/src/app/(customer)/business/new/details.tsx`:

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

export default function BusinessDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');

  // TODO: wire real data — save business details

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={3}
      onNext={() => router.push('/(customer)/business/new/location')}
      nextLabel={t('common.continue', 'Continue')}
      nextDisabled={!name.trim()}
      showBack={false}
      testID="SCR-B2B-002"
    >
      <FormField label={t('b2b.setup.businessName', 'Business Name')}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t('b2b.setup.businessNamePlaceholder', 'Enter business name')}
          testID="b2b-business-name-input"
        />
      </FormField>
    </FormWizardTemplate>
  );
}
```

Create `apps/mobile/src/app/(customer)/business/new/location.tsx` — same `FormWizardTemplate` pattern with `currentStep={1}`, `testID="SCR-B2B-003"`, navigates to `invite`.

Create `apps/mobile/src/app/(customer)/business/new/invite.tsx` — same pattern with `currentStep={2}`, `testID="SCR-B2B-004"`, navigates back to business dashboard on finish.

- [ ] **Step 3: Create select business account screen (SCR-B2B-005)**

Create `apps/mobile/src/app/(customer)/business/select.tsx` using `ModalSheetTemplate` with `testID="SCR-B2B-005"`.

- [ ] **Step 4: Create business task list (SCR-B2B-006)**

Create `apps/mobile/src/app/(customer)/business/[businessId]/tasks.tsx` using `FeedListTemplate` with `testID="SCR-B2B-006"`.

- [ ] **Step 5: Create business billing screen (SCR-B2B-007)**

Create `apps/mobile/src/app/(customer)/business/[businessId]/billing.tsx` using `DetailTemplate` with `testID="SCR-B2B-007"`.

- [ ] **Step 6: Verify typecheck and commit**

```bash
cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30
git add apps/mobile/src/app/\(customer\)/business/
git commit -m "feat(mobile): scaffold all B2B screens (SCR-B2B-001 through 007)"
```

---

### Task 14: Layer 2 Gate 2 verification

- [ ] **Step 1: Extract all screen IDs from catalog**

```bash
grep -oP 'screen: SCR-[A-Z0-9-]+' docs/design/journey-catalog.yaml | sort -u | sed 's/screen: //'
```

- [ ] **Step 2: Check each ID has a testID in the source tree**

```bash
for id in $(grep -oP 'screen: SCR-[A-Z0-9-]+' docs/design/journey-catalog.yaml | sort -u | sed 's/screen: //'); do
  count=$(grep -r "testID=\"$id\"" apps/mobile/src/ | wc -l)
  if [ "$count" -eq 0 ]; then echo "MISSING: $id"; fi
done
```

Expected: Zero "MISSING" lines.

- [ ] **Step 3: Fix any missing IDs and commit**

---

## LAYER 3: WIRE

### Task 15: Verify shared + customer journey navigation

For each journey, read the catalog's `happy_path`, then check that each screen's CTA calls `router.push/replace` to the correct next screen.

- [ ] **Step 1: Verify JRN-SHARED-01 (First Launch & Onboarding)**

Check the navigation chain:
1. `app/index.tsx` → Redirect to `/(auth)` (no session) ✓
2. `(auth)/index.tsx` → Facebook login → onboarding after success
3. `onboarding.tsx` → `/(auth)/role-select` on finish
4. `(auth)/role-select.tsx` → `/(auth)/permission-camera` on confirm
5. `(auth)/permission-camera.tsx` → `/(auth)/permission-location`
6. `(auth)/permission-location.tsx` → `/(auth)/permission-notifications`
7. `(auth)/permission-notifications.tsx` → `/(customer)/tasks` or `/(tabs)`

Fix any broken `router.push/replace` calls.

- [ ] **Step 2: Verify JRN-CUST-01 (Post a Task)**

Check the 8-step chain:
1. Customer home → FAB → `/(customer)/tasks/new/category`
2. Category → `/(customer)/tasks/new/intake`
3. Intake → `/(customer)/tasks/new/photos`
4. Photos → `/(customer)/tasks/new/location`
5. Location → `/(customer)/tasks/new/schedule`
6. Schedule → `/(customer)/tasks/new/review`
7. Review → POST API → `/(customer)/tasks/new/success`
8. Success → task detail

Verify all `router.push` calls use the correct pathnames and forward all required params (`categoryId`, `description`, `intakeAnswers`, etc.).

- [ ] **Step 3: Verify remaining shared journeys (JRN-SHARED-02 through 07)**

For each journey, trace the `next:` field from catalog and confirm router calls match.

- [ ] **Step 4: Verify remaining customer journeys (JRN-CUST-02 through 09)**

Same procedure.

- [ ] **Step 5: Commit any navigation fixes**

```bash
git add apps/mobile/src/
git commit -m "fix(mobile): correct navigation wiring for shared + customer journeys"
```

---

### Task 16: Verify tasker + B2B journey navigation

- [ ] **Step 1: Verify JRN-TASK-01 through 08**

Trace each happy-path chain. Key chains to verify:
- Verification flow: task detail → gate → consent → upload → submitted → pending → approved
- Browse & Apply: feed → detail → apply → applied success (new screen)
- Manage booking: jobs list → job detail → mark done → review

- [ ] **Step 2: Verify JRN-B2B-01 through 04**

Trace the B2B chains through the new scaffolded screens.

- [ ] **Step 3: Verify JRN-INFRA-01**

Check that network-error, session-expired, and app-update screens are reachable and have retry/recovery actions.

- [ ] **Step 4: Commit any navigation fixes**

```bash
git add apps/mobile/src/
git commit -m "fix(mobile): correct navigation wiring for tasker + B2B + infra journeys"
```

---

### Task 17: Produce smoke-check table and final Gate 3

- [ ] **Step 1: Build the smoke-check table**

For each of the 29 journeys, record:
- Entry reachable: ✓/✗
- N steps forward: ✓/✗
- Exit terminal: ✓/✗

Format as markdown table and save to `docs/quality/journey-navigation-smoke-check.md`.

- [ ] **Step 2: Fix any ✗ entries**

If any journey has a failing check, fix the navigation and re-verify.

- [ ] **Step 3: Commit**

```bash
git add docs/quality/journey-navigation-smoke-check.md apps/mobile/src/
git commit -m "docs(quality): journey navigation smoke-check — all 29 journeys passing"
```

---

## GATE CHECK

### Task 18: Run all three quality gates

- [ ] **Step 1: Gate 1 — Zero Figma URLs**

```bash
grep -r "figma.com/api/mcp" apps/mobile/src/
```
Expected: No output.

- [ ] **Step 2: Gate 2 — Full catalog coverage**

```bash
for id in $(grep -oP 'screen: SCR-[A-Z0-9-]+' docs/design/journey-catalog.yaml | sort -u | sed 's/screen: //'); do
  count=$(grep -r "testID=\"$id\"" apps/mobile/src/ | wc -l)
  if [ "$count" -eq 0 ]; then echo "MISSING: $id"; fi
done
```
Expected: No output.

- [ ] **Step 3: Gate 3 — All happy paths navigable**

Verify the smoke-check table at `docs/quality/journey-navigation-smoke-check.md` has ✓ on all three columns for all 29 journeys.

- [ ] **Step 4: Run typecheck one final time**

```bash
cd apps/mobile && npx tsc --noEmit --pretty
```
Expected: Zero errors.

- [ ] **Step 5: Commit any final fixes**

```bash
git add .
git commit -m "chore(mobile): UI consistency — all 3 quality gates passing"
```
