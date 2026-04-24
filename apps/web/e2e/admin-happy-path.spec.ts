import { expect, test } from '@playwright/test';

import { loginThroughDevAuth } from './support/mockApi';

test.describe('Admin happy path', () => {
  test('TID-TASK-000-WEB-ADMIN-HAPPY-PATH @smoke admin can review and approve a pending verification', async ({
    page,
  }) => {
    await loginThroughDevAuth(page, 'ADMIN');
    await expect(page).toHaveURL(/\/admin(?:\/verifications)?$/);

    await expect(page.getByRole('heading', { name: 'Verifications' })).toBeVisible();

    const verificationRow = page.locator('[data-testid^="verification-row-"]').first();
    await verificationRow.click();
    await expect(page.getByText('ID Front')).toBeVisible();

    const approveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/verifications/') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Approve' }).click();
    await approveResponse;

    await expect(page.getByText('No pending verifications')).toBeVisible();
  });
});
