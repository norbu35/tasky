import { expect, test } from '@playwright/test';

import { loginThroughDevAuth, nextLocalDateTimeInput } from './support/mockApi';

test.describe('Customer happy path', () => {
  test('@smoke customer can create a task through the browser wizard', async ({ page }) => {
    await loginThroughDevAuth(page, 'Customer');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/customer/tasks/new');
    await expect(page.getByRole('heading', { name: 'Create task' })).toBeVisible();
    await expect(page.locator('#task-category')).toHaveValue('cat-cleaning');

    await page.getByLabel('Description').fill('Deep clean a two-bedroom apartment');
    await page.getByLabel('Scheduled at').fill(nextLocalDateTimeInput(24));
    await page.getByLabel('Address description').fill('HUD, 15-r khoroo, Olimpiin khotkhon');

    const createTaskResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/tasks') && response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Create task' }).click();
    await createTaskResponse;

    await expect(page.getByText('Task posted successfully')).toBeVisible();
    await expect(page.getByText(/Task ID: task-1/)).toBeVisible();
  });
});
