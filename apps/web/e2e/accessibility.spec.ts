import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';

import { expect, test } from './support/fixtures';
import { installMockApi, type Role } from './support/mockApi';

type Surface = {
  name: string;
  role?: Role;
  expectedUrl: RegExp;
};

const surfaces: Surface[] = [
  { name: 'auth', expectedUrl: /\/auth$/ },
  { name: 'customer-dashboard', role: 'CUSTOMER', expectedUrl: /\/customer\/dashboard/ },
  { name: 'tasker-feed', role: 'TASKER', expectedUrl: /\/tasker\/feed/ },
  { name: 'admin-verifications', role: 'ADMIN', expectedUrl: /\/admin(?:\/verifications)?$/ },
];

function summarizeViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3)
        .map((node) => `    - ${node.target.join(', ')}`)
        .join('\n');
      return `${violation.id}: ${violation.help}\n${nodes}`;
    })
    .join('\n\n');
}

async function scan(page: Page, testInfo: TestInfo, name: string) {
  const results = await new AxeBuilder({ page }).analyze();

  await testInfo.attach(`axe-${name}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  await testInfo.attach(`axe-${name}-summary.txt`, {
    body:
      results.violations.length === 0
        ? 'No automatic axe violations detected.'
        : summarizeViolations(results.violations),
    contentType: 'text/plain',
  });
}

test.describe('Accessibility smoke', () => {
  for (const surface of surfaces) {
    test(`TID-TASK-000-WEB-A11Y-${surface.name.toUpperCase()} @a11y captures an automatic axe report`, async ({
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
      await scan(page, testInfo, surface.name);
    });
  }
});
