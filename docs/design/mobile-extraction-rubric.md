# Mobile Extraction Rubric

This document defines how to decide whether a value, style, component, or layout pattern in `apps/mobile`
should stay local or be extracted into a shared abstraction.

Use it when reviewing new mobile work, cleaning up legacy screens, or deciding whether one-off constants
should become tokens, surfaces, primitives, or templates.

## Goal

The mobile app should follow a predictable extraction ladder:

1. Raw value is removed from screens whenever it carries reusable design meaning.
2. Shared values live in a central token layer.
3. Repeated mobile-only visual recipes live in a mobile surface layer.
4. Repeated interaction and layout patterns become reusable primitives.
5. Repeated page composition becomes a template.

The point is not to eliminate every local constant. The point is to make reuse intentional and keep
semantics centralized while avoiding premature abstractions.

## Extraction Ladder

### 1. Design token

Extract to `packages/design-tokens` or `apps/mobile/src/design/*` when the thing being named is a
cross-screen design decision.

Typical examples:

- spacing scale
- radius scale
- color roles
- elevation roles
- motion curves and durations
- chrome dimensions shared by navigation or shell layout

Current repo examples:

- `packages/design-tokens/src/motion.ts`
- `apps/mobile/src/design/screenLayout.ts`
- `apps/mobile/src/design/elevations.ts`

### 2. Mobile surface

Extract to [apps/mobile/src/design/surfaces.ts](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/design/surfaces.ts)
when the value is not a global token, but it is a repeated mobile visual recipe.

A surface is appropriate when the same cluster of fill, border, tint, or emphasis appears in multiple
mobile screens and means the same thing each time.

Good candidates:

- info cards
- success or warning fills
- legal content containers
- booking timeline accents
- illustration backplates
- icon button fills

Do not use a surface for generic spacing, typography, or brand colors. Those remain tokens.

### 3. Primitive component

Extract to `apps/mobile/src/components/ui` when the same interaction pattern or structural markup
appears more than once and can be expressed with a stable API.

Good candidates:

- pressable cards
- headers
- empty and error states
- CTAs with login gates
- permission primers
- reveal wrappers for enter motion

Current repo examples:

- [apps/mobile/src/components/ui/Reveal.tsx](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/components/ui/Reveal.tsx)
- [apps/mobile/src/components/ui/ScreenHeader.tsx](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/components/ui/ScreenHeader.tsx)
- [apps/mobile/src/components/ui/TrustBanner.tsx](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/components/ui/TrustBanner.tsx)

### 4. Template

Extract to `apps/mobile/src/components/templates` when the repeated thing is page composition, not just
a smaller UI block.

Good candidates:

- feed screens
- detail screens
- success or celebration layouts
- settings-style grouped forms
- empty and error full-screen layouts

Current repo examples:

- [apps/mobile/src/components/templates/DetailTemplate.tsx](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/components/templates/DetailTemplate.tsx)
- [apps/mobile/src/components/templates/FeedListTemplate.tsx](/home/norbu/Workspace/Projects/tasky/apps/mobile/src/components/templates/FeedListTemplate.tsx)

## Decision Matrix

Use these thresholds in order.

### Keep it local

Leave a constant or markup block local when all of these are true:

- it appears only once
- it is content-driven or screen-specific
- the name would be awkward or too broad
- extracting it would create props that only one caller uses
- the visual meaning is decorative rather than semantic

Examples:

- a one-off hero illustration offset
- a screen-specific progress total
- a single marketing phrase

### Promote to token

Promote when at least one of these is true:

- the same raw value appears in 3 or more places with the same meaning
- the value belongs to spacing, radius, typography, color, elevation, motion, or shell chrome
- changing the value should update the system consistently

Examples in this repo:

- tab bar height and inset values in `screenLayout.chrome`
- reusable spring definitions in `motion.ts`

### Promote to mobile surface

Promote when all of these are true:

- the pattern is mobile-only or screen-family-specific
- it is mostly visual treatment rather than layout structure
- at least 2 screens use the same treatment or clearly should
- a semantic name is possible

Examples:

- `bookingTimeline`
- `permissionPrimer`
- `legal`
- `taskDetail`

### Promote to primitive

Promote when all of these are true:

- the markup and states repeat, not just the color values
- the component has a stable core API
- the same accessibility behavior should be shared
- the same motion behavior should be shared

Extraction threshold:

- 2 uses is enough if the pattern is high-value and obviously recurring
- 3 uses is the default threshold for routine UI extraction

### Promote to template

Promote when all of these are true:

- several screens share the same page skeleton
- the differences are content slots, not layout rules
- shared loading, error, or empty behavior should remain aligned

## Nameability Test

If you cannot name the thing without referencing the current screen, it is probably not ready to extract.

Good names:

- `primaryStrong`
- `bookingTimeline`
- `Reveal`
- `ScreenHeader`
- `DetailTemplate`

Weak names:

- `blueCard2`
- `taskPageBox`
- `newSpacing`
- `specialHeader`

## API Stability Test

Before extracting a component, ask:

- Can I describe the component in one sentence?
- Are the required props obvious?
- Would a third caller use the same API?
- Am I sharing behavior, not just copying JSX?

If the extracted component needs many boolean escape hatches, it is probably the wrong abstraction level.
In that case, extract the semantics lower down:

- token instead of component
- surface instead of primitive
- primitive instead of template

## Preferred Placement

Use this placement rule consistently.

### `packages/design-tokens`

Place values here when they should stay aligned across platforms or represent core brand/system decisions.

Examples:

- motion durations and curves
- shared semantic colors
- spacing and radius scales

### `apps/mobile/src/design`

Place values here when they are mobile-specific adaptations of the system or navigation/shell behavior.

Examples:

- `screenLayout.ts`
- `surfaces.ts`
- `animations.ts`
- `navigationOptions.ts`

### `apps/mobile/src/components/ui`

Place small reusable building blocks here.

Examples:

- controls
- banners
- cards
- headers
- small animated wrappers

### `apps/mobile/src/components/templates`

Place higher-level screen composition patterns here.

Examples:

- feed pages
- detail pages
- empty/error wrappers
- celebration flows

## Review Checklist

When reviewing a mobile screen or PR, check these in order:

1. Are spacing, radius, color, elevation, and motion values already available as tokens?
2. If not, are they true system decisions or just local decoration?
3. Does a matching `mobileSurfaces.*` recipe already exist?
4. Is the repeated thing just visual treatment, or does it include repeated markup and states?
5. If markup repeats, should it become a `ui` primitive?
6. If whole-screen composition repeats, should it become a template?
7. Would extraction reduce inline literals and simplify future change, or just add indirection?

## Reliable Audit Method

Use the following workflow to check whether extraction opportunities are real.

### 1. Find raw literals

Look for values that should rarely live directly inside screens.

```bash
rg -n "\b(p-[0-9]|m-[0-9]|gap-[0-9]|rounded-\[[^]]+\]|#[0-9A-Fa-f]{3,8}|rgba?\()" apps/mobile/src/app apps/mobile/src/components
```

```bash
rg -n "\b(duration|damping|stiffness|mass|translateY|scale)\b" apps/mobile/src/app apps/mobile/src/components
```

### 2. Group findings by meaning

Do not group only by exact numeric match. Group by semantic intent:

- shell chrome
- card tint
- warning fill
- hero backplate
- CTA spacing
- enter motion

If several different literals are trying to solve the same visual problem, that still points to a shared abstraction.

### 3. Check repetition count

Use `rg` to count how often a pattern already appears.

```bash
rg -n "bg-\[#|border-\[#|text-\[#|rgba?\(" apps/mobile/src/app apps/mobile/src/components
```

```bash
rg -n "rounded-\[|px-\[|py-\[|gap-\[" apps/mobile/src/app apps/mobile/src/components
```

### 4. Check whether existing primitives already cover it

Before creating a new abstraction, inspect:

- `apps/mobile/src/components/ui`
- `apps/mobile/src/components/templates`
- `apps/mobile/src/design/surfaces.ts`
- `apps/mobile/src/design/screenLayout.ts`
- `apps/mobile/src/design/animations.ts`

### 5. Extract the lowest stable layer first

Prefer this order:

1. token
2. surface
3. primitive
4. template

Do not jump straight to a component if the only shared thing is visual treatment.

## Animation Rules

Animation should also follow the extraction ladder.

### Centralize motion tokens first

Durations, easings, and spring parameters belong in the design layer, not inside screens.

Current repo anchors:

- `packages/design-tokens/src/motion.ts`
- `apps/mobile/src/design/animations.ts`

### Reuse motion by intent

Use shared motion categories:

- interactive press feedback
- floating affordances
- emphasis and celebration
- enter/reveal transitions

This is preferable to each screen inventing its own spring.

### Apply motion at the primitive and template layer

Prefer adding motion in shared components so the app feels coherent:

- `Button`
- `PressableCard`
- `SplitCard`
- `FAB`
- `Reveal`
- screen templates for staggered entrance

Keep screen-specific animation only for genuinely unique flows.

## Anti-Patterns

Avoid these:

- naming values by color or implementation instead of meaning
- extracting a component that only wraps one caller with many escape-hatch props
- repeating the same animation config in multiple components
- introducing a global token for a single mobile-only accent card
- leaving semantically identical card fills inline in several screens

## Done Criteria

A cleanup is complete when:

- raw design values are removed from screens where semantics already exist
- repeated mobile-only visual recipes are moved into `mobileSurfaces`
- repeated interaction patterns are expressed as primitives
- repeated screen composition is expressed as templates
- motion uses shared presets instead of ad hoc literals
- new abstractions have short, stable, semantic names

## Practical Rule For This Repo

Use this shorthand during reviews:

- one use: leave it local unless it is clearly a system token
- two uses: consider a surface or primitive if the meaning is already stable
- three uses: extraction is the default unless there is a strong reason not to

That rule keeps `apps/mobile` from drifting back into one-off constants without forcing premature abstractions.
