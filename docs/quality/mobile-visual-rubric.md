# Mobile Visual Audit Rubric

**Date:** 2026-04-10
**Applies to:** Active (launch-live) screens in the April 2026 batch

---

## Review Categories

### 1. Spacing

**Pass:** Padding, margin, and section gaps follow consistent multiples of the base spacing unit; no cramped or gapped content blocks.
**Fail:** Irregular gaps, sections running together, or padding that differs across sibling screens without intent.

### 2. Typography

**Pass:** Text uses the correct scale (heading/body/caption), weight, and line height from the design token set; hierarchy is scannable at a glance.
**Fail:** Mismatched font sizes, wrong weight for context, or collapsed line height making text hard to read.

### 3. CTA Hierarchy

**Pass:** Primary action is clearly dominant (size, fill, position); secondary and tertiary actions are visually subordinate.
**Fail:** Two or more actions at equal visual weight, a destructive action styled as primary, or a ghost button used where a filled button is required.

### 4. Token Compliance

**Pass:** All colors, border radii, and elevation values are drawn from `@tasky/design-tokens`; no raw hex or magic numbers visible.
**Fail:** Hardcoded hex colors, non-token shadow values, or border radii that do not match the token scale.

### 5. Alignment

**Pass:** Elements share a visible grid baseline; icons, labels, and cards line up across the screen.
**Fail:** Mixed horizontal anchors, uneven icon-to-label gaps, or card edges that do not align.

### 6. State Quality

**Pass:** Empty, loading, and error states use composed layouts with appropriate illustration or feedback copy; they do not look like accidents.
**Fail:** Blank white space on empty state, raw spinner with no context, or an unhandled error that shows a stack trace or nothing.

### 7. Safe-Area / Keyboard Behavior

**Pass:** Content and CTAs are fully visible and tappable when the keyboard is open; notch and home indicator are never occluded by interactive elements.
**Fail:** Sticky action bar hidden behind keyboard, form field obscured by system chrome, or tappable area cut off by notch.

### 8. Localization Fit

**Pass:** Labels and headings do not truncate in English (`en`) or Mongolian (`mn`); no overflow causes layout break.
**Fail:** Label clips to single character in `mn`, heading wraps unexpectedly and pushes CTA off-screen, or a button becomes too narrow to read.

### 9. Sibling Consistency

**Pass:** Screen shares the same header style, card rhythm, and CTA placement as others in its family.
**Fail:** One screen in a family uses a different header variant, card padding, or action-bar style without a documented exception.

---

## Classification Values

| Value          | Meaning                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `pass`         | No material defect; screen is visually acceptable for launch.                                       |
| `systemic-fix` | Defect originates in a shared template, shell, or token mapping; fix at the shared layer.           |
| `screen-fix`   | Defect is isolated to this screen's composition; fix locally after shared fixes land.               |
| `defer`        | Defect is real but out of scope for this batch (no fixture, deferred screen, or cosmetic-only gap). |
