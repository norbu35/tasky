import type { AuthTokens, Booking, Profile, PublicTask, User } from '../../src/lib/api/types';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/appStore';

export const baseUser: User = {
  id: 'user-1',
  phone: '+97699001122',
  primary_auth: 'PHONE_OTP',
  role: 'CUSTOMER',
  status: 'PENDING',
  created_at: '2026-02-14T00:00:00Z',
};

export const taskerUser: User = {
  id: 'user-2',
  phone: '+97699003344',
  primary_auth: 'PHONE_OTP',
  role: 'TASKER',
  status: 'VERIFIED',
  created_at: '2026-01-10T00:00:00Z',
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
  completed_tasks: 3,
  is_pro: false,
  created_at: '2026-02-14T00:00:00Z',
};

export const taskerProfile: Profile = {
  id: 'user-2',
  phone_masked: '+97699****44',
  role: 'TASKER',
  status: 'VERIFIED',
  full_name: 'Test Tasker',
  avatar_url: 'https://cdn.tasky.mn/avatars/user2.jpg',
  rating_avg: 4.8,
  completed_tasks: 47,
  is_pro: true,
  created_at: '2026-01-10T00:00:00Z',
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

export const repairTask: PublicTask = {
  id: 'public-task-2',
  category: {
    id: 'cat-repair',
    name: 'Repair',
    name_mn: 'Засвар',
    icon_url: 'https://example/icon-repair.png',
    is_active: true,
    sort_order: 2,
    intake_enabled: false,
    intake_schema_version: 0,
  },
  customer: {
    id: 'customer-2',
    full_name: 'Another Customer',
    avatar_url: null,
    rating_avg: 4.5,
  },
  description: 'Fix broken pipe',
  budget: 50000,
  approximate_location: 'Баянгол дүүрэг',
  approximate_lat: 47.91,
  approximate_lng: 106.88,
  status: 'OPEN',
  scheduled_at: '2026-02-17T00:00:00Z',
  photo_urls: [],
  application_count: 0,
  created_at: '2026-02-15T00:00:00Z',
};

export const bannedProfile: Profile = {
  ...baseProfile,
  status: 'BANNED',
};

export const suspendedProfile: Profile = {
  ...baseProfile,
  status: 'SUSPENDED',
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

export function resetStores(): void {
  useAuthStore.setState({
    session: null,
  });
  useAppStore.setState({
    hasSeenOnboarding: true,
    currentRole: 'customer',
  });
}

export function setAuthenticated(session: AuthTokens = baseSession): void {
  useAuthStore.setState({ session });
}

export function setFirstTimeUser(): void {
  useAuthStore.setState({ session: null });
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
}

export function setBannedUser(): void {
  useAuthStore.setState({ session: baseSession });
}

export function setSuspendedUser(): void {
  useAuthStore.setState({ session: baseSession });
}
