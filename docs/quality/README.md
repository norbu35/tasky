# Quality Documents

This directory stores repository-quality artifacts used during maintenance-mode realignment.

Start with the classification documents when you need to know which quality artifact is authoritative:

1. `document-taxonomy.md` defines the authority classes and read order.
2. `document-inventory-2026-04.md` maps the live `docs/` surfaces to those classes.

## Contents

- `verification-matrix.md`: Current verification command inventory and ownership.
- `test-trust-audit.md`: Trust audit of test and gate effectiveness.
- `flaky-or-ceremonial-checks.md`: Known unstable or low-signal checks.
- `cleanup-gate.md`: Trusted cleanup gate contract.
- `source-generated-archive-policy.md`: Policy for source vs generated vs archived assets.
- `test-rehab-backlog.md`: Prioritized test rehabilitation backlog.
- `document-taxonomy.md`: Authority taxonomy for canonical, derived-active, historical, and generated-local docs.
- `document-inventory-2026-04.md`: Current inventory of `docs/` surfaces and their authority class.
- `realignment-report.md`: Final report after ratification.

Only durable quality/verification records should be added here. If a question is about doc authority, status, or
classification, consult the taxonomy and inventory first; do not infer status from directory placement alone.

## Archived Context

Archived baseline artifacts such as `repo-realignment-baseline.md` and `repo-tree-baseline.txt` are historical context
from the realignment effort. They are not live contents of `docs/quality/` and should be treated as archived reference
material if encountered elsewhere in the repository.
