import type { Page, Route } from '@playwright/test';

export type Role = 'CUSTOMER' | 'TASKER' | 'ADMIN';

const NOW = '2026-04-24T00:00:00Z';

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function makeUser(role: Role) {
  return {
    id: `${role.toLowerCase()}-1`,
    phone: role === 'ADMIN' ? '+97694000001' : role === 'TASKER' ? '+97693000001' : '+97692000001',
    facebook_id: null,
    role,
    status: role === 'TASKER' ? 'VERIFIED' : 'ACTIVE',
    created_at: NOW,
  };
}

function makeProfile(role: Role) {
  return {
    ...makeUser(role),
    full_name:
      role === 'ADMIN' ? 'Admin User' : role === 'TASKER' ? 'Verified Tasker' : 'Customer User',
    avatar_url: null,
    rating_avg: role === 'TASKER' ? 4.8 : 0,
    completed_tasks: role === 'TASKER' ? 12 : 0,
    is_pro: role === 'TASKER',
  };
}

function makeCategories() {
  return {
    data: [
      {
        id: 'cat-cleaning',
        name: 'Cleaning',
        name_mn: 'Цэвэрлэгээ',
        icon_url: 'https://example.test/icon-cleaning.svg',
        is_active: true,
        sort_order: 1,
        intake_enabled: true,
        assisted_distribution_enabled: true,
        intake_schema_version: 1,
        intake_schema_json: [
          {
            key: 'room_count',
            label: 'Room count',
            label_mn: 'Өрөөний тоо',
            type: 'numeric_counter',
            required: true,
            min: 1,
            max: 5,
          },
        ],
      },
    ],
    cursor: { next: null, has_more: false },
  };
}

function makePublicTasks() {
  return {
    data: [
      {
        id: 'public-task-1',
        category: {
          id: 'cat-cleaning',
          name: 'Cleaning',
          name_mn: 'Цэвэрлэгээ',
          icon_url: 'https://example.test/icon-cleaning.svg',
        },
        description: 'Window cleaning for a two-bedroom apartment',
        pricing_mode: 'BUDGET',
        budget: 65000,
        approximate_location: 'Сүхбаатар дүүрэг',
        approximate_lat: 47.92,
        approximate_lng: 106.92,
        status: 'OPEN',
        scheduled_at: '2026-04-25T09:00:00Z',
        created_at: NOW,
      },
    ],
    cursor: { next: null, has_more: false },
  };
}

function makePublicTaskDetail() {
  return {
    id: 'public-task-1',
    category: {
      id: 'cat-cleaning',
      name: 'Cleaning',
      name_mn: 'Цэвэрлэгээ',
      icon_url: 'https://example.test/icon-cleaning.svg',
      is_active: true,
      sort_order: 1,
      intake_enabled: true,
      assisted_distribution_enabled: true,
      intake_schema_version: 1,
    },
    customer: {
      id: 'customer-1',
      full_name: 'Customer User',
      avatar_url: null,
      rating_avg: 4.7,
    },
    description: 'Window cleaning for a two-bedroom apartment',
    pricing_mode: 'BUDGET',
    budget: 65000,
    approximate_location: 'Сүхбаатар дүүрэг',
    approximate_lat: 47.92,
    approximate_lng: 106.92,
    status: 'OPEN',
    scheduled_at: '2026-04-25T09:00:00Z',
    photo_urls: [],
    application_count: 0,
    created_at: NOW,
  };
}

function makeCustomerTasks() {
  return {
    data: [],
    cursor: { next: null, has_more: false },
  };
}

function makeVerificationList() {
  return [
    {
      id: 'verification-1',
      user_id: 'tasker-1',
      user_name: 'Verified Tasker',
      user_phone: '+97693000001',
      submitted_at: NOW,
      reviewed_at: null,
      status: 'PENDING',
      id_card_front_url: 'https://example.test/id-front.png',
      id_card_back_url: 'https://example.test/id-back.png',
      selfie_url: 'https://example.test/selfie.png',
    },
  ];
}

export async function installMockApi(page: Page, role: Role) {
  let pendingVerifications = makeVerificationList();

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/auth/facebook/status' && method === 'GET') {
      return json(route, 200, { available: true });
    }

    if (path === '/api/v1/auth/dev/login' && method === 'POST') {
      const payload = request.postDataJSON() as { phone: string; role: Role };
      const resolvedRole = payload.role;
      return json(route, 200, {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: makeUser(resolvedRole),
      });
    }

    if (path === '/api/v1/users/me' && method === 'GET') {
      return json(route, 200, makeProfile(role));
    }

    if (path === '/api/v1/categories' && method === 'GET') {
      return json(route, 200, makeCategories());
    }

    if (path === '/api/v1/tasks' && method === 'GET') {
      return json(route, 200, makePublicTasks());
    }

    if (path === '/api/v1/tasks/public-task-1' && method === 'GET') {
      return json(route, 200, makePublicTaskDetail());
    }

    if (path === '/api/v1/tasks/mine' && method === 'GET') {
      return json(route, 200, makeCustomerTasks());
    }

    if (path === '/api/v1/tasks' && method === 'POST') {
      return json(route, 200, {
        id: 'task-1',
        category_id: 'cat-cleaning',
        customer_id: 'customer-1',
        description: 'Deep clean a two-bedroom apartment',
        budget: 120000,
        location_lat: 47.9184,
        location_lng: 106.9177,
        location_text: 'HUD, 15-r khoroo, Olimpiin khotkhon',
        status: 'OPEN',
        scheduled_at: '2026-04-25T09:00:00Z',
        photos: [],
        created_at: NOW,
      });
    }

    if (path === '/api/v1/tasks/public-task-1/applications' && method === 'POST') {
      return json(route, 200, {
        id: 'application-1',
        task_id: 'public-task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Verified Tasker',
          avatar_url: null,
          rating_avg: 4.8,
          completed_tasks: 12,
          is_pro: true,
        },
        message: 'I can handle this tomorrow morning and bring my own supplies.',
        status: 'PENDING',
        created_at: NOW,
      });
    }

    if (path === '/api/v1/admin/verifications/pending' && method === 'GET') {
      return json(route, 200, pendingVerifications);
    }

    if (path === '/api/v1/admin/verifications/verification-1/approve' && method === 'POST') {
      pendingVerifications = [];
      return json(route, 200, {
        id: 'verification-1',
        user_id: 'tasker-1',
        status: 'APPROVED',
        submitted_at: NOW,
      });
    }

    return json(route, 404, {
      code: 'E2E_UNHANDLED_ROUTE',
      message: `${method} ${path} is not mocked in Playwright smoke support`,
    });
  });
}

function buttonLabelForRole(role: Role) {
  if (role === 'CUSTOMER') return 'Customer';
  if (role === 'TASKER') return 'Tasker';
  return 'Admin';
}

export async function loginThroughDevAuth(page: Page, role: Role): Promise<void> {
  await installMockApi(page, role);
  await page.goto('/auth');
  await page.getByRole('button', { name: buttonLabelForRole(role) }).click();
}

export function nextLocalDateTimeInput(hoursAhead: number): string {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
