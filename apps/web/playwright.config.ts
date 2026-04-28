import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env['CI']);
const host = process.env['PLAYWRIGHT_HOST'] ?? '127.0.0.1';
const port = process.env['PLAYWRIGHT_PORT'] ?? '4173';
const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? `http://${host}:${port}`;
const workers = process.env['PLAYWRIGHT_WORKERS']
  ? Number(process.env['PLAYWRIGHT_WORKERS'])
  : isCI
    ? 1
    : 4;
const shouldStartWebServer = process.env['PLAYWRIGHT_SKIP_WEBSERVER'] !== 'true';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: isCI
    ? [
        ['github'],
        ['list'],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command: `pnpm preview --host ${host} --port ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      }
    : undefined,
});
