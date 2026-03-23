/**
 * Shared test fixtures for mobile integration tests.
 * Provides common mock data, store reset helpers, and mock setup functions.
 */
import type { AuthTokens, Booking, Profile, PublicTask, User } from '../../src/lib/mobileApiClient';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/appStore';

// ── Mock Data ──────────────────────────────────────────────────────────

export const baseUser: User = {
  id: 'user-1',
  phone: '+97699001122',
  primary_auth: 'PHONE_OTP',
  role: 'CUSTOMER',
  status: 'PENDING',
  created_at: '2026-02-14T00:00:00Z',
};

export const taskerUser: User = {
  ...baseUser,
  id: 'tasker-1',
  role: 'TASKER',
};

export const baseSession: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: baseUser,
};

export const taskerSession: AuthTokens = {
  accessToken: 'tasker-access-token',
  refreshToken: 'tasker-refresh-token',
  user: taskerUser,
};

export const baseProfile: Profile = {
  id: 'user-1',
  phone_masked: '+97699****22',
  role: 'CUSTOMER',
  status: 'PENDING',
  full_name: 'Test Customer',
  avatar_url: null,
  rating_avg: 0,
  completed_tasks: 0,
  is_pro: false,
  created_at: '2026-02-14T00:00:00Z',
};

export const taskerProfile: Profile = {
  ...baseProfile,
  id: 'tasker-1',
  role: 'TASKER',
  full_name: 'Test Tasker',
  rating_avg: 4.8,
  completed_tasks: 42,
  status: 'VERIFIED',
};

export const bannedProfile: Profile = {
  ...baseProfile,
  status: 'BANNED',
};

export const suspendedProfile: Profile = {
  ...baseProfile,
  status: 'SUSPENDED',
};

export const baseTask: PublicTask = {
  id: 'public-task-1',
  category: {
    id: 'cat-cleaning',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: 'https://example/icon.png',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    intake_schema_version: 0,
  },
  customer: {
    id: 'customer-1',
    full_name: 'Customer',
    avatar_url: null,
    rating_avg: 4.7,
  },
  description: 'Window cleaning',
  budget: 70000,
  approximate_location: 'Сүхбаатар дүүрэг',
  approximate_lat: 47.92,
  approximate_lng: 106.92,
  status: 'OPEN',
  scheduled_at: '2026-02-16T00:00:00Z',
  photo_urls: [],
  application_count: 1,
  created_at: '2026-02-14T00:00:00Z',
};

export const baseBooking: Booking = {
  id: 'booking-1',
  task_id: 'task-123456789',
  tasker_id: 'tasker-1',
  customer_id: 'customer-1',
  price: 120000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-02-16T10:00:00Z',
  cancellation_fee: null,
  created_at: '2026-02-14T00:00:00Z',
};

// ── Store Helpers ──────────────────────────────────────────────────────

export function resetStores() {
  useAuthStore.setState({ session: null, profile: null, deviceToken: null });
  useAppStore.setState({ hasSeenOnboarding: true, currentRole: 'customer' });
}

export function setAuthenticated(role: 'customer' | 'tasker' = 'customer') {
  const session = role === 'customer' ? baseSession : taskerSession;
  const profile = role === 'customer' ? baseProfile : taskerProfile;
  useAuthStore.setState({ session, profile });
  useAppStore.setState({ currentRole: role });
}

export function setFirstTimeUser() {
  useAuthStore.setState({ session: null, profile: null, deviceToken: null });
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
}

export function setBannedUser() {
  useAuthStore.setState({ session: baseSession, profile: bannedProfile });
}

export function setSuspendedUser() {
  useAuthStore.setState({ session: baseSession, profile: suspendedProfile });
}
