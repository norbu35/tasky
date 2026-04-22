# Tasky Architecture — Shared Frontend Contracts

Status: derived cross-platform UI contract for `apps/web` and `apps/mobile`.

Read after: `docs/PRD.md`, `docs/STRATEGY.md`, the surface-specific doc (`web.md` or `mobile.md`), then `common.md`
when needed.

## 1. Scope

This document owns the cross-platform frontend contract: design tokens, component source of truth, parity baseline, accessibility, file structure conventions, and test naming rules. Surface-specific rules live in `web.md` and `mobile.md`. Backend API contracts live in `api.md`.

## 2. Design Token Source of Truth

- The governing design-token source for implementation is `packages/design-tokens`, structured as primitive values,
  semantic aliases, and platform outputs.
- Web consumes the token graph via Tailwind/theme variables (`packages/design-tokens/tokens.css` for CSS variables).
- Mobile consumes the token graph via NativeWind theme bindings and shared shell/primitive adapters.
- Token contract: all parity components consume the canonical token graph from `packages/design-tokens` via platform outputs.
- During the NativeWind foundation refactor, the parity baseline table (§4) is reference-only and does not drive implementation sequencing.

## 3. Component Source of Truth (per Platform)

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

## 7. Test Location and TID Naming Rule

| Platform | Test type      | Location                                                                |
| -------- | -------------- | ----------------------------------------------------------------------- |
| Web      | Unit/component | `apps/web/src/**/*.test.tsx` or `apps/web/tests/**/*.test.tsx` (Vitest) |
| Web      | E2E            | `apps/web/e2e/**/*.test.ts` (Playwright)                                |
| Mobile   | Unit/component | `apps/mobile/__tests__/**/*.test.tsx` (Jest)                            |

**Critical rule:** Every test block must include its `TID-*` identifier directly in the `it()` or `test()` description string — bare, with no brackets or decorators. The self-verification script discovers AC coverage by scanning for this string in test runner output.

```typescript
it('TID-TASK-080-WEB-AUTH-OAUTH-FLOW should allow user to continue with Facebook and redirect to feed', async () => {
  // test logic
});
```

## 8. Structured Intake Renderer Contract (MVP)

1. **Renderer Input Contract**:
   - Task-post UI loads `intake_schema_json` + `intake_schema_version` from category metadata.
   - Supported field primitives in Phase 0-2: single-select, multi-select, dropdown, yes/no toggle, numeric counter.
2. **Draft Binding Contract**:
   - Client binds draft to schema version on form start.
   - Submit endpoint validates answers against bound version, not latest activated version.
3. **Summary Contract**:
   - Deterministic template summary is generated before submit and prefilled into editable description.
   - On deterministic summary failure, fallback key-value summary is generated and posting continues.
4. **AI Optionality Contract** _(Phase 3+ only)_:
   - Async summary polish can run behind feature toggle.
   - Posting success cannot depend on LLM availability.
   - LLM output cannot mutate structured intake answers.
