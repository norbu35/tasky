import type {
  Category,
  CreateTaskRequest,
  CursorPage,
  Task,
  TaskDetail,
  TaskFeedItem,
  TaskApplication,
  TaskFilters,
  RecentLocation,
} from '@/lib/api/types';
import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

export async function createTask(accessToken: string, payload: CreateTaskRequest): Promise<Task> {
  return getClient().requestJson<Task>(
    '/tasks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function listTasks(
  accessToken: string,
  filters?: TaskFilters,
): Promise<CursorPage<TaskFeedItem>> {
  return getClient().requestJson<CursorPage<TaskFeedItem>>(
    '/tasks',
    { method: 'GET' },
    accessToken,
    {
      category: filters?.categoryId,
      lat: filters?.lat,
      lng: filters?.lng,
      radius_km: filters?.radiusKm,
      cursor: filters?.cursor,
      limit: filters?.limit ?? 20,
    },
  );
}

export async function getTask(accessToken: string, taskId: string): Promise<TaskDetail> {
  return getClient().requestJson<TaskDetail>(`/tasks/${taskId}`, { method: 'GET' }, accessToken);
}

export async function listMyTasks(accessToken: string): Promise<CursorPage<Task>> {
  return getClient().requestJson<CursorPage<Task>>('/tasks/mine', { method: 'GET' }, accessToken, {
    limit: 100,
  });
}

export async function listCategories(accessToken: string): Promise<CursorPage<Category>> {
  return getClient().requestJson<CursorPage<Category>>(
    '/categories',
    { method: 'GET' },
    accessToken,
    {
      limit: 100,
    },
  );
}

export async function applyToTask(
  accessToken: string,
  taskId: string,
  message: string,
  quotePrice?: number | null,
): Promise<TaskApplication> {
  const body =
    quotePrice == null
      ? { message }
      : {
          message,
          quote_price: quotePrice,
        };

  return getClient().requestJson<TaskApplication>(
    `/tasks/${taskId}/applications`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    accessToken,
  );
}

export async function listApplications(
  accessToken: string,
  taskId: string,
): Promise<CursorPage<TaskApplication>> {
  return getClient().requestJson<CursorPage<TaskApplication>>(
    `/tasks/${taskId}/applications`,
    { method: 'GET' },
    accessToken,
    { limit: 100 },
  );
}

export async function getTaskPhotoUploadUrl(
  accessToken: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<{ upload_url: string; storage_key: string }> {
  return getClient().requestJson<{ upload_url: string; storage_key: string }>(
    '/tasks/photos/upload-url',
    {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType }),
    },
    accessToken,
  );
}

export async function listRecentLocations(
  accessToken: string,
): Promise<{ locations: RecentLocation[] }> {
  return getClient().requestJson<{ locations: RecentLocation[] }>(
    '/tasks/mine/recent-locations',
    { method: 'GET' },
    accessToken,
  );
}

export async function reverseGeocode(
  accessToken: string | undefined,
  lat: number,
  lng: number,
): Promise<{ formatted_address: string }> {
  return getClient().requestJson<{ formatted_address: string }>(
    '/location/reverse-geocode',
    { method: 'GET' },
    accessToken,
    { lat, lng },
  );
}
