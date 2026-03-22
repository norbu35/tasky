# Tasky Brand Identity

**Version:** 2.0
**Date:** 2026-03-22
**Status:** Canonical

---

## Mission

> "Mongolia's trust-first domestic service marketplace — where state-backed identity meets community reputation."

Tasky solves what Facebook groups and Unegui.mn structurally cannot: verified identity, fair pricing, dispute protection, and reputation that travels with you.

---

## Brand Personality

| Pillar | What It Means |
|--------|---------------|
| **Trustworthy** | Every Tasker is ID-verified. Payments are protected. Disputes have recourse. |
| **Local** | Built for Ulaanbaatar. Mongolian Cyrillic is first-class, not an afterthought. |
| **Modern** | Clean, fast, no clutter. Feels like a product people are proud to use. |
| **Fair** | Fixed prices upfront. No foreigner pricing. No pay-to-rank spam. |

---

## Voice & Tone

- **Direct and warm** — not corporate, not cold
- **Reassuring** — especially around money and strangers in your home
- **Bilingual parity** — Mongolian copy is written for Mongolian readers, not translated from English

### Microcopy examples

| Moment | English | Notes |
|--------|---------|-------|
| Verification complete | "Identity confirmed. You're good to go." | Positive, immediate, no jargon |
| Booking confirmed | "Locked in. Your Tasker is on the way." | Confident, human |
| Dispute opened | "We've got it. You'll hear back within 24 hours." | Reassuring, not defensive |
| Empty state (no taskers) | "No one nearby yet — try a wider area or a different time." | Honest, gives next step |
| Payment held | "Your payment is held safely until the job is done." | Trust-building, not alarming |

---

## Color Palette — "Steppe Diffusion"

Five anchors: Deep Teal `#163838` · Terracotta `#A93700` · Golden Olive `#89752A` · Indigo `#3F53A2` · Cream `#FAFAF5`

| Token | Hex | Role | Rationale |
|-------|-----|------|-----------|
| `primary` | `#163838` | Deep Teal | Authority and trust. Grounded, not corporate. Also used as body text color. |
| `primary-deep` | `#0D2626` | Darker Teal | Hero text, prominent headers, high-authority UI. |
| `secondary` | `#A93700` | Terracotta | Second action color — secondary CTAs, warm interactive surfaces. Earth-toned energy. |
| `accent` | `#89752A` | Golden Olive | Highlights, star ratings, tags, warm accents. |
| `background` | `#FAFAF5` | Warm Cream | Inviting, warm surface. Easy on the eyes for long browsing sessions. |
| `trust` | `#3F53A2` | Indigo | Trust badges, authority indicators. Cool digital confidence. |
| `verified` | `#3B9B7A` | Sage Emerald | Verification badge. Derived from primary hue (180) shifted toward green (160) — reads as "safe" while harmonizing with the teal family. |
| `danger` | `#EF4444` | Red | Errors and destructive actions only. Never used for branding. |

### Dark theme
Deep teal base (`180 30% 5%`) with warm cream foreground (`47 70% 88%`). Brand colors increase lightness to ~55% and slightly desaturate to avoid glare on dark surfaces. The terracotta secondary and golden olive accent remain warm and recognizable.

---

## Typography

| Role | Font | Weight | Min Size |
|------|------|--------|----------|
| Display / Headlines | Manrope | 600–800 | 24px |
| Body / UI | Plus Jakarta Sans | 400–600 | **16px** (hard floor) |
| Fallback (Cyrillic) | Roboto | system | — |

### Mongolian Cyrillic rules
- **Minimum body size: 16px** — non-negotiable for Mongolian readability on mobile
- **Line-height: 1.6** for body text — Cyrillic letterforms are more "fence-like" and need more vertical breathing room than Latin
- **No wide letter-spacing on Cyrillic** — tracking wider than `0em` degrades readability
- **Flush-left alignment** — justified text creates uneven gaps in Mongolian words; always left-align
- **Font fallback** — Manrope and Plus Jakarta Sans cover the Ү and Ө glyphs; Roboto is listed as a system fallback for edge cases

---

## Logo Principles

- **Wordmark:** "Tasky" in Manrope 700, `primary-deep` (`#0D2626`)
- **Don't use:** literal houses, hammers, generic checkmark shields, culturally specific symbols

---

## Recognition Marker — Hand-drawn Checkmark

A gestural, slightly imperfect single-stroke checkmark in `verified` sage emerald (`#3B9B7A`). This is Tasky's signature mark — used across all surfaces to create brand recognition.

**The mark:** A hand-drawn checkmark rendered as an SVG path with `stroke-linecap: round` and `stroke-linejoin: round`. Not a geometric checkbox — a confident, human stroke with slight thickness variation.

**Variations:**
- **Standard** — single confident stroke, 3-4px weight. Primary usage.
- **Inline** — smaller, lighter (2-3px). Used within text or UI elements.
- **Emphasis** — double stroke (second at 40% opacity). For marketing hero moments.

**Where to use:**
- Section punctuation on landing pages (after headlines)
- Task completion states in-app
- Marketing card accents (corner or bottom-right, low opacity)
- Social media watermarks
- Photo overlays on marketing imagery

**Rules:**
- Always `verified` color (`#3B9B7A`) — never primary, accent, or secondary
- Never fill the checkmark — stroke only
- Minimum size: 16px
- On dark backgrounds: use at 100% opacity. On light backgrounds: 60-80% opacity for subtlety.
- Maximum one checkmark per visible viewport area — sparse, not patterned

---

## Verification System (DAN/KHUR)

The DAN state-identification badge is the primary trust signal on every Tasker profile. Its visual treatment must communicate **government-grade authority**, not just platform self-certification.

| State | Color Token | Label |
|-------|------------|-------|
| Verified | `verified` (#3B9B7A) | "Баталгаажсан" / Verified |
| Pending | `accent` (#89752A) | "Хянагдаж байна" / Under Review |
| Unverified | `chip-inactive` | (no badge shown) |

The badge must appear:
1. On every search result card (anchored to the avatar)
2. At the top of the Tasker profile page
3. In the booking confirmation screen

---

## Photography & Illustration

- **Photography:** Real urban homes and professional workers. Warm-lit, candid, not staged global stock.
- **Illustration:** Flat geometric using `primary-deep` + `accent` palette. No gradients in illustrations — gradients are reserved for UI chrome.
- **Asset naming:** `hero-illustration.webp`, `auth-bg.webp`, `category-{slug}.webp`
- **Performance:** All images served as `.webp`. Target < 150 KB for above-the-fold assets (20 Mbps mobile constraint).

---

## What We Are Not

- Not a generic SaaS landing page with blurred gradient blobs
- Not a copy of TaskRabbit with Mongolian text
- Not a culturally themed brand — no ethnic motifs, no folklore decoration
- Not a fintech app that sacrifices warmth for authority
