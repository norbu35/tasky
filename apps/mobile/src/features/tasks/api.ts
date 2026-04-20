import { createMobileApiClient } from '@/lib/mobileApiClient';
import type {
  Category,
  CreateTaskRequest,
  CursorPage,
  PublicTask,
  Task,
  TaskApplication,
  TaskFilters,
  RecentLocation,
} from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function createTask(accessToken: string, payload: CreateTaskRequest): Promise<Task> {
  return getClient().createTask(accessToken, payload);
}

export async function listTasks(
  accessToken: string,
  filters?: TaskFilters,
): Promise<CursorPage<PublicTask>> {
  return getClient().listTasks(accessToken, filters);
}

export async function listMyTasks(accessToken: string): Promise<CursorPage<Task>> {
  return getClient().listMyTasks(accessToken);
}

export async function listCategories(accessToken: string): Promise<CursorPage<Category>> {
  return getClient().listCategories(accessToken);
}

export async function applyToTask(
  accessToken: string,
  taskId: string,
  message: string,
): Promise<TaskApplication> {
  return getClient().applyToTask(accessToken, taskId, message);
}

export async function listApplications(
  accessToken: string,
  taskId: string,
): Promise<CursorPage<TaskApplication>> {
  return getClient().listApplications(accessToken, taskId);
}

export async function getTaskPhotoUploadUrl(
  accessToken: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<{ upload_url: string; storage_key: string }> {
  return getClient().getTaskPhotoUploadUrl(accessToken, contentType);
}

export async function listRecentLocations(
  accessToken: string,
): Promise<{ locations: RecentLocation[] }> {
  return getClient().listRecentLocations(accessToken);
}

export async function reverseGeocode(
  accessToken: string | undefined,
  lat: number,
  lng: number,
): Promise<{ formatted_address: string }> {
  const client = getClient();
  return (
    client as unknown as {
      requestJson: <T>(
        path: string,
        init: RequestInit,
        accessToken?: string,
        query?: Record<string, string | number | undefined>,
      ) => Promise<T>;
    }
  ).requestJson<{ formatted_address: string }>(
    '/location/reverse-geocode',
    { method: 'GET' },
    accessToken,
    { lat, lng },
  );
}
