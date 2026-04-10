import { expect, test } from '@playwright/test';
import { loginThroughDevBypass, mockCategories, mockDevSession, mockTaskApplication, mockTaskFeed } from './support/mockApi';

test.describe('Tasker happy path', () => {
  test('@smoke tasker can browse and apply to a task', async ({ page }) => {
    await mockDevSession(page, 'TASKER');
    await mockCategories(page);
    await mockTaskFeed(page);
    await mockTaskApplication(page);

    await loginThroughDevBypass(page, 'Tasker');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/tasker/feed');
    await expect(page.getByRole('heading', { name: 'Open task feed' })).toBeVisible();
    await expect(page.getByText('Window cleaning for a two-bedroom apartment')).toBeVisible();

    await page
      .getByLabel('Application message')
      .fill('I can handle this tomorrow morning and bring my own supplies.');

    const applyResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/tasks/public-task-1/applications') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Apply to task' }).click();
    await applyResponse;

    await expect(page.getByRole('heading', { name: 'Application sent' })).toBeVisible();
  });
});
