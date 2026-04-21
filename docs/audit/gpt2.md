Full Audit of the Tasky Monorepo Executive Summary This monorepo is not a mess.
The foundation is better than average: the repo is clearly split into apps,
packages, services, tooling, docs, and archive; Node and Java versions are
pinned; frontend and backend both have meaningful quality gates; and the backend
carries real architecture tests, security scanning, and scenario-based test
governance. The mobile app, in particular, shows the most disciplined modular
structure in the codebase. The problem is not lack of effort. The problem is
that the repository is no longer truthful by default.

The main failure mode is drift. The code, docs, and enforcement layers no longer
say the same thing. Active docs point to missing docs/quality/\* artifacts.
Several tooling scripts still depend on deleted
docs/design/screen-inventory.yaml and docs/design/state-matrix.yaml. The backend
still claims contract-first discipline, but its generated Spring OpenAPI
interfaces are not wired into controller compilation. The web app README
describes a stack and route map that no longer exist. The mobile alignment plans
dated 2026-04-21 are already stale relative to the actual files in the repo
snapshot audited on 2026-04-20. That means onboarding, code review, incident
response, and future refactors are all carrying avoidable ambiguity.

My blunt assessment is this: the repo is structurally promising, but it is
over-documented, under-pruned, and only partially contract-enforced. If you keep
shipping features without first fixing truthfulness, the maintenance cost will
compound faster than feature velocity.

Audit Baseline I audited the extracted repository top to bottom: root
scaffolding, package/workspace setup, CI/CD workflows, backend Gradle
configuration, backend controllers/services/DAOs/tests, web source and route
layer, mobile source and structural contract tooling, shared packages,
foundational docs, derived docs, and archive surfaces. I also ran the
source-only structural checks that do not require downloading dependencies:
tooling/scripts/validate-workspace-boundaries.mjs passed, and
apps/mobile/scripts/structure-check.js passed with 90 warnings and 0 hard
failures.

I could not fully execute Gradle and pnpm install-based gates here because the
environment cannot fetch external dependencies; for example, ./gradlew failed
while trying to download the Gradle distribution. So this report is a
static-code and static-config audit, not a claim that the entire suite passed
end to end in this environment. That limitation matters for runtime-only
defects, but it does not change the main conclusions because most of the
high-value findings are visible directly in the repository.

Monorepo Foundation The workspace shape itself is fundamentally sound.
pnpm-workspace.yaml uses a conventional multi-app structure, and package.json
pins pnpm@10.29.2 and node >=22. That is aligned with modern monorepo
conventions, and Expo explicitly supports pnpm workspaces and automatic monorepo
configuration for current SDKs. pnpm is also explicitly positioned as a strong
monorepo package manager.

Where the foundation falls short is task orchestration and artifact reuse. The
root scripts are all pnpm -r ...; there is no turbo.json, Nx graph, or
equivalent task pipeline. At this repo size, that is leaving CI performance on
the floor. pnpm gives you workspaces; it does not give you a first-class cached
task graph. Vercel’s Turborepo docs are explicit that task registration,
caching, and remote caching are the point of adopting a task runner on top of
workspaces. I would not force Turbo or Nx just because it is fashionable, but
for this repo the missing cache graph is now a practical cost, not a theoretical
one.

The quality-gate intent is strong. .github/workflows/quality-gates.yml has
separate jobs for structural checks, backend quality, frontend quality, browser
E2E, Android E2E, and security scanning with Trivy, Semgrep, and Scorecard. That
is good engineering hygiene. But some gates are weaker than they look.
apps/web/stryker.config.mjs has thresholds.break: 0, so web mutation testing is
effectively advisory. services/api/build.gradle.kts sets PIT’s mutationThreshold
to 20 and only wires mutation into gateFull, which is described as nightly
rather than PR-blocking. In other words, mutation testing exists, but it is not
currently a serious release-quality contract.

Repository hygiene is the most obvious foundational cleanup miss. The repo
currently tracks local.properties with a machine-specific Android SDK path,
Eclipse metadata (.project, .classpath, .factorypath, .settings), .gradle-home,
and four large committed repomix-_.xml snapshots at roughly 283 KB, 273 KB, 1.1
MB, and 1.7 MB. The root .gitignore ignores some generated repomix-_ files, but
not the ones that are actually committed. That is not a subtle best-practice
issue; it is straightforward repository pollution.

Backend Service The backend has the best engineering posture in the repo. The
positive signals are real: Java 21 toolchains, Spring Boot 3.x, JDBI instead of
hidden ORM behavior, explicit OpenAPI validation, JaCoCo, Checkstyle, PMD,
SpotBugs with FindSecBugs, Error Prone, OWASP Dependency Check, PIT, ArchUnit
tests, and scenario-linked tests. That stack is serious. The architecture tests
in services/api/src/test/java/mn/tasky/architecture/\* are also a strong sign
that the team is trying to keep boundaries intentional.

But the backend’s biggest issue is architecture-contract drift.
docs/ARCHITECTURE.md says active request paths should be either controller ->
runtime composition -> module public ports or controller -> module-owned
publicapi port. The code does not consistently do that. Concrete examples:
services/api/src/main/java/mn/tasky/user/api/UserProfileController.java injects
ProfileDao and ReliabilityScoreDao directly; TaskController.java injects
TaskDraftService directly; CategoryController.java injects CategoryService and
CategorySchemaVersionService directly; PaymentController.java,
LocationController.java, BookingIntentController.java, and others also bypass
the public-port story. So the docs describe a cleaner system than the one that
currently exists.

The OpenAPI setup is also weaker than it first appears.
services/api/build.gradle.kts generates Spring code with interfaceOnly=true into
build/generated-sources/openapi, but the controllers in
services/api/src/main/java do not implement any generated \*Api interface. The
parity tests under mn.tasky.contract help, but OpenApiSpringParityTests only
proves that live Spring MVC paths exist in docs/API.yaml; it does not give you
compile-time enforcement of operation signatures, request models, response
models, or enum drift. OpenAPI Generator’s own Spring docs describe
interfaceOnly as generating API interface stubs without server files. As
currently wired, this repo is using generated artifacts as a reference surface,
not as an enforcement mechanism. That is a meaningful difference.

Error handling is also more manual than it should be for modern Spring.
Controllers repeatedly assemble Map.of("code", ..., "message", ..., "trace_id",
...) bodies by hand and switch on error codes inline. TaskController.java alone
is nearly 600 lines and is full of repeated response-envelope construction.
Spring Framework already supports RFC 9457-style problem details through
ProblemDetail, ErrorResponse, and @ControllerAdvice. Centralizing that would
reduce duplicated branches, make error contracts easier to audit, and cut
controller size significantly.

There are also classic hotspot symptoms. TaskService.java is around 665 lines,
TaskController.java around 597, AuthService.java around 543, TaskDao.java around
390, and BookingService.java around 373. A large file is not automatically bad,
but these are not passive data holders; they are the places where orchestration,
state transition logic, validation, and mapping all accumulate. That is where
contract drift and regression risk grow fastest.

My backend verdict is simple: the quality stack is strong, but the enforcement
story is overstated. The architecture docs are ahead of the code, and the
contract-first story is only partially true until controller compilation is
actually coupled to the generated API contract.

Web Application The web app is the weakest runtime surface in the repo. Not
because it is broken everywhere, but because it has the most visible gap between
current code and current truth.

The most obvious documentation drift is apps/web/README.md. It still says React
18.3 + Vite 5.4 + Tailwind 3.4 + React Router DOM 6 + next-themes, but
apps/web/package.json is on React 19.2.5, Vite 8.0.8, Tailwind 4.2.2, React
Router DOM 7.14.0, and has no next-themes dependency at all. The route table is
also wrong: the README describes routes like /dashboard, /tasks, and
/booking/confirm, while src/router/AppRoutes.tsx uses /customer/dashboard,
/customer/tasks, /customer/booking-confirmation, /tasker/feed, /admin/\*, and
many more role-scoped paths. This is not harmless README drift. It means a new
engineer cannot trust the first app-level document they read.

The web code is also too page-heavy. The hotspots are large and concentrated in
UI composition files: LandingPage.tsx is about 954 lines, ComparisonVisuals.tsx
about 982, AppRoutes.tsx about 622, apiClient.ts about 721, adminApiClient.ts
about 462, and AdminCategoriesPage.tsx about 643. This is not just aesthetics.
It means routing, view composition, IO policy, and screen logic are staying too
close together instead of being pushed into feature hooks, query layers, and
smaller route adapters.

The web client has a more serious runtime gap too: it appears to still lack
refresh-token handling even though the backend exposes POST
/api/v1/auth/token/refresh and the mobile app has already implemented silent
refresh. In apps/web/src/AppShell.tsx, a tasky:unauthorized event signs the user
out and shows a “session expired” toast. In apps/web/src/lib/apiClient.ts,
unauthorized responses dispatch that event. There is no web-side call to
/auth/token/refresh. This means the backend and one client have moved forward,
but the other client has not. That is contract drift at the user-session level,
not just documentation drift.

The typing story is also noisier than it should be. apps/web/src/lib/apiTypes.ts
correctly imports many schema types from @tasky/sdk, but it also defines a large
set of manual interfaces for admin and deferred surfaces such as
VerificationDetail, FeatureToggle, StrikePolicy, PayoutRequest, LeadUnlockPrice,
AdminDisputeDetail, and category schema types. Some manual glue is unavoidable,
but this file has become a second type authority. That is exactly the pattern
that generated SDKs are meant to prevent.

There is also dead-code residue.
apps/web/src/future/admin/AdminLeadPricingPage.tsx, AdminPayoutsPage.tsx, and
future/tasker/TaskerProfilePolishPage.tsx exist, but there are no active imports
into the route graph. If these are intentionally deferred, they belong in an
explicit quarantine package or archive. If not, they should be wired in. Right
now they are just ambiguity.

The Caddy security posture is decent overall, especially because CSP, HSTS,
X-Content-Type-Options, and clickjacking controls are already present. But
apps/web/Caddyfile.production still allows style-src 'unsafe-inline'. A strong
CSP is still worth keeping, but the modern direction is to tighten via
report-only rollout, hashes, and nonces wherever possible rather than preserving
broad inline allowances indefinitely. OWASP recommends CSP headers as the
preferred delivery mechanism and explicitly frames 'unsafe-inline' as a broad
allowance that should be avoided when practical.

My web verdict: this app needs architectural thinning and truth restoration
before it needs new features.

Mobile Application The mobile app is in the best shape architecturally. The repo
has pushed real effort into a disciplined feature split, route boundary rules,
shared providers, NativeWind-backed primitives, and a bespoke structural
checker. That is the strongest client-engineering surface in the monorepo.

The scaffolding choice itself is sound. apps/mobile/package.json is on Expo 55
and React Native 0.83.4, and the repo does not carry old custom Metro monorepo
hacks. That matches current Expo guidance: Expo supports monorepos well and
automatically handles common monorepo config when using supported workspace
managers.

The good news is that the mobile code has real enforcement.
apps/mobile/scripts/structure-check.js is not just aspirational prose; it
encodes route budgets, import boundaries, screen-family rules, model purity,
deep-relative-import checks, section caps, and test-path mirror checks. The even
better news is that it currently produces 0 hard failures.

The bad news is that it still produces 90 warnings, and those warnings are not
cosmetic. The checker reports cross-feature boundary leaks in useAuth.ts,
RebookScreen.tsx, useChatConversationScreen.ts, useTaskerProfile.ts,
TaskCancelSheet.tsx, and useTasks.ts; a cross-screen import in HomeScreen.tsx;
five route files already above the warning threshold; and a very large test-path
mirror mismatch set, where dozens of tests still point to pre-refactor source
paths that no longer exist. That means the mobile architecture has improved
faster than its tests and derived docs have kept up.

There are also two runtime anti-patterns I would remove quickly. First,
apps/mobile/src/app/\_layout.tsx calls LogBox.ignoreAllLogs(). That is too blunt.
It hides exactly the warnings that help catch third-party breakage, RN API
deprecations, and state bugs during dev and CI. Second,
apps/mobile/src/lib/clientAnalytics.ts logs analytics payloads unconditionally
with console.info(...), while the web equivalent gates console analytics to
development mode. The mobile implementation should match the web posture or move
behind a real telemetry adapter.

The derived mobile planning docs are also stale enough to be misleading.
docs/plans/2026-04-21-mobile-contract-alignment-plan.md says \_layout.tsx is 129
lines and mobileApiClient.ts is 971 lines. In the audited repo, \_layout.tsx is a
thin provider stack and mobileApiClient.ts is about 231 lines with refresh
support already implemented. The plan is describing a prior state. That means it
should be archived or explicitly marked historical, not left in the live
docs/plans/ lane as if it were current execution truth.

My mobile verdict: keep the architecture, kill the warning backlog, and stop
letting stale plan docs pretend to be active.

Documentation and Lifecycle Hygiene This is the worst part of the repository.

The foundational documentation model is actually solid in concept. README.md,
docs/ARCHITECTURE_INDEX.md, docs/maintenance/OPERATING_MODEL.md,
docs/ARCHITECTURE.md, and docs/API.yaml try to separate canonical,
derived-active, and archived surfaces. That is the right model. The problem is
that the implementation of that model has fallen apart.

Active docs still reference missing live artifacts. docs/API.yaml points readers
to docs/quality/capability-matrix.md and
docs/quality/launch-baseline-2026-04.md, but docs/quality/ does not exist in the
active tree. docs/maintenance/PRODUCTION_READINESS.md references missing
docs/quality/staging-rehearsal-2026-04.md,
docs/quality/launch-baseline-2026-04.md, and docs/quality/test-trust-audit.md.
tests/registry.yaml still tells readers to follow up in missing
docs/quality/test-rehab-backlog.md. tooling/scripts/check-cleanup-gate.sh
comments rely on that same absent test-trust audit. That is not archival
neatness; that is live-doc breakage.

The design/tooling storyline is also broken.
tooling/scripts/check-spec-drift.mjs, tooling/scripts/parse_yaml.py, and
tooling/scripts/generate-prompts.js all assume
docs/design/screen-inventory.yaml. That file is not in the active repo.
state-matrix.yaml is also gone, yet the historical docs and prompt-generation
comments still talk as if both are active authorities. Worse,
generate-prompts.js appears to compute its design directory from
tooling/scripts/.. /docs/design, which resolves to tooling/docs/design, not the
repository root docs/design. So even if the inventory came back, that script
would still be suspect.

The READMEs and guidance docs are also inconsistent on basic facts. AGENTS.md
and docs/ARCHITECTURE.md still describe the web as React 18.
packages/core/README.md still says the react peer is React 18+ and claims a
zustand dependency the package no longer has. apps/web/README.md is stale on
versions, dependencies, and routes. docs/maintenance/PRODUCTION_READINESS.md and
docs/maintenance/STAGING_RUNBOOK.md both still say the mobile client lacks token
refresh, even though apps/mobile/src/lib/mobileApiClient.ts and
apps/mobile/src/providers/AppBootstrapProvider.tsx already implement it.

There is also lifecycle drift in docs/plans/. Some of those documents are still
useful as historical context, but they are no longer active plans. A plan that
references a missing
spec—docs/plans/2026-04-20-mobile-screen-section-naming-remediation-plan.md
points to a non-existent ...remediation-spec.md—is not an active plan. A
future-dated plan that already misdescribes the code on the day before its own
timestamp is not an active plan either. These should be archived, superseded, or
collapsed into a smaller current-plan set.

The cleanup candidates are straightforward:

local.properties, Eclipse project files, .gradle-home, committed repomix-_.xml,
dead apps/web/src/future/_ pages, broken prompt/spec-drift scripts, and stale
live-plan docs should all be treated as cleanup work, not tolerated background
noise.

Prioritized Remediation Do not try to “improve everything.” Fix the trust model
first.

The first tranche should be pure truth restoration. Remove local.properties,
Eclipse metadata, .gradle-home, and committed repomix-_.xml artifacts. Extend
.gitignore so they stay gone. Then repair or delete every live reference to
missing docs/quality/_ and deleted design inventory/state-matrix files. Update
README.md, AGENTS.md, docs/ARCHITECTURE.md, apps/web/README.md,
apps/mobile/README.md, and packages/core/README.md so a new engineer can trust
the first document they read.

The second tranche should harden contract enforcement in the backend. Either
make controllers implement generated OpenAPI interfaces, or switch to another
compile-time coupling pattern. Right now you have a contract reference surface,
not a contract-enforced server. At the same time, move repetitive controller
error maps into a centralized @ControllerAdvice built on Spring’s
ProblemDetail/ErrorResponse stack, and push DAOs/application services back
behind public ports or composition services where the architecture docs say they
belong.

The third tranche should bring the clients to the same operational standard. On
web, implement refresh-token rotation and retry the same way mobile already
does, then test it. Kill the dead src/future/\* pages or wire them properly.
Split apiTypes.ts, apiClient.ts, adminApiClient.ts, AppRoutes.tsx, and the giant
admin/landing pages into smaller feature-owned surfaces. On mobile, drive
structure:check warnings to zero, remove LogBox.ignoreAllLogs(), gate analytics
logging to dev mode, and either update or archive the stale contract-alignment
plans.

The fourth tranche is performance and tooling leverage. If CI time matters, add
a real task graph with local and remote caching instead of relying entirely on
pnpm -r. That is when a Turborepo or Nx adoption makes sense. Do it after the
repo is truthful, not before. Right now the repo’s main bottleneck is not build
speed. It is confidence.
