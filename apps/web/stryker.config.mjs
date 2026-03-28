// Stryker mutation testing configuration for @tasky/web
//
// Run:    pnpm test:mutation
// Report: reports/mutation/html/index.html
//
// Docs: https://stryker-mutator.io/docs/stryker-js/configuration
//
// Thresholds start at 0 — run once to establish a baseline, then raise.
// The HTML report shows which lines survived mutation (i.e., have no real test).

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",

  // Only mutate source files — not tests, generated code, or entry points
  mutate: [
    "src/**/*.{ts,tsx}",
    "!src/test/**",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    // apiClient.ts is hand-written glue over generated types; exclude alongside coverage exclusions
    "!src/lib/apiClient.ts",
    "!src/lib/adminApiClient.ts",
  ],

  // Reporters: html for local review, json for CI artifact, clear-text for terminal summary
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: { fileName: "reports/mutation/html/index.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },

  // Fail the build if mutation score drops below these thresholds.
  // Set to 0 initially — tighten after reviewing the first baseline report.
  thresholds: {
    high: 80,    // green in report
    low: 60,     // yellow in report
    break: 0,    // CI fails below this — raise once baseline is established
  },

  // Vitest-specific: reuse the project's existing vitest config
  vitest: {
    configFile: "vitest.config.ts",
  },

  // Concurrency: number of workers running mutations in parallel
  concurrency: 4,

  // Ignore unproductive mutants in well-known boilerplate spots
  ignorers: ["@stryker-mutator/vitest-runner"],
  ignorePatterns: [
    "node_modules",
    "dist",
    "reports",
  ],
};
