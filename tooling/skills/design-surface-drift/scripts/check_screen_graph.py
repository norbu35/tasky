#!/usr/bin/env python3
"""Validate docs/design/screen-graph.yaml structure.

Deterministic checks:
  - top-level `nodes` key exists and is a mapping
  - no duplicate node IDs
  - every node has a `label`
  - every node `edges` is a list when present
  - every edge `to:` target resolves to a defined node

Identifier convention (from identifier-consistency audit):
  - Screen IDs follow SCR-[A-Z]+-\\d{3} (3-digit zero-padded)
  - Edge types: replace, push, pop, modal, dismiss

Output convention:
  - check_screen_graph: PASS (N nodes)
  - check_screen_graph: FAIL
      - detail lines prefixed with " - "
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("check_screen_graph: ERROR: pyyaml not installed. Run: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[4]
SCREEN_GRAPH = REPO_ROOT / "docs" / "design" / "screen-graph.yaml"

SCREEN_ID_RE = re.compile(r"^SCR-[A-Z]+-\d{3}$")
VALID_EDGE_TYPES = {"replace", "push", "pop", "modal", "dismiss"}


def main() -> int:
    if not SCREEN_GRAPH.exists():
        print(f"check_screen_graph: FAIL — file not found: {SCREEN_GRAPH}", file=sys.stderr)
        return 1

    with SCREEN_GRAPH.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}

    failures: list[str] = []
    warnings: list[str] = []

    # 1. top-level nodes
    nodes = data.get("nodes")
    if nodes is None:
        print("check_screen_graph: FAIL — missing top-level `nodes`", file=sys.stderr)
        return 1

    if not isinstance(nodes, dict):
        print("check_screen_graph: FAIL — `nodes` is not a mapping", file=sys.stderr)
        return 1

    node_ids = set(nodes.keys())

    # 2. identifier format enforcement
    for nid in sorted(node_ids):
        if not SCREEN_ID_RE.match(nid):
            warnings.append(f"node {nid}: does not match SCR-[PREFIX]-NNN format")

    # 3. duplicate node IDs (dict keys are unique by construction, but check
    #    for future-proofing in case the loader behaves differently)
    seen_ids: set[str] = set()
    for nid in nodes:
        if nid in seen_ids:
            failures.append(f"duplicate node ID: {nid}")
        seen_ids.add(nid)

    # 4. per-node structural checks
    for nid, node in sorted(nodes.items()):
        if not isinstance(node, dict):
            failures.append(f"node {nid}: expected mapping, got {type(node).__name__}")
            continue

        label = node.get("label")
        if not label:
            failures.append(f"node {nid}: missing `label`")

        edges = node.get("edges")
        if edges is None:
            # edges can be absent (terminal screens)
            continue
        if not isinstance(edges, list):
            failures.append(f"node {nid}: `edges` is not a list")
            continue

        for idx, edge in enumerate(edges):
            if not isinstance(edge, dict):
                failures.append(f"node {nid}: edge [{idx}] is not a mapping")
                continue

            target = edge.get("to")
            if target is None:
                failures.append(f"node {nid}: edge [{idx}] missing `to`")
            elif target not in node_ids:
                failures.append(f"node {nid}: edge [{idx}] targets undefined node `{target}`")

            edge_type = edge.get("type")
            if edge_type and edge_type not in VALID_EDGE_TYPES:
                warnings.append(
                    f"node {nid}: edge [{idx}] has non-standard type `{edge_type}`"
                )

    # 5. deep_links target validation (optional section)
    deep_links = data.get("deep_links")
    if deep_links is not None and isinstance(deep_links, list):
        for idx, dl in enumerate(deep_links):
            if not isinstance(dl, dict):
                continue
            target = dl.get("target")
            if target and target not in node_ids:
                failures.append(
                    f"deep_links [{idx}]: target `{target}` not defined in nodes"
                )

    # 6. tab_bars root validation (optional section)
    tab_bars = data.get("tab_bars")
    if tab_bars is not None and isinstance(tab_bars, dict):
        for role, bar in tab_bars.items():
            if not isinstance(bar, dict):
                continue
            for tab in bar.get("tabs") or []:
                root = tab.get("root")
                if root and root not in node_ids:
                    failures.append(
                        f"tab_bars.{role}.tabs[{tab.get('id', '?')}]: "
                        f"root `{root}` not defined in nodes"
                    )

    if failures:
        print("check_screen_graph: FAIL")
        for f in failures:
            print(f" - {f}")
        for w in warnings:
            print(f" - warning: {w}")
        return 1

    print(f"check_screen_graph: PASS ({len(node_ids)} nodes, {len(warnings)} warning(s))")
    for w in warnings:
        print(f" - warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
