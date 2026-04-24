# Tasky Architecture — Shared Frontend Contracts

This document defines the shared frontend contract for `apps/web` and `apps/mobile`.

Read after: `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, the surface-specific doc (`web.md` or `mobile.md`), then `common.md`
when needed.

## 1. Scope

This document owns the cross-platform frontend contract: design tokens, component reference, parity baseline, accessibility, file structure conventions, and test naming rules. Surface-specific rules live in `web.md` and `mobile.md`. Backend API contracts live in `api.md`.

Phase-specific UI behavior must follow `docs/PRD.md` for the active launch baseline and `docs/ROLLOUT_PHASES.md` for deferred surfaces. A dormant screen, component, or state does not become part of the launch UX unless the PRD and rollout map say it is active.

## 2. Design Tokens

- The governing design-token source for implementation is `packages/design-tokens`, structured as primitive values,
  semantic aliases, and platform outputs.
- Web consumes the token graph via Tailwind/theme variables (`packages/design-tokens/tokens.css` for CSS variables).
- Mobile consumes the token graph via NativeWind theme bindings and shared shell/primitive adapters.
- Token contract: all parity components consume the canonical token graph from `packages/design-tokens` via platform outputs.
- During the NativeWind foundation refactor, the parity baseline table (§4) is reference-only and does not drive implementation sequencing.

## 3. Component Ownership by Platform

### 3.1 Web

- Base primitives are hand-authored Radix UI + Tailwind components in `apps/web/src/components/ui`, following shadcn file conventions. The shadcn CLI is not in use.
- Product-level components are composed from those primitives in feature folders.
- Additional third-party UI frameworks (MUI, Ant, Chakra, etc.) are forbidden for web runtime components.

### 3.2 Mobile

- Build native component equivalents. Never import `shadcn/ui` into the mobile app.
- NativeWind backed by `@tasky/design-tokens` is the default styling pipeline.
- `StyleSheet.create` and inline object styles are exceptions reserved for Reanimated styles, platform shadow/elevation helpers, safe-area/inset calculations, and third-party APIs that require object styles.
- If a component exists in `apps/web/src/components/ui/`, a functionally and visually parallel component must exist in `apps/mobile/src/components/ui/` when that primitive is needed on mobile.

## 4. Parity Baseline Table

| Primitive   | Web Source (`apps/web/src/components/ui`) | Mobile Source (`apps/mobile/src/components/ui`) | Required States                              | Notes                                     |
| ----------- | ----------------------------------------- | ----------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Button      | `button.tsx`                              | `Button.tsx`                                    | default, secondary, ghost, disabled, loading | Loading disables press on both platforms. |
| Input       | `input.tsx`                               | `Input.tsx`                                     | default, focus, invalid, disabled            | Invalid state uses danger border token.   |
| Form Field  | composition (`label` + input + message)   | `FormField.tsx`                                 | default, helper, error                       | Error message replaces helper text.       |
| Modal/Sheet | dialog/sheet pattern                      | `ModalSheet.tsx`                                | open, close, backdrop-dismiss                | Backdrop dismiss is enabled by default.   |
| Toast       | toast/badge pattern                       | `Toast.tsx`                                     | info, success, error                         | Alert role for accessibility semantics.   |

**Validation:** `TID-TASK-070-WEB-*` validates web primitives and token usage. `TID-TASK-071-MOBILE-*` validates mobile NativeWind token bindings, shell ownership boundaries, component parity, and this table.

## 5. Accessibility Baseline

- Web components must preserve Radix/shadcn accessibility defaults and satisfy keyboard navigation + WCAG AA contrast.
- Touched flows need visible focus states and minimum AA contrast.
- Accessibility checks for touched flows belong in the web test surface, not as ad hoc manual notes.

## 6. Shared File Structure

```
apps/web/src/components/
  ui/       ← Radix UI + Tailwind primitive components (shadcn conventions)
  feature/  ← domain-specific components composed of UI primitives

apps/mobile/src/components/
  ui/       ← native atomic components matching web primitives
  shells/   ← safe-area, header, CTA-bar, and route-shell ownership boundaries
  feature/  ← domain-specific mobile components composed from shells + primitives
```

### Building Composite Components

1. Check if required primitive Atoms (Button, Badge, Input, Label, Card) exist in `components/ui/`.
2. If not, create them first according to the platform rules for the affected surface.
3. Assemble Molecules/Organisms exclusively from those Atoms using spacing/layout variables from `@tasky/design-tokens`.

## 7. Test Location and Naming Rules

| Platform | Test type      | Location                                                                |
| -------- | -------------- | ----------------------------------------------------------------------- |
| Web      | Unit/component | `apps/web/src/**/*.test.tsx` or `apps/web/tests/**/*.test.tsx` (Vitest) |
| Web      | E2E            | `apps/web/e2e/**/*.spec.ts` (Playwright)                                |
| Mobile   | Unit/component | `apps/mobile/__tests__/**/*.test.tsx` (Jest)                            |

**Behavioral rule for new or touched frontend flow tests:** When an integration or E2E test maps cleanly to an existing launch scenario in `tests/scenarios/*.md`, name that test `SCN-XXX-NNN: <exact title from scenario file>`. This keeps frontend launch evidence aligned with the same scenario spine used by backend tests.

**Technical rule:** Use `TID-*` only for frontend-specific technical checks that do not have a single scenario source of truth, such as token binding, parity, accessibility, shell rendering, and API-client boundary tests.

**Flow rule:** If a frontend test covers multiple launch behaviors, split it into scenario-backed tests or keep it technical. Do not force a fake one-to-one SCN mapping.

Examples:

```typescript
it('SCN-AUTH-004: Valid Facebook OAuth token creates a CUSTOMER session', async () => {
  // scenario-backed frontend behavior
});

it('TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables', () => {
  // frontend-only technical check
});
```

## 8. Structured Intake Renderer Contract

1. **Renderer input contract**:
   - Task-post UI loads `intake_schema_json` and `intake_schema_version` from category metadata.
   - Phase 1 launch field primitives are: single-select, multi-select, dropdown, yes/no toggle, and numeric counter.
2. **Draft binding contract**:
   - Client binds the draft to a schema version when the form starts.
   - Submit validation runs against that bound version, not against whatever schema becomes active later.
3. **Summary contract**:
   - A deterministic template summary is generated before submit and prefilled into the editable description.
   - If deterministic rendering fails, the client or server must still allow posting to continue with a canonical fallback summary.
4. **Deferred optional polish**:
   - Any later async summary polish must remain out of the posting critical path.
   - Model output must never overwrite structured intake answers.
