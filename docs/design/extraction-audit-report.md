# Mobile Extraction Audit — Disputes & Bookings

> **Status: SUPERSEDED** by [`docs/design/audits/disputes-bookings-2026-04-17.md`](../design/audits/disputes-bookings-2026-04-17.md) (30 findings, used for proposals).
> Retained for reference — contains unique findings (F-04 64px icon box, F-05 tight gap, F-06/F-07 lineHeight inconsistency, F-13 checkbox, F-16 StyleSheet drift, F-19 danger tint, F-23 InfoRow usage, F-24 gradient CTA) not present in the primary audit. These require separate triage.

**Date:** 2026-04-17
**Feature area:** `disputes`, `bookings` (customer routes + feature components)
**Phase:** 1 (read-only audit)
**Scope:** `apps/mobile/src/app/(customer)/disputes/*`, `apps/mobile/src/app/(customer)/bookings/*`, `apps/mobile/src/features/bookings/components/*`, `apps/mobile/src/features/disputes/*`

---

## Existing layer coverage (cross-check)

These layers already cover some of the visual patterns in scope:

| Layer                             | What it covers in this area                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `mobileSurfaces.dispute.timeline` | dot size, inner dot, line width, resolution icon box, evidence bullet, decorative scale height |
| `mobileSurfaces.bookingTimeline`  | dot size, rail width/height/offset, card icon box, help CTA height, title tracking             |
| `mobileSurfaces.bookingList`      | skeleton dimensions, header icon box, empty icon box, CTA height, status tracking              |
| `mobileSurfaces.reschedule`       | nav icons, calendar cells, time chips, step badge, state icon box, CTA height                  |
| `mobileSurfaces.bookingConfirmed` | nav icon, hero size, next-step icon, provider avatar, primary CTA, bottom glow                 |
| `elevations.soft`                 | card shadow used in booking list cards, reschedule calendar, detail template                   |
| `overlays.sheet`                  | scrim color for sheet overlays (derived from `primaryDeep`)                                    |
| `screenLayout.*`                  | inset, header gaps, body section/block/item gaps, action bar padding                           |
| `ui/Card`                         | card container with `bg-card rounded-lg border border-border`                                  |
| `ui/TimelineStepper`              | basic vertical stepper (smaller, different API from custom timelines)                          |
| `ui/PressableCard`                | pressable card with press feedback animation                                                   |
| `templates/DetailTemplate`        | detail screen scaffold with loading/error/skeleton/CTA bar                                     |
| `templates/FormWizardTemplate`    | multi-step form wizard scaffold                                                                |
| `templates/ModalSheetTemplate`    | bottom sheet scaffold                                                                          |

---

## Findings inventory

### F-01: Muted info-section card (NativeWind)

| Field                | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `bg-muted rounded-lg p-lg gap-item`, `bg-muted rounded-md p-md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Call sites**       | `disputes/[disputeId]/index.tsx:348` (detail card), `disputes/[disputeId]/index.tsx:446` (resolution card), `disputes/[disputeId]/index.tsx:469` (phase-1 note), `bookings/[bookingId]/timeline.tsx:165` (hero card), `bookings/[bookingId]/reschedule.tsx:133` (current schedule), `bookings/[bookingId]/reschedule.tsx:182` (calendar card), `bookings/[bookingId]/reschedule.tsx:336` (reason card), `bookings/[bookingId]/reschedule.tsx:362` (info tip), `bookings/[bookingId]/reschedule.tsx:374` (state card), `bookings/[bookingId]/dispute.tsx:130` (evidence note), `bookings/index.tsx:318` (offline banner), `bookings/[bookingId]/index.tsx:199` (tasker card) |
| **Semantic intent**  | "info section" — a muted-background container for grouped content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Already covered?** | No — `Card` uses `bg-card` with border, not `bg-muted`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Bucket guess**     | surface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### F-02: Muted info-section card (StyleSheet)

| Field                | Value                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `backgroundColor: colors.muted, borderRadius: radius.md, padding: spacing.md`                                                                                                                                                                                                                                                                                                                      |
| **Call sites**       | `CustomerCancelSheet.tsx:172` (warning card), `CustomerCancelSheet.tsx:221` (text area card), `CustomerCancelSheet.tsx:232` (policy note), `TaskerCancelSheet.tsx:199` (note box), `TaskerCancelSheet.tsx:209` (warning box), `TaskerNoShowSheet.tsx:124` (warning box), `CustomerNoShowSheet.tsx:117` (note container), `RescheduleModal.tsx:143` (current schedule), `BookingList.tsx:39` (card) |
| **Semantic intent**  | same as F-01 but via StyleSheet — "info section" card                                                                                                                                                                                                                                                                                                                                              |
| **Already covered?** | No — same visual recipe as F-01, different styling mechanism                                                                                                                                                                                                                                                                                                                                       |
| **Bucket guess**     | surface                                                                                                                                                                                                                                                                                                                                                                                            |

### F-03: CTA minimum heights

| Field                | Value                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `minHeight: 48`, `minHeight: 52`                                                                                                                                                                                                                           |
| **Call sites**       | `CustomerCancelSheet.tsx:249` (secondary btn: 48), `ConfirmCompletionSheet.tsx:150` (secondary btn: 48), `BookingConfirmation.tsx:318` (gradient btn: 48), `ConfirmCompletionSheet.tsx:138` (primary btn: 52), `LeadUnlockSheet.tsx:207` (primary btn: 52) |
| **Semantic intent**  | "secondary CTA height" (48) and "primary CTA height" (52)                                                                                                                                                                                                  |
| **Already covered?** | Partially — `reschedule.ctaHeight: 56`, `bookingConfirmed.primaryCtaHeight: 52`, `bookingList.ctaHeight: 48` exist but are screen-specific and inconsistent                                                                                                |
| **Bucket guess**     | surface (consolidate)                                                                                                                                                                                                                                      |

### F-04: Medium icon-box container (64x64)

| Field                | Value                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `w-16 h-16 rounded-lg bg-muted`, `width: 64, height: 64`                                                                                     |
| **Call sites**       | `bookings/index.tsx:211` (empty state icon), `bookings/[bookingId]/timeline.tsx:166` (hero icon), `CustomerCancelSheet.tsx:153` (icon outer) |
| **Semantic intent**  | "medium illustration box" — icon container for empty states, hero illustrations, sheet icons                                                 |
| **Already covered?** | No direct match — `bookingConfirmed.heroSize: 96` is different                                                                               |
| **Bucket guess**     | surface                                                                                                                                      |

### F-05: Tight text-stack gap

| Field                | Value                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `gap-[2px]`, `style={{ gap: 2 }}`                                                                          |
| **Call sites**       | `bookings/index.tsx:132` (tasker name + description), `bookings/confirmed.tsx:157` (provider label + name) |
| **Semantic intent**  | "tight text stack" — vertically stacked text lines with minimal gap                                        |
| **Already covered?** | No — closest is `spacing.xs` which is larger                                                               |
| **Bucket guess**     | token (spacing)                                                                                            |

### F-06: Derived lineHeight ratios

| Field                | Value                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `lineHeight: typography.body * 1.6`, `lineHeight: typography.label * 1.5`, `lineHeight: typography.caption * 1.5`                                                                |
| **Call sites**       | `CustomerCancelSheet.tsx:179,239`, `ConfirmCompletionSheet.tsx:126`, `CustomerNoShowSheet.tsx:107,126`, `LeadUnlockSheet.tsx:179`, `RescheduleModal.tsx:183` (via `reasonInput`) |
| **Semantic intent**  | "body line height", "label line height", "caption line height" — derived from font size                                                                                          |
| **Already covered?** | No explicit line-height tokens or surfaces                                                                                                                                       |
| **Bucket guess**     | token (typography line heights)                                                                                                                                                  |

### F-07: Hardcoded literal lineHeight values

| Field                | Value                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `lineHeight: 22`, `lineHeight: 18`, `leading-[20px]`                                                                                        |
| **Call sites**       | `TaskerCancelSheet.tsx:164,207`, `TaskerNoShowSheet.tsx:122,132`, `BookingConfirmation.tsx:276`, `bookings/[bookingId]/dispute.tsx:131,135` |
| **Semantic intent**  | same as F-06 but as raw numbers instead of derived ratios — inconsistent                                                                    |
| **Already covered?** | No — inconsistency with F-06 (should use same system)                                                                                       |
| **Bucket guess**     | token (same as F-06, consolidate)                                                                                                           |

### F-08: Future/dimmed state opacity

| Field                | Value                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `opacity-[0.45]`                                                                                                                  |
| **Call sites**       | `bookings/[bookingId]/timeline.tsx:77` (future timeline row), `bookings/[bookingId]/reschedule.tsx:168` (inactive step indicator) |
| **Semantic intent**  | "future state" opacity for visually de-emphasizing inactive items                                                                 |
| **Already covered?** | No                                                                                                                                |
| **Bucket guess**     | token (opacity)                                                                                                                   |

### F-09: Timeline dot border widths

| Field                | Value                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**   | `border-[4px]`, `border-[3px]`, `border-[2px]`                                                                                                                                                                                   |
| **Call sites**       | `disputes/[disputeId]/index.tsx:185` (done dot: 4px), `disputes/[disputeId]/index.tsx:199` (current dot: 2px), `disputes/[disputeId]/index.tsx:218` (future dot: 2px), `bookings/[bookingId]/timeline.tsx:83` (booking dot: 3px) |
| **Semantic intent**  | timeline dot border treatment — varies by state and by screen family                                                                                                                                                             |
| **Already covered?** | Partially — `dispute.timeline.dotSize` and `bookingTimeline.dotSize` exist but border widths are inline                                                                                                                          |
| **Bucket guess**     | surface (extend existing)                                                                                                                                                                                                        |

### F-10: Letter spacing / tracking literals

| Field                | Value                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sample literal**   | `letterSpacing: 1`, `letterSpacing: 0.5`, `letterSpacing: -0.5`, `tracking-wide`, `tracking-widest`, `tracking-tight`                                                                                                                                                                                                    |
| **Call sites**       | `TaskerCancelSheet.tsx:174` (0.5), `BookingConfirmation.tsx:180` (1), `BookingConfirmation.tsx:187` (-0.5), `disputes/[disputeId]/index.tsx:353,361,369,379` (tracking-widest), `bookings/index.tsx:149` (tracking-[0.6px]), `bookings/confirmed.tsx:104` (tracking-tight), `bookings/confirmed.tsx:114` (tracking-wide) |
| **Semantic intent**  | "uppercase label tracking", "heading negative tracking", "micro label tracking"                                                                                                                                                                                                                                          |
| **Already covered?** | Partially — `taskDetail.labelTracking: 0.4`, `taskDetail.sectionTracking: 0.8`, `bookingTimeline.titleTracking: 0.8`, `roleSelect.headingLineHeight` etc. — but many are still inline                                                                                                                                    |
| **Bucket guess**     | surface (consolidate into named tracking values)                                                                                                                                                                                                                                                                         |

### F-11: Hardcoded scrim color (rgba)

| Field                                                                                      | Value                                                          |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Sample literal**                                                                         | `rgba(0, 36, 68, 0.35)`                                        |
| **Call sites**                                                                             | `LeadUnlockSheet.tsx:149` (1 call site)                        |
| **Semantic intent**                                                                        | sheet/modal scrim overlay                                      |
| **Already covered?** YES — `overlays.sheet` = `hexToRgba(primaryDeep, 0.35)` is equivalent |
| **Bucket guess**                                                                           | leave local (replace with existing `overlays.sheet` reference) |

### F-12: Section heading class combination

| Field                                                                 | Value                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**                                                    | `text-heading font-sans-bold text-primary-deep`                                                                                                                                                                                   |
| **Call sites**                                                        | `disputes/[disputeId]/index.tsx:349,390,447,477`, `bookings/[bookingId]/index.tsx:195,219`, `bookings/[bookingId]/reschedule.tsx:184,288,332`, `bookings/confirm.tsx:69,89,111`, `bookings/[bookingId]/dispute.tsx:80,88,120,143` |
| **Semantic intent**                                                   | "section heading" typography treatment                                                                                                                                                                                            |
| **Already covered?** No — repeated class combination, not a component |
| **Bucket guess**                                                      | local (class combination, per rubric not extractable as component — no markup reuse, just class strings)                                                                                                                          |

### F-13: Checkbox control (w-6 h-6 rounded-xs border-2)

| Field                                                      | Value                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Sample literal**                                         | `w-6 h-6 rounded-xs border-2 border-primary bg-primary` / `border-border` |
| **Call sites**                                             | `bookings/confirm.tsx:127-128`, `BookingConfirmation.tsx:284-290`         |
| **Semantic intent**                                        | "checkbox" — toggle control for accepting terms                           |
| **Already covered?** No checkbox primitive exists in `ui/` |
| **Bucket guess**                                           | primitive                                                                 |

### F-14: Hardcoded scroll bottom padding

| Field                                                                                                              | Value                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Sample literal**                                                                                                 | `paddingBottom: 40`, `paddingBottom: spacing['2xl']`                        |
| **Call sites**                                                                                                     | `bookings/[bookingId]/timeline.tsx:162` (40), `bookings/index.tsx:309` (40) |
| **Semantic intent**                                                                                                | scroll content bottom clearance                                             |
| **Already covered?** YES — `screenLayout` has gap/padding values, and `InsetScrollView` handles `extraBottomInset` |
| **Bucket guess**                                                                                                   | leave local (should use existing system)                                    |

### F-15: Tab indicator bar

| Field                   | Value                                   |
| ----------------------- | --------------------------------------- |
| **Sample literal**      | `w-12 h-1 rounded-full bg-primary-deep` |
| **Call sites**          | `bookings/index.tsx:95` (1 call site)   |
| **Semantic intent**     | active tab underline indicator          |
| **Already covered?** No |
| **Bucket guess**        | leave local (single use)                |

### F-16: Feature components using StyleSheet instead of NativeWind

| Field                                                        | Value                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sample literal**                                           | `StyleSheet.create({...})` with `mobileTheme.*` values                                                                                                                                                                                                             |
| **Call sites**                                               | `LeadUnlockSheet.tsx:147`, `CustomerCancelSheet.tsx:146`, `TaskerCancelSheet.tsx:148`, `TaskerNoShowSheet.tsx:106`, `ConfirmCompletionSheet.tsx:93`, `BookingConfirmation.tsx:160`, `CustomerNoShowSheet.tsx:103`, `RescheduleModal.tsx:124`, `BookingList.tsx:34` |
| **Semantic intent**                                          | 9 feature components use StyleSheet.create instead of NativeWind                                                                                                                                                                                                   |
| **Already covered?** N/A — architectural convention question |
| **Bucket guess**                                             | observation (per AGENTS.md, StyleSheet is for Reanimated/platform APIs; most of these don't use either)                                                                                                                                                            |

### F-17: Status pill with runtime colors

| Field                                                                       | Value                                                                                                                                  |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**                                                          | `className="self-start rounded-full px-md py-xs"` + `style={{ backgroundColor: statusColors.bg }}`                                     |
| **Call sites**                                                              | `bookings/index.tsx:144-152` (1 call site for the pill itself, but status-color logic is duplicated in booking detail and other areas) |
| **Semantic intent**                                                         | "status pill" — colored badge showing booking status                                                                                   |
| **Already covered?** `StatusBadge` exists in `ui/` but uses a different API |
| **Bucket guess**                                                            | leave local (single inline use; StatusBadge already exists for detail screens)                                                         |

### F-18: Sheet handle (width: 48, height: 5)

| Field                                                                    | Value                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **Sample literal**                                                       | `width: 48, height: 5, borderRadius: 999`                       |
| **Call sites**                                                           | `LeadUnlockSheet.tsx:160` (1 call site)                         |
| **Semantic intent**                                                      | bottom sheet drag handle                                        |
| **Already covered?** `ModalSheetTemplate` likely handles this internally |
| **Bucket guess**                                                         | leave local (single use; ModalSheetTemplate should own handles) |

### F-19: Danger-tinted icon box

| Field                                                                                                                  | Value                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**                                                                                                     | `${colors.danger}1a` → `dangerTint`, `backgroundColor: dangerTint` with `borderRadius: radius.lg`                                           |
| **Call sites**                                                                                                         | `CustomerCancelSheet.tsx:12,156` (1 call site for the icon outer), `TaskerCancelSheet.tsx:215` (dangerBox uses similar pattern with border) |
| **Semantic intent**                                                                                                    | "danger icon container" or "warning fill"                                                                                                   |
| **Already covered?** `mobileSurfaces.tint.dangerSoft` = `withAlpha(colors.danger, 0.08)` — similar but different alpha |
| **Bucket guess**                                                                                                       | surface (extend `tint.dangerSoft` or add `tint.dangerMedium` — already exists at 0.12)                                                      |

### F-20: Large icon-box (80x80) with nested icon-box (56x56)

| Field                   | Value                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Sample literal**      | `width: 80, height: 80` outer, `width: 56, height: 56` inner                                   |
| **Call sites**          | `ConfirmCompletionSheet.tsx:100,109` (1 call site — nested circles for completion celebration) |
| **Semantic intent**     | "celebration icon box" — double-ring icon container                                            |
| **Already covered?** No |
| **Bucket guess**        | leave local (single use, screen-specific celebration)                                          |

### F-21: Dispute reason selection items

| Field                   | Value                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Sample literal**      | `border-[1.5px] border-primary-deep` / `border-[1.5px] border-transparent`                    |
| **Call sites**          | `bookings/[bookingId]/dispute.tsx:97-98` (1 call site, but renders in a loop for each reason) |
| **Semantic intent**     | "selectable item" border treatment                                                            |
| **Already covered?** No |
| **Bucket guess**        | leave local (single logical use, per-rason variation)                                         |

### F-22: Divider line (bg-border opacity-40)

| Field                                                     | Value                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| **Sample literal**                                        | `bg-border opacity-40` with `height: bookingList.railHeight`          |
| **Call sites**                                            | `bookings/index.tsx:156,192` (in BookingCard and LoadingSkeletonCard) |
| **Semantic intent**                                       | "card divider" — subtle horizontal separator inside cards             |
| **Already covered?** No surface for this specific pattern |
| **Bucket guess**                                          | local (contained within a single component file)                      |

### F-23: Info-row pattern (icon + text row)

| Field                                                    | Value                                                                                                                                                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sample literal**                                       | `flex-row gap-sm items-start bg-muted rounded-md p-md` with `<Icon size={16}>` + `<Text>`                                                                                                                                                   |
| **Call sites**                                           | `bookings/[bookingId]/reschedule.tsx:362` (info tip), `bookings/[bookingId]/dispute.tsx:130` (evidence note), `bookings/[bookingId]/index.tsx:199` (tasker card — similar but different), `bookings/confirm.tsx:72` (tasker card — similar) |
| **Semantic intent**                                      | "info row" — icon + text in a muted container                                                                                                                                                                                               |
| **Already covered?** `InfoRow` primitive exists in `ui/` |
| **Bucket guess**                                         | local (InfoRow already exists but these screens don't use it; could migrate)                                                                                                                                                                |

### F-24: Gradient CTA button

| Field                                                                          | Value                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sample literal**                                                             | `colors={[colors.primaryDeep, colors.primary]}` in `LinearGradient`                                                                                                                                                                  |
| **Call sites**                                                                 | `bookings/[bookingId]/reschedule.tsx:418-438`, `bookings/confirmed.tsx:175-193`, `ConfirmCompletionSheet.tsx:69-77` (different gradient: `verified → trust`), `BookingConfirmation.tsx:135-144` (different: `primary → primaryDeep`) |
| **Semantic intent**                                                            | "primary CTA" gradient button, "success CTA" gradient button                                                                                                                                                                         |
| **Already covered?** No — `Button` component is flat; gradient CTAs are inline |
| **Bucket guess**                                                               | primitive (if pattern stabilizes) or leave local (gradients vary)                                                                                                                                                                    |

### F-25: Scaffold `paddingHorizontal: 16` in booking timeline

| Field                                                                   | Value                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| **Sample literal**                                                      | `paddingHorizontal: 16`                                   |
| **Call sites**                                                          | `bookings/[bookingId]/timeline.tsx:162` (1 call site)     |
| **Semantic intent**                                                     | screen horizontal inset                                   |
| **Already covered?** YES — `screenLayout.insetX` should be used instead |
| **Bucket guess**                                                        | leave local (replace with existing `screenLayout.insetX`) |

---

## Summary statistics

| Metric                                    | Count                                              |
| ----------------------------------------- | -------------------------------------------------- |
| Total findings                            | 25                                                 |
| Findings with ≥2 call sites               | 14 (F-01 through F-10, F-12, F-13, F-16, F-24)     |
| Single-use, leave local                   | 8 (F-11, F-15, F-17, F-18, F-20, F-21, F-22, F-25) |
| Already covered (just fix reference)      | 3 (F-11, F-14, F-25)                               |
| Observations (not extractable per rubric) | 2 (F-12, F-16)                                     |

### Bucket distribution (actionable findings only)

| Bucket                    | Count | Findings                                                 |
| ------------------------- | ----- | -------------------------------------------------------- |
| surface                   | 5     | F-01, F-02, F-03, F-04, F-19                             |
| token                     | 4     | F-05, F-06, F-07, F-08                                   |
| surface (extend existing) | 3     | F-09, F-10, F-14 → but F-14 is "use existing" not extend |
| primitive                 | 2     | F-13, F-24                                               |
| local / leave local       | 8     | F-11, F-15, F-17, F-18, F-20, F-21, F-22, F-25           |
| observation               | 2     | F-12, F-16                                               |

---

## Notable patterns

1. **F-01 + F-02** are the same visual recipe (`bg-muted rounded container`) split across NativeWind and StyleSheet. If consolidated, they represent the highest-impact extraction opportunity (~20 call sites combined).

2. **F-06 + F-07** reveal an inconsistency: some components derive lineHeight from `typography.* * ratio` while others hardcode raw numbers. A token-level consolidation would fix both.

3. **F-16** is architectural rather than extractable: 9 feature components in `features/bookings/components/` use `StyleSheet.create` when AGENTS.md says NativeWind should be the default. This is a convention drift that should be addressed separately from the extraction ladder.

4. **F-11, F-14, F-25** are "just use existing" fixes rather than extractions — the `overlays.sheet`, `screenLayout.*` tokens already exist but aren't referenced.

---

## Done criteria verification

- [x] Report exists
- [x] Every finding has ≥2 call sites OR is flagged "single-use, leave local" with reason
- [x] No source files edited
