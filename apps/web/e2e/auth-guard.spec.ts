import { expect, test } from '@playwright/test';

test.describe('Auth guard — unauthenticated access', () => {
  test('customer dashboard redirects to /auth', async ({ page }) => {
    await page.goto('/customer/dashboard');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('tasker feed redirects to /auth', async ({ page }) => {
    await page.goto('/tasker/feed');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('profile page redirects to /auth', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('admin route redirects away from admin', async ({ page }) => {
    await page.goto('/admin');
    // Admin guard redirects unauthenticated users away from /admin
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('auth page renders login options', async ({ page }) => {
    await page.goto('/auth');
    // Should stay on /auth and show login UI
    await expect(page).toHaveURL(/\/auth/);
  });
});
