---
name: tasky-design
description: Use this skill to design or generate well-branded interfaces, assets, and mocks for Tasky — Mongolia's trust-first domestic service marketplace. Provides the Тэнгэр design system (palette, typography, motion, components) with Mongolian-Cyrillic-first copy rules.
---

# Tasky Design Skill

You are designing for **Tasky** — a trust-first domestic services marketplace built for Ulaanbaatar. Mobile-primary. Mongolian Cyrillic is the default locale, not an afterthought.

The design system is **Тэнгэр** (Sky). It is deliberately austere and premium: deep navy authority, steppe gold for value, sage emerald for verification.

## Canonical sources (read in this order)

Authoritative — when these conflict with anything else, these win:

1. `docs/BRAND.md` — brand voice, color roles, logo principles
2. `docs/design/DESIGN_SYSTEM.md` — Тэнгэр palette, typography, motion, spacing
3. `packages/design-tokens/tokens.css` — web runtime tokens (primitive + semantic tiers)
4. `apps/mobile/tailwind.config.ts` · `apps/web/tailwind.config.ts` — platform bindings
5. `docs/design/component-contract.yaml` — component API contract (variants, templates, composition)
6. `docs/design/design-system-additions.yaml` — Mongolian-specific constraints (char budgets, currency, typography)

## Reference material

- `docs/design/screen-specs/SCR-*.yaml` — per-screen canonical layouts, components, copy
- `docs/design/journey-catalog.yaml` — end-to-end user flows with alternate paths
- `docs/design/screen-graph.yaml` — navigation graph (edges, guards, data deps)
- `docs/design/domain-lifecycles.yaml` — backend state machines (task, booking, verification, etc.)
- `docs/design/ui_kits/mobile/` — mobile UI kit HTML/JSX reference
- `docs/design/preview/*.html` — static token previews (colors, type, components, spacing, shadows)
- `apps/mobile/assets/` · `apps/web/public/` — SVG / image assets

## Token system (three-tier, web)

| Tier          | Prefix       | Example                                 | Defined in                          |
| ------------- | ------------ | --------------------------------------- | ----------------------------------- |
| Primitive     | `--tenger-*` | `--tenger-ink`, `--tenger-shadow-nav`   | `packages/design-tokens/tokens.css` |
| Semantic      | `--color-*`  | `--color-primary`, `--color-background` | `packages/design-tokens/tokens.css` |
| shadcn bridge | unprefixed   | `--primary`, `--background`             | `apps/web/src/styles.css`           |

- Web components use Tailwind classes (`bg-primary`, `text-foreground`) — **never** reference `--tenger-*` primitives directly.
- Mobile uses NativeWind classes backed by `@tasky/design-tokens` native outputs (hex values, not HSL).
- Shadows: `--shadow-*` aliases bridge `--tenger-shadow-*` primitives; components use `var(--shadow-card)` etc.
- Motion: `--duration-*` and `--easing-*` (no namespace prefix).

## Working rules

- **Mongolian first.** All UI copy defaults to Mongolian Cyrillic. Respect per-component character budgets in `design-system-additions.yaml` (e.g., card title ≤ 40, button label ≤ 20).
- **Sentence case universally.** ALL-CAPS is reserved for `StatusBadge` microcopy, with +0.6–1.2px letter-spacing for Cyrillic block-form readability.
- **Currency format:** `₮{amount}` prefix, thousand-separated (e.g., `₮45,000`). Minimum representable value is `₮1,001`.
- **Typography:** Manrope (display), Plus Jakarta Sans (body), Roboto (Cyrillic fallback). Line-height `1.6` for body to prevent the Cyrillic fence-effect. Never justify Cyrillic text; never auto-hyphenate.
- **No invented tokens.** If a needed value isn't in the token system, add it at the primitive tier in `packages/design-tokens/src/primitives.ts` and let it propagate through `semantic.ts` → `platform/*`. Never edit platform outputs directly.
- **Parity.** Every shared primitive must keep web/mobile parity across states.

## When invoked

- **Throwaway visual artifacts** (slides, mocks, prototypes): copy assets out and produce static HTML. Use `docs/design/preview/*.html` and `docs/design/ui_kits/mobile/index.html` as references for structure.
- **Production code:** apply tokens through Tailwind / NativeWind utility classes. Never hardcode hex values or ad-hoc spacing. For new screens, start from the matching `SCR-*.yaml` spec.
- **No specific ask:** ask the user what they want to build, probe for context (audience, platform, feature), then decide between HTML artifact or production code.
