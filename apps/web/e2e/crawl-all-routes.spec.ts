import { expect, test } from './support/fixtures';

test.describe('Automated Route Crawler', () => {
  // Define customer routes to test
  const customerRoutes = [
    '/customer/dashboard',
    '/customer/tasks',
    '/customer/tasks/new',
    '/customer/tasks/success',
    '/customer/tasks/task-1',
    '/customer/tasks/task-1/applicants',
    '/customer/taskers/tasker-1',
    '/customer/booking-confirmation',
    '/customer/bookings',
    '/customer/bookings/booking-1',
    '/customer/bookings/booking-1/confirmed',
    '/customer/bookings/booking-1/timeline',
    '/customer/bookings/booking-1/reschedule',
    '/customer/bookings/booking-1/dispute',
    '/customer/disputes/dispute-1',
    '/customer/bookings/booking-1/no-show',
    '/customer/tasks/task-1/no-applicants',
    '/customer/rebook',
    '/profile',
    '/profile/edit',
    '/profile/settings',
    '/profile/delete',
    '/inbox',
    '/inbox/conversation-1',
    '/notifications',
    '/communication',
    '/booking/safety',
    '/help',
    '/terms',
    '/privacy',
  ];

  // Define tasker routes to test
  const taskerRoutes = [
    '/tasker/feed',
    '/tasker/tasks',
    '/tasker/my-tasks',
    '/tasker/tasks/task-1',
    '/tasker/tasks/task-1/applied',
    '/tasker/jobs',
    '/tasker/bookings/booking-1',
    '/tasker/stats',
    '/tasker/privacy',
    '/tasker/verification',
    '/tasker/verification/consent',
    '/tasker/verification/upload',
    '/tasker/verification/pending',
    '/tasker/verification/approved',
    '/tasker/verification/rejected',
    '/tasker/verification/submitted',
  ];

  // Define admin routes to test
  const adminRoutes = [
    '/admin',
    '/admin/verifications',
    '/admin/disputes',
    '/admin/disputes/dispute-1',
    '/admin/users',
    '/admin/categories',
    '/admin/features',
    '/admin/concierge',
    '/admin/moderation',
  ];

  test('crawl all customer routes', async ({ loginAs, page }) => {
    await loginAs('CUSTOMER');
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(`[PageError] ${err.message}\n${err.stack ?? ''}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Ignore translation key warnings and network failure logging noise
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('i18next')) {
          errors.push(`[ConsoleError] ${text}`);
        }
      }
    });

    for (const route of customerRoutes) {
      await page.goto(route);
      await page.waitForTimeout(300); // Fast but stable yield for React rendering
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('Something went wrong');
    }

    if (errors.length > 0) {
      throw new Error(`Customer crawler encountered errors:\n${errors.join('\n')}`);
    }
  });

  test('crawl all tasker routes', async ({ loginAs, page }) => {
    await loginAs('TASKER');
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(`[PageError] ${err.message}\n${err.stack ?? ''}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('i18next')) {
          errors.push(`[ConsoleError] ${text}`);
        }
      }
    });

    for (const route of taskerRoutes) {
      await page.goto(route);
      await page.waitForTimeout(300);
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('Something went wrong');
    }

    if (errors.length > 0) {
      throw new Error(`Tasker crawler encountered errors:\n${errors.join('\n')}`);
    }
  });

  test('crawl all admin routes', async ({ loginAs, page }) => {
    await loginAs('ADMIN');
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(`[PageError] ${err.message}\n${err.stack ?? ''}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('i18next')) {
          errors.push(`[ConsoleError] ${text}`);
        }
      }
    });

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForTimeout(300);
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('Something went wrong');
    }

    if (errors.length > 0) {
      throw new Error(`Admin crawler encountered errors:\n${errors.join('\n')}`);
    }
  });
});
