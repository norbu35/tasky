# Workflow Analysis for Autonomous Agents

## 1. Executive Summary
The Tasky repository provides a robust, highly structured environment for autonomous agents. It enforces strict quality gates (linting, testing, security, contract validation) through a mandatory `self-verify.sh` script. The coordination model (`tickets/STATUS.json`) prevents race conditions and ensures orderly execution.

However, the learning curve is steep. A new agent must ingest multiple large documentation files (`AGENTS.md`, `CLAUDE.md`, `README.md`) to understand the constraints. The strictness of the verification script, while excellent for quality, was previously a bottleneck for iterative development (now mitigated by the `--only` flag).

## 2. Component Analysis

### A. Documentation
*   **`AGENTS.md`**: Excellent. It is the "Constitution" of the project. Clear rules on commits, branching, and risk.
*   **`CLAUDE.md`**: Very helpful technical summary. Provides the "cheat sheet" for architecture and stack.
*   **`README.md`**: Good entry point for human developers, but agents might miss the nuance of the "Agent Workflow" buried in `AGENTS.md`.

### B. Helper Scripts
*   **`scripts/claim-ticket.sh`**: **Robust.** Uses atomic git push to prevent double-claiming. Handles retries well.
*   **`scripts/ticket-status.sh`**: **Useful.** clear visualization of the dependency graph.
*   **`scripts/self-verify.sh`**: **Critical.** This is the core quality gate.
    *   *Improvement Implemented:* Added `--only` flag to allow fast iteration.
    *   *Observation:* It relies heavily on specific file locations and naming conventions.
*   **`scripts/complete-ticket.sh`**: **Safe.** Validates branch, status, and artifact existence before allowing completion.
*   **`scripts/agent-log.sh`**: **Audit Trail.** Maintains a permanent record of all verification runs.

### C. Ticket Structure
*   JSON-based ticket specs (`tickets/TASK-XXX.json`) are machine-readable and precise.
*   Explicit dependency modeling (`depends_on`) allows for parallel execution without chaos.
*   Acceptance Criteria (`acceptance_criteria`) with mapped `test_ids` bridges the gap between requirements and code.

## 3. Workflow Sequence for New Agents

1.  **Discovery**:
    *   Read `AGENTS.md` (Rules).
    *   Read `CLAUDE.md` (Tech Stack).
    *   Run `scripts/ticket-status.sh` (Context).

2.  **Selection & Claiming**:
    *   Identify "AVAILABLE" ticket.
    *   Run `scripts/claim-ticket.sh --agent <NAME>`.

3.  **Implementation Loop**:
    *   Create branch `agent/<TICKET>-<SLUG>`.
    *   **Loop**:
        *   Read `tickets/<TICKET>.json`.
        *   Write Code / Tests.
        *   Verify *Iteratively*: `scripts/self-verify.sh ... --only <check>` (New!).
    *   **Finalize**:
        *   Verify *Fully*: `scripts/self-verify.sh ...` (Full suite).

4.  **Completion**:
    *   Commit & Push.
    *   Run `scripts/complete-ticket.sh --ticket <TICKET>`.

## 4. Gaps and Improvements

### Gap 1: Context Overload
**Issue:** A new agent often burns many tokens just reading the file tree to find relevant files for a ticket.
**Suggestion:** Create a `scripts/context-for-ticket.sh` that uses the `files_changed` or semantic search to dump relevant file *contents* (interfaces, existing tests) for a given ticket.

### Gap 2: Test ID Discovery
**Issue:** Tickets refer to `TID-XXX`. Agents might struggle to know *where* to write these tests or how to name them so the validation script finds them.
**Suggestion:** A `scripts/scaffold-test.sh` that creates a blank test file with the correct `@Test(id="TID-XXX")` or `test("TID-XXX", ...)` boilerplate.

### Gap 3: "Definition of Done" Visibility
**Issue:** The validation script fails at the end if coverage is low.
**Suggestion:** The `--only ac_coverage_gate` checks this, but it requires the tests to have run first.

## 5. Recommended Actions

1.  **Maintain the `--only` flag**: It is crucial for efficiency.
2.  **Adopt the "Context Script" idea**: To save tokens and improve focus.
3.  **Standardize Test Annotation**: Ensure all languages (Java, TS) have a clear way to mark `TID`s that the regex scanners in `validate-ac-coverage.py` can pick up.

## 6. Conclusion
The scaffolding is **complete and functional**. It is strict but fair. The addition of partial verification makes it highly suitable for autonomous agents. No critical blocks exist.
