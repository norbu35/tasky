import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = process.cwd();
const hookPath = path.join(repoRoot, ".husky", "pre-push");

function writeExecutable(filePath, body) {
    writeFileSync(filePath, body);
    chmodSync(filePath, 0o755);
}

function setupFakeBinaries() {
    const tempDir = mkdtempSync(path.join(tmpdir(), "tasky-pre-push-"));
    const binDir = path.join(tempDir, "bin");
    const logPath = path.join(tempDir, "calls.log");
    const worktreeCounter = path.join(tempDir, "worktree-counter");
    const indexCounter = path.join(tempDir, "index-counter");
    mkdirSync(binDir);

    writeExecutable(
        path.join(binDir, "pnpm"),
        `#!/usr/bin/env bash
set -euo pipefail
echo "pnpm $*" >> "$HOOK_CALL_LOG"
exit "\${PNPM_STATUS:-0}"
`,
    );

    writeExecutable(
        path.join(binDir, "git"),
        `#!/usr/bin/env bash
set -euo pipefail
echo "git $*" >> "$HOOK_CALL_LOG"

status_for_call() {
  local sequence="$1"
  local counter_file="$2"
  local count=0
  if [ -f "$counter_file" ]; then
    count="$(cat "$counter_file")"
  fi
  count=$((count + 1))
  echo "$count" > "$counter_file"

  IFS=',' read -ra statuses <<< "$sequence"
  local index=$((count - 1))
  if [ "$index" -ge "\${#statuses[@]}" ]; then
    index=$(("\${#statuses[@]}" - 1))
  fi
  return "\${statuses[$index]}"
}

if [ "$1" = "diff" ] && [ "$2" = "--quiet" ] && [ "$#" -eq 2 ]; then
  status_for_call "\${GIT_WORKTREE_STATUSES:-0}" "$HOOK_WORKTREE_COUNTER"
  exit "$?"
fi

if [ "$1" = "diff" ] && [ "$2" = "--cached" ] && [ "$3" = "--quiet" ] && [ "$#" -eq 3 ]; then
  status_for_call "\${GIT_INDEX_STATUSES:-0}" "$HOOK_INDEX_COUNTER"
  exit "$?"
fi

if [ "$1" = "diff" ] && [ "$2" = "--name-only" ]; then
  echo "docs/PRD.md"
  exit 0
fi

echo "unexpected git invocation: $*" >&2
exit 42
`,
    );

    return { tempDir, binDir, logPath, worktreeCounter, indexCounter };
}

function runHook({ input, env = {} }) {
    const fake = setupFakeBinaries();
    const inputPath = path.join(fake.tempDir, "stdin");
    writeFileSync(inputPath, input);

    const result = spawnSync("bash", ["-c", 'exec "$1" < "$2"', "pre-push-test", hookPath, inputPath], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: {
            ...process.env,
            ...env,
            PATH: `${fake.binDir}:${process.env.PATH}`,
            HOOK_CALL_LOG: fake.logPath,
            HOOK_WORKTREE_COUNTER: fake.worktreeCounter,
            HOOK_INDEX_COUNTER: fake.indexCounter,
        },
    });
    const calls = existsSync(fake.logPath) ? readFileSync(fake.logPath, "utf8") : "";
    return { ...result, calls };
}

test("main pushes run the canonical full pre-push gate even for docs-only updates", () => {
    const result = runHook({
        input: "refs/heads/main 1111111111111111111111111111111111111111 refs/heads/main 0000000000000000000000000000000000000000\n",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.calls, /pnpm verify:prepush/);
    assert.doesNotMatch(result.calls, /pnpm repo:docs:check/);
    assert.doesNotMatch(result.calls, /git diff --name-only/);
});

test("main pushes fail before gates when the worktree is dirty", () => {
    const result = runHook({
        input: "refs/heads/main 1111111111111111111111111111111111111111 refs/heads/main 0000000000000000000000000000000000000000\n",
        env: { GIT_WORKTREE_STATUSES: "1" },
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /worktree has unstaged changes/i);
    assert.doesNotMatch(result.calls, /pnpm verify:prepush/);
});

test("main pushes fail after gates when validation leaves tracked files behind", () => {
    const result = runHook({
        input: "refs/heads/main 1111111111111111111111111111111111111111 refs/heads/main 0000000000000000000000000000000000000000\n",
        env: { GIT_WORKTREE_STATUSES: "0,1" },
    });

    assert.notEqual(result.status, 0);
    assert.match(result.calls, /pnpm verify:prepush/);
    assert.match(result.stderr, /validation changed tracked files/i);
});

test("non-main pushes keep the lightweight default path", () => {
    const result = runHook({
        input: "refs/heads/feature/x 1111111111111111111111111111111111111111 refs/heads/feature/x 0000000000000000000000000000000000000000\n",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.calls, /pnpm verify:prepush/);
});
