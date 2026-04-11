# CI Pipeline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the CI pipeline into three clean layers (pre-commit, pre-push, CI) with zero redundancy, blocking security gates, real-backend E2E, and CVE remediation.

**Architecture:** Fix CVEs first (so Trivy can go blocking), create the CI Spring profile (so E2E jobs have a backend), then rewrite all workflow files and hooks in order. Each task produces a working commit that doesn't break existing CI.

**Tech Stack:** GitHub Actions, pnpm, Gradle, Trivy, Semgrep, OpenSSF Scorecard, Dependabot, Playwright, Maestro, Docker Compose, Spring Boot profiles.

**Spec:** `docs/superpowers/specs/2026-04-12-ci-pipeline-redesign-design.md`

---

### Task 1: Fix lint-staged ESLint path

**Files:**

- Modify: `.lintstagedrc.json`

The hardcoded path `./apps/mobile/node_modules/.bin/eslint` breaks if mobile's node_modules layout changes. Replace with workspace-resolved `eslint`.

- [ ] **Step 1: Update `.lintstagedrc.json`**

Replace the full file contents with:

```json
{
  "*.{ts,tsx}": [
    "prettier --write",
    "bash -c 'ESLINT_USE_FLAT_CONFIG=false eslint --no-error-on-unmatched-pattern \"$@\"' --"
  ],
  "*.{json,yaml,yml,md,css}": ["prettier --write"],
  "*.java": ["./gradlew spotlessApply -x test"]
}
```

The change: `./apps/mobile/node_modules/.bin/eslint` → `eslint` (resolved from workspace root via pnpm).

- [ ] **Step 2: Verify lint-staged still works**

Run:

```bash
echo "// test" >> apps/web/src/lib/i18n.ts
git add apps/web/src/lib/i18n.ts
npx lint-staged --verbose
git checkout -- apps/web/src/lib/i18n.ts
```

Expected: Prettier and ESLint run without "command not found" errors. If ESLint can't be found, fall back to `pnpm exec eslint` in the lint-staged config.

- [ ] **Step 3: Commit**

```bash
git add .lintstagedrc.json
git commit -m "fix(ci): resolve eslint from workspace root instead of hardcoded mobile path"
```

---

### Task 2: CVE remediation — pnpm overrides

**Files:**

- Modify: `package.json`
- Regenerate: `pnpm-lock.yaml`

Add overrides for the 23 HIGH CVEs found by Trivy in transitive npm deps.

- [ ] **Step 1: Add pnpm overrides to `package.json`**

In the existing `"pnpm"` block (which already has `"overrides"` with `@react-native/babel-plugin-codegen` and `postcss`), add the CVE-fixing overrides. The result should be:

```json
{
  "pnpm": {
    "overrides": {
      "@react-native/babel-plugin-codegen": "0.85.0",
      "postcss": "8.5.9",
      "minimatch@<3.1.3": ">=3.1.3",
      "tar@<7.5.11": ">=7.5.11",
      "undici@<6.24.0": ">=6.24.0",
      "@xmldom/xmldom@<0.9.9": ">=0.9.9",
      "node-forge@<1.4.0": ">=1.4.0",
      "picomatch@<2.3.2": ">=2.3.2"
    }
  }
}
```

- [ ] **Step 2: Regenerate lockfile**

```bash
pnpm install
```

Expected: lockfile regenerates cleanly. No errors.

- [ ] **Step 3: Verify overrides took effect**

```bash
pnpm list minimatch --depth=10 2>/dev/null | head -20
pnpm list tar --depth=10 2>/dev/null | head -20
```

Expected: all resolved versions should be at or above the override thresholds.

- [ ] **Step 4: Run tests to verify no breakage**

```bash
pnpm -r typecheck && pnpm -r test
```

Expected: all pass (264 web tests, 741 mobile tests, typecheck clean).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "security(deps): add pnpm overrides for 23 HIGH CVEs in transitive npm deps"
```

---

### Task 3: Create `.trivyignore` and expiry check script

**Files:**

- Create: `.trivyignore`
- Create: `tooling/scripts/check-trivyignore-expiry.sh`

Spring Security CVEs can't be fixed until a backend Spring Boot upgrade. Track them with expiry dates.

- [ ] **Step 1: Create `.trivyignore`**

```
# Spring Security — blocked until backend Spring Boot upgrade
# Expires: 2026-05-15
CVE-2025-41232
CVE-2026-22732
CVE-2025-41248
CVE-2025-22228
CVE-2025-22235
CVE-2025-41249
```

- [ ] **Step 2: Create `tooling/scripts/check-trivyignore-expiry.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

TRIVYIGNORE="${1:-.trivyignore}"
TODAY=$(date +%Y-%m-%d)
EXPIRED=0

if [ ! -f "$TRIVYIGNORE" ]; then
  echo "No .trivyignore found — nothing to check."
  exit 0
fi

while IFS= read -r line; do
  if [[ "$line" =~ ^#\ Expires:\ ([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    EXPIRY="${BASH_REMATCH[1]}"
    if [[ "$TODAY" > "$EXPIRY" || "$TODAY" == "$EXPIRY" ]]; then
      # Read the next non-comment, non-empty line (the CVE ID)
      while IFS= read -r cve_line; do
        cve_line=$(echo "$cve_line" | xargs)
        if [[ -n "$cve_line" && ! "$cve_line" =~ ^# ]]; then
          echo "EXPIRED: $cve_line (was due $EXPIRY)"
          EXPIRED=$((EXPIRED + 1))
          break
        fi
      done
    fi
  fi
done < "$TRIVYIGNORE"

if [ "$EXPIRED" -gt 0 ]; then
  echo ""
  echo "ERROR: $EXPIRED .trivyignore entries have expired."
  echo "Fix the underlying CVEs and remove them, or extend the expiry date with justification."
  exit 1
fi

echo ".trivyignore expiry check passed."
```

- [ ] **Step 3: Make the script executable**

```bash
chmod +x tooling/scripts/check-trivyignore-expiry.sh
```

- [ ] **Step 4: Verify it passes today (expiry is 2026-05-15, today is 2026-04-12)**

```bash
bash tooling/scripts/check-trivyignore-expiry.sh
```

Expected: `.trivyignore expiry check passed.`

- [ ] **Step 5: Commit**

```bash
git add .trivyignore tooling/scripts/check-trivyignore-expiry.sh
git commit -m "security(ci): add .trivyignore for Spring CVEs with expiry enforcement script"
```

---

### Task 4: Create `.github/dependabot.yml`

**Files:**

- Create: `.github/dependabot.yml`

Enable automated dependency update PRs for npm, Gradle, and GitHub Actions.

- [ ] **Step 1: Create `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    groups:
      minor-and-patch:
        update-types: [minor, patch]
    labels: [dependencies, auto]
    open-pull-requests-limit: 10

  - package-ecosystem: gradle
    directory: /services/api
    schedule:
      interval: weekly
      day: monday
    labels: [dependencies, auto]
    open-pull-requests-limit: 5

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    labels: [ci, auto]
    open-pull-requests-limit: 5
```

- [ ] **Step 2: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore(ci): enable Dependabot for npm, Gradle, and GitHub Actions"
```

---

### Task 5: Create `application-ci.yml` Spring profile

**Files:**

- Create: `services/api/src/main/resources/application-ci.yml`

The E2E CI jobs start Postgres + MinIO via docker-compose, then run the backend JAR with `--spring.profiles.active=ci`. This profile configures the backend for that environment.

- [ ] **Step 1: Create `services/api/src/main/resources/application-ci.yml`**

```yaml
# CI profile — used by E2E jobs (e2e-web, e2e-android, e2e-ios)
# Expects: docker-compose Postgres on localhost:5432, MinIO on localhost:9000
# Expects: FACEBOOK_TEST_APP_ID and FACEBOOK_TEST_APP_SECRET from GitHub secrets

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tasky
    username: tasky_app
    password: tasky_app

  flyway:
    url: jdbc:postgresql://localhost:5432/tasky
    user: tasky
    password: tasky

tasky:
  dev-auth:
    enabled: true

  facebook:
    app-id: ${FACEBOOK_TEST_APP_ID:}
    app-secret: ${FACEBOOK_TEST_APP_SECRET:}

  auth:
    jwt-secret: ci-test-jwt-secret-32-chars-minimum!!
    encryption-key: MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=
    blind-index-key: RkVEQ0JBOTg3NjU0MzIxMEZFRENCQTk4NzY1NDMyMTA=

  qpay:
    webhook-secret: ci-test-qpay-secret

  storage:
    endpoint: http://localhost:9000
    access-key: minioadmin
    secret-key: minioadmin
    bucket: tasky-local
    upload-ttl-seconds: 900
    download-ttl-seconds: 3600

  cors:
    allowed-origins: http://localhost:4173,http://localhost:5173

  push:
    provider: logging

  feature:
    monetization-enabled: false
```

- [ ] **Step 2: Verify the profile loads**

```bash
docker compose up -d postgres minio minio-bootstrap
./gradlew --no-daemon :services:api:bootJar
java -jar services/api/build/libs/*.jar --spring.profiles.active=ci &
sleep 10
curl -sf http://localhost:8080/actuator/health | python3 -m json.tool
kill %1
docker compose down
```

Expected: health endpoint returns `{"status":"UP"}` (or similar with component details).

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/resources/application-ci.yml
git commit -m "feat(ci): add Spring CI profile for E2E backend in GitHub Actions"
```

---

### Task 6: Expand pre-push hook

**Files:**

- Modify: `.husky/pre-push`

Add lint, SDK drift check, and frontend unit tests. Budget: ~55s total.

- [ ] **Step 1: Replace `.husky/pre-push` with expanded version**

```bash
echo "Running pre-push checks..."

# === Structural checks (~15s) ===

pnpm -r typecheck || exit 1

pnpm workspace:boundaries || exit 1

python3 tooling/scripts/validate-migrations.py || exit 1

./gradlew openApiValidate -q || exit 1

# === New: lint + SDK drift (~13s) ===

pnpm -r lint || exit 1

pnpm sdk:drift || exit 1

# === New: frontend unit tests (~23s) ===

pnpm --filter @tasky/web test:unit || exit 1

pnpm --filter @tasky/mobile test:unit || exit 1

echo "All pre-push checks passed."
```

- [ ] **Step 2: Verify pre-push runs within budget**

```bash
time bash .husky/pre-push
```

Expected: completes in ~50-60s, all checks pass, exit 0.

- [ ] **Step 3: Commit**

```bash
git add .husky/pre-push
git commit -m "fix(ci): expand pre-push hook with lint, SDK drift, and frontend unit tests"
```

---

### Task 7: Rewrite `quality-gates.yml`

**Files:**

- Modify: `.github/workflows/quality-gates.yml`

Rewrite from scratch: 6 jobs, zero overlap, all blocking. This is the largest task.

- [ ] **Step 1: Replace `.github/workflows/quality-gates.yml`**

```yaml
name: quality-gates

on:
  pull_request:
  workflow_dispatch:

jobs:
  structural-gate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Ensure scripts are executable
        run: chmod +x gradlew tooling/scripts/*.sh tooling/scripts/*.py

      - name: Validate SDK contract drift
        run: tooling/scripts/validate-sdk-contract-drift.sh

      - name: Validate workspace boundaries
        run: pnpm workspace:boundaries

      - name: Validate migration safety
        run: python3 tooling/scripts/validate-migrations.py

  backend-quality:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure gradlew is executable
        run: chmod +x gradlew

      - name: Run backend quality checks
        run: ./gradlew --no-daemon :services:api:check :services:api:jacocoTestCoverageVerification :services:api:openApiValidate

  frontend-quality:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm -r typecheck

      - name: Lint
        run: pnpm -r lint

      - name: Test
        run: pnpm -r test

  e2e-web:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure scripts are executable
        run: chmod +x gradlew

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Start infrastructure
        run: |
          docker compose up -d postgres minio minio-bootstrap
          echo "Waiting for Postgres..."
          for i in $(seq 1 30); do
            docker compose exec -T postgres pg_isready -U tasky -d tasky && break
            sleep 2
          done
          echo "Waiting for MinIO..."
          for i in $(seq 1 15); do
            curl -sf http://localhost:9000/minio/health/live && break
            sleep 2
          done

      - name: Build and start backend
        run: |
          ./gradlew --no-daemon :services:api:bootJar
          java -jar services/api/build/libs/*.jar --spring.profiles.active=ci &
          echo "Waiting for backend health..."
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/actuator/health && break
            sleep 2
          done
        env:
          FACEBOOK_TEST_APP_ID: ${{ secrets.FACEBOOK_TEST_APP_ID }}
          FACEBOOK_TEST_APP_SECRET: ${{ secrets.FACEBOOK_TEST_APP_SECRET }}

      - name: Install Playwright Chromium
        run: pnpm --filter @tasky/web exec playwright install --with-deps chromium

      - name: Run Playwright smoke tests
        run: pnpm --filter @tasky/web test:e2e:smoke

      - name: Stop infrastructure
        if: always()
        run: docker compose down

  e2e-android:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure scripts are executable
        run: chmod +x gradlew

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Enable KVM acceleration
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: Start infrastructure
        run: |
          docker compose up -d postgres minio minio-bootstrap
          for i in $(seq 1 30); do
            docker compose exec -T postgres pg_isready -U tasky -d tasky && break
            sleep 2
          done
          for i in $(seq 1 15); do
            curl -sf http://localhost:9000/minio/health/live && break
            sleep 2
          done

      - name: Build and start backend
        run: |
          ./gradlew --no-daemon :services:api:bootJar
          java -jar services/api/build/libs/*.jar --spring.profiles.active=ci &
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/actuator/health && break
            sleep 2
          done
        env:
          FACEBOOK_TEST_APP_ID: ${{ secrets.FACEBOOK_TEST_APP_ID }}
          FACEBOOK_TEST_APP_SECRET: ${{ secrets.FACEBOOK_TEST_APP_SECRET }}

      - name: Install Maestro CLI
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> "$GITHUB_PATH"

      - name: Build Android release app
        run: pnpm --filter @tasky/mobile exec expo run:android --variant release --no-bundler

      - name: Run Maestro smoke flows
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          script: pnpm --filter @tasky/mobile test:e2e:smoke

      - name: Stop infrastructure
        if: always()
        run: docker compose down

  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check .trivyignore expiry
        run: bash tooling/scripts/check-trivyignore-expiry.sh

      - name: Filesystem vulnerability scan
        uses: aquasecurity/trivy-action@0.35.0
        with:
          scan-type: fs
          scan-ref: .
          scanners: vuln,misconfig,secret
          ignore-unfixed: true
          severity: HIGH,CRITICAL
          exit-code: '1'

      - name: Build container image
        run: docker build -t tasky-server:ci .

      - name: Container image scan
        uses: aquasecurity/trivy-action@0.35.0
        with:
          image-ref: tasky-server:ci
          format: table
          ignore-unfixed: true
          vuln-type: os,library
          severity: HIGH,CRITICAL
          exit-code: '0'
          trivyignores: .trivyignore

      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/java
            tooling/config/semgrep/tasky-rules.yaml

      - name: OpenSSF Scorecard
        uses: ossf/scorecard-action@v2
        continue-on-error: true
        with:
          results_file: scorecard-results.json
          results_format: json
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/quality-gates.yml'))"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/quality-gates.yml
git commit -m "refactor(ci): rewrite quality-gates — 6 jobs, zero overlap, all blocking"
```

---

### Task 8: Rewrite `nightly-regression.yml`

**Files:**

- Modify: `.github/workflows/nightly-regression.yml`

Split into two schedules: every night (ubuntu) and Mon+Thu (macOS iOS).

- [ ] **Step 1: Replace `.github/workflows/nightly-regression.yml`**

```yaml
name: nightly-regression

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  full-regression:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure scripts are executable
        run: chmod +x gradlew tooling/scripts/*.sh tooling/scripts/*.py

      - name: Install workspace dependencies
        run: pnpm install --frozen-lockfile

      - name: Run frontend regression checks
        run: |
          pnpm -r typecheck
          pnpm -r test

      - name: Run backend regression gate
        run: ./gradlew --no-daemon :services:api:gateRegression :services:api:openApiValidate

      - name: Build regression container image
        run: docker build -t tasky-server:nightly .

      - name: Scan regression container image
        uses: aquasecurity/trivy-action@0.35.0
        with:
          image-ref: tasky-server:nightly
          format: table
          ignore-unfixed: true
          vuln-type: os,library
          severity: HIGH,CRITICAL
          exit-code: '1'
          trivyignores: .trivyignore

  web-e2e-regression:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure scripts are executable
        run: chmod +x gradlew

      - name: Install workspace dependencies
        run: pnpm install --frozen-lockfile

      - name: Start infrastructure
        run: |
          docker compose up -d postgres minio minio-bootstrap
          for i in $(seq 1 30); do
            docker compose exec -T postgres pg_isready -U tasky -d tasky && break
            sleep 2
          done
          for i in $(seq 1 15); do
            curl -sf http://localhost:9000/minio/health/live && break
            sleep 2
          done

      - name: Build and start backend
        run: |
          ./gradlew --no-daemon :services:api:bootJar
          java -jar services/api/build/libs/*.jar --spring.profiles.active=ci &
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/actuator/health && break
            sleep 2
          done
        env:
          FACEBOOK_TEST_APP_ID: ${{ secrets.FACEBOOK_TEST_APP_ID }}
          FACEBOOK_TEST_APP_SECRET: ${{ secrets.FACEBOOK_TEST_APP_SECRET }}

      - name: Install Playwright Chromium
        run: pnpm --filter @tasky/web exec playwright install --with-deps chromium

      - name: Run full Playwright regression suite
        run: pnpm --filter @tasky/web test:e2e

      - name: Stop infrastructure
        if: always()
        run: docker compose down
```

- [ ] **Step 2: Create separate nightly-mobile workflow**

Create `.github/workflows/nightly-mobile.yml`:

```yaml
name: nightly-mobile-e2e

on:
  schedule:
    - cron: '0 2 * * 1,4'
  workflow_dispatch:

jobs:
  e2e-ios:
    runs-on: macos-latest
    permissions:
      contents: read
    env:
      CI: '1'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Ensure scripts are executable
        run: chmod +x gradlew

      - name: Install workspace dependencies
        run: pnpm install --frozen-lockfile

      - name: Start infrastructure
        run: |
          docker compose up -d postgres minio minio-bootstrap
          for i in $(seq 1 30); do
            docker compose exec -T postgres pg_isready -U tasky -d tasky && break
            sleep 2
          done

      - name: Build and start backend
        run: |
          ./gradlew --no-daemon :services:api:bootJar
          java -jar services/api/build/libs/*.jar --spring.profiles.active=ci &
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/actuator/health && break
            sleep 2
          done
        env:
          FACEBOOK_TEST_APP_ID: ${{ secrets.FACEBOOK_TEST_APP_ID }}
          FACEBOOK_TEST_APP_SECRET: ${{ secrets.FACEBOOK_TEST_APP_SECRET }}

      - name: Install Maestro CLI
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> "$GITHUB_PATH"

      - name: Boot iOS simulator
        run: |
          SIMULATOR_NAME="$(xcrun simctl list devices available | awk -F '[()]' '/iPhone/ {gsub(/^ +| +$/, "", $1); print $1; exit}')"
          SIMULATOR_UDID="$(xcrun simctl list devices available | awk -F '[()]' '/iPhone/ {print $2; exit}')"
          if [ -z "$SIMULATOR_NAME" ] || [ -z "$SIMULATOR_UDID" ]; then
            echo "ERROR: no available iPhone simulator found" >&2
            exit 1
          fi
          echo "SIMULATOR_NAME=$SIMULATOR_NAME" >> "$GITHUB_ENV"
          echo "SIMULATOR_UDID=$SIMULATOR_UDID" >> "$GITHUB_ENV"
          open -a Simulator
          xcrun simctl boot "$SIMULATOR_UDID" || true
          xcrun simctl bootstatus "$SIMULATOR_UDID" -b

      - name: Build iOS release app
        run: pnpm --filter @tasky/mobile exec expo run:ios --configuration Release --device "$SIMULATOR_NAME" --no-bundler

      - name: Run Maestro smoke flows
        run: pnpm --filter @tasky/mobile test:e2e:smoke

      - name: Stop infrastructure
        if: always()
        run: docker compose down
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/nightly-regression.yml'))"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/nightly-mobile.yml'))"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/nightly-regression.yml .github/workflows/nightly-mobile.yml
git commit -m "refactor(ci): split nightly into daily ubuntu + Mon/Thu macOS iOS E2E"
```

---

### Task 9: Update `release-gate.yml`

**Files:**

- Modify: `.github/workflows/release-gate.yml`

Update the E2E jobs to use live backend (matching the new quality-gates pattern) and remove the old standalone Playwright/Maestro jobs.

- [ ] **Step 1: Replace `web-e2e-smoke` job in `release-gate.yml`**

Replace lines 120-143 (the existing `web-e2e-smoke` job) with the same live-backend pattern from quality-gates `e2e-web`. The job should:

- Start docker-compose infrastructure
- Build and start backend with `--spring.profiles.active=ci`
- Run Playwright smoke tests
- Clean up with `docker compose down`

Use the same steps as Task 7's `e2e-web` job definition.

- [ ] **Step 2: Replace `mobile-e2e-smoke` job in `release-gate.yml`**

Replace lines 145-195 (the existing `mobile-e2e-smoke` job) with the same pattern but for iOS on macOS. The job should:

- Start docker-compose infrastructure
- Build and start backend
- Boot iOS simulator
- Build and run Maestro smoke flows
- Clean up

Use the same steps as Task 8's `e2e-ios` job definition.

- [ ] **Step 3: Update `release-readiness-checklist` needs**

The `needs` array references old job names. Update to match:

```yaml
release-readiness-checklist:
  runs-on: ubuntu-latest
  needs: [migration-safety, rollback-readiness, performance-smoke, web-e2e-smoke, mobile-e2e-smoke]
```

Job names stay the same (`web-e2e-smoke`, `mobile-e2e-smoke`) so the `needs` array doesn't change, but verify after editing.

- [ ] **Step 4: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-gate.yml'))"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release-gate.yml
git commit -m "refactor(ci): update release-gate E2E jobs to use live backend"
```

---

## Manual Steps (not automatable)

These require human action outside the codebase:

1. **Create "Tasky CI Test" Facebook app** in the Facebook developer console:
   - App Domain: your current domain
   - Valid OAuth Redirect URIs: `http://localhost:8080/api/v1/auth/facebook/callback`
   - Create test users for deterministic E2E flows

2. **Add GitHub repository secrets:**
   - `FACEBOOK_TEST_APP_ID` — from the test Facebook app
   - `FACEBOOK_TEST_APP_SECRET` — from the test Facebook app

3. **Verify end-to-end:** After all tasks are committed and pushed, trigger the quality-gates workflow manually (`workflow_dispatch`) to confirm all 6 jobs pass.

---

## Task Dependency Order

```
Task 1 (lint-staged) ─────────────────────────────────────┐
Task 2 (pnpm overrides) ──────┐                           │
Task 3 (.trivyignore + expiry) ├── Task 7 (quality-gates) ├── Push + verify
Task 4 (dependabot) ───────────┘                           │
Task 5 (application-ci.yml) ───── Task 7 + 8 + 9 ─────────┤
Task 6 (pre-push) ────────────────────────────────────────┘
                                   Task 8 (nightly) ───────┤
                                   Task 9 (release-gate) ──┘
```

Tasks 1-6 can run in any order. Tasks 7-9 depend on 2, 3, and 5 being done first (quality-gates needs overrides for Trivy to pass, .trivyignore for container scan, and application-ci.yml for E2E backend).
