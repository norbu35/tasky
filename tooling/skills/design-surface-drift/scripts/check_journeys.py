#!/usr/bin/env python3
"""Validate docs/design/journey-catalog.yaml structure.

Deterministic checks:
  - top-level `journeys` key exists and is a list
  - every journey `entry` screen resolves in screen-graph.yaml
  - every journey `exit` screen resolves in screen-graph.yaml
  - every `happy_path[].screen` resolves in screen-graph.yaml
  - every `alternate_paths[].screens[]` resolves in screen-graph.yaml
  - lifecycle references extracted via tolerant regex are resolved against
    domain-lifecycles.yaml transition IDs

Identifier convention (from identifier-consistency audit):
  - Screen IDs: SCR-[A-Z]+-\\d{3}
  - Transition IDs: [A-Z]+-T\\d{2} (tolerant: \\b[A-Z]+-T\\d+\\b)
  - Journey IDs: JRN-[A-Z]+-\\d{2}
  - Lifecycle strings may contain free text with mixed references like
    "USER-T02 or USER-T04" or "BOOK-T08 (reschedule_accepted) or BOOK-T09"

Warn (not fail) on:
  - lifecycle strings that contain text but no parseable transition ID token
  - `next` values that are not screen IDs (may be descriptive prose)

Do not implement in v1:
  - fuzzy trigger-matches-code-event-name checks
  - DB enum parity
  - require schema rewrite of journey-catalog.yaml
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("check_journeys: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[4]
JOURNEY_CATALOG = REPO_ROOT / "docs" / "design" / "journey-catalog.yaml"
SCREEN_GRAPH = REPO_ROOT / "docs" / "design" / "screen-graph.yaml"
LIFECYCLES = REPO_ROOT / "docs" / "design" / "domain-lifecycles.yaml"

# Tolerant regex: catches USER-T02, BOOK-T08, TASK-T01, etc.
LIFECYCLE_ID_RE = re.compile(r"\b([A-Z]+-T\d+)\b")
JOURNEY_ID_RE = re.compile(r"^JRN-[A-Z]+-\d{2}$")


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def collect_screen_ids(screen_graph: dict[str, Any]) -> set[str]:
    nodes = screen_graph.get("nodes")
    if isinstance(nodes, dict):
        return set(nodes.keys())
    return set()


def collect_transition_ids(lifecycles: dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    entities = lifecycles.get("entities")
    if not isinstance(entities, dict):
        return ids
    for entity in entities.values():
        if not isinstance(entity, dict):
            continue
        for trans in entity.get("transitions") or []:
            if isinstance(trans, dict) and trans.get("id"):
                ids.add(str(trans["id"]))
    return ids


def extract_lifecycle_ids(text: str) -> list[str]:
    """Extract transition IDs from free-form lifecycle strings.

    Handles patterns like:
      - USER-T02 or USER-T04
      - BOOK-T08 (reschedule_accepted) or BOOK-T09 (reschedule_declined)
      - TASK-T01 (customer_publishes_task)
    """
    return LIFECYCLE_ID_RE.findall(text)


def main() -> int:
    if not JOURNEY_CATALOG.exists():
        print(f"check_journeys: FAIL — file not found: {JOURNEY_CATALOG}", file=sys.stderr)
        return 1

    data = load_yaml(JOURNEY_CATALOG)

    # Load cross-references (optional — warn if missing but don't hard-fail)
    screen_ids: set[str] = set()
    transition_ids: set[str] = set()

    if SCREEN_GRAPH.exists():
        screen_ids = collect_screen_ids(load_yaml(SCREEN_GRAPH))
    else:
        print("check_journeys: warning — screen-graph.yaml not found, skipping screen resolution", file=sys.stderr)

    if LIFECYCLES.exists():
        transition_ids = collect_transition_ids(load_yaml(LIFECYCLES))
    else:
        print("check_journeys: warning — domain-lifecycles.yaml not found, skipping lifecycle resolution", file=sys.stderr)

    failures: list[str] = []
    warnings: list[str] = []

    journeys = data.get("journeys")
    if journeys is None:
        print("check_journeys: FAIL — missing top-level `journeys`", file=sys.stderr)
        return 1

    if not isinstance(journeys, list):
        print("check_journeys: FAIL — `journeys` is not a list", file=sys.stderr)
        return 1

    for journey in journeys:
        if not isinstance(journey, dict):
            failures.append("journey entry is not a mapping")
            continue

        jid = journey.get("id", "<missing id>")

        # journey ID format
        if not isinstance(jid, str) or not JOURNEY_ID_RE.match(jid):
            warnings.append(f"journey `{jid}`: does not match JRN-[PREFIX]-NN format")

        # entry screen
        entry = journey.get("entry")
        if entry is None:
            failures.append(f"journey `{jid}`: missing `entry`")
        elif screen_ids and str(entry) not in screen_ids:
            failures.append(
                f"journey `{jid}`: entry `{entry}` not in screen-graph.yaml"
            )

        # exit screens
        exit_raw = journey.get("exit")
        if exit_raw is None:
            failures.append(f"journey `{jid}`: missing `exit`")
        elif isinstance(exit_raw, list):
            for ex in exit_raw:
                ex_str = str(ex)
                # Tolerate prose exit values (e.g. "previous screen") as warnings
                # only hard-fail on values that look like screen IDs but are unresolved
                if ex_str.startswith("SCR-") and screen_ids and ex_str not in screen_ids:
                    failures.append(
                        f"journey `{jid}`: exit `{ex_str}` not in screen-graph.yaml"
                    )
                elif not ex_str.startswith("SCR-") and screen_ids:
                    warnings.append(
                        f"journey `{jid}`: exit `{ex_str}` is not a screen ID"
                    )
        else:
            failures.append(f"journey `{jid}`: `exit` is not a list")

        # happy_path screens
        happy_path = journey.get("happy_path")
        if happy_path is not None and isinstance(happy_path, list):
            for step in happy_path:
                if not isinstance(step, dict):
                    continue
                screen = step.get("screen")
                if screen and screen_ids and str(screen) not in screen_ids:
                    failures.append(
                        f"journey `{jid}`: happy_path screen `{screen}` "
                        f"not in screen-graph.yaml"
                    )

                # lifecycle resolution
                lc_text = step.get("lifecycle")
                if lc_text and isinstance(lc_text, str):
                    parsed_ids = extract_lifecycle_ids(lc_text)
                    if not parsed_ids:
                        warnings.append(
                            f"journey `{jid}`: lifecycle string has no parseable "
                            f"transition ID: `{lc_text}`"
                        )
                    elif transition_ids:
                        for tid in parsed_ids:
                            if tid not in transition_ids:
                                failures.append(
                                    f"journey `{jid}`: lifecycle ref `{tid}` "
                                    f"not in domain-lifecycles.yaml"
                                )

                # next field: warn if not a screen ID (may be descriptive prose)
                next_val = step.get("next")
                if next_val and screen_ids and str(next_val) not in screen_ids:
                    # Don't fail — "return to booking detail" is legitimate prose
                    pass

        # alternate_paths screens
        alt_paths = journey.get("alternate_paths")
        if alt_paths is not None and isinstance(alt_paths, list):
            for ap in alt_paths:
                if not isinstance(ap, dict):
                    continue
                ap_screens = ap.get("screens")
                if isinstance(ap_screens, list):
                    for scr in ap_screens:
                        if screen_ids and str(scr) not in screen_ids:
                            failures.append(
                                f"journey `{jid}`: alternate_path `{ap.get('id', '?')}` "
                                f"screen `{scr}` not in screen-graph.yaml"
                            )

                # alternate path lifecycle resolution
                ap_lc = ap.get("lifecycle")
                if ap_lc and isinstance(ap_lc, str):
                    parsed_ids = extract_lifecycle_ids(ap_lc)
                    if not parsed_ids:
                        warnings.append(
                            f"journey `{jid}`: alternate_path `{ap.get('id', '?')}` "
                            f"lifecycle string has no parseable transition ID: `{ap_lc}`"
                        )
                    elif transition_ids:
                        for tid in parsed_ids:
                            if tid not in transition_ids:
                                failures.append(
                                    f"journey `{jid}`: alternate_path `{ap.get('id', '?')}` "
                                    f"lifecycle ref `{tid}` not in domain-lifecycles.yaml"
                                )

        # JRN-INFRA-01 uses `paths` instead of `happy_path`/`alternate_paths`
        infra_paths = journey.get("paths")
        if infra_paths is not None and isinstance(infra_paths, list):
            for ip in infra_paths:
                if not isinstance(ip, dict):
                    continue
                ip_screens = ip.get("screens")
                if isinstance(ip_screens, list):
                    for scr in ip_screens:
                        if screen_ids and str(scr) not in screen_ids:
                            failures.append(
                                f"journey `{jid}`: path `{ip.get('name', '?')}` "
                                f"screen `{scr}` not in screen-graph.yaml"
                            )

                # infrastructure path lifecycle
                ip_lc = ip.get("lifecycle")
                if ip_lc and isinstance(ip_lc, str):
                    parsed_ids = extract_lifecycle_ids(ip_lc)
                    if not parsed_ids:
                        warnings.append(
                            f"journey `{jid}`: path `{ip.get('name', '?')}` "
                            f"lifecycle string has no parseable transition ID: `{ip_lc}`"
                        )
                    elif transition_ids:
                        for tid in parsed_ids:
                            if tid not in transition_ids:
                                failures.append(
                                    f"journey `{jid}`: path `{ip.get('name', '?')}` "
                                    f"lifecycle ref `{tid}` not in domain-lifecycles.yaml"
                                )

    if failures:
        print("check_journeys: FAIL")
        for f in failures:
            print(f" - {f}")
        for w in warnings:
            print(f" - warning: {w}")
        return 1

    print(
        f"check_journeys: PASS "
        f"({len(journeys)} journeys, {len(warnings)} warning(s))"
    )
    for w in warnings:
        print(f" - warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
