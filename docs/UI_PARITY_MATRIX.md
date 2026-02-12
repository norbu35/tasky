# UI Parity Matrix (Web `shadcn/ui` -> Mobile Native Layer)

## Scope
Defines state and behavior parity for shared UX primitives between:
1. `apps/web/src/components/ui` (`shadcn/ui`-based)
2. `apps/mobile/src/components/ui` (native token-adapted components)

## Parity Baseline
| Primitive | Web Source | Mobile Source | Required States | Notes |
|---|---|---|---|---|
| Button | `button.tsx` | `Button.tsx` | default, secondary, ghost, disabled, loading | Loading disables press on both platforms. |
| Input | `input.tsx` | `Input.tsx` | default, focus, invalid, disabled | Invalid state uses danger border token. |
| Form Field | composition (`label` + input + message) | `FormField.tsx` | default, helper, error | Error message replaces helper text. |
| Modal/Sheet | dialog/sheet pattern | `ModalSheet.tsx` | open, close, backdrop-dismiss | Backdrop dismiss is enabled by default. |
| Toast | toast/badge pattern | `Toast.tsx` | info, success, error | Alert role for accessibility semantics. |

## Token Contract
All parity components consume tokens derived from:
1. `packages/design-tokens/tokens.ts` (typed token source)
2. `packages/design-tokens/tokens.css` (web CSS variables)
3. `apps/mobile/src/design/tokenAdapter.ts` (mobile adapter)

## Validation Hooks
1. `TID-TASK-070-WEB-*` validates web primitives and token usage.
2. `TID-TASK-071-MOBILE-*` validates mobile token adapter, component parity, and this matrix linkage.
