# Third-Party Licenses

This directory contains machine-readable license reports for all open-source
dependencies used by the Tasky platform.

## Generating reports

Run from the repository root:

```bash
./tooling/scripts/generate-licenses.sh
```

This produces:

| File                            | Scope                   |
| ------------------------------- | ----------------------- |
| `THIRD_PARTY_LICENSES.web.json` | Web (pnpm) dependencies |
| `THIRD_PARTY_LICENSES.api.html` | Backend (Gradle) deps   |

> **Note:** The Gradle report requires the `com.jaredsburrows.license` plugin.
> See `tooling/scripts/generate-licenses.sh` for setup instructions.

## Review cadence

Regenerate and review before every release. Check for new copyleft (GPL/AGPL)
dependencies that may require legal review.
