import { expect, test as base } from '@playwright/test';

import { loginThroughDevAuth, type Role } from './mockApi';

type TaskyFixtures = {
  loginAs: (role: Role) => Promise<void>;
};

export const test = base.extend<TaskyFixtures>({
  page: async ({ page }, run, testInfo) => {
    const diagnostics: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        diagnostics.push(`[console:${message.type()}] ${message.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      diagnostics.push(`[pageerror] ${error.message}`);
    });

    page.on('requestfailed', (request) => {
      diagnostics.push(
        `[requestfailed] ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
    });

    await run(page);

    if (diagnostics.length > 0) {
      await testInfo.attach('browser-diagnostics.txt', {
        body: diagnostics.join('\n'),
        contentType: 'text/plain',
      });
    }
  },

  loginAs: async ({ page }, run) => {
    await run((role) => loginThroughDevAuth(page, role));
  },
});

export { expect };
