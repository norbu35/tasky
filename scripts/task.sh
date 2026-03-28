#!/usr/bin/env bash
set -euo pipefail

TASKS_DIR="$(cd "$(dirname "$0")/.." && pwd)/tasks"

usage() {
  cat <<EOF
Usage: scripts/task.sh <command> [args]

Commands:
  list              Show all tasks grouped by status
  next              Show the highest priority todo task
  start <TASK-ID>   Set task to in-progress and create a branch
  done <TASK-ID>    Set task to done
  add "Title"       Create a new task file from template
EOF
  exit 1
}

get_field() {
  local file="$1" field="$2"
  grep -m1 "^\*\*${field}:\*\*" "$file" | sed "s/.*\*\*${field}:\*\* *//" || true
}

set_status() {
  local file="$1" new_status="$2"
  sed -i "s/^\*\*Status:\*\* .*/\*\*Status:\*\* ${new_status}/" "$file"
}

slug_from_title() {
  local title="$1"
  echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-40
}

next_id() {
  local max=0
  for f in "$TASKS_DIR"/TASK-*.md; do
    [[ -f "$f" ]] || continue
    num=$(basename "$f" | sed 's/TASK-0*//;s/\.md//')
    (( num > max )) && max=$num
  done
  printf "TASK-%03d" $((max + 1))
}

cmd_list() {
  for status in todo in-progress done; do
    local found=false
    for f in "$TASKS_DIR"/TASK-*.md; do
      [[ -f "$f" ]] || continue
      local s
      s="$(get_field "$f" "Status")"
      if [[ "$s" == "$status" ]]; then
        if ! $found; then
          echo ""
          echo "=== ${status^^} ==="
          found=true
        fi
        local title
        title="$(head -1 "$f" | sed 's/^# //')"
        local priority
        priority="$(get_field "$f" "Priority")"
        echo "  ${title}  [${priority}]"
      fi
    done
  done
}

cmd_next() {
  for priority in critical high medium low; do
    for f in "$TASKS_DIR"/TASK-*.md; do
      [[ -f "$f" ]] || continue
      local s p
      s="$(get_field "$f" "Status")"
      p="$(get_field "$f" "Priority")"
      [[ "$s" != "todo" || "$p" != "$priority" ]] && continue

      # Check dependencies
      local deps
      deps="$(get_field "$f" "Depends on")"
      if [[ -n "$deps" ]]; then
        local blocked=false
        for dep in $(echo "$deps" | tr ',' ' '); do
          dep="$(echo "$dep" | tr -d ' ')"
          local dep_file="$TASKS_DIR/${dep}.md"
          if [[ -f "$dep_file" ]]; then
            local dep_status
            dep_status="$(get_field "$dep_file" "Status")"
            [[ "$dep_status" != "done" ]] && blocked=true
          fi
        done
        $blocked && continue
      fi

      echo "$(head -1 "$f" | sed 's/^# //')"
      echo ""
      cat "$f"
      return 0
    done
  done
  echo "No available tasks."
}

cmd_start() {
  local task_id="$1"
  local file="$TASKS_DIR/${task_id}.md"
  [[ -f "$file" ]] || { echo "Task not found: $task_id" >&2; exit 1; }

  set_status "$file" "in-progress"

  local title
  title="$(head -1 "$file" | sed 's/^# [A-Z]*-[0-9]*: //')"
  local slug
  slug="$(slug_from_title "$title")"
  local branch="agent/${task_id}-${slug}"

  git checkout -b "$branch" 2>/dev/null || git checkout "$branch"
  echo "Started ${task_id} on branch ${branch}"
}

cmd_done() {
  local task_id="$1"
  local file="$TASKS_DIR/${task_id}.md"
  [[ -f "$file" ]] || { echo "Task not found: $task_id" >&2; exit 1; }
  set_status "$file" "done"
  echo "Marked ${task_id} as done."
}

cmd_add() {
  local title="$1"
  local task_id
  task_id="$(next_id)"
  local file="$TASKS_DIR/${task_id}.md"

  cat > "$file" <<EOF
# ${task_id}: ${title}

**Status:** todo
**Priority:** medium

## Description


## Done When
-
EOF

  echo "Created ${file}"
}

[[ $# -lt 1 ]] && usage

case "$1" in
  list)  cmd_list ;;
  next)  cmd_next ;;
  start) [[ $# -lt 2 ]] && usage; cmd_start "$2" ;;
  done)  [[ $# -lt 2 ]] && usage; cmd_done "$2" ;;
  add)   [[ $# -lt 2 ]] && usage; cmd_add "$2" ;;
  *)     usage ;;
esac
