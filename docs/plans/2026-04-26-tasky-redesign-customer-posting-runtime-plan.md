# Tasky Customer Posting Redesign Runtime Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the mobile customer task-posting proof slice from the Refero redesign contracts without promoting unproven global tokens or changing Phase 1 product behavior.

**Architecture:** This is a mobile-first runtime slice for `SCR-CUST-002` through `SCR-CUST-008`. Keep Expo Router route files as one-line adapters, keep the existing task-posting screen families, and add proof-local task-posting components under `apps/mobile/src/features/tasks/components/` when a pattern is reused across multiple posting steps. Shared design tokens and app-wide primitives are not promoted in this slice unless a verifier proves the existing token/component cannot support the proof screen.

**Tech Stack:** React Native, Expo Router, NativeWind, `@tasky/design-tokens`, `react-i18next`, Jest, React Native Testing Library.

---

## Source Artifacts

- `docs/plans/2026-04-26-tasky-redesign-thesis.md`
- `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
- `docs/design/screen-specs/SCR-CUST-002.yaml`
- `docs/design/screen-specs/SCR-CUST-003.yaml`
- `docs/design/screen-specs/SCR-CUST-004.yaml`
- `docs/design/screen-specs/SCR-CUST-005.yaml`
- `docs/design/screen-specs/SCR-CUST-006.yaml`
- `docs/design/screen-specs/SCR-CUST-007.yaml`
- `docs/design/screen-specs/SCR-CUST-008.yaml`

## Scope Boundaries

- Mobile customer posting only.
- Do not edit web runtime in this slice.
- Do not add runtime AI posting.
- Do not add escrow, wallet, payment protection, checkout, deposit, or payment-hold copy.
- Do not add open-ended pre-booking chat.
- Do not move task-posting draft ownership out of `apps/mobile/src/features/tasks/draft/**`.
- Do not add new root-level design docs or static UI-kit artifacts.

## File Structure

- Create: `apps/mobile/src/features/tasks/components/PostingGuidance.tsx`
  - Owns proof-local guidance modules reused across task-posting steps: structure cue, address privacy cue, pricing cue, deterministic summary cue, and next-step cue.
- Modify: `apps/mobile/src/features/tasks/screens/TaskCategoryScreen.tsx`
  - Uses guided context at the start of the wizard and keeps category selection tap-to-advance.
- Modify: `apps/mobile/src/features/tasks/screens/TaskIntakeScreen.tsx`
  - Makes structured scope guidance visible before schema fields.
- Modify: `apps/mobile/src/features/tasks/screens/TaskPhotosScreen.tsx`
  - Keeps photos optional while explaining why evidence helps taskers quote and apply.
- Modify: `apps/mobile/src/features/tasks/screens/TaskLocation/Screen.tsx`
  - Adds address privacy copy: approximate location before booking, exact address after confirmed booking.
- Modify: `apps/mobile/src/features/tasks/screens/TaskScheduleScreen.tsx`
  - Keeps budget and quote modes explicit and adds a compact price-summary cue.
- Modify: `apps/mobile/src/features/tasks/screens/TaskReviewSubmitScreen.tsx`
  - Turns the review step into the proof anchor for deterministic summary, address privacy, pricing mode, and next-step guidance.
- Modify: `apps/mobile/src/features/tasks/screens/TaskSuccessScreen.tsx`
  - Confirms what happens next after posting without promising instant match, payment protection, or open chat.
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`
- Test: `apps/mobile/__tests__/features/tasks/components/PostingGuidance.test.tsx`
- Test: `apps/mobile/__tests__/features/tasks/screens/TaskReviewSubmitScreen.test.tsx`

## Task 1: Add Tests For Proof-Local Posting Guidance

**Files:**

- Create: `apps/mobile/__tests__/features/tasks/components/PostingGuidance.test.tsx`
- Create: `apps/mobile/__tests__/features/tasks/screens/TaskReviewSubmitScreen.test.tsx`

- [ ] **Step 1: Add component tests for reusable guidance modules**

Create `apps/mobile/__tests__/features/tasks/components/PostingGuidance.test.tsx` with tests that assert the reusable modules render i18n-backed copy and no forbidden Phase 1 claims.

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import {
  PostingGuidanceCard,
  PostingProofChecklist,
} from '@/features/tasks/components/PostingGuidance';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('PostingGuidance proof-local components', () => {
  it('renders a guided proof card from locale keys', () => {
    render(
      <PostingGuidanceCard
        titleKey="PostingGuidance.structuredTitle"
        bodyKey="PostingGuidance.structuredBody"
        testID="posting-guidance-structured"
      />,
    );

    expect(screen.getByTestId('posting-guidance-structured')).toBeTruthy();
    expect(screen.getByText('Structured tasks get clearer applications')).toBeTruthy();
    expect(screen.queryByText(/payment protection/i)).toBeNull();
    expect(screen.queryByText(/escrow/i)).toBeNull();
  });

  it('renders the posting proof checklist in the planned order', () => {
    render(<PostingProofChecklist testID="posting-proof-checklist" />);

    expect(screen.getByText('Structured scope')).toBeTruthy();
    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(screen.getByText('Budget or quote is clear')).toBeTruthy();
    expect(screen.getByText('Taskers apply with structured responses')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Add screen-level proof contract tests**

Create `apps/mobile/__tests__/features/tasks/screens/TaskReviewSubmitScreen.test.tsx`. Mock screen dependencies rather than the i18n function, then assert that each posting proof cue appears on at least one screen in the posting flow.

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import TaskLocationScreen from '@/features/tasks/screens/TaskLocation';
import TaskReviewSubmitScreen from '@/features/tasks/screens/TaskReviewSubmitScreen';
import TaskScheduleScreen from '@/features/tasks/screens/TaskScheduleScreen';
import TaskSuccessScreen from '@/features/tasks/screens/TaskSuccessScreen';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ draftId: 'draft-1', taskId: 'task-1' }),
}));

describe('customer posting redesign proof contract', () => {
  beforeEach(() => {
    resetTestI18n();
    setTestLanguage('en');
  });

  it('shows address privacy on the location step', () => {
    render(<TaskLocationScreen />);

    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(
      screen.getByText('The exact address is shared only after booking is confirmed.'),
    ).toBeTruthy();
  });

  it('keeps budget and quote modes explicit on the schedule step', () => {
    render(<TaskScheduleScreen />);

    expect(screen.getByText('I have a budget')).toBeTruthy();
    expect(screen.getByText('I want quotes')).toBeTruthy();
  });

  it('summarizes structured scope, location privacy, pricing, and next steps on review', () => {
    render(<TaskReviewSubmitScreen />);

    expect(screen.getByText('Review before posting')).toBeTruthy();
    expect(screen.getByText('Structured scope')).toBeTruthy();
    expect(screen.getByText('Approximate location first')).toBeTruthy();
    expect(screen.getByText('Budget or quote is clear')).toBeTruthy();
  });

  it('explains next steps after posting without payment-protection claims', () => {
    render(<TaskSuccessScreen />);

    expect(screen.getByText('What happens next')).toBeTruthy();
    expect(screen.queryByText(/payment protection/i)).toBeNull();
    expect(screen.queryByText(/escrow/i)).toBeNull();
  });
});
```

- [ ] **Step 3: Run the new tests and confirm they fail before implementation**

```bash
pnpm --filter @tasky/mobile test:unit -- TaskReviewSubmitScreen.test.tsx PostingGuidance.test.tsx
```

Expected: fail because `PostingGuidance.tsx` and the new locale keys do not exist yet.

## Task 2: Implement Proof-Local Posting Guidance Components

**Files:**

- Create: `apps/mobile/src/features/tasks/components/PostingGuidance.tsx`

- [ ] **Step 1: Create `PostingGuidance.tsx`**

Implement two proof-local components. Keep them in `features/tasks/components/` because they are reused across several task-posting screens.

```tsx
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

type PostingGuidanceCardProps = {
  titleKey: string;
  bodyKey: string;
  testID?: string;
  className?: string;
};

export function PostingGuidanceCard({
  titleKey,
  bodyKey,
  testID,
  className,
}: PostingGuidanceCardProps) {
  const { t } = useTranslation();

  return (
    <View testID={testID} className={cn('rounded-md bg-muted p-md gap-xs', className)}>
      <Text className="text-label font-sans-bold text-primary-deep">{t(titleKey)}</Text>
      <Text className="text-caption text-text-secondary leading-relaxed">{t(bodyKey)}</Text>
    </View>
  );
}

const checklistKeys = [
  'PostingGuidance.checkStructuredScope',
  'PostingGuidance.checkAddressPrivacy',
  'PostingGuidance.checkPricingClarity',
  'PostingGuidance.checkStructuredApplications',
] as const;

type PostingProofChecklistProps = {
  testID?: string;
};

export function PostingProofChecklist({ testID }: PostingProofChecklistProps) {
  const { t } = useTranslation();

  return (
    <View testID={testID} className="rounded-md bg-card p-md gap-sm">
      {checklistKeys.map((key) => (
        <View key={key} className="flex-row items-start gap-sm">
          <CheckCircle2 size={16} color={colors.verified} />
          <Text className="flex-1 text-caption text-text-secondary leading-relaxed">{t(key)}</Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Import the components directly from the task component module**

No barrel export is required for this slice. Posting screens should import the proof-local components directly:

```tsx
import {
  PostingGuidanceCard,
  PostingProofChecklist,
} from '@/features/tasks/components/PostingGuidance';
```

- [ ] **Step 3: Run the component tests**

```bash
pnpm --filter @tasky/mobile test:unit -- PostingGuidance.test.tsx
```

Expected: tests still fail only because locale keys are not present.

## Task 3: Add Locale Keys For The Posting Proof Slice

**Files:**

- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`

- [ ] **Step 1: Add English keys under a new `PostingGuidance` namespace**

Add this object to `apps/mobile/src/locales/en/translation.json` in alphabetical namespace order.

```json
"PostingGuidance": {
  "structuredTitle": "Structured tasks get clearer applications",
  "structuredBody": "The details you add here become the task record taskers use to apply.",
  "addressPrivacyTitle": "Approximate location first",
  "addressPrivacyBody": "The exact address is shared only after booking is confirmed.",
  "pricingTitle": "Budget or quote is clear",
  "pricingBody": "Choose a posted budget or ask verified taskers to send structured quotes.",
  "summaryTitle": "Review before posting",
  "summaryBody": "Check scope, photos, location, schedule, and pricing before the task goes live.",
  "nextStepsTitle": "What happens next",
  "nextStepsBody": "Verified taskers can apply. You choose from structured applications when they arrive.",
  "checkStructuredScope": "Structured scope",
  "checkAddressPrivacy": "Approximate location first",
  "checkPricingClarity": "Budget or quote is clear",
  "checkStructuredApplications": "Taskers apply with structured responses"
}
```

- [ ] **Step 2: Add Mongolian keys with identical placeholders**

Add the same key set to `apps/mobile/src/locales/mn/translation.json`. Use natural Mongolian copy and keep interpolation placeholders absent in both locales.

- [ ] **Step 3: Validate i18n**

```bash
pnpm verify:i18n
```

Expected: pass with identical key shape across mobile locales.

## Task 4: Wire Guidance Into Posting Screens

**Files:**

- Modify: `apps/mobile/src/features/tasks/screens/TaskCategoryScreen.tsx`
- Modify: `apps/mobile/src/features/tasks/screens/TaskIntakeScreen.tsx`
- Modify: `apps/mobile/src/features/tasks/screens/TaskPhotosScreen.tsx`
- Modify: `apps/mobile/src/features/tasks/screens/TaskLocation/Screen.tsx`
- Modify: `apps/mobile/src/features/tasks/screens/TaskScheduleScreen.tsx`

- [ ] **Step 1: Add category and intake guidance**

In `TaskCategoryScreen.tsx`, render `PostingGuidanceCard` above the category list with:

```tsx
<PostingGuidanceCard
  titleKey="PostingGuidance.structuredTitle"
  bodyKey="PostingGuidance.structuredBody"
  testID="posting-guidance-structured"
/>
```

In `TaskIntakeScreen.tsx`, render the same card below the header copy and above the description field.

- [ ] **Step 2: Add photo guidance without making photos required**

In `TaskPhotosScreen.tsx`, render `PostingGuidanceCard` below the hero copy with:

```tsx
<PostingGuidanceCard
  titleKey="PostingGuidance.summaryTitle"
  bodyKey="PostingGuidance.summaryBody"
  testID="posting-guidance-photos-summary"
/>
```

Keep `nextLabel={photos.length > 0 ? t('common.continue') : t('Photos.photosSkip')}` unchanged.

- [ ] **Step 3: Add location privacy guidance**

In `TaskLocation/Screen.tsx`, render `PostingGuidanceCard` below the location instruction with:

```tsx
<PostingGuidanceCard
  titleKey="PostingGuidance.addressPrivacyTitle"
  bodyKey="PostingGuidance.addressPrivacyBody"
  testID="posting-guidance-address-privacy"
/>
```

Do not display an exact address after this screen. Keep `LocationStatusCard` behavior unchanged.

- [ ] **Step 4: Add pricing clarity guidance**

In `TaskScheduleScreen.tsx`, render `PostingGuidanceCard` immediately above `PricingModeSelector` with:

```tsx
<PostingGuidanceCard
  titleKey="PostingGuidance.pricingTitle"
  bodyKey="PostingGuidance.pricingBody"
  testID="posting-guidance-pricing"
/>
```

Keep the existing `PricingModeSelector`, `BudgetField`, and `QuoteModeNotice` branching unchanged.

- [ ] **Step 5: Run focused tests**

```bash
pnpm --filter @tasky/mobile test:unit -- TaskReviewSubmitScreen.test.tsx PostingGuidance.test.tsx TaskSchedule.PricingMode.test.tsx
```

Expected: pass.

## Task 5: Make Review And Success The Proof Anchors

**Files:**

- Modify: `apps/mobile/src/features/tasks/screens/TaskReviewSubmitScreen.tsx`
- Modify: `apps/mobile/src/features/tasks/screens/TaskSuccessScreen.tsx`

- [ ] **Step 1: Add checklist to the review screen**

In `TaskReviewSubmitScreen.tsx`, render `PostingProofChecklist` below the review title and before the first `SectionCard`.

```tsx
<PostingProofChecklist testID="posting-proof-checklist" />
```

Keep every existing edit route and submit call unchanged.

- [ ] **Step 2: Add next-step guidance to the success screen**

In `TaskSuccessScreen.tsx`, render `PostingGuidanceCard` inside the existing next-step card or immediately above it with:

```tsx
<PostingGuidanceCard
  titleKey="PostingGuidance.nextStepsTitle"
  bodyKey="PostingGuidance.nextStepsBody"
  testID="posting-guidance-next-steps"
/>
```

Do not add copy that says "matched", "booked", "protected", "escrow", "payment hold", or "chat now".

- [ ] **Step 3: Run focused tests**

```bash
pnpm --filter @tasky/mobile test:unit -- TaskReviewSubmitScreen.test.tsx PostingGuidance.test.tsx
```

Expected: pass.

## Task 6: Validate Architecture, Copy, And Runtime Health

**Files:**

- Review all files changed by this plan.

- [ ] **Step 1: Run mobile i18n validation**

```bash
pnpm verify:i18n
```

Expected: pass.

- [ ] **Step 2: Run mobile typecheck and tests**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

Expected: both pass.

- [ ] **Step 3: Run mobile lint and structure checks**

```bash
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile structure:check
```

Expected: both pass. `structure:check` must not report new `screens/` loose-file violations.

- [ ] **Step 4: Run docs checks if screen specs or design docs changed again**

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Expected: both pass.

- [ ] **Step 5: Check dirty scope before commit**

```bash
git status --short
git diff -- apps/mobile/src/features/tasks/components/PostingGuidance.tsx apps/mobile/src/features/tasks/screens/TaskCategoryScreen.tsx apps/mobile/src/features/tasks/screens/TaskIntakeScreen.tsx apps/mobile/src/features/tasks/screens/TaskPhotosScreen.tsx apps/mobile/src/features/tasks/screens/TaskLocation/Screen.tsx apps/mobile/src/features/tasks/screens/TaskScheduleScreen.tsx apps/mobile/src/features/tasks/screens/TaskReviewSubmitScreen.tsx apps/mobile/src/features/tasks/screens/TaskSuccessScreen.tsx apps/mobile/src/locales/en/translation.json apps/mobile/src/locales/mn/translation.json apps/mobile/__tests__/features/tasks/components/PostingGuidance.test.tsx apps/mobile/__tests__/features/tasks/screens/TaskReviewSubmitScreen.test.tsx
```

Expected: diff contains only the mobile customer-posting proof slice.

- [ ] **Step 6: Commit if the execution brief asks for a commit**

```bash
git add apps/mobile/src/features/tasks/components/PostingGuidance.tsx apps/mobile/src/features/tasks/screens/TaskCategoryScreen.tsx apps/mobile/src/features/tasks/screens/TaskIntakeScreen.tsx apps/mobile/src/features/tasks/screens/TaskPhotosScreen.tsx apps/mobile/src/features/tasks/screens/TaskLocation/Screen.tsx apps/mobile/src/features/tasks/screens/TaskScheduleScreen.tsx apps/mobile/src/features/tasks/screens/TaskReviewSubmitScreen.tsx apps/mobile/src/features/tasks/screens/TaskSuccessScreen.tsx apps/mobile/src/locales/en/translation.json apps/mobile/src/locales/mn/translation.json apps/mobile/__tests__/features/tasks/components/PostingGuidance.test.tsx apps/mobile/__tests__/features/tasks/screens/TaskReviewSubmitScreen.test.tsx
git commit -m "feat(mobile): apply customer posting redesign proof slice"
```

Do not stage unrelated docs, backend, web, OpenAPI, SDK, or generated artifacts.

## Self-Review

- Spec coverage: This plan covers guided density, structured scope, address privacy, pricing clarity, deterministic summary review, and next-step guidance for `SCR-CUST-002` through `SCR-CUST-008`.
- Scope check: This is a single mobile runtime slice. Tasker feed, applicant review, booking detail, profile, and web redesign remain separate slices.
- Placeholder scan: This plan contains no placeholder markers and no deferred implementation slots.
- Type consistency: The new component names are `PostingGuidanceCard` and `PostingProofChecklist`; tests and screen wiring use the same names.
