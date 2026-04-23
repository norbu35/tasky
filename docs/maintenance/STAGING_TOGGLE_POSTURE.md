# Staging Toggle Posture

## Scope

This document defines the current toggle posture for the private VPS staging sandbox.
It is intentionally a Phase 1 validation surface, not a later-phase rehearsal surface.

## Product rule

- Phase 1 remains zero-monetization and direct-settlement
- later-phase toggles remain off
- staging must not be used to imply that a deferred feature is live

## Environment-level controls

### Private VPS sandbox

| Control                              | Required value       | Why                                                     |
| ------------------------------------ | -------------------- | ------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`             | `local`              | Required because dev-auth is enabled in this sandbox    |
| `TASKY_DEV_AUTH_ENABLED`             | `true`               | Enables local smoke login for customer and tasker flows |
| `VITE_DEV_AUTH_ENABLED`              | `true`               | Enables web quick-login buttons                         |
| `EXPO_PUBLIC_DEV_AUTH_ENABLED`       | `true`               | Enables mobile quick-login buttons                      |
| `TASKY_FEATURE_MONETIZATION_ENABLED` | `false`              | Phase 1 remains zero-monetization                       |
| `TASKY_OTP_ENABLED`                  | `false`              | OTP is not part of the active launch baseline           |
| `TASKY_PUSH_PROVIDER`                | `logging` by default | Safe sandbox default                                    |

Additional rules:

- `TASKY_OTP_TEST_CODE` remains unset
- Facebook credentials are optional in this private sandbox because dev-auth is intentionally used

## Database feature toggles

Current rule:

- any non-launch toggle must stay `false`
- toggle presence must not be used as evidence that the feature is ready

## Future release-grade staging

A later release-grade staging environment may be introduced in the future, but it should be documented separately when it actually exists.
