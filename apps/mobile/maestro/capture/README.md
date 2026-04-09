# Maestro Capture Output

This directory holds visual audit screenshot run logs produced by
`apps/mobile/scripts/capture-visual-audit.sh`.

## Directory Convention

```
apps/mobile/maestro/capture/<batch>/<timestamp>/
```

- `<batch>` — one of the valid batch names listed below
- `<timestamp>` — `YYYYMMDD-HHMMSS` generated at run start

Each run directory is self-contained and never overwritten.

## Valid Batch Names

| Batch      | Flows included                                               |
| ---------- | ------------------------------------------------------------ |
| `smoke`    | app launch smoke, customer post-a-task, tasker browse        |
| `auth`     | onboarding/login journey                                     |
| `customer` | customer post-a-task, profile management                     |
| `tasker`   | tasker browse, tasker verification, tasker stats             |
| `shared`   | profile management, settings, notification center, legal     |
| `all`      | all of the above, deduplicated (default)                     |

## Per-Run Output Files

| File                          | Contents                                          |
| ----------------------------- | ------------------------------------------------- |
| `capture-summary.txt`         | PASS / FAIL / SKIP totals and per-flow results    |
| `<flow-stem>.log`             | Raw stdout/stderr from `maestro test` for one flow |
| `<flow-stem>.xml`             | JUnit XML report for one flow                     |

Maestro's own device screenshots are written automatically to
`~/.maestro/tests/<timestamp>/` — they are not copied here.

## How to Run

```bash
# from apps/mobile/
./scripts/capture-visual-audit.sh          # run all batches
./scripts/capture-visual-audit.sh smoke    # run smoke batch only
./scripts/capture-visual-audit.sh auth     # run auth batch only
```

Requires: Maestro CLI installed, a booted iOS simulator (iPhone 15 Pro / iOS 17),
and the Expo dev server running.

## Capture vs Test Mode

Capture mode (`capture-visual-audit.sh`) continues on flow failures so every
reachable screen is attempted. `pnpm test:e2e` / `test:e2e:smoke` are strict
pass/fail gates — do not conflate the two.
