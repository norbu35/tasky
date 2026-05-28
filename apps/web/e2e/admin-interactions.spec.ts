import { expect, test } from './support/fixtures';

test.describe('Admin detailed interactions', () => {
  test('TID-TASK-001-WEB-ADMIN-CATEGORY-MANAGEMENT @smoke can create categories, expand schemas, and toggle active state', async ({
    loginAs,
    page,
  }) => {
    await loginAs('ADMIN');
    await expect(page).toHaveURL(/\/admin(?:\/verifications)?$/);

    // Navigate to Categories page
    await page.getByRole('link', { name: 'Categories' }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/categories$/);

    // Verify existing category
    await expect(page.getByText('Cleaning')).toBeVisible();

    // Toggle active state
    const firstSwitch = page
      .locator('[data-testid^="category-row-"] button[role="switch"]')
      .first();
    await expect(firstSwitch).toBeVisible();
    await firstSwitch.click();

    // Click Edit Category
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit title' })).toBeVisible();

    // Fill new sort order
    await page.locator('#cat-sort-order').fill('5');
    await page.getByRole('button', { name: 'Save' }).click({ force: true });
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Click Schemas to expand versions panel
    await page.getByRole('button', { name: 'Schemas' }).first().click();
    await expect(page.getByRole('heading', { name: 'Schema versions' })).toBeVisible();

    // Click Create Schema
    await page.getByRole('button', { name: 'Create schema' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create schema title' })).toBeVisible();

    // Enter invalid JSON and click Save
    await page.locator('#schema-json').fill('invalid json string');
    await page.getByRole('button', { name: 'Save' }).click({ force: true });
    await expect(page.getByText('Invalid json', { exact: true })).toBeVisible();

    // Enter valid JSON and click Save
    await page
      .locator('#schema-json')
      .fill(JSON.stringify([{ key: 'room_count', type: 'numeric_counter' }], null, 2));
    const createSchemaResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/categories/') &&
        response.url().includes('/schemas') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save' }).click({ force: true });
    await createSchemaResponse;
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('TID-TASK-002-WEB-ADMIN-DISPUTE-RESOLUTION @smoke can review dispute lists and perform resolution actions', async ({
    loginAs,
    page,
  }) => {
    await loginAs('ADMIN');

    // Navigate to Disputes page
    await page.getByRole('link', { name: 'Disputes' }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/disputes$/);

    // Verify list mounts
    const disputeRow = page.locator('[data-testid="dispute-row"]').first();
    await expect(disputeRow).toBeVisible();
    await expect(disputeRow.getByText('Quality issue')).toBeVisible();

    // Click dispute row to view details
    await disputeRow.click();
    await expect(page).toHaveURL(/\/admin\/disputes\/dispute-1$/);

    // Verify detail elements
    await expect(page.getByText('Dispute info')).toBeVisible();
    await expect(page.getByText('Quality issue')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resolve customer' })).toBeVisible();

    // Try resolving without notes, expecting validation error
    await page.getByRole('button', { name: 'Resolve customer' }).click({ force: true });
    await expect(page.getByText('Notes required')).toBeVisible();

    // Fill notes and resolve
    await page.locator('#resolution-notes').fill('Resolving to Customer after review.');
    const resolveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/disputes/dispute-1/resolve') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Resolve customer' }).click({ force: true });
    await resolveResponse;

    // Verify redirect back to disputes list
    await expect(page).toHaveURL(/\/admin\/disputes$/);
  });

  test('TID-TASK-003-WEB-ADMIN-USER-SEARCH-BAN @smoke can search users, view flagged messages, and trigger user ban', async ({
    loginAs,
    page,
  }) => {
    await loginAs('ADMIN');

    // Navigate to Users page
    await page.getByRole('link', { name: 'Users' }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);

    // Enter phone and search
    await page.getByPlaceholder('Phone number').fill('+97692000001');
    const searchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/users') && response.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Search' }).click({ force: true });
    await searchResponse;

    // Verify user row returned
    const userRow = page.locator('[data-testid^="user-row-customer-1"]');
    await expect(userRow).toBeVisible();

    // Trigger Ban Dialog
    await userRow.getByRole('button', { name: 'Ban' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ban user' })).toBeVisible();

    // Fill reason and confirm ban
    await page.getByPlaceholder('Reason for ban').fill('Spam activity detected.');
    const banResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/users/customer-1/ban') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm' }).click({ force: true });
    await banResponse;
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Go to Flagged Tab
    await page.getByRole('tab', { name: 'Flagged messages' }).click({ force: true });
    await expect(page.getByText('No flagged messages')).toBeVisible();
  });
});
