import { expect, test } from '@playwright/test';

test.describe('Tasker happy path — route gating', () => {
  test('tasker feed is gated behind auth', async ({ page }) => {
    await page.goto('/tasker/feed');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('tasker verification is gated behind auth', async ({ page }) => {
    await page.goto('/tasker/verification');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('tasker jobs route is gated behind auth', async ({ page }) => {
    await page.goto('/tasker/jobs');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('tasker stats route is gated behind auth', async ({ page }) => {
    await page.goto('/tasker/stats');
    await expect(page).toHaveURL(/\/auth/);
  });
});
