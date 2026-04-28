#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

if ! command -v graphify >/dev/null 2>&1; then
  cat >&2 <<'EOF'
graphify is not installed.
Run: pnpm repo:graph:setup
EOF
  exit 127
fi

graphify update .

graphify_bin="$(command -v graphify)"
graphify_python="$(sed -n '1s/^#!//p' "$graphify_bin")"
if [ ! -x "$graphify_python" ]; then
  graphify_python="python3"
fi

"$graphify_python" <<'PY'
import json
import shutil
from pathlib import Path

from graphify.analyze import god_nodes
from graphify.build import build_from_json
from graphify.cluster import cluster
from graphify.wiki import to_wiki

graph_path = Path("graphify-out/graph.json")
if not graph_path.exists():
    raise SystemExit("graphify update: graphify-out/graph.json is missing")

raw = json.loads(graph_path.read_text(encoding="utf-8"))
graph = build_from_json(raw)

communities = {}
for node_id, data in graph.nodes(data=True):
    community = data.get("community")
    if community is None:
        continue
    try:
        community = int(community)
    except (TypeError, ValueError):
        continue
    communities.setdefault(community, []).append(node_id)

if not communities:
    communities = cluster(graph)

labels = {community: f"Community {community}" for community in communities}
wiki_dir = Path("graphify-out/wiki")
if wiki_dir.exists():
    shutil.rmtree(wiki_dir)

article_count = to_wiki(
    graph,
    communities,
    wiki_dir,
    community_labels=labels,
    god_nodes_data=god_nodes(graph),
)
print(f"graphify update: regenerated graphify-out/wiki with {article_count + 1} markdown files")
PY
