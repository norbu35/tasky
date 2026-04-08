# Mobile i18n Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all hardcoded user-visible strings from the mobile app so every screen uses `t()` from `react-i18next`, with both `en` and `mn` translation files fully covering all keys used in code.

**Architecture:** The app already has a working i18n setup (`i18next` + `react-i18next`, `locales/en/translation.json` and `locales/mn/translation.json`, default locale `mn`). The problem is threefold:
1. **366 keys used in code via `t()` that don't exist in the translation JSON files** — these fall back to inline English defaults silently
2. **~30 hardcoded strings in 8 files** that bypass `t()` entirely (mix of English and Mongolian)
3. **284 orphaned keys** in the translation files that are no longer referenced in code (legacy key structure from earlier naming conventions)

The plan does NOT restructure the key hierarchy. It adds missing keys to both JSON files, replaces hardcoded strings with `t()` calls, and removes orphaned keys. The screen-spec copy sections (`docs/design/screen-specs/SCR-*.yaml`) are the authoritative source for Mongolian translations.

**Tech Stack:** React Native (Expo), TypeScript, react-i18next, JSON translation files

**Pre-requisite:** The 12 duplicate `testID` errors listed in `docs/plans/2026-04-05-maestro-setup-handoff.md` Step A should be fixed first so `pnpm --filter @tasky/mobile typecheck` passes. If they haven't been fixed yet, do that before starting Task 1.

---

## Current State Summary

| Metric | Count |
|---|---|
| Keys in `en/translation.json` | 670 |
| Keys in `mn/translation.json` | 670 |
| Unique `t()` keys used in code | 752 |
| Keys in code missing from JSON | 366 |
| Orphaned keys in JSON not in code | 284 |
| Files with hardcoded English strings in props | 4 |
| Files with hardcoded Cyrillic inline text | 8 |
| Files in `app/` missing `useTranslation` import | 18 |

### Files with hardcoded strings (must be converted to `t()`)

**English in props:**
- `apps/mobile/src/app/(tasker)/credits/history.tsx` (2 strings)
- `apps/mobile/src/app/(tasker)/credits/index.tsx` (1 string)
- `apps/mobile/src/app/(tabs)/inbox/_layout.tsx` (1 string)
- `apps/mobile/src/features/auth/components/LoginForm.tsx` (2 strings — dev bypass, acceptable to leave)

**Mongolian inline text (bypasses `t()`):**
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx` (11 strings)
- `apps/mobile/src/app/(tasker)/subscription.tsx` (6 strings)
- `apps/mobile/src/app/(tasker)/wallet/index.tsx` (4 strings)
- `apps/mobile/src/app/(tasker)/wallet/payout.tsx` (4 strings)
- `apps/mobile/src/app/(tasker)/verification/dan.tsx` (2 strings)
- `apps/mobile/src/components/ui/LanguageSwitcher.tsx` (1 string — "Монгол", acceptable as language name)
- `apps/mobile/src/features/matching/components/InstantMatchTaskerSheet.tsx` (3 strings)
- `apps/mobile/src/app/(shared)/legal/terms.tsx` (1 string)

### Key namespace mapping

The translation files have **two parallel naming conventions** from different development phases:

| Old (flat) | New (nested) | Status |
|---|---|---|
| `taskPost.*` | `customer.postTask.*` | Both exist; code uses new |
| `taskDetails.*` | `customer.taskDetail.*` | Both exist; code uses new |
| `taskDetail.*` | `customer.taskDetail.*` (customer) / `tasker.taskDetail.*` (tasker) | Both exist |
| `applicants.*` | `customer.applicants.*` | Both exist; code uses new |
| `booking.*` | `customer.bookings.*` | Both exist; code uses new |
| `bookingList.*` | `customer.bookings.*` | Both exist; code uses new |
| `verification.*` | `tasker.verification.*` | Both exist; code uses new |
| `createTask.*` | `customer.postTask.*` | Both exist; code uses new |
| `onboarding.*` | `auth.onboarding.*` | Both exist; code uses new |
| `review.*` | `shared.review.*` | Both exist; code uses new |
| `chat.*` | `shared.inbox.*` | Both exist; code uses new |
| `profile.*` | `shared.profile.*` | Both exist; code uses new |
| `notifications.*` | `shared.notifications.*` | Both exist; code uses new |
| `reschedule.*` | `customer.bookings.*` | Both exist; code uses new |

---

### Task 1: Fix duplicate testID errors (pre-requisite)

**Files:**
- Modify: 12 files listed in `docs/plans/2026-04-05-maestro-setup-handoff.md` Step A

**Step 1: Run typecheck to confirm the errors**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "multiple attributes"
```

Expected: 12 errors about duplicate `testID`.

**Step 2: For each file, keep `SCR-*` testID, remove legacy testID**

Open each file listed below. Find the root component (`ScreenContainer`, `DetailTemplate`, `FormWizardTemplate`, `FeedListTemplate`, `SuccessCelebrationTemplate`, or `ErrorStateTemplate`). It will have two `testID` props. Keep the one that starts with `SCR-`, remove the other.

Files:
1. `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
2. `apps/mobile/src/app/(customer)/rebook.tsx`
3. `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
4. `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
5. `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
6. `apps/mobile/src/app/(shared)/profile/edit.tsx`
7. `apps/mobile/src/app/(tabs)/profile.tsx`
8. `apps/mobile/src/app/(tasker)/credits/pay.tsx`
9. `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
10. `apps/mobile/src/app/(tasker)/profile/polish.tsx`
11. `apps/mobile/src/app/(tasker)/verification/approved.tsx`
12. `apps/mobile/src/app/(tasker)/verification/submitted.tsx`

**Step 3: Run typecheck to confirm zero duplicate testID errors**

```bash
pnpm --filter @tasky/mobile typecheck
```

Expected: PASS (or other unrelated warnings only).

**Step 4: Run tests**

```bash
pnpm --filter @tasky/mobile test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/mobile/src/app
git commit -m "fix(mobile): remove duplicate testID props in 12 screen files

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 2: Generate the missing translation keys and add them to both JSON files

This is the largest task. It adds the 366 missing keys to both `en/translation.json` and `mn/translation.json`.

**Files:**
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`
- Reference: `docs/design/screen-specs/SCR-*.yaml` (for Mongolian copy)

**Step 1: Extract all `t()` keys from the codebase**

Run:

```bash
rg -g '*.tsx' -g '*.ts' -o "t\('([^']+)'" -r '$1' --no-filename apps/mobile/src/ | sort -u > /tmp/code-keys.txt
wc -l /tmp/code-keys.txt
```

**Step 2: Extract all keys from the current EN translation file**

Run:

```bash
python3 -c "
import json
from pathlib import Path

def flatten(d, prefix=''):
    items = []
    for k,v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            items.extend(flatten(v, key))
        else:
            items.append(key)
    return items

en = json.loads(Path('apps/mobile/src/locales/en/translation.json').read_text())
for k in sorted(flatten(en)):
    print(k)
" > /tmp/json-keys.txt
wc -l /tmp/json-keys.txt
```

**Step 3: Compute the missing keys**

```bash
comm -23 /tmp/code-keys.txt /tmp/json-keys.txt | grep '\.' > /tmp/missing-keys.txt
wc -l /tmp/missing-keys.txt
```

Expected: ~366 keys.

**Step 4: For each missing key, determine the English text**

The English text is available from the inline fallback in the `t()` call. The pattern in the codebase is:

```typescript
t('customer.postTask.scheduleLabel', 'Schedule')
```

The second argument is the English fallback. Extract these:

```bash
rg -g '*.tsx' -g '*.ts' -o "t\('([^']+)',\s*'([^']+)'" -r '$1 ||| $2' --no-filename apps/mobile/src/ | sort -u > /tmp/key-fallbacks.txt
head -20 /tmp/key-fallbacks.txt
```

For keys where the fallback matches an existing key's value (meaning the developer used a different key path but same text), use that text.

For keys with no inline fallback (the developer wrote `t('some.key')` without a second argument), look up the key in the screen spec copy sections. The key naming convention maps to screen specs as follows:
- `customer.postTask.*` → `docs/design/screen-specs/SCR-CUST-002.yaml` through `SCR-CUST-008.yaml`
- `customer.bookings.*` → `SCR-CUST-014.yaml` through `SCR-CUST-023.yaml`
- `customer.taskDetail.*` → `SCR-CUST-009.yaml`
- `customer.applicants.*` → `SCR-CUST-011.yaml`
- `customer.disputes.*` → `SCR-CUST-024.yaml`, `SCR-CUST-025.yaml`
- `tasker.browse.*` → `SCR-TASK-001.yaml`
- `tasker.taskDetail.*` → `SCR-TASK-002.yaml`
- `tasker.verification.*` → `SCR-TASK-003.yaml` through `SCR-TASK-010.yaml`
- `tasker.jobs.*` → `SCR-TASK-012.yaml` through `SCR-TASK-015.yaml`
- `tasker.stats.*` → `SCR-TASK-016.yaml`
- `tasker.profilePolish.*` → `SCR-TASK-019.yaml`
- `tasker.credits.*` → `SCR-P2-001.yaml` through `SCR-P2-003.yaml`
- `shared.profile.*` → `SCR-SHARED-012.yaml`, `SCR-SHARED-013.yaml`
- `shared.settings.*` → `SCR-SHARED-014.yaml`, `SCR-SHARED-015.yaml`
- `shared.review.*` → `SCR-SHARED-017.yaml`
- `shared.inbox.*` → `SCR-SHARED-010.yaml`, `SCR-SHARED-011.yaml`
- `shared.notifications.*` → `SCR-SHARED-016.yaml`
- `shared.account.*` → `SCR-SHARED-020.yaml`, `SCR-SHARED-021.yaml`
- `matching.instantMatch.*` → `SCR-CUST-027.yaml`
- `wizard.*` → shared template keys (use English fallback from code)
- `error.*`, `feed.*`, `detail.*`, `success.*` → shared template keys

**Step 5: Write a script that adds missing keys to both JSON files**

Create a temporary script (do NOT commit it):

```bash
cat > /tmp/add-missing-keys.py << 'SCRIPT'
import json
from pathlib import Path

# This dict contains ALL 366 missing keys with their EN and MN values.
# Format: { "dotted.key": {"en": "English text", "mn": "Mongolian text"} }
MISSING_KEYS = {
    # FILL THIS IN from step 4 output + screen spec lookups
    # Example:
    # "customer.postTask.scheduleLabel": {"en": "Schedule", "mn": "Хуваарь"},
}

def set_nested(d, key, value):
    parts = key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

for lang in ['en', 'mn']:
    path = Path(f'apps/mobile/src/locales/{lang}/translation.json')
    data = json.loads(path.read_text())
    for key, translations in MISSING_KEYS.items():
        set_nested(data, key, translations[lang])
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Updated {path}")
SCRIPT
```

**CRITICAL INSTRUCTION FOR HAIKU:** You must fill in the `MISSING_KEYS` dict by:
1. Reading the fallback strings from `/tmp/key-fallbacks.txt`
2. For keys without fallbacks, reading the matching screen spec's `copy:` section for the `mn` value, and deriving the `en` value from the key name or existing patterns
3. For `wizard.*`, `error.*`, `feed.*`, `detail.*`, `success.*` template keys: use the inline English fallback from the `t()` call for EN, and translate to Mongolian following existing translation style

**Step 6: Run the script**

```bash
python3 /tmp/add-missing-keys.py
```

**Step 7: Verify no missing keys remain**

```bash
python3 -c "
import json, re, subprocess
from pathlib import Path

en = json.loads(Path('apps/mobile/src/locales/en/translation.json').read_text())

def flatten(d, prefix=''):
    items = set()
    for k,v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            items.update(flatten(v, key))
        else:
            items.add(key)
    return items

en_keys = flatten(en)

result = subprocess.run(
    ['rg', '-g', '*.tsx', '-g', '*.ts', '-o', \"t\\\('([^']+)'\", '-r', '\$1',
     '--no-filename', 'apps/mobile/src/'],
    capture_output=True, text=True
)
code_keys = set()
for line in result.stdout.strip().splitlines():
    k = line.strip()
    if k and '.' in k:
        code_keys.add(k)

missing = code_keys - en_keys
print(f'Missing: {len(missing)}')
for k in sorted(missing):
    print(f'  {k}')
"
```

Expected: `Missing: 0`

**Step 8: Verify EN and MN have same key count**

```bash
python3 -c "
import json
from pathlib import Path

def count_keys(d):
    n = 0
    for v in d.values():
        if isinstance(v, dict):
            n += count_keys(v)
        else:
            n += 1
    return n

en = json.loads(Path('apps/mobile/src/locales/en/translation.json').read_text())
mn = json.loads(Path('apps/mobile/src/locales/mn/translation.json').read_text())
print(f'EN: {count_keys(en)}, MN: {count_keys(mn)}')
"
```

Expected: both counts equal.

**Step 9: Run typecheck and tests**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

Expected: PASS.

**Step 10: Commit**

```bash
git add apps/mobile/src/locales
git commit -m "feat(i18n): add 366 missing translation keys to en and mn

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 3: Convert hardcoded English strings to `t()` calls

**Files:**
- Modify: `apps/mobile/src/app/(tasker)/credits/history.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/_layout.tsx`

**Step 1: Open each file and replace hardcoded English props with `t()` calls**

For each file:
1. Add `import { useTranslation } from 'react-i18next';` if not already present
2. Add `const { t } = useTranslation();` at the top of the component function
3. Replace hardcoded strings with `t('key')` calls using the keys that already exist (or were added in Task 2)

**`apps/mobile/src/app/(tasker)/credits/history.tsx`:**
- `title="No credit activity yet"` → `title={t('tasker.credits.emptyTitle', 'No credit activity yet')}`
- `description="Top up credits..."` → `description={t('tasker.credits.emptyDescription', 'Top up credits or finish more tasks to populate this timeline.')}`

**`apps/mobile/src/app/(tasker)/credits/index.tsx`:**
- `description="Task applications are moving fast..."` → `description={t('tasker.credits.lowBalanceDescription', 'Task applications are moving fast. Add credits before your balance drops to zero.')}`

**`apps/mobile/src/app/(tabs)/inbox/_layout.tsx`:**
- `message="You need to be logged in..."` → `message={t('auth.loginReason')}`

**Step 2: Ensure the new keys exist in translation files**

If any of the keys you used in Step 1 were NOT added in Task 2, add them now to both `en/translation.json` and `mn/translation.json`.

**Step 3: Run typecheck and tests**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/mobile/src/app/(tasker)/credits apps/mobile/src/app/(tabs)/inbox apps/mobile/src/locales
git commit -m "fix(i18n): replace hardcoded English strings with t() in credits and inbox

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 4: Convert hardcoded Mongolian strings to `t()` calls — escrow screen

**Files:**
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx`
- Modify: `apps/mobile/src/locales/en/translation.json` (if new keys needed)
- Modify: `apps/mobile/src/locales/mn/translation.json` (if new keys needed)
- Reference: `docs/design/screen-specs/SCR-P3-003.yaml`

**Step 1: Read the file and identify all hardcoded Cyrillic strings**

There are 11 hardcoded Mongolian strings in this file. Each one is a `<Text>` element with inline Mongolian text.

**Step 2: Map each string to a translation key**

Use the namespace `customer.bookings.escrow.*` for escrow-specific strings. Example mappings:

| Hardcoded Mongolian | Key | EN translation |
|---|---|---|
| `Эскроу төлбөр` | `customer.bookings.escrow.title` | `Escrow Payment` |
| `Эскроу төлбөрөөр хамгаалалт нэмэх` | `customer.bookings.escrow.optInTitle` | `Add protection with escrow payment` |
| `Мөнгөн хамгаалалт` | `customer.bookings.escrow.featureProtection` | `Money protection` |
| `Маргаан шийдвэрлэх боломж` | `customer.bookings.escrow.featureDispute` | `Dispute resolution` |
| `Автомат шилжүүлэг` | `customer.bookings.escrow.featureAutoTransfer` | `Automatic transfer` |
| `Баталгаажуулах` | `customer.bookings.escrow.confirmTitle` | `Confirm` |
| `Буцах` | `customer.bookings.escrow.cancelText` | `Go back` |
| `Төлбөр амжилтгүй` | `customer.bookings.escrow.paymentFailed` | `Payment failed` |
| `Төлбөр баталгаажлаа` | `customer.bookings.escrow.paymentConfirmed` | `Payment confirmed` |
| `Эскроу амжилттай!` | `customer.bookings.escrow.escrowSuccess` | `Escrow successful!` |
| `Төлбөр аюулгүй эскроу дансанд хадгалагдаж байна.` | `customer.bookings.escrow.escrowHeldDescription` | `Payment is securely held in escrow.` |

**Step 3: Add `useTranslation` import and `t()` calls**

1. Add `import { useTranslation } from 'react-i18next';`
2. Add `const { t } = useTranslation();` at top of component
3. Replace each `<Text ...>Mongolian text</Text>` with `<Text ...>{t('customer.bookings.escrow.keyName')}</Text>`

**Step 4: Add keys to both translation files**

Add all new `customer.bookings.escrow.*` keys to both `en/translation.json` and `mn/translation.json`.

**Step 5: Run typecheck and tests**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

**Step 6: Commit**

```bash
git add apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx apps/mobile/src/locales
git commit -m "fix(i18n): convert escrow screen hardcoded Mongolian to t() calls

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 5: Convert hardcoded Mongolian strings to `t()` calls — subscription screen

**Files:**
- Modify: `apps/mobile/src/app/(tasker)/subscription.tsx`
- Reference: `docs/design/screen-specs/SCR-P3-004.yaml`

**Step 1: Identify all 6 hardcoded strings**

**Step 2: Map to keys under `tasker.subscription.*`**

| Hardcoded Mongolian | Key | EN |
|---|---|---|
| `Tasker Pro болоорой` | `tasker.subscription.heroTitle` | `Become a Tasker Pro` |
| `Priority boost болон нэмэлт боломжууд.` | `tasker.subscription.heroDescription` | `Priority boost and additional benefits.` |
| `Шаардлага хангаагүй` | `tasker.subscription.ineligibleTitle` | `Not eligible` |
| `Стандарт` | `tasker.subscription.planStandard` | `Standard` |
| `Премиум` | `tasker.subscription.planPremium` | `Premium` |
| `Идэвхтэй` | `tasker.subscription.activeLabel` | `Active` |
| `Илүү харагдах байдал ба илүү итгэлцэл.` | `tasker.subscription.planStandardDesc` | `More visibility and more trust.` |
| `Tasker Pro subscription-ийг идэвхжүүлэх үү?` | `tasker.subscription.confirmBody` | `Activate Tasker Pro subscription?` |
| `Сонголтоо шалгана уу` | `tasker.subscription.confirmTitle` | `Confirm your choice` |

**Step 3: Add `useTranslation`, replace strings, add to both JSON files**

**Step 4: Run typecheck and tests**

**Step 5: Commit**

```bash
git add apps/mobile/src/app/(tasker)/subscription.tsx apps/mobile/src/locales
git commit -m "fix(i18n): convert subscription screen hardcoded Mongolian to t() calls

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 6: Convert hardcoded Mongolian strings to `t()` calls — wallet screens

**Files:**
- Modify: `apps/mobile/src/app/(tasker)/wallet/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/wallet/payout.tsx`
- Reference: `docs/design/screen-specs/SCR-P3-001.yaml`, `SCR-P3-002.yaml`

**Step 1: Identify all 8 hardcoded strings across both files**

**wallet/index.tsx (4 strings):**

| Hardcoded | Key | EN |
|---|---|---|
| `Хэтэвч` | `tasker.wallet.title` | `Wallet` |
| `Боломжит үлдэгдэл` | `tasker.wallet.availableBalance` | `Available Balance` |
| `Нийт орлого` | `tasker.wallet.totalEarnings` | `Total Earnings` |
| `Хүлээгдэж буй` | `tasker.wallet.pending` | `Pending` |

**wallet/payout.tsx (4 strings):**

| Hardcoded | Key | EN |
|---|---|---|
| `Мөнгө татах` | `tasker.wallet.payoutTitle` | `Request Payout` |
| `Боломжит үлдэгдэл: ₮120,000` | `tasker.wallet.payoutBalance` | `Available balance: ₮120,000` |
| `Хамгийн бага дүн: ₮10,000` | `tasker.wallet.payoutMinError` | `Minimum amount: ₮10,000` |
| `Хүсэлт амжилттай илгээгдлээ` | `tasker.wallet.payoutSuccess` | `Request submitted successfully` |

**Step 2: Add `useTranslation`, replace strings, add to both JSON files**

**Step 3: Run typecheck and tests**

**Step 4: Commit**

```bash
git add apps/mobile/src/app/(tasker)/wallet apps/mobile/src/locales
git commit -m "fix(i18n): convert wallet screens hardcoded Mongolian to t() calls

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 7: Convert remaining hardcoded strings — DAN verification and InstantMatch

**Files:**
- Modify: `apps/mobile/src/app/(tasker)/verification/dan.tsx`
- Modify: `apps/mobile/src/features/matching/components/InstantMatchTaskerSheet.tsx`
- Reference: `docs/design/screen-specs/SCR-TASK-006.yaml`, `SCR-P3-005.yaml`

**dan.tsx (2 strings):**

| Hardcoded | Key | EN |
|---|---|---|
| `Хурдан баталгаажуулалт` | `tasker.verification.danTitle` | `Fast-track verification` |
| `Баталгаажуулалт амжилттай!` | `tasker.verification.danSuccess` | `Verification successful!` |

**InstantMatchTaskerSheet.tsx (3 strings):**
Identify the 3 Mongolian strings and map them under `matching.instantMatch.*`.

**Step 1: Add `useTranslation`, replace strings, add to both JSON files**

**Step 2: Run typecheck and tests**

**Step 3: Commit**

```bash
git add apps/mobile/src/app/(tasker)/verification/dan.tsx apps/mobile/src/features/matching apps/mobile/src/locales
git commit -m "fix(i18n): convert DAN verification and instant match hardcoded strings to t()

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 8: Remove orphaned translation keys

**Files:**
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`

**Step 1: Identify orphaned top-level namespaces**

These entire top-level sections are legacy and their content has been migrated to nested namespaces. All their keys exist under the new namespace already:

- `taskPost` → migrated to `customer.postTask`
- `taskDetails` → migrated to `customer.taskDetail`
- `taskDetail` → migrated to `customer.taskDetail` / `tasker.taskDetail`
- `applicants` → migrated to `customer.applicants`
- `booking` → migrated to `customer.bookings`
- `bookingList` → migrated to `customer.bookings`
- `verification` → migrated to `tasker.verification`
- `createTask` → migrated to `customer.postTask`
- `onboarding` → migrated to `auth.onboarding`
- `review` → migrated to `shared.review`
- `chat` → migrated to `shared.inbox`
- `profile` → migrated to `shared.profile`
- `notifications` → migrated to `shared.notifications`
- `reschedule` → migrated to `customer.bookings`

**Step 2: Before removing, verify none of these old keys are used in code**

Run:

```bash
for ns in taskPost taskDetails taskDetail applicants booking bookingList verification createTask onboarding review chat profile notifications reschedule; do
  count=$(rg -g '*.tsx' -g '*.ts' -c "t\('${ns}\." apps/mobile/src/ 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
  echo "$ns: $count usages"
done
```

Expected: all 0, confirming these are orphaned.

**If any show non-zero:** Do NOT remove that namespace. Investigate whether the code should be migrated to the new key or the old key should stay.

**Step 3: Remove the orphaned top-level keys from both files**

Write a script:

```python
import json
from pathlib import Path

ORPHANED = [
    'taskPost', 'taskDetails', 'taskDetail', 'applicants',
    'booking', 'bookingList', 'verification', 'createTask',
    'onboarding', 'review', 'chat', 'profile', 'notifications', 'reschedule'
]

for lang in ['en', 'mn']:
    path = Path(f'apps/mobile/src/locales/{lang}/translation.json')
    data = json.loads(path.read_text())
    for key in ORPHANED:
        data.pop(key, None)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'Cleaned {path}')
```

**Step 4: Run typecheck and tests**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

**Step 5: Commit**

```bash
git add apps/mobile/src/locales
git commit -m "chore(i18n): remove 284 orphaned translation keys from legacy namespaces

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

### Task 9: Final verification — full i18n audit

**Files:**
- Verify: `apps/mobile/src/locales/en/translation.json`
- Verify: `apps/mobile/src/locales/mn/translation.json`
- Verify: all `*.tsx` files

**Step 1: Re-run the full key parity check**

```bash
python3 - <<'PY'
import json, re, subprocess
from pathlib import Path

def flatten(d, prefix=''):
    items = set()
    for k,v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            items.update(flatten(v, key))
        else:
            items.add(key)
    return items

en = json.loads(Path('apps/mobile/src/locales/en/translation.json').read_text())
mn = json.loads(Path('apps/mobile/src/locales/mn/translation.json').read_text())
en_keys = flatten(en)
mn_keys = flatten(mn)

result = subprocess.run(
    ['rg', '-g', '*.tsx', '-g', '*.ts', '-o', "t\\('([^']+)'", '-r', '$1',
     '--no-filename', 'apps/mobile/src/'],
    capture_output=True, text=True
)
code_keys = set()
for line in result.stdout.strip().splitlines():
    k = line.strip()
    if k and '.' in k:
        code_keys.add(k)

missing_en = sorted(code_keys - en_keys)
missing_mn = sorted(code_keys - mn_keys)
en_only = sorted(en_keys - mn_keys)
mn_only = sorted(mn_keys - en_keys)

print(f"EN keys: {len(en_keys)}")
print(f"MN keys: {len(mn_keys)}")
print(f"Code keys: {len(code_keys)}")
print(f"Missing from EN: {len(missing_en)}")
print(f"Missing from MN: {len(missing_mn)}")
print(f"EN-only (not in MN): {len(en_only)}")
print(f"MN-only (not in EN): {len(mn_only)}")
PY
```

Expected:
- `Missing from EN: 0`
- `Missing from MN: 0`
- `EN-only: 0`
- `MN-only: 0`

**Step 2: Re-check for hardcoded strings**

```bash
echo "=== Hardcoded English props ==="
rg -g '*.tsx' -n '(?:title|label|placeholder|description|message|heading)="[A-Z][a-z]+' apps/mobile/src/app/ apps/mobile/src/components/ apps/mobile/src/features/

echo "=== Hardcoded Cyrillic inline ==="
rg -g '*.tsx' -n '>[А-Яа-яөүЁёӨҮ].{3,}<' apps/mobile/src/ | grep -v 'LanguageSwitcher'
```

Expected: zero matches (or only `LoginForm.tsx` dev bypass strings which are acceptable).

**Step 3: Run full workspace checks**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

Expected: PASS.

**Step 4: Commit if any final adjustments were needed**

```bash
git add apps/mobile/src
git commit -m "chore(i18n): final i18n audit verification pass

Co-Authored-By: Pi <noreply@pi.dev>"
```

---

## Verification Commands (run after all tasks)

```bash
# Full parity check
python3 -c "
import json, subprocess
from pathlib import Path

def flatten(d, prefix=''):
    items = set()
    for k,v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict): items.update(flatten(v, key))
        else: items.add(key)
    return items

en = flatten(json.loads(Path('apps/mobile/src/locales/en/translation.json').read_text()))
mn = flatten(json.loads(Path('apps/mobile/src/locales/mn/translation.json').read_text()))
r = subprocess.run(['rg','-g','*.tsx','-g','*.ts','-o',\"t\\\\'([^\\\\']+)\\\\'\",'-r','\$1','--no-filename','apps/mobile/src/'], capture_output=True, text=True)
code = {k.strip() for k in r.stdout.splitlines() if '.' in k.strip()}
print(f'EN={len(en)} MN={len(mn)} Code={len(code)} Missing={len(code-en)} Orphan={len(en-code)}')
"

# Hardcoded string check
rg -g '*.tsx' '(?:title|label|placeholder|description|message|heading)="[A-Z][a-z]+' apps/mobile/src/app/
rg -g '*.tsx' '>[А-Яа-яөүЁёӨҮ].{3,}<' apps/mobile/src/ | grep -v LanguageSwitcher

# Build checks
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test
```

## Notes for Haiku

1. **Task 2 is the largest task.** It requires reading ~366 `t()` call sites to extract English fallbacks, then looking up Mongolian translations from screen spec `copy:` sections. Budget at least 30 minutes for this task.
2. **Screen spec copy sections** are YAML blocks like:
   ```yaml
   copy:
     - key: heading
       mn: "Mongolian text"
       en: "English text"
   ```
   Use these as the authoritative MN source whenever the key maps to a screen spec.
3. **When no screen spec copy exists** for a key (e.g., template-level keys like `wizard.next`), translate from English using the existing translation style in `mn/translation.json`.
4. **Do not restructure keys.** The code uses `customer.postTask.*` style — add keys there, not under the old `taskPost.*`.
5. **The dev bypass strings** in `LoginForm.tsx` (`"Dev: Login as Customer"`, `"Dev: Login as Tasker"`) are acceptable to leave hardcoded — they are development-only UI not shown in production.
6. **The LanguageSwitcher** string `"Монгол"` is the name of the language itself and is acceptable to leave hardcoded.
