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
export type Dispute = components['schemas']['Dispute'];
export type Conversation = components['schemas']['Conversation'];
export type Message = components['schemas']['Message'];

export interface VerificationDetail {
  id: string;
  user_id: string;
  user_phone: string;
  user_name: string;
  id_card_front_url: string;
  id_card_back_url: string;
  selfie_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface VerificationStatus {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface FeatureToggle {
  feature_name: string;
  is_enabled: boolean;
  updated_by: string;
  updated_at: string;
}

export interface StrikePolicy {
  strikeWindowDays: number;
  strikeThreshold: number;
  firstSuspensionDays: number;
  repeatSuspensionDays: number;
  repeatOffenseWindowDays: number;
  autoUnsuspendEnabled: boolean;
  updatedAt?: string;
}

export interface StrikePolicyUpdateRequest {
  strikeWindowDays?: number;
  strikeThreshold?: number;
  firstSuspensionDays?: number;
  repeatSuspensionDays?: number;
  repeatOffenseWindowDays?: number;
  autoUnsuspendEnabled?: boolean;
}

export interface PayoutRequest {
  id: string;
  user_id?: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  created_at: string;
  processed_at: string | null;
}

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
  effective_to?: string | null;
}

export interface AdminDisputeDetail {
  dispute: Record<string, unknown>;
  booking: Record<string, unknown>;
  conversation_id: string | null;
  evidence_messages: unknown[];
}

export interface CategorySchemaVersion {
  version: number;
  status: string;
  schema_json: Record<string, unknown>;
  created_at: string;
}

export interface AdminCategoryPayload {
  name: string;
  name_mn: string;
  icon_url: string;
  sort_order: number;
  intake_enabled: boolean;
  is_active?: boolean;
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
}

export interface BookingFilters {
  role?: 'customer' | 'tasker';
  status?: 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
}
