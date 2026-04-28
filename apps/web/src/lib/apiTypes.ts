import type { components } from '@tasky/sdk';

export type User = components['schemas']['User'];
export type Profile = components['schemas']['Profile'];
export type Category = components['schemas']['Category'];
export type TaskFeedItem = components['schemas']['TaskFeedItem'];
export type PublicTask = components['schemas']['PublicTask'];
export type Task = components['schemas']['Task'];
export type CreateTaskRequest = components['schemas']['CreateTaskRequest'];
export type TaskApplication = components['schemas']['TaskApplication'];
export type Booking = components['schemas']['Booking'];
export type BookingIntent = components['schemas']['BookingIntent'];
export type BookingScheduleEvent = components['schemas']['BookingScheduleEvent'];
export type Review = components['schemas']['Review'];
export type Dispute = components['schemas']['Dispute'];
export type Conversation = components['schemas']['Conversation'];
export type Message = components['schemas']['Message'];

export type VerificationDetail = components['schemas']['VerificationDetail'] & {
  selfie_url?: string;
};
export type VerificationStatus = components['schemas']['VerificationStatus'];
export type FeatureToggle = Omit<components['schemas']['FeatureToggle'], 'feature_name'> & {
  feature_name: string;
};
export type StrikePolicy = Omit<components['schemas']['StrikePolicy'], 'updatedAt'> & {
  updatedAt?: string;
};
export type StrikePolicyUpdateRequest = components['schemas']['StrikePolicyUpdateRequest'];
export type PayoutRequest = components['schemas']['PayoutRequest'];
export type AdminDisputeDetail = components['schemas']['AdminDisputeDetail'];
export type CategorySchemaVersion = components['schemas']['CategorySchemaVersion'];
export type AdminCategoryPayload = components['schemas']['AdminCategoryPayload'];
export type TaskDraft = components['schemas']['TaskDraft'];
export type RecentLocation = components['schemas']['RecentLocation'];

export interface LeadUnlockPrice {
  id: string;
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
  effective_to: string | null;
}

export interface LeadUnlockPricePayload {
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CursorPage<T> {
  data: T[];
  cursor: {
    next: string | null;
    has_more: boolean;
  };
}

export interface TaskFilters {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  cursor?: string;
  limit?: number;
}

export interface BookingFilters {
  role?: 'customer' | 'tasker';
  status?: 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
}
