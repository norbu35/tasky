# Staging Toggle Posture

Last updated: 2026-04-10

## Scope

This document defines the current toggle posture for the private VPS staging sandbox. It is intentionally different from
future release-grade staging because this sandbox runs in `local` profile with dev-auth enabled.

The product rule does not change:

- Phase 1 remains zero-monetization
- later-phase toggles remain off

## Environment-Level Controls

### Private VPS sandbox

| Control                              | Required value       | Why                                                      |
| ------------------------------------ | -------------------- | -------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`             | `local`              | Required if dev-auth is enabled                          |
| `TASKY_DEV_AUTH_ENABLED`             | `true`               | Enables real backend dev auth endpoint                   |
| `VITE_DEV_AUTH_ENABLED`              | `true`               | Web quick-login buttons (calls real backend)             |
| `EXPO_PUBLIC_DEV_AUTH_ENABLED`       | `true`               | Mobile quick-login buttons (calls real backend)          |
| `TASKY_FEATURE_MONETIZATION_ENABLED` | `false`              | Phase 1 remains zero-monetization                        |
| `TASKY_OTP_ENABLED`                  | `false`              | OTP remains out of launch scope                          |
| `TASKY_PUSH_PROVIDER`                | `logging` by default | Safe sandbox default                                     |

Additional rules:

- `TASKY_OTP_TEST_CODE` remains unset
- `TASKY_FACEBOOK_APP_ID` and `TASKY_FACEBOOK_APP_SECRET` are optional in this sandbox (dev auth provides local login)

### Future release staging

Not implemented yet, but the intended posture later is:

- `SPRING_PROFILES_ACTIVE=prod`
- `TASKY_DEV_AUTH_ENABLED=false`
- `VITE_DEV_AUTH_ENABLED=false`
- `EXPO_PUBLIC_DEV_AUTH_ENABLED=false`

## Database Feature Toggles

These rows stay aligned with the Phase 1 launch baseline even in the private sandbox.

| Toggle                     | Required value | Current truth                                                     | Rule                                                |
| -------------------------- | -------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `lead_fee_enabled`         | `false`        | Seeded, but no confirmed runtime consumer in the current audit    | Keep off                                            |
| `subscription_enabled`     | `false`        | Seeded, but deferred and shell-only                               | Keep off                                            |
| `escrow_enabled`           | `false`        | Real gated runtime path exists, but Phase 1 keeps it dormant      | Keep off                                            |
| `ai_scope_summary_enabled` | `false`        | Deterministic summary is launch-live; AI rewrite is still dormant | Keep off                                            |
| `data_retention_dry_run`   | `true`         | Internal safety toggle seeded by migration                        | Keep on unless running a deliberate retention drill |

## Deferred Or Document-Only Toggle Names

These names should not be inserted manually into the sandbox database:

| Name                        | Current status                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `promoted_listings_enabled` | Documented future capability with no confirmed seeded runtime support in this sweep |
| `b2b_enabled`               | Documented future capability; API and runtime remain deferred                       |

## Operator Rules

1. Do not use the private sandbox to simulate Phase 2/3 monetization by turning on dormant toggles.
2. Do not invent new DB toggle rows to satisfy future-facing docs.
3. Record every manual toggle change with actor, timestamp, and reason.
4. Return the sandbox to the values above after any exploratory test.

## Decision Boundary

The private VPS sandbox is considered Phase 1-aligned only when:

- dev-auth is enabled intentionally for this sandbox
- all monetization and later-phase DB toggles remain in their dormant posture
- `TASKY_FEATURE_MONETIZATION_ENABLED=false`

If later-phase toggles are enabled, the sandbox stops being a valid Phase 1 test ground.
