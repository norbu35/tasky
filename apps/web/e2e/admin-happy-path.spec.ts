import { expect, test } from '@playwright/test';
import { loginThroughDevBypass, mockApproveVerification, mockDevSession, mockPendingVerifications } from './support/mockApi';

test.describe('Admin happy path', () => {
  test('@smoke admin can review and approve a pending verification', async ({ page }) => {
    await mockDevSession(page, 'ADMIN');
    await mockPendingVerifications(page);
    await mockApproveVerification(page);

    // The app only exposes customer/tasker dev-login buttons. For browser E2E we return
    // an ADMIN session/profile from the mocked dev-login response so the admin route is reachable.
    await loginThroughDevBypass(page, 'Customer');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/admin/verifications');
    await expect(page.getByRole('heading', { name: 'Verifications' })).toBeVisible();

    await page.getByTestId('verification-row-verification-1').click();
    await expect(page.getByText('ID Front')).toBeVisible();

    const approveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/verifications/verification-1/approve') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Approve' }).click();
    await approveResponse;

    await expect(page.getByText('No pending verifications')).toBeVisible();
  });
});
