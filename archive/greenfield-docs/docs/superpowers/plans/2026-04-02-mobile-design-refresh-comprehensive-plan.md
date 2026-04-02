# Mobile Design Refresh Comprehensive Execution Plan (v3)

**Date:** 2026-04-02  
**Project:** `Tasky/Mobile`  
**Figma file key:** `IljfnTQPkq7vpkmK1NN1NC`  
**Scope:** SCR-SHARED-001..021, SCR-INFRA-001..005, SCR-CUST-001..027, SCR-TASK-001..002 + 011..018 (63 screens)

## 1. Current Facts (Re-validated)

### 1.1 Figma MCP status
- `mcp__figma__whoami` is authenticated (`norbu.erdene@gmail.com`).
- `mcp__figma__get_metadata(fileKey=IljfnTQPkq7vpkmK1NN1NC, nodeId=0:1)` works.
- `mcp__figma__use_figma` inventory probe returned **110** top-level frames on Page 1.
- `mcp__figma__get_design_context` is working for concrete nodes (examples validated):
  - `2:38` Role Selection
  - `2:87` Premium Splash Screen
  - `2:119` Camera Permission Primer

### 1.2 Codebase route/file reality (apps/mobile)
- Confirmed route alias exists for `SCR-TASK-002` contract:
  - `apps/mobile/src/app/(tasker)/tasks/[taskId].tsx` -> redirects to `/task/${taskId}`
- Confirmed route target now exists for `SCR-CUST-027`:
  - `apps/mobile/src/app/(customer)/tasks/[taskId]/instant-match.tsx`
- `apps/mobile/src/app` currently contains the major Shared/Infra/Customer/Tasker surfaces, but there is naming drift vs design doc path references.

### 1.3 Documentation normalization status
- Path normalization is complete: `docs/superpowers/specs/2026-04-02-mobile-design-refresh-design.md` now maps **63/63** in-scope SCR rows to existing files under `apps/mobile/src`.
- Canonical routing/file mapping artifact has been created:
  - `docs/superpowers/plans/2026-04-02-mobile-route-normalization-matrix.md`
- Remaining documentation risk is not missing paths; it is execution drift if agents deviate from the normalization matrix lanes and file ownership.

## 2. Architecture and Workflow Risks

1. **Spec route contract vs Expo href drift**
- Some screens have a public/contract route that differs from the internal Expo route target.
- Without explicit two-column mapping, parallel agents may implement conflicting navigation.

2. **Route contract inconsistency (grouped vs ungrouped)**
- Some specs use `/(auth)` and `/(customer)` groups, others use root routes (e.g., `/profile`, `/inbox`).
- Without a normalization matrix, navigation/deep-link behavior will diverge.

3. **Component-vs-route ambiguity (state surfaces)**
- Several SCRs are modal/sheet states with `route: null` and should remain embedded in parent route flows.
- Treating these as standalone screens causes duplicate UX and fragmented state logic.

4. **Outdated earlier assumptions in plan docs**
- Previous version assumed Figma MCP unavailable; this is now false.
- Remaining work should use live Figma nodes as the visual source of truth.

## 3. Canonical Source Order (Enforced)

For each SCR implementation/update:
1. `docs/design/screen-specs/SCR-*.yaml` (states, behaviors, acceptance)
2. Figma `get_design_context(fileKey, nodeId)` (layout and visual details)
3. Existing route/component code (hooks, SDK usage, side-effects)

Do not start from old path tables in isolation.

## 4. Route Normalization Policy (Completed, then enforced)

1. Use the matrix as source of truth for execution assignments.
2. Treat `Spec Route Contract` and `Canonical Expo Href` as separate fields; do not collapse them.
3. Keep current working routes as canonical where already wired in navigation.
4. Add route aliases only when required by contract/deeplink compatibility (`SCR-TASK-002` done). `SCR-SHARED-017` route contract is now migrated to booking-scoped path; no alias required.

Deliverable artifact:
- `docs/superpowers/plans/2026-04-02-mobile-route-normalization-matrix.md`

## 5. Implementation Plan (post-normalization)

### 5.0 Parallel execution shape (context minimization)
- Agent 1: Auth + onboarding
- Agent 2A: Shared profile/inbox/review surfaces
- Agent 2B: Infrastructure surfaces
- Agent 3: Customer task flow
- Agent 4: Customer booking flow
- Agent 5: Tasker flow

Each agent should receive only:
- assigned SCR rows from the normalization matrix,
- corresponding `SCR-*.yaml` specs,
- exact target files listed in the matrix.

Do not provide full-repo context to each agent.

### 5.1 Worktree enforcement
- Parallel execution must run in isolated git worktrees (one per lane).
- Branch/worktree naming and ownership are defined in:
  - `docs/superpowers/plans/2026-04-02-mobile-design-refresh.md` (`Execution Environment (Required)` section)

### Phase A: Shared + Infra stabilization
- Update Shared/Infra screens against live Figma nodes.
- Preserve current route structure (`app/(auth)`, `app/(shared)`, `app/(tabs)`).
- Ensure testIDs required by current tests are preserved.

### Phase B: Customer flow surfaces
- Align post-task + task detail + applicants + booking screens.
- Keep new `SCR-CUST-027` route implementation as canonical.

### Phase C: Tasker flow surfaces (in-scope set)
- Keep task detail alias strategy for `SCR-TASK-002`.
- Update `SCR-TASK-011..018` surfaces using Figma nodes and current feature/component boundaries.

## 6. Verification Strategy

Per batch (Shared/Infra, Customer, Tasker):
- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile test`

Autonomous completion policy:
- No deferred test execution is allowed for autonomous runs.
- An agent/lane cannot be marked complete until its required checks are green.

Before final PR:
- `./gradlew test`
- `./gradlew openApiValidate`
- `pnpm -r typecheck`
- `pnpm -r test`

## 7. Immediate Next Actions

1. Freeze agent assignments against the normalization matrix lanes (1, 2A, 2B, 3, 4, 5).
2. For each SCR, fetch Figma via `get_design_context(fileKey, nodeId)` using the matrix node ID (no root-node calls).
3. Execute UI parity updates batch-by-batch, preserving hooks/navigation and existing testIDs.

## 8. Completion Checkpoint (2026-04-02)

- The in-scope 63-screen refresh lane is implemented in repo history (lane commits plus booking-source follow-up).
- Current branch (`agent/TASK-002-source-aware-booking-confirmation`) includes the latest customer booking source-aware handoff updates required by this plan.
- Route wrappers verified as intentionally stable:
  - `apps/mobile/src/app/(shared)/review/[bookingId].tsx` remains a route-level re-export to the refreshed `ReviewForm` component.
  - `apps/mobile/src/app/(tasker)/tasks/[taskId].tsx` remains the contract alias redirect to canonical `/task/[id]`.
- Verification run completed on this branch:
  - `pnpm --filter @tasky/mobile typecheck` ✅
  - `pnpm --filter @tasky/mobile exec jest --watchman=false --runInBand` ✅ (105 suites, 719 tests)
- Remaining tracked mobile work is outside this 63-screen scope and is captured in `tasks/TASK-001.md` (deferred phase screens from AGENTS.md).
