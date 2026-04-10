import type { Page, Route } from '@playwright/test';
import type { Category, Profile, PublicTask, Task, User, VerificationDetail } from '../../src/lib/apiClient';

type DevRole = 'CUSTOMER' | 'TASKER' | 'ADMIN';

const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XbNQAAAAASUVORK5CYII=';

function buildUser(role: DevRole): User {
  return {
    id: `${role.toLowerCase()}-user-1`,
    phone: '+97699001122',
    facebook_id: `fb-${role.toLowerCase()}-1`,
    primary_auth: 'PHONE_OTP',
    role,
    status: 'VERIFIED',
    created_at: '2026-02-14T00:00:00Z',
  };
}

function buildProfile(role: DevRole): Profile {
  return {
    id: `${role.toLowerCase()}-user-1`,
    phone_masked: '+97699****22',
    role,
    status: 'VERIFIED',
    full_name:
      role === 'ADMIN' ? 'Admin Operator' : role === 'TASKER' ? 'Verified Tasker' : 'Test Customer',
    avatar_url: null,
    rating_avg: role === 'TASKER' ? 4.8 : 0,
    completed_tasks: role === 'TASKER' ? 19 : 2,
    is_pro: role === 'TASKER',
    created_at: '2026-02-14T00:00:00Z',
  };
}

export function buildCategory(): Category {
  return {
    id: 'cat-cleaning',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: 'https://example.test/icon.png',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    intake_schema_version: 1,
    intake_schema_json: null,
  };
}

export function buildPublicTask(): PublicTask {
  return {
    id: 'public-task-1',
    category: buildCategory(),
    customer: {
      id: 'customer-1',
      full_name: 'Customer',
      avatar_url: null,
      rating_avg: 4.7,
    },
    description: 'Window cleaning for a two-bedroom apartment',
    budget: 65000,
    approximate_location: 'Sukhbaatar district',
    approximate_lat: 47.92,
    approximate_lng: 106.92,
    status: 'OPEN',
    scheduled_at: '2026-02-15T00:00:00Z',
    photo_urls: [],
    application_count: 0,
    created_at: '2026-02-14T00:00:00Z',
  };
}

export function buildCreatedTask(): Task {
  return {
    id: 'task-1',
    category_id: 'cat-cleaning',
    customer_id: 'customer-user-1',
    description: 'Deep clean a two-bedroom apartment',
    budget: 85000,
    location_lat: 47.9184,
    location_lng: 106.9177,
    location_text: 'HUD, 15-r khoroo, Olimpiin khotkhon',
    status: 'OPEN',
    scheduled_at: '2026-02-15T00:00:00Z',
    intake_schema_version: 1,
    photos: [],
    created_at: '2026-02-14T00:00:00Z',
    updated_at: '2026-02-14T00:00:00Z',
  };
}

export function buildPendingVerification(): VerificationDetail {
  return {
    id: 'verification-1',
    user_id: 'tasker-user-1',
    user_phone: '+97699110011',
    user_name: 'Verified Tasker',
    id_card_front_url: PLACEHOLDER_IMAGE,
    id_card_back_url: PLACEHOLDER_IMAGE,
    selfie_url: PLACEHOLDER_IMAGE,
    status: 'PENDING',
    admin_notes: null,
    submitted_at: '2026-02-14T00:00:00Z',
    reviewed_at: null,
  };
}

async function fulfillJson(route: Route, payload: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function mockAuthBootstrap(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/facebook/status', async (route) => {
    await fulfillJson(route, { available: true });
  });
}

export async function mockDevSession(page: Page, role: DevRole): Promise<void> {
  const user = buildUser(role);
  const profile = buildProfile(role);

  await mockAuthBootstrap(page);

  await page.route('**/api/v1/auth/dev/login', async (route) => {
    await fulfillJson(route, {
      access_token: 'e2e-access-token',
      refresh_token: 'e2e-refresh-token',
      user,
    });
  });

  await page.route('**/api/v1/users/me', async (route) => {
    await fulfillJson(route, profile);
  });
}

export async function loginThroughDevBypass(page: Page, buttonName: string): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('button', { name: buttonName }).click();
}

export async function mockCategories(page: Page, categories: Category[] = [buildCategory()]): Promise<void> {
  await page.route('**/api/v1/categories*', async (route) => {
    await fulfillJson(route, {
      data: categories,
      cursor: { next: null, has_more: false },
    });
  });
}

export async function mockCreateTask(page: Page, createdTask: Task = buildCreatedTask()): Promise<void> {
  await page.route('**/api/v1/tasks', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({ status: 404, body: 'not mocked' });
      return;
    }

    await fulfillJson(route, createdTask);
  });
}

export async function mockTaskFeed(page: Page, tasks: PublicTask[] = [buildPublicTask()]): Promise<void> {
  await page.route('**/api/v1/tasks*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 404, body: 'not mocked' });
      return;
    }

    await fulfillJson(route, {
      data: tasks,
      cursor: { next: null, has_more: false },
    });
  });
}

export async function mockTaskApplication(page: Page, taskId = 'public-task-1'): Promise<void> {
  await page.route(`**/api/v1/tasks/${taskId}/applications`, async (route) => {
    await fulfillJson(route, {
      id: 'application-1',
      task_id: taskId,
      tasker: {
        id: 'tasker-user-1',
        full_name: 'Verified Tasker',
        avatar_url: null,
        rating_avg: 4.8,
        completed_tasks: 19,
        is_pro: true,
      },
      message: 'I can handle this tomorrow morning.',
      status: 'PENDING',
      created_at: '2026-02-14T00:00:00Z',
    });
  });
}

export async function mockPendingVerifications(
  page: Page,
  verifications: VerificationDetail[] = [buildPendingVerification()],
): Promise<void> {
  await page.route('**/api/v1/admin/verifications/pending', async (route) => {
    await fulfillJson(route, verifications);
  });
}

export async function mockApproveVerification(page: Page, verificationId = 'verification-1'): Promise<void> {
  await page.route(`**/api/v1/admin/verifications/${verificationId}/approve`, async (route) => {
    await fulfillJson(route, {
      ...buildPendingVerification(),
      id: verificationId,
      status: 'APPROVED',
      reviewed_at: '2026-02-14T01:00:00Z',
    });
  });
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
