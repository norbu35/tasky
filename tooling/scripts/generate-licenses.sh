#!/usr/bin/env bash
# generate-licenses.sh — Produce open-source license reports for web and backend.
#
# Usage:
#   ./tooling/scripts/generate-licenses.sh
#
# Outputs:
#   docs/THIRD_PARTY_LICENSES.web.json   — pnpm license list (JSON)
#   docs/THIRD_PARTY_LICENSES.api.html   — Gradle license report (HTML)
#   docs/THIRD_PARTY_LICENSES.md         — combined human-readable placeholder
#
# Prerequisites:
#   - pnpm (for web dependencies)
#   - com.jaredsburrows.license Gradle plugin installed in services/api/build.gradle.kts
#
# To add the Gradle license plugin, add to services/api/build.gradle.kts plugins block:
#   id("com.jaredsburrows.license") version "0.9.8"
# Then uncomment the Gradle step below.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "==> Generating web license list (pnpm)..."
pnpm licenses list --json > docs/THIRD_PARTY_LICENSES.web.json
echo "    Written: docs/THIRD_PARTY_LICENSES.web.json"

echo "==> Generating backend license report (Gradle)..."
# NOTE: Requires com.jaredsburrows.license plugin. Uncomment when installed:
# ./gradlew :services:api:licenseReport
# cp services/api/build/reports/licenses/licenseReport.html docs/THIRD_PARTY_LICENSES.api.html
# echo "    Written: docs/THIRD_PARTY_LICENSES.api.html"
echo "    SKIPPED: com.jaredsburrows.license Gradle plugin not installed."
echo "    See script header for installation instructions."

echo "==> Done."
