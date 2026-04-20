import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { Profile, ProfilePolishPreviewPayload, User } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function getMyProfile(accessToken: string): Promise<Profile> {
  return getClient().requestJson<Profile>('/users/me', { method: 'GET' }, accessToken);
}

export async function getPublicProfile(accessToken: string, userId: string): Promise<Profile> {
  return getClient().requestJson<Profile>(`/users/${userId}`, { method: 'GET' }, accessToken);
}

export async function updateMyProfile(
  accessToken: string,
  payload: { full_name?: string; avatar_url?: string | null; bio?: string },
): Promise<Profile> {
  return getClient().requestJson<Profile>(
    '/users/me',
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export async function getProfilePolishPreview(
  accessToken: string,
  payload: ProfilePolishPreviewPayload,
): Promise<{ suggested_bio: string }> {
  return getClient()
    .requestJson<{
      suggested_bio?: string;
      suggestion?: string;
      preview?: string;
      bio?: string;
    }>(
      '/users/me/profile-polish-preview',
      { method: 'POST', body: JSON.stringify(payload) },
      accessToken,
    )
    .then((response) => ({
      suggested_bio:
        response.suggested_bio ?? response.suggestion ?? response.preview ?? response.bio ?? '',
    }));
}

export async function getAvatarUploadUrl(
  accessToken: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<{ uploadUrl: string; storageKey: string }> {
  return getClient()
    .requestJson<{ upload_url: string; storage_key: string }>(
      '/users/me/avatar/upload-url',
      { method: 'POST', body: JSON.stringify({ content_type: contentType }) },
      accessToken,
    )
    .then((response) => ({
      uploadUrl: response.upload_url,
      storageKey: response.storage_key,
    }));
}

export async function activateTaskerRole(accessToken: string): Promise<User> {
  return getClient().requestJson<User>('/users/me/role/tasker', { method: 'POST' }, accessToken);
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  return getClient().requestVoid('/users/me', { method: 'DELETE' }, accessToken);
}

export async function getMyStats(accessToken: string): Promise<{
  jobs_completed: number;
  average_rating: number;
  response_time_minutes: number;
  reliability_score: number;
}> {
  return getClient().requestJson<{
    jobs_completed: number;
    average_rating: number;
    response_time_minutes: number;
    reliability_score: number;
  }>('/users/me/stats', { method: 'GET' }, accessToken);
}
