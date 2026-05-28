import { test } from './support/fixtures';

test.describe('Visual Screenshots', () => {
  test('take screenshots of tasks and task details', async ({ loginAs, page }) => {
    // Navigate to tasks list
    await loginAs('CUSTOMER');
    await page.goto('/customer/tasks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/customer-tasks.png', fullPage: true });

    // Navigate to task details
    await page.goto('/customer/tasks/task-1');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'test-results/screenshots/customer-task-details.png',
      fullPage: true,
    });
  });
});
