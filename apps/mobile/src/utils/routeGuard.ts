import type { Profile } from '../lib/api/types';

export function isRestricted(profile: Profile | null): boolean {
  return profile?.status === 'BANNED' || profile?.status === 'SUSPENDED';
}
