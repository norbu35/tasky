import type {Profile} from "../lib/mobileApiClient";

export function isRestricted(profile: Profile | null): boolean {
  return profile?.status === "BANNED" || profile?.status === "SUSPENDED";
}
