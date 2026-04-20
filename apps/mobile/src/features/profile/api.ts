import { createMobileApiClient } from '@/lib/mobileApiClient';
import type { Profile, ProfilePolishPreviewPayload, User } from '@/lib/api/types';

const getClient = () => createMobileApiClient();

export async function getMyProfile(accessToken: string): Promise<Profile> {
  return getClient().getMyProfile(accessToken);
}

export async function getPublicProfile(accessToken: string, userId: string): Promise<Profile> {
  return getClient().getPublicProfile(accessToken, userId);
}

export async function updateMyProfile(
  accessToken: string,
  payload: { full_name?: string; avatar_url?: string | null; bio?: string },
): Promise<Profile> {
  return getClient().updateMyProfile(accessToken, payload);
}

export async function getProfilePolishPreview(
  accessToken: string,
  payload: ProfilePolishPreviewPayload,
): Promise<{ suggested_bio: string }> {
  return getClient().getProfilePolishPreview(accessToken, payload);
}

export async function getAvatarUploadUrl(
  accessToken: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<{ uploadUrl: string; storageKey: string }> {
  return getClient().getAvatarUploadUrl(accessToken, contentType);
}

export async function activateTaskerRole(accessToken: string): Promise<User> {
  return getClient().activateTaskerRole(accessToken);
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  return getClient().deleteMyAccount(accessToken);
}

export async function getMyStats(accessToken: string): Promise<{
  jobs_completed: number;
  average_rating: number;
  response_time_minutes: number;
  reliability_score: number;
}> {
  return getClient().getMyStats(accessToken);
}
