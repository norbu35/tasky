# Tasky Mobile UI Kit

**Surface:** iOS/Android mobile app (Expo React Native)
**Design width:** 390px (iPhone 14 / standard mobile viewport)
**Source:** Figma `Mobile.fig` + `tasky/apps/mobile/src/`

## Screens included

| Screen         | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| Login          | Social + email auth, brand identity section                     |
| Browse Feed    | Task discovery — search, filter chips, task cards, trust banner |
| Task Detail    | Full task view — header, details, applicant CTA                 |
| Tasker Profile | Profile page — avatar, stats, ratings, verified badge           |
| Post Task      | Multi-step task creation form                                   |
| Bookings       | Customer bookings list                                          |

## Components

All components are in `components.jsx` and exposed to `window`. Key exports:
`BottomNav`, `TopBar`, `TaskCard`, `VerifiedBadge`, `StatusBadge`, `ProfileAvatar`, `Button`, `Input`, `TrustBanner`, `FilterChip`, `RatingStars`

## Usage

Open `index.html` in a browser. Navigate via the bottom tab bar and clickable cards.
Fonts load from `../../fonts/`. Assets from `../../assets/`.
