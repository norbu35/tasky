import { expect, test } from '@playwright/test';

test.describe('Customer happy path — landing to login gate', () => {
  test('landing page shows call-to-action buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('Get Started navigates to auth page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('Login button navigates to auth page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('customer task creation route is gated', async ({ page }) => {
    await page.goto('/customer/tasks/new');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('customer bookings route is gated', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page).toHaveURL(/\/auth/);
  });
});
