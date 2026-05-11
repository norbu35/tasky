# App Privacy Questionnaire Mapping

> Maps Tasky's data practices to both Apple App Store Connect and Google Play Data Safety sections.
> Source: `docs/maintenance/PII_INVENTORY.md`
> Last updated: 2026-05-11

## Data collected

| Data type          | Collected?            | Purpose                                   | Shared?                   |
| ------------------ | --------------------- | ----------------------------------------- | ------------------------- |
| Email address      | No (phone-based auth) | N/A                                       | N/A                       |
| Phone number       | Yes                   | Account creation, authentication, SMS OTP | No                        |
| Name               | Yes                   | Profile display                           | Other users (matched)     |
| Profile photo      | Yes                   | Profile display                           | Other users (matched)     |
| Government ID      | Yes (taskers only)    | Identity verification                     | No                        |
| Location (precise) | Yes                   | Task posting, tasker matching             | Other users (approximate) |
| Messages           | Yes                   | Communication between users               | No                        |
| Device identifiers | Yes (push token)      | Push notifications                        | No                        |
| Crash data         | Yes                   | Error reporting (Sentry)                  | Sentry (third-party)      |
| Analytics          | Yes                   | Product improvement                       | No                        |

## Apple App Store Connect — App Privacy

### Data used to track you

None. Tasky does not use data to track users across apps or websites.

### Data linked to you

- **Contact information:** Phone number
- **Identifiers:** User ID, device token
- **Sensitive information:** Government ID images (taskers, for verification)
- **User content:** Messages, profile photos
- **Search history:** Task search queries (for matching)

### Data not linked to you

- **Diagnostics:** Crash logs, performance data
- **Usage data:** Analytics events (anonymized)

## Google Play Data Safety

### Data collected and shared

| Data type     | Collected | Shared              | Purpose       | Encrypted in transit | Can request deletion |
| ------------- | --------- | ------------------- | ------------- | -------------------- | -------------------- |
| Phone number  | Yes       | No                  | Account, auth | Yes (TLS)            | Yes                  |
| Name          | Yes       | Yes (matched users) | Profile       | Yes                  | Yes                  |
| Photos        | Yes       | Yes (matched users) | Profile       | Yes                  | Yes                  |
| Location      | Yes       | Yes (approximate)   | Task matching | Yes                  | Yes                  |
| Messages      | Yes       | No                  | Communication | Yes                  | Yes                  |
| Government ID | Yes       | No                  | Verification  | Yes                  | Yes                  |
| Device ID     | Yes       | No                  | Notifications | Yes                  | Yes                  |
| Crash logs    | Yes       | Yes (Sentry)        | Debugging     | Yes                  | No                   |

### Data handling

- **Encryption:** All data in transit uses TLS; phone numbers encrypted at rest with AES-256-GCM
- **Data deletion:** Users can delete their account and all associated data via the app
- **Data retention:** Data retained until account deletion (see Privacy Policy §6)
- **Third-party sharing:** Only crash data shared with Sentry; no data sold

### Security practices

- Data encrypted in transit (HTTPS/TLS)
- Sensitive data encrypted at rest
- Access limited to authorized personnel
- Regular security reviews
