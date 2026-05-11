# Security Posture

> Operational security reference for the Tasky platform.
> Last updated: 2026-05-11.

## Supply-chain security

### OpenSSF Scorecard

**Status:** Planned assessment (P2-07).

Run [OpenSSF Scorecard](https://github.com/ossf/scorecard) against the repository
to establish a baseline and remediate low-scoring sub-categories (branch protection,
token permissions, dependency pinning, etc.).

```bash
# Install scorecard (one-time)
go install github.com/ossf/scorecard/v5/cmd/scorecard@latest

# Run against the public repo
scorecard --repo=github.com/<org>/tasky --format json > docs/audits/scorecard.json
```

Target: remediate all sub-scores below 7/10 within one quarter of launch.
