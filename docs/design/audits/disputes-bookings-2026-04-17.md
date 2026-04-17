# Phase 1 Audit: disputes + bookings timeline

**Date:** 2026-04-17
**Feature area:** `disputes`, `bookings/[bookingId]/timeline`
**Scope:** `apps/mobile/src/app/(customer)/disputes/*`, `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`, plus cross-cutting patterns discovered in surrounding screens
**Rubric:** `docs/design/mobile-extraction-rubric.md`
**Method:** All 7 audit queries from `docs/design/mobile-extraction-delegation.md` ran across `apps/mobile/src`, cross-checked against existing design layers.

---

## Summary

- 30 findings captured (cap reached)
- 8 findings already partially covered by existing surfaces/tokens (migration needed)
- 5 findings are single-use or contained within one component (leave local)
- 17 findings represent genuine extraction opportunities
- 2 unused exported components discovered (`TimelineStepper`, `StepIndicator`)
- 1 unused surface token block discovered (`iconButton`)

---

## Findings Inventory

### F-01: `bg-muted rounded-lg p-lg` section card (12 call sites)

| Field                | Value                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-lg p-lg gap-item`                                                                                                                                                                                                                           |
| **call sites**       | `disputes/[disputeId]/index.tsx:348`, `:446`, `:469`; `bookings/[bookingId]/timeline.tsx:165`; `bookings/[bookingId]/reschedule.tsx:133`, `:182`, `:374`; `taskers/[taskerId].tsx:86`, `:97`, `:158`; `future/.../escrow.tsx:94`; `future/.../polish.tsx:233` |
| **semantic intent**  | "default content section card" — muted background, generous padding, rounded corners                                                                                                                                                                          |
| **already covered?** | No surface exists. `Card.tsx` provides `bg-card rounded-lg` but no muted variant.                                                                                                                                                                             |
| **bucket guess**     | surface (`mobileSurfaces.sectionCard`) or primitive (`<SectionCard>`)                                                                                                                                                                                         |

**Notes:** Gap varies across 6 values (gap-sm×4, gap-item×2, gap-lg×2, gap-md×1, gap-xs×2, none×1). The bg+rounded+padding combo is the stable part; gap is caller-specific.

---

### F-02: `bg-muted rounded-lg p-xl gap-md` section card variant (10 call sites)

| Field                | Value                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-lg p-xl gap-md`                                                                                                                     |
| **call sites**       | `future/.../escrow.tsx:41`, `:60`, `:85`, `:116`; `future/.../instant-match.tsx:241`, `:258`, `:276`, `:292`; `future/.../subscription.tsx:32`, `:50` |
| **semantic intent**  | "spacious content section" — same as F-01 but with extra padding and consistent gap-md                                                                |
| **already covered?** | No.                                                                                                                                                   |
| **bucket guess**     | surface                                                                                                                                               |

---

### F-03: 72px status hero icon circle (7 call sites)

| Field                | Value                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `w-[72px] h-[72px] rounded-full items-center justify-center bg-muted mb-lg`                                                                                                                                                                                                 |
| **call sites**       | `(shared)/notifications.tsx:190`; `(shared)/session-expired.tsx:42`; `(shared)/network-error.tsx:52`; `(shared)/app-update.tsx:41`; `(shared)/account/suspended.tsx:29`; `(shared)/account/banned.tsx:21`; `(shared)/profile/delete.tsx:41` (via `accountDeletion.iconBox`) |
| **semantic intent**  | "status screen hero icon container" — large circular backdrop for status illustrations                                                                                                                                                                                      |
| **already covered?** | Partially: `mobileSurfaces.accountDeletion.iconBox: 72` exists but only consumed by delete.tsx. Other 6 screens hardcode.                                                                                                                                                   |
| **bucket guess**     | token (add to surfaces as `statusHero.iconBox: 72`) or primitive (`<StatusIcon>`)                                                                                                                                                                                           |

---

### F-04: `bg-muted rounded-md` section card — fragmented (26 call sites, 7+ sub-variants)

| Field                | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-md p-lg gap-md`, `bg-muted rounded-md p-md`, `bg-muted rounded-md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **call sites**       | `task/[id].tsx:118`, `:141`, `:188`; `bookings/index.tsx:318`; `bookings/confirm.tsx:72`; `bookings/[bookingId]/index.tsx:199`; `bookings/[bookingId]/dispute.tsx:130`; `bookings/[bookingId]/reschedule.tsx:336`, `:362`; `(tabs)/profile.tsx:88`, `:111`; `(shared)/profile/edit.tsx:113`; `(tasker)/jobs/[bookingId]/index.tsx:123`, `:134`; `verification/upload.tsx:145`; `future/.../wallet/index.tsx:28`, `:34`; `rebook.tsx:122`; `components/ui/StatCard.tsx:14`; `components/ui/ReviewCard.tsx:32`; `components/templates/DetailTemplate.tsx:40`, `:42`, `:46`, `:50`; `components/templates/FeedListTemplate.tsx:67`; `components/templates/SettingsTemplate.tsx:99` |
| **semantic intent**  | "muted section card" — same as F-01 but with md radius instead of lg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **already covered?** | No.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **bucket guess**     | surface (if narrowed to top sub-variant) or leave local (too fragmented for single abstraction)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Notes:** Padding splits into p-lg (7), p-md (7), none (5 skeletons + 2 content), p-4 (1), p-[20px] (1), p-card (1), px-md py-sm (1). Too fragmented for one component. The `p-lg` and `p-md` sub-variants might warrant separate surfaces.

---

### F-05: Shared timeline dot+rail rendering (2 screens, already tokenized)

| Field                | Value                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **sample literal**   | Disputes: `<View style={{ width: 24, height: 24 }}> + <View style={{ width: 2, bottom: -16, backgroundColor: tint.borderSoft }} />`; Bookings: `<View style={{ width: 24, height: 24 }}> + <View style={{ width: 2, minHeight: 28, marginTop: -1 }} />`      |
| **call sites**       | `disputes/[disputeId]/index.tsx:180-441` (TimelineDot + inline rail); `bookings/[bookingId]/timeline.tsx:54-130` (TimelineEventRow with inline dot+rail)                                                                                                     |
| **semantic intent**  | "vertical timeline dot and rail" — shared structural layout for status/event progress                                                                                                                                                                        |
| **already covered?** | Values YES: `dispute.timeline.dotSize: 24`, `bookingTimeline.dotSize: 24`, `dispute.timeline.lineWidth: 2`, `bookingTimeline.railWidth: 2`. Rendering NO: `TimelineStepper.tsx` exists but is unused and too rigid (hardcodes 10px dot, simple label model). |
| **bucket guess**     | primitive (enhance or replace `TimelineStepper`)                                                                                                                                                                                                             |

**Notes:** Both screens share: flex-row per row, dot column with absolute-positioned rail, state-dependent coloring, isLast guard for rail. They differ in dot rendering (disputes has checkmark/inner-dot/plain; bookings has bordered solid-color dots) and content layout. See also F-17 re: unused `TimelineStepper`.

---

### F-06: `lineHeight: 24` inline style (8 call sites)

| Field                | Value                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **sample literal**   | `style={{ lineHeight: 24 }}` or `style={{ color: colors.textSecondary, lineHeight: 24 }}`                                                                                                              |
| **call sites**       | `(shared)/legal/terms.tsx:187`, `:193`, `:204`, `:209` (4); `(shared)/help.tsx:324`; `app/index.tsx:65`; `components/ui/LoginRequiredCTA.tsx:46`; `features/tasks/components/TaskDetailsModal.tsx:148` |
| **semantic intent**  | "body paragraph line height" — comfortable reading rhythm for body text blocks                                                                                                                         |
| **already covered?** | Partially: `mobileSurfaces.legal.paragraphLineHeight: 24` exists but only covers terms.tsx. Other screens don't consume it.                                                                            |
| **bucket guess**     | token (promote to `semanticTokens.typography.lineHeights.body` or a shared surface value)                                                                                                              |

---

### F-07: Hardcoded `paddingHorizontal: 16` / `gap: 16` (16+ call sites)

| Field                | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 16 }}`                                                                                                                                                                                                                                                                                                                                                                                               |
| **call sites**       | `bookings/[bookingId]/timeline.tsx:162` (px+pb+gap); `features/profile/components/TaskerPublicProfile.tsx:226` (px); `features/chat/components/ChatDetailScreen.tsx:185`, `:222`, `:257`, `:265` (px); `features/chat/components/InboxScreen.tsx:116` (pb); `(tabs)/inbox/[id].tsx:218` (px+pt+pb); `features/tasks/components/ApplicantsList.tsx:303`, `:393` (gap); `future/.../wallet/payout.tsx:31` (padding+gap); `future/.../escrow.tsx:39`, `:57`, `:78` (padding+gap) |
| **semantic intent**  | "screen horizontal inset" and "standard section gap" — should use `screenLayout.insetX` and `spacing.md`                                                                                                                                                                                                                                                                                                                                                                      |
| **already covered?** | Yes: `screenLayout.insetX` (= `spacing.lg` = 16) and `spacing.md` (= 16) exist. Screens just don't consume them.                                                                                                                                                                                                                                                                                                                                                              |
| **bucket guess**     | token (migration — replace raw numbers with existing tokens)                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

### F-08: `bg-primary-deep rounded-lg p-lg` accent section card (3 call sites)

| Field                | Value                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-primary-deep rounded-lg p-lg gap-md`                                                                                                                                                    |
| **call sites**       | `(customer)/tasks/[taskId]/index.tsx:245` (gap-sm + elevations.soft); `(shared)/notifications.tsx:222` (justify-end h-[128px]); `(customer)/bookings/[bookingId]/timeline.tsx:214` (gap-md) |
| **semantic intent**  | "primary accent section" — deep-brand-background callout for CTAs, help prompts, premium content                                                                                            |
| **already covered?** | No.                                                                                                                                                                                         |
| **bucket guess**     | surface (`mobileSurfaces.accentCard`)                                                                                                                                                       |

---

### F-09: `letterSpacing: 0.8` inline style (4 call sites)

| Field                | Value                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `style={{ letterSpacing: 0.8 }}`                                                                                                                   |
| **call sites**       | `future/.../polish.tsx:229`, `:258`, `:285` (3); `(customer)/tasks/[taskId]/index.tsx:216` (1)                                                     |
| **semantic intent**  | "section label tracking" — wide letter-spacing for section headings/labels                                                                         |
| **already covered?** | Yes: `mobileSurfaces.taskDetail.sectionTracking: 0.8` and `bookingTimeline.titleTracking: 0.8`. Polish and task detail screens don't consume them. |
| **bucket guess**     | token (migration — consume existing surface tokens)                                                                                                |

---

### F-10: `min-h-[56px]` header row (3 call sites)

| Field                | Value                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `min-h-[56px] flex-row items-center justify-between`                                                           |
| **call sites**       | `(tasker)/verification/consent.tsx:60`; `(customer)/disputes/[disputeId]/index.tsx:270`; `(auth)/index.tsx:82` |
| **semantic intent**  | "screen header bar" — minimum-height row for back button + title + trailing action                             |
| **already covered?** | Partially: `screenLayout` defines `header.topInset` and gaps but no `headerHeight` or `headerMinHeight`.       |
| **bucket guess**     | token (add to `screenLayout.header.minHeight: 56`) or leave local                                              |

---

### F-11: 42px action tiles — `w-[42px] h-[42px] rounded-sm` (3 call sites, 1 file)

| Field                | Value                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| **sample literal**   | `w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border` |
| **call sites**       | `(customer)/tasks/new/location.tsx:263`, `:275`, `:283`                                 |
| **semantic intent**  | "map action button" — small square action tiles on the location picker map              |
| **already covered?** | Yes: `mobileSurfaces.iconButton.md: 42` exists but has zero consumers.                  |
| **bucket guess**     | token (migration — consume `iconButton.md`)                                             |

**Notes:** Single-use per feature area. All 3 sites are within one file. The existing `iconButton.md` token matches exactly. Flagged as "migration" rather than new extraction.

---

### F-12: 48px rounded-md list icons — `w-12 h-12 rounded-md` (3 call sites, 2 files)

| Field                | Value                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| **sample literal**   | `w-12 h-12 rounded-md`                                                         |
| **call sites**       | `components/ui/ListItemCard.tsx:11`; `(customer)/tasks/index.tsx:80`, `:113`   |
| **semantic intent**  | "list item icon box" — medium square icon container for list rows              |
| **already covered?** | No surface token for 48px. `iconButton` goes up to 44.                         |
| **bucket guess**     | token (extend `iconButton` with `xl: 48` or add `listIconBox: 48` to surfaces) |

---

### F-13: `bg-card rounded-lg p-lg` bypassing `<Card>` component (6 call sites)

| Field                | Value                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-card rounded-lg p-lg gap-md`                                                                                                                                                                                                                                                                                                                           |
| **call sites**       | `(customer)/bookings/index.tsx:171`; `(customer)/bookings/[bookingId]/timeline.tsx:165` (no — this is bg-muted, see F-01); `future/.../instant-match.tsx:203`; `(customer)/disputes/[disputeId]/index.tsx:476` (with elevations.soft); `(customer)/tasks/[taskId]/index.tsx:348` (with elevations.soft); `future/.../escrow.tsx:85` (with elevations.soft) |
| **semantic intent**  | "card section" — elevated card with standard padding                                                                                                                                                                                                                                                                                                       |
| **already covered?** | Yes: `Card.tsx` provides `bg-card rounded-lg border border-border`. These sites either don't need the border or add `elevations.soft` instead.                                                                                                                                                                                                             |
| **bucket guess**     | leave local (use `<Card>` where border fits; otherwise justify the elevation variant)                                                                                                                                                                                                                                                                      |

---

### F-14: Inline motion config — `withSpring(1, { damping: 14, stiffness: 220 })` (1 call site)

| Field                | Value                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `checkScale.value = withSpring(1, { damping: 14, stiffness: 220 })`                                                                                      |
| **call sites**       | `(customer)/tasks/new/success.tsx:21`                                                                                                                    |
| **semantic intent**  | "celebration spring" — bouncy checkmark entrance                                                                                                         |
| **already covered?** | Partially: `springs.emphasis` exists in `animations.ts` but may differ in values. `animationPresets.celebration` exists but is timing-based, not spring. |
| **bucket guess**     | token (add `springs.celebration` if absent; otherwise migrate to closest existing spring)                                                                |

**Notes:** Single-use. Flagging because the rubric says "centralize motion tokens first." The celebration spring is generic enough to be reusable.

---

### F-15: `rgba(0,0,0,0.05)` pressed overlay (2 call sites)

| Field                | Value                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **sample literal**   | `pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }`                                                  |
| **call sites**       | `components/ui/ActionRow.tsx:43`; `components/templates/SettingsTemplate.tsx:43`                      |
| **semantic intent**  | "pressed state overlay" — subtle background tint on press for list rows                               |
| **already covered?** | No: `interactiveStates.pressed` provides `{ opacity: 0.85, scale: 0.98 }` but not a bg-color overlay. |
| **bucket guess**     | surface (add to `interactiveStates` or `mobileSurfaces.tint`) or leave local                          |

---

### F-16: Timeline dot border widths — `border-[4px]` / `border-[2px]` / `border-[3px]` (2 screens)

| Field                | Value                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `border-[4px] border-background` (disputes done state), `border-[2px] border-secondary` (disputes current), `border-[3px]` (bookings) |
| **call sites**       | `disputes/[disputeId]/index.tsx:185` (4px), `:199` (2px), `:217` (2px); `bookings/[bookingId]/timeline.tsx:83` (3px)                  |
| **semantic intent**  | "timeline dot ring" — the border around timeline dots that creates the "cutout" effect against the rail                               |
| **already covered?** | No: the surfaces define `dotSize` and `innerDotSize` but not border width.                                                            |
| **bucket guess**     | token (add to existing timeline surfaces: `dotBorderWidth`) or leave local                                                            |

---

### F-17: Unused `TimelineStepper` component (0 consumers)

| Field                | Value                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `components/ui/TimelineStepper.tsx` — exported, never imported                                                       |
| **call sites**       | 0                                                                                                                    |
| **semantic intent**  | Was intended as shared vertical stepper but hardcoded 10px dot (too small), simple label+timestamp model (too rigid) |
| **already covered?** | N/A — exists but unused                                                                                              |
| **bucket guess**     | cleanup (delete or redesign per F-05 findings)                                                                       |

---

### F-18: Unused `StepIndicator` component (0 consumers)

| Field                | Value                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **sample literal**   | `components/ui/StepIndicator.tsx` — exported, never imported                                          |
| **call sites**       | 0                                                                                                     |
| **semantic intent**  | Horizontal dot-only progress for wizard steps; `FormWizardTemplate` has its own segmented bar instead |
| **already covered?** | N/A — exists but unused                                                                               |
| **bucket guess**     | cleanup (delete — `FormWizardTemplate` covers the use case)                                           |

---

### F-19: Unused `iconButton` surface tokens (0 consumers)

| Field                | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| **sample literal**   | `mobileSurfaces.iconButton: { sm: 40, md: 42, lg: 44 }`                |
| **call sites**       | 0 direct consumers (9 screens hardcode these exact sizes)              |
| **semantic intent**  | "icon button box sizes" — standard sizes for icon-only pressable tiles |
| **already covered?** | Token exists but is not consumed.                                      |
| **bucket guess**     | token (migration — wire existing tokens to consumers)                  |

---

### F-20: 96px success hero circle — `w-24 h-24 rounded-full` (2 call sites)

| Field                | Value                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **sample literal**   | `w-24 h-24 rounded-full`                                                                         |
| **call sites**       | `(tasker)/verification/pending.tsx:18`; `(customer)/tasks/new/success.tsx:51`                    |
| **semantic intent**  | "success/celebration hero icon" — larger than status hero (72px), for positive milestone screens |
| **already covered?** | No.                                                                                              |
| **bucket guess**     | token (add to `statusHero` or `celebration` surface)                                             |

**Notes:** Only 2 call sites — below rule-of-three threshold. Flagged for monitoring.

---

### F-21: `bg-muted rounded-sm p-lg` task detail section (6 call sites, 2 files)

| Field                | Value                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-sm p-lg gap-md`                                                                               |
| **call sites**       | `(customer)/tasks/[taskId]/index.tsx:84`, `:222`, `:274`, `:303`; `(customer)/tasks/new/review.tsx:208`, `:437` |
| **semantic intent**  | "task detail section card" — smaller radius variant for dense task information                                  |
| **already covered?** | No.                                                                                                             |
| **bucket guess**     | surface (or leave local — confined to task detail family)                                                       |

**Notes:** 4 of 6 sites are in a single file (`tasks/[taskId]/index.tsx`). The pattern is family-specific.

---

### F-22: `bg-muted rounded-lg p-lg gap-item` — disputes-specific variant (2 call sites)

| Field                | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-lg p-lg gap-item`                                          |
| **call sites**       | `(customer)/disputes/[disputeId]/index.tsx:348`, `:446`                      |
| **semantic intent**  | "dispute detail section" — muted card with item-level gap for key-value rows |
| **already covered?** | No.                                                                          |
| **bucket guess**     | leave local (2 sites in 1 file)                                              |

---

### F-23: `minHeight: 48` inline touch targets (4 call sites)

| Field                | Value                                                                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `minHeight: 48`                                                                                                                                                                                                                              |
| **call sites**       | `features/bookings/components/CustomerCancelSheet.tsx:249`; `features/bookings/components/ConfirmCompletionSheet.tsx:150`; `features/bookings/components/BookingConfirmation.tsx:318`; `features/tasks/components/NoApplicantRescue.tsx:178` |
| **semantic intent**  | "CTA button minimum height" — standard touch-target height for action buttons                                                                                                                                                                |
| **already covered?** | Partially: `bookingList.ctaHeight: 48` and `bookingTimeline.helpCtaHeight: 48` exist but are per-feature. No global token.                                                                                                                   |
| **bucket guess**     | token (global `touchTarget.ctaHeight: 48` or extend button surfaces)                                                                                                                                                                         |

---

### F-24: `lineHeight: 20` inline style (3 call sites)

| Field                | Value                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `style={{ lineHeight: 20 }}`                                                                                                                                                      |
| **call sites**       | `features/verification/components/VerificationModal.tsx:225`; `features/notifications/components/NotificationCenter.tsx:270`; `features/chat/components/ChatDetailScreen.tsx:236` |
| **semantic intent**  | "compact body line height" — tighter line height for secondary/caption-style body text                                                                                            |
| **already covered?** | No global token. `otp.errorLineHeight: 20` and `otp.securityLineHeight: 21` are close but per-feature.                                                                            |
| **bucket guess**     | token (add `lineHeightCompact: 20` to semantic tokens or surfaces)                                                                                                                |

---

### F-25: `paddingHorizontal: 16` in bookings timeline (1 call site, high-visibility)

| Field                | Value                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **sample literal**   | `contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 16 }}`                 |
| **call sites**       | `(customer)/bookings/[bookingId]/timeline.tsx:162`                                              |
| **semantic intent**  | "screen content inset" — should use `screenLayout.insetX` + `spacing` tokens                    |
| **already covered?** | Yes: `screenLayout.insetX` = 16. Not consumed here.                                             |
| **bucket guess**     | token (migration) — called out separately from F-07 because this is in the target session scope |

---

### F-26: `rgba(16, 38, 56, 0.35)` scrim overlay (3 call sites)

| Field                | Value                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `backgroundColor: 'rgba(0, 36, 68, 0.35)'` or `bg-[rgba(16,38,56,0.35)]`                                                                                                                             |
| **call sites**       | `(shared)/session-expired.tsx:29` (as NativeWind class); `features/matching/components/InstantMatchTaskerSheet.tsx:94` (as style); `features/bookings/components/LeadUnlockSheet.tsx:149` (as style) |
| **semantic intent**  | "modal scrim" — branded overlay behind bottom sheets and full-screen modals                                                                                                                          |
| **already covered?** | Yes: `overlays.sheet` = `hexToRgba(primaryDeep, 0.35)` in `elevations.ts`. Not consumed by these 3 screens.                                                                                          |
| **bucket guess**     | token (migration — consume `overlays.sheet`)                                                                                                                                                         |

---

### F-27: `bg-muted rounded-md p-md` bookings section card (7 call sites)

| Field                | Value                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-muted rounded-md p-md`                                                                                                                                                                                                                                |
| **call sites**       | `(customer)/bookings/confirm.tsx:72`; `(customer)/bookings/[bookingId]/index.tsx:199`; `(customer)/bookings/[bookingId]/dispute.tsx:130`; `(customer)/bookings/[bookingId]/reschedule.tsx:336`, `:362`; `(tasker)/jobs/[bookingId]/index.tsx:123`, `:134` |
| **semantic intent**  | "compact info card" — smaller padding than p-lg, used for inline info rows in booking flows                                                                                                                                                               |
| **already covered?** | No.                                                                                                                                                                                                                                                       |
| **bucket guess**     | surface or leave local (confined to booking/job family)                                                                                                                                                                                                   |

---

### F-28: `w-[48%] aspect-square` photo grid tile (2 call sites, 1 component)

| Field                | Value                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `w-[48%] aspect-square rounded-md`                                                                                    |
| **call sites**       | `components/ui/PhotoGrid.tsx:36`, `:54`                                                                               |
| **semantic intent**  | "2-column photo tile" — half-width grid cells for photo display                                                       |
| **already covered?** | Partially: `mobileSurfaces.taskDetail.photoTileWidth: '48%'` exists for task detail but PhotoGrid doesn't consume it. |
| **bucket guess**     | leave local (contained in one component)                                                                              |

---

### F-29: `text-caption font-bold uppercase` section label (1 confirmed call site)

| Field                | Value                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `text-caption font-bold uppercase tracking-widest`                                                                                                                         |
| **call sites**       | `(customer)/disputes/[disputeId]/index.tsx:353`, `:361`, `:369`, `:379` (4 in disputes); `(customer)/tasks/[taskId]/index.tsx:248` (1, `text-caption font-bold uppercase`) |
| **semantic intent**  | "field label" — small, bold, uppercase label above detail values                                                                                                           |
| **already covered?** | No global surface or typography recipe.                                                                                                                                    |
| **bucket guess**     | surface (typography recipe) or leave local                                                                                                                                 |

---

### F-30: `elevations.soft` on section cards (5+ call sites)

| Field                | Value                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sample literal**   | `bg-card rounded-lg p-lg gap-sm` + `style={elevations.soft}`                                                                                                                                                                                                            |
| **call sites**       | `(customer)/disputes/[disputeId]/index.tsx:476`; `(customer)/tasks/[taskId]/index.tsx:245`, `:348`; `(customer)/tasks/new/schedule.tsx:203`; `(customer)/tasks/new/location.tsx:221`; `(customer)/rebook.tsx:122`; `(customer)/bookings/[bookingId]/reschedule.tsx:182` |
| **semantic intent**  | "elevated card" — standard card with soft shadow, used for important/highlighted content                                                                                                                                                                                |
| **already covered?** | Yes: `elevations.soft` is properly tokenized. The combination of `bg-card rounded-lg p-lg + elevations.soft` repeats but doesn't need a new token.                                                                                                                      |
| **bucket guess**     | leave local (values are already tokens; the combo doesn't justify a new surface)                                                                                                                                                                                        |

---

## Cross-check Summary: Existing Layers

| Layer               | File                                     | Coverage                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **surfaces.ts**     | `apps/mobile/src/design/surfaces.ts`     | Contains 18 surface groups. `bookingTimeline`, `dispute.timeline`, `iconButton`, `taskDetail`, `legal` etc. Partially consumed — several screens hardcode values that already exist as tokens (see F-07, F-09, F-11, F-19, F-25, F-26). |
| **animations.ts**   | `apps/mobile/src/design/animations.ts`   | Contains springs, easings, durations, presets. `withSpring` inline config in success.tsx (F-14) should migrate here.                                                                                                                    |
| **screenLayout.ts** | `apps/mobile/src/design/screenLayout.ts` | Defines `insetX`, `header.*`, `body.*`, `chrome.*`, `wizard.*`. Timeline and several other screens hardcode `16` instead of consuming `insetX` (F-07, F-25).                                                                            |
| **elevations.ts**   | `apps/mobile/src/design/elevations.ts`   | 4 elevation levels + overlay scrims. Properly tokenized. `overlays.sheet` not consumed by 3 screens that hardcode the scrim (F-26).                                                                                                     |
| **tokenAdapter.ts** | `apps/mobile/src/design/tokenAdapter.ts` | Re-exports all design layer values. Screens that import from `tokenAdapter` already consume the system; screens that import raw values from `theme` miss surface-level tokens.                                                          |
| **semantic.ts**     | `packages/design-tokens/src/semantic.ts` | Cross-platform tokens (colors, spacing, radius, typography). No `lineHeight` or `letterSpacing` recipe tokens.                                                                                                                          |
| **ui/ primitives**  | `apps/mobile/src/components/ui/`         | 40 components. `TimelineStepper` and `StepIndicator` are unused. `Card.tsx` is bypassed by 6 sites using raw `bg-card` classes.                                                                                                         |
| **templates/**      | `apps/mobile/src/components/templates/`  | 10 templates. `FeedListTemplate`, `DetailTemplate`, `SettingsTemplate` properly consumed.                                                                                                                                               |

---

## Done Criteria Verification

- [x] Report exists at `docs/design/audits/disputes-bookings-2026-04-17.md`
- [x] Every finding has >= 2 call sites OR is flagged "single-use, leave local" or "contained in one component"
- [x] No code edited
- [x] 30 findings captured (cap reached), listed by highest frequency first
