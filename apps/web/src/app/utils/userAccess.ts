import type {Profile} from "../../lib/apiClient";

export function isRestrictedUser(profile: Profile | null): boolean {
    return profile?.status === "BANNED" || profile?.status === "SUSPENDED";
}
