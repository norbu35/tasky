# Tasky Design System

**Version:** 2.0 | **Status:** Canonical | **Updated:** 2026-03-22

> Mongolia's trust-first domestic service marketplace — where verified identity meets community reputation.

Tasky solves what Facebook groups and Unegui.mn structurally cannot: verified identity, fair pricing, dispute protection, and reputation that travels with you. Built for Ulaanbaatar; Mongolian Cyrillic is first-class, not an afterthought.

---

## Sources

| Resource      | Location                                           |
| ------------- | -------------------------------------------------- |
| Figma file    | `Mobile.fig` (mounted as VFS — 110 frames, 1 page) |
| Codebase      | `tasky/` (Expo React Native monorepo)              |
| Design tokens | `tasky/packages/design-tokens/`                    |
| Mobile app    | `tasky/apps/mobile/`                               |
| Brand doc     | `tasky/docs/BRAND.md`                              |

---

## Products

| Product            | Tech                                      | Notes                                         |
| ------------------ | ----------------------------------------- | --------------------------------------------- |
| **Mobile App**     | Expo React Native + NativeWind + Tailwind | Primary product. Customer + Tasker dual-role. |
| **Web**            | `tasky/apps/web/`                         | Secondary surface (not in Figma scope)        |
| **Services / API** | `tasky/services/`                         | Backend (not a UI surface)                    |

---

## CONTENT FUNDAMENTALS

**Voice:** Direct and warm — not corporate, not cold. Reassuring especially around money and strangers in your home.

**Language:** Bilingual parity. Mongolian copy is written for Mongolian readers, not translated from English. UI uses Mongolian Cyrillic as the default first-class language (e.g. "Даалгаврууд", "Баталгаажсан", "Хүсэлт илгээх").

**Casing:** Sentence-case universally. ALL-CAPS used only for badge/status microcopy (StatusBadge text, "БАТАЛГААЖСАН"), with slight letter-spacing (+0.6–1.2px) to separate Cyrillic block forms.

**Emoji:** Never used in UI. Brand identity relies on a hand-drawn checkmark (SVG stroke) as the sole gestural mark.

**Tone examples:**

- Verification complete → "Identity confirmed. You're good to go." — positive, immediate, no jargon
- Booking confirmed → "Locked in. Your Tasker is on the way." — confident, human
- Dispute opened → "We've got it. You'll hear back within 24 hours." — reassuring, not defensive
- Empty state → "No one nearby yet — try a wider area or a different time." — honest, gives next step
- Payment held → "Your payment is held safely until the job is done." — trust-building, not alarming

**Numbers/prices:** Mongolian tögrög symbol `₮` prefix, comma-separated (e.g. `₮120,000`).

---

## VISUAL FOUNDATIONS

### Colors — "Тэнгэр" (Sky) Palette

Four anchors: Deep Sky Blue · Steppe Gold · Open Sky · Clean Off-White

| Token                         | Hex       | Role                                                                                                   |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `--color-primary` / ink       | `#1B3A5C` | Authority, trust. Body text, primary buttons, nav active. Evokes "Мөнх хөх тэнгэр" (Eternal Blue Sky). |
| `--color-primary-deep`        | `#102638` | Hero text, prominent headers, high-authority UI                                                        |
| `--color-secondary` / sun     | `#8B6914` | Steppe Gold — star ratings, pricing, warm CTAs. Evokes the Mongolian steppe.                           |
| `--color-accent` / sky        | `#6BA3BE` | Open Sky — highlights, links, interactive accents                                                      |
| `--color-background` / canvas | `#F9F8F5` | Clean off-white — professional without being sterile                                                   |
| `--color-card` / surface      | `#FFFFFF` | Card backgrounds                                                                                       |
| `--color-muted`               | `#F3F1EC` | Subtle surface, chip backgrounds                                                                       |
| `--color-verified`            | `#469178` | Sage Emerald — verification badges, success states                                                     |
| `--color-trust`               | `#3568A1` | Trust badges, authority indicators                                                                     |
| `--color-danger`              | `#EF4444` | Errors and destructive actions only — never branding                                                   |

**Dark theme:** Deep sky base (HSL 212 35% 6%) with warm foreground (HSL 40 30% 88%). Brand colors increase lightness to ~55–60% and slightly desaturate. Dark theme values live in the `.dark` CSS class.

### Typography

| Role                | Font                  | Weight  | Sizes                                                                                  |
| ------------------- | --------------------- | ------- | -------------------------------------------------------------------------------------- |
| Display / Headlines | **Manrope**           | 600–700 | 30px hero, 24px heading, 20px title, 18px subtitle                                     |
| Body / UI           | **Plus Jakarta Sans** | 400–700 | 16px body (hard floor for Mongolian readability), 14px label, 12px caption, 10px micro |
| Cyrillic fallback   | Roboto                | system  | —                                                                                      |

- **Line-height:** 1.6 for body paragraphs; 1.3 (tight) for UI controls/buttons
- **Letter-spacing:** Prohibited on sentence-case. +1px only on ALL-CAPS microcopy
- **Alignment:** Flush-left always — justified text creates uneven gaps in Mongolian words
- **Min body size:** 16px non-negotiable for Mongolian mobile reading

### Spacing Scale

4px base unit: 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64

### Border Radius

xs: 6px · sm: 8px · md: 12px · lg: 16px · full: 9999px  
Cards use `md` (12px). Buttons use `sm` (8px). Avatar initials: `md`. Circular badges: `full`.

### Shadows / Elevation

- **card:** `0 1px 2px rgba(0,0,0,0.05)` — default card
- **elevated:** `0 4px 6px rgba(0,0,0,0.1)` — modals, FABs
- **navBar:** `0 -4px 24px rgba(26,28,26,0.04)` — bottom nav bar (upward shadow)

### Backgrounds

Off-white canvas `#F9F8F5` is universal. Cards sit on pure white. Subtle sections use `#F3F1EC`. No full-bleed photographic backgrounds in app UI. Auth screen uses a decorative illustration at 30% opacity with `mix-blend-mode: multiply`. Trust banner uses soft blue tint `rgba(171,201,242,0.3)`.

### Animation / Motion

- **Durations:** instant 80ms, fast 150ms, normal 250ms, slow 400ms, skeleton 1500ms
- **Easing:** standard `cubic-bezier(0.4,0,0.2,1)`, spring `cubic-bezier(0.34,1.56,0.64,1)` for interactive press states
- **Press states:** opacity drop to 0.92 + `scale(0.98)` spring. No color change on press.
- **Skeleton:** 1500ms shimmer tuned for Mongolia's 20 Mbps mobile average
- **Celebration animations:** HandDrawnCheck scales in using spring easing on verification/success

### Hover / Press States

- Buttons: opacity 0.5 when disabled; `scale(0.98)` + opacity 0.92 on press
- Cards (PressableCard/ListItemCard): `scale(0.98)` spring on press
- No color-change hover states (mobile-first, touch-primary)

### Cards

White background (`#FFFFFF`), radius `md` (12px), card shadow (`0 1px 2px rgba(0,0,0,0.05)`). No border by default. Pressable cards shrink slightly on press.

### Bottom Navigation Bar

Height ~81px. Background: `rgba(250,249,246,0.6)` with `backdrop-filter: blur(16px)`. Top-left/right radius 12px. Shadow: `0 -4px 20px rgba(26,28,26,0.06)`. Active tab: primary blue icon + label. Inactive: `#6C7B89`.

### Sticky Footer Actions

Full-width action area at screen bottom. Background: `rgba(250,249,246,0.8)` with `backdrop-filter: blur(24px)`. Contains primary CTA button (full width or paired with icon-only secondary).

### Iconography — Lucide Icons

See `ICONOGRAPHY` section below.

### Brand Mark

**Logo wordmark:** "Tasky" in Manrope 700, `#102638`.  
**Logo icon:** Dark navy square (border-radius 8px, `#002444`) with white checkmark SVG centered inside. Subtle gold halo (`rgba(253,206,106,0.2)`, radius 12px) offset -16px behind the icon box.  
**Recognition mark:** Hand-drawn gestural checkmark in verified sage emerald `#469178`. Stroke only, `stroke-linecap: round`, `stroke-linejoin: round`, 3–4px weight. Never filled. Max one per viewport.

---

## ICONOGRAPHY

**Icon library:** Lucide (`lucide-react-native`) — thin-stroke outlined icon set.  
**Style:** Outlined / stroke, consistent 1.5–2px weight, never filled except star ratings.  
**Sizes:** 16px (sm inline), 18px (nav), 20px (standard), 24px (feature).  
**Color:** Matches semantic text/foreground tokens — primary blue for active states, `#6C7B89` for inactive nav, `#5E6B78` for secondary actions.  
**Special fill:** Star rating icons (`Star`) fill with `secondary` gold when active; stroke only when inactive.  
**Emoji:** Never used. Unicode chars not used as icons.  
**Verification badge icon:** `ShieldCheck` (Lucide) filled on verified, `Shield` unfilled for pending.

Assets copied:

- `assets/logo-icon.svg` — App icon (white checkmark on navy bg)
- `assets/facebook-icon.svg` — Facebook OAuth button icon
- `assets/email-icon.svg` — Email login button icon

---

## File Index

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← All CSS custom properties (colors + typography)
fonts/                       ← .ttf font files (Manrope, Plus Jakarta Sans)
assets/                      ← Logos, icons, SVG assets
preview/                     ← Design system card HTML files
ui_kits/
  mobile/
    index.html               ← Interactive mobile app UI kit
    components.jsx           ← Shared React components
    README.md                ← Mobile UI kit notes
```

---

## Verification System

The `VerifiedBadge` is the primary trust signal on every Tasker profile. States:

| State      | Color                  | Label                           |
| ---------- | ---------------------- | ------------------------------- |
| Verified   | `#469178` sage emerald | "Баталгаажсан" / Verified       |
| Pending    | `#6BA3BE` open sky     | "Хянагдаж байна" / Under Review |
| Unverified | (hidden)               | —                               |

Badge appears: search result cards, Tasker profile header, booking confirmation screen.
