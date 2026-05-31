import { expect, test } from './support/fixtures';

test.describe('Visual Screenshots', () => {
  test('take screenshots of primary web surfaces', async ({ loginAs, page }) => {
    await loginAs('CUSTOMER');
    await expect(page.getByText('Deep clean a two-bedroom apartment')).toBeVisible();
    await page.screenshot({
      path: 'test-results/screenshots/customer-dashboard.png',
      fullPage: true,
    });

    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/\/customer\/tasks$/);
    await expect(
      page.getByRole('button', { name: /Deep clean a two-bedroom apartment/ }),
    ).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/screenshots/customer-tasks.png',
      fullPage: true,
    });

    await page.getByRole('button', { name: /Deep clean a two-bedroom apartment/ }).click();
    await expect(page).toHaveURL(/\/customer\/tasks\/task-1$/);
    await expect(page.getByText('Verified Tasker', { exact: true })).toBeVisible();
    await page.screenshot({
      path: 'test-results/screenshots/customer-task-details.png',
      fullPage: true,
    });

    await loginAs('TASKER');
    await expect(page.getByRole('button', { name: /Window cleaning/ })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/tasker-feed.png', fullPage: true });

    await loginAs('ADMIN');
    await expect(page.getByText('Verified Tasker', { exact: true })).toBeVisible();
    await page.screenshot({
      path: 'test-results/screenshots/admin-verifications.png',
      fullPage: true,
    });
  });
});
