import { expect, test } from './support/fixtures';
import { installMockApi, type Role } from './support/mockApi';

type InspectionSurface = {
  name: string;
  role?: Role;
  expectedUrl: RegExp;
};

const surfaces: InspectionSurface[] = [
  { name: 'auth', expectedUrl: /\/auth$/ },
  { name: 'customer-dashboard', role: 'CUSTOMER', expectedUrl: /\/customer\/dashboard/ },
  { name: 'tasker-feed', role: 'TASKER', expectedUrl: /\/tasker\/feed/ },
  { name: 'admin-verifications', role: 'ADMIN', expectedUrl: /\/admin(?:\/verifications)?$/ },
];

test.describe('UI inspection', () => {
  for (const surface of surfaces) {
    test(`TID-TASK-000-WEB-INSPECTION-${surface.name.toUpperCase()} @inspection captures ${surface.name}`, async ({
      loginAs,
      page,
    }, testInfo) => {
      if (surface.role) {
        await loginAs(surface.role);
      } else {
        await installMockApi(page, 'CUSTOMER');
        await page.goto('/auth');
      }

      await expect(page).toHaveURL(surface.expectedUrl);
      await expect(page.locator('body')).toBeVisible();

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${surface.name}.png`, {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  }
});
