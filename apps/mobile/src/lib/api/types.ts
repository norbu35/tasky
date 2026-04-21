import type { components } from '@tasky/sdk';

export type User = components['schemas']['User'];
export type Profile = components['schemas']['Profile'];
export type Category = components['schemas']['Category'];
export type PublicTask = components['schemas']['PublicTask'];
export type Task = components['schemas']['Task'];
export type CreateTaskRequest = components['schemas']['CreateTaskRequest'];
export type TaskApplication = components['schemas']['TaskApplication'];
export type Booking = components['schemas']['Booking'];
export type BookingIntent = components['schemas']['BookingIntent'];
export type Review = components['schemas']['Review'];
export type PendingReview = components['schemas']['PendingReview'];
export type Dispute = components['schemas']['Dispute'];
export type Conversation = components['schemas']['Conversation'];
export type Message = components['schemas']['Message'];
export type BookingScheduleEvent = components['schemas']['BookingScheduleEvent'];
export type CursorPagination = components['schemas']['CursorPagination'];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CursorPage<T> {
  data: T[];
  cursor: CursorPagination;
}

export interface TaskFilters {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface RecentLocation {
  location_lat: number;
  location_lng: number;
  location_text: string;
}

export interface BookingFilters {
  role?: 'customer' | 'tasker';
  status?: 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
}

export interface ProfilePolishPreviewPayload {
  bio: string;
  tone: 'friendly' | 'professional' | 'concise';
}

export { ApiError } from '@tasky/core/http';
