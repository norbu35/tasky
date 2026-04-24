import { expect, test } from '@playwright/test';

import { loginThroughDevAuth, nextLocalDateTimeInput } from './support/mockApi';

test.describe('Customer happy path', () => {
  test('TID-TASK-000-WEB-CUSTOMER-HAPPY-PATH @smoke customer can create a task through the browser wizard', async ({
    page,
  }) => {
    await loginThroughDevAuth(page, 'CUSTOMER');
    await expect(page).toHaveURL(/\/customer\/dashboard/);
    await page.getByRole('button', { name: 'Post new task' }).click();

    await expect(page.getByRole('heading', { name: 'Post a new task' })).toBeVisible();
    await expect(page.locator('#task-category')).toHaveValue('cat-cleaning');

    await page.getByLabel('Task details').fill('Deep clean a two-bedroom apartment');
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
