# PII Inventory

> Source of truth for personally identifiable information stored by Tasky.
> Input for `docs/legal/privacy-policy.*.md`, app-store questionnaires, and data-subject request handling.
> Last audited: 2026-05-11 — derived from `V1__baseline.sql` and `tooling/config/expected-schema.json`.

## Legend

| Column      | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| Encryption  | At-rest column-level encryption applied by the application   |
| Blind index | Searchable hash allowing lookup without decrypting plaintext |
| Retention   | How long the data is kept                                    |
| Deletion    | Mechanism for data subject to request removal                |

## High-impact PII

| Table         | Column            | PII class                           | Encryption                                      | Blind index                     | Retention              | Deletion mechanism                          |
| ------------- | ----------------- | ----------------------------------- | ----------------------------------------------- | ------------------------------- | ---------------------- | ------------------------------------------- |
| users         | phone             | Phone number                        | AES-256-GCM (`CryptoService`)                   | HMAC-SHA256 (`phone_blind_idx`) | Until account deletion | Account deletion cascade                    |
| users         | facebook_id       | Social auth identifier              | None (not reversible to personal data by Tasky) | None                            | Until account deletion | Account deletion cascade                    |
| users         | phone_blind_idx   | Derived phone hash                  | N/A (is the blind index)                        | N/A                             | Until account deletion | Cleared on account deletion                 |
| profiles      | full_name         | Legal name                          | None                                            | None                            | Until account deletion | Account deletion cascade                    |
| profiles      | avatar_url        | Profile photo (S3 key)              | None                                            | None                            | Until account deletion | S3 object deleted on account deletion       |
| profiles      | bio               | Personal biographical text          | None                                            | None                            | Until account deletion | Account deletion cascade                    |
| verifications | id_card_front_key | Government ID image (S3 key)        | None (S3 server-side encryption at rest)        | None                            | Until account deletion | S3 object + row deleted on account deletion |
| verifications | id_card_back_key  | Government ID image (S3 key)        | None (S3 server-side encryption at rest)        | None                            | Until account deletion | S3 object + row deleted on account deletion |
| verifications | dan_reference     | Government registration number      | None                                            | None                            | Until account deletion | Account deletion cascade                    |
| verifications | admin_notes       | Manual review notes (may name user) | None                                            | None                            | Until account deletion | Account deletion cascade                    |
| messages      | content           | Direct message body                 | None                                            | None                            | Conversation lifetime  | Conversation / account deletion             |

## Medium-impact PII

| Table                      | Column           | PII class                | Encryption    | Blind index | Retention                                 | Deletion mechanism                       |
| -------------------------- | ---------------- | ------------------------ | ------------- | ----------- | ----------------------------------------- | ---------------------------------------- |
| tasks                      | location_lat     | Latitude coordinate      | None          | None        | Until task deleted                        | Task deletion / account deletion cascade |
| tasks                      | location_lng     | Longitude coordinate     | None          | None        | Until task deleted                        | Task deletion / account deletion cascade |
| tasks                      | location_text    | Human-readable address   | None          | None        | Until task deleted                        | Task deletion / account deletion cascade |
| task_drafts                | location_lat     | Latitude coordinate      | None          | None        | Until draft expires (7 days)              | Automatic expiry                         |
| task_drafts                | location_lng     | Longitude coordinate     | None          | None        | Until draft expires                       | Automatic expiry                         |
| task_drafts                | location_text    | Human-readable address   | None          | None        | Until draft expires                       | Automatic expiry                         |
| task_applications          | message          | Application message text | None          | None        | Until task deleted                        | Task deletion cascade                    |
| booking_reviews            | comment          | Review text              | None          | None        | Until booking deleted                     | Booking deletion cascade                 |
| disputes                   | reason           | Dispute reason text      | None          | None        | Until dispute resolved + retention window | Admin purge                              |
| disputes                   | resolution_notes | Resolution notes         | None          | None        | Until dispute resolved + retention window | Admin purge                              |
| dispute_evidence           | text_payload     | Written evidence         | None          | None        | Until dispute resolved + retention window | Admin purge                              |
| dispute_evidence           | storage_key      | Evidence file (S3 key)   | None (S3 SSE) | None        | Until dispute resolved + retention window | Admin purge                              |
| booking_completion_signals | proof_note       | Completion note          | None          | None        | Until booking deleted                     | Booking deletion cascade                 |

## Low-impact PII

| Table            | Column          | PII class                | Encryption                   | Blind index | Retention                          | Deletion mechanism                           |
| ---------------- | --------------- | ------------------------ | ---------------------------- | ----------- | ---------------------------------- | -------------------------------------------- |
| otp_challenges   | phone_blind_idx | Derived phone hash       | N/A (is blind index)         | N/A         | Until expiry (5 min)               | Automatic TTL expiry                         |
| otp_challenges   | code            | OTP code hash            | HMAC-SHA256 (not reversible) | N/A         | Until expiry (5 min)               | Automatic TTL expiry                         |
| device_tokens    | token           | Push notification token  | None                         | None        | Until replaced or account deletion | Replaced on re-register; cascade on deletion |
| refresh_sessions | token_id        | Refresh token identifier | None                         | None        | 30 days or explicit logout         | Logout or TTL expiry                         |
| ledger_entries   | description     | Transaction description  | None                         | None        | Until account deletion             | Account deletion cascade                     |
| payout_requests  | amount          | Financial amount         | None                         | None        | Until account deletion             | Account deletion cascade                     |

## Event / log tables with embedded PII risk

| Table                | Column        | PII risk                                               | Encryption | Blind index | Retention                 | Deletion mechanism                                                                  |
| -------------------- | ------------- | ------------------------------------------------------ | ---------- | ----------- | ------------------------- | ----------------------------------------------------------------------------------- |
| audit_events         | metadata_json | May embed actor IP, user agent, email                  | None       | None        | Indefinite (immutable)    | Not deletable (append-only by design); keyed by `actor_user_id` for access requests |
| audit_events         | actor_user_id | Links action to user                                   | None       | None        | Indefinite                | Not deletable; queryable by user ID                                                 |
| domain_outbox_events | payload       | Domain event JSON — may embed task location, user name | None       | None        | Until processed + 30 days | `processed_at` purge job (T3 / ops)                                                 |
| domain_outbox_events | actor_id      | User ID that triggered event                           | None       | None        | Until processed + 30 days | Purge with outbox event                                                             |
| analytics_events     | properties    | JSONB — may embed PII from event context               | None       | None        | Indefinite                | Aggregated / anonymized post-extract                                                |

## Encryption details

| Algorithm                                 | Key source                                           | Usage                                                                            |
| ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| AES-256-GCM (IV: 12 bytes, tag: 128 bits) | `tasky.security.encryption-key` (Base64, 32 bytes)   | `users.phone` column                                                             |
| HMAC-SHA256                               | `tasky.security.blind-index-key` (Base64, ≥32 bytes) | `users.phone_blind_idx`, `otp_challenges.phone_blind_idx`, `otp_challenges.code` |

Both keys are injected via environment variables and never committed.

## Non-PII tables (reference)

The following tables contain no direct PII columns:
`categories`, `category_schema_versions`, `credited_bookings`, `districts`, `feature_toggles`, `moderation_policy`, `payment_intents` (booking_id + processed flag only), `rate_limit_counters`, `shedlock`, `task_badges`, `task_photos` (S3 keys, no faces), `task_reliability_scores`, `task_rescue_events`, `task_service_districts`, `wallets`, `event_idempotency`, `idempotency_keys`.
