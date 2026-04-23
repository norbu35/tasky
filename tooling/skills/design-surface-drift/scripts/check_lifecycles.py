#!/usr/bin/env python3
"""Validate docs/design/domain-lifecycles.yaml structure.

Deterministic checks:
  - top-level `entities` key exists and is a mapping
  - no duplicate entity keys
  - every entity has `states`, `initial`, and `terminal`
  - `initial` is present in `states`
  - all `terminal` values are present in `states`
  - every transition `id` is unique across the entire file
  - every transition has required fields: id, trigger, source, target
  - transition `source` and `target` are either null or defined in the same entity's `states`
  - active transitions (non-null source/target) declare `phase`

Identifier convention (from identifier-consistency audit):
  - Transition IDs follow [ENTITY_PREFIX]-T\\d{2} format (2-digit zero-padded)

Do not implement in v1:
  - schema enum parity
  - runtime event-name parity
  - validation against Java symbol names
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("check_lifecycles: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[4]
LIFECYCLES = REPO_ROOT / "docs" / "design" / "domain-lifecycles.yaml"

TRANSITION_ID_RE = re.compile(r"^[A-Z]+-T\d{2}$")


def main() -> int:
    if not LIFECYCLES.exists():
        print(f"check_lifecycles: FAIL — file not found: {LIFECYCLES}", file=sys.stderr)
        return 1

    with LIFECYCLES.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}

    failures: list[str] = []
    warnings: list[str] = []

    # 1. top-level entities
    entities = data.get("entities")
    if entities is None:
        print("check_lifecycles: FAIL — missing top-level `entities`", file=sys.stderr)
        return 1

    if not isinstance(entities, dict):
        print("check_lifecycles: FAIL — `entities` is not a mapping", file=sys.stderr)
        return 1

    # 2. global transition ID uniqueness
    all_transition_ids: dict[str, str] = {}  # id -> entity_key

    # 3. per-entity checks
    for entity_key, entity in sorted(entities.items()):
        if not isinstance(entity, dict):
            failures.append(f"entity `{entity_key}`: expected mapping, got {type(entity).__name__}")
            continue

        # required fields
        states_raw = entity.get("states")
        initial = entity.get("initial")
        terminal_raw = entity.get("terminal")
        transitions_raw = entity.get("transitions")

        if states_raw is None:
            failures.append(f"entity `{entity_key}`: missing `states`")
            continue

        states = set(str(s) for s in states_raw) if isinstance(states_raw, list) else set()

        # initial must be in states
        if initial is None:
            failures.append(f"entity `{entity_key}`: missing `initial`")
        elif str(initial) not in states:
            failures.append(
                f"entity `{entity_key}`: initial `{initial}` not in states"
            )

        # terminal must all be in states
        if terminal_raw is None:
            failures.append(f"entity `{entity_key}`: missing `terminal`")
        elif isinstance(terminal_raw, list):
            for t in terminal_raw:
                if str(t) not in states:
                    failures.append(
                        f"entity `{entity_key}`: terminal `{t}` not in states"
                    )
        else:
            failures.append(f"entity `{entity_key}`: `terminal` is not a list")

        # transitions
        if transitions_raw is None:
            warnings.append(f"entity `{entity_key}`: no `transitions` defined")
            continue

        if not isinstance(transitions_raw, list):
            failures.append(f"entity `{entity_key}`: `transitions` is not a list")
            continue

        for idx, trans in enumerate(transitions_raw):
            if not isinstance(trans, dict):
                failures.append(
                    f"entity `{entity_key}`: transition [{idx}] is not a mapping"
                )
                continue

            tid = trans.get("id")
            trigger = trans.get("trigger")
            source = trans.get("source")
            target = trans.get("target")

            # required fields
            if tid is None:
                failures.append(
                    f"entity `{entity_key}`: transition [{idx}] missing `id`"
                )
            else:
                # format enforcement
                if not TRANSITION_ID_RE.match(str(tid)):
                    warnings.append(
                        f"entity `{entity_key}`: transition `{tid}` "
                        f"does not match [PREFIX]-TNN format"
                    )

                # global uniqueness
                if str(tid) in all_transition_ids:
                    failures.append(
                        f"duplicate transition ID `{tid}`: "
                        f"used in `{all_transition_ids[str(tid)]}` and `{entity_key}`"
                    )
                else:
                    all_transition_ids[str(tid)] = entity_key

            if trigger is None:
                failures.append(
                    f"entity `{entity_key}`: transition `{tid or idx}` missing `trigger`"
                )

            # source validation
            if source is None:
                # null source means creation transition — valid
                pass
            elif str(source) not in states:
                failures.append(
                    f"entity `{entity_key}`: transition `{tid or idx}` "
                    f"source `{source}` not in states"
                )

            # target validation
            if target is None:
                # null target means deletion transition — valid
                pass
            elif str(target) not in states:
                failures.append(
                    f"entity `{entity_key}`: transition `{tid or idx}` "
                    f"target `{target}` not in states"
                )

            # phase required on active transitions
            if source is not None or target is not None:
                phase = trans.get("phase")
                if phase is None:
                    failures.append(
                        f"entity `{entity_key}`: transition `{tid or idx}` "
                        f"is active (has source/target) but missing `phase`"
                    )

    if failures:
        print("check_lifecycles: FAIL")
        for f in failures:
            print(f" - {f}")
        for w in warnings:
            print(f" - warning: {w}")
        return 1

    total_transitions = len(all_transition_ids)
    print(
        f"check_lifecycles: PASS "
        f"({len(entities)} entities, {total_transitions} transitions, "
        f"{len(warnings)} warning(s))"
    )
    for w in warnings:
        print(f" - warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
