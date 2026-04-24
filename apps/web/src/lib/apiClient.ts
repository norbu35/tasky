import { HttpTransport, normalizeBaseUrl } from '@tasky/core/http';

import type {
  User,
  Profile,
  AuthTokens,
  Task,
  TaskFilters,
  CursorPage,
  PublicTask,
  TaskApplication,
  Booking,
  BookingIntent,
  BookingFilters,
  Review,
  Dispute,
  Conversation,
  Message,
  VerificationStatus,
  Category,
  CreateTaskRequest,
} from './apiTypes';

export type * from './apiTypes';
export { ApiError } from '@tasky/core/http';
export type { TokenRefreshDelegate } from '@tasky/core/http';

export interface ApiClient {
  loginWithFacebook(accessToken: string): Promise<AuthTokens>;

  getFacebookAuthStatus(): Promise<{ available: boolean }>;

  getMyProfile(accessToken: string): Promise<Profile>;

  updateMyProfile(
    accessToken: string,
    payload: {
      full_name?: string;
      avatar_url?: string | null;
    },
  ): Promise<Profile>;

  getAvatarUploadUrl(
    accessToken: string,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  ): Promise<{ uploadUrl: string; storageKey: string }>;

  getTaskPhotoUploadUrl(
    accessToken: string,
    taskId: string | null,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  ): Promise<{ uploadUrl: string; storageKey: string }>;

  activateTaskerRole(accessToken: string): Promise<User>;

  listCategories(accessToken: string): Promise<CursorPage<Category>>;

  createTask(accessToken: string, payload: CreateTaskRequest): Promise<Task>;

  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>>;

  listMyTasks(accessToken: string): Promise<CursorPage<Task>>;

  applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication>;

  listTaskApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>>;

  acceptApplication(
    accessToken: string,
    taskId: string,
    applicationId: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking>;

  createBookingIntent(
    accessToken: string,
    taskId: string,
    source: 'REBOOK' | 'INSTANT_MATCH',
    taskerId: string,
    originalBookingId?: string,
    offerId?: string,
  ): Promise<BookingIntent>;

  confirmBookingIntent(
    accessToken: string,
    bookingIntentId: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking>;

  initiatePayment(
    accessToken: string,
    bookingId: string,
    idempotencyKey: string,
  ): Promise<{ paymentUrl: string; qrCode: string }>;

  listBookings(accessToken: string, filters?: BookingFilters): Promise<CursorPage<Booking>>;

  getBooking(accessToken: string, bookingId: string): Promise<Booking>;

  cancelBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;

  completeBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;

  submitReview(
    accessToken: string,
    bookingId: string,
    payload: {
      quality_rating: number;
      punctuality_rating: number;
      communication_rating: number;
      clarity_rating: number;
      respectfulness_rating: number;
      comment?: string | null;
    },
  ): Promise<Review>;

  getUserReviews(accessToken: string, userId: string): Promise<CursorPage<Review>>;

  raiseDispute(
    accessToken: string,
    bookingId: string,
    reason: string,
    idempotencyKey: string,
  ): Promise<Dispute>;

  getDispute(accessToken: string, disputeId: string): Promise<Dispute>;

  listConversations(accessToken: string): Promise<CursorPage<Conversation>>;

  listMessages(accessToken: string, conversationId: string): Promise<CursorPage<Message>>;

  sendMessage(accessToken: string, conversationId: string, content: string): Promise<Message>;

  registerDevice(
    accessToken: string,
    payload: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB' },
  ): Promise<string>;

  unregisterDevice(accessToken: string, token: string): Promise<void>;

  devLogin(phone: string, role: 'CUSTOMER' | 'TASKER' | 'ADMIN'): Promise<AuthTokens>;

  // ─── Verification Methods ─────────────────────────────────────────

  getVerificationUploadUrl(
    accessToken: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; storageKey: string }>;

  submitVerification(
    accessToken: string,
    payload: {
      id_card_front_key: string;
      id_card_back_key: string;
      consent_policy_version: string;
      consent_accepted: boolean;
    },
  ): Promise<VerificationStatus>;

  getVerificationStatus(accessToken: string): Promise<VerificationStatus>;
}

function inferRuntimeOrigin(): string | null {
  const maybeLocation = globalThis.location;
  if (
    maybeLocation &&
    typeof maybeLocation.origin === 'string' &&
    maybeLocation.origin.length > 0 &&
    maybeLocation.origin !== 'null'
  ) {
    return maybeLocation.origin;
  }
  return null;
}

function buildBaseUrl(): string {
  const configured = import.meta.env['VITE_API_BASE_URL'];
  const rawBaseUrl =
    typeof configured === 'string' && configured.trim().length > 0
      ? configured
      : (inferRuntimeOrigin() ?? 'http://localhost:8080');
  return normalizeBaseUrl(rawBaseUrl);
}

export function buildSocketBaseUrl(): string {
  const socketUrl = new URL(buildBaseUrl());
  socketUrl.pathname = '/ws';
  socketUrl.search = '';
  socketUrl.hash = '';
  return socketUrl.toString().replace(/\/$/, '');
}

export class HttpApiClient extends HttpTransport implements ApiClient {
  constructor(baseUrl?: string) {
    super({
      baseUrl: normalizeBaseUrl(baseUrl ?? buildBaseUrl()),
      onUnauthorized: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tasky:unauthorized'));
        }
      },
    });
  }

  loginWithFacebook(accessToken: string): Promise<AuthTokens> {
    return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/facebook',
      {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
      },
    ).then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    }));
  }

  getFacebookAuthStatus(): Promise<{ available: boolean }> {
    return this.requestJson<{ available: boolean }>('/auth/facebook/status', {
      method: 'GET',
    });
  }

  getMyProfile(accessToken: string): Promise<Profile> {
    return this.requestJson<Profile>('/users/me', { method: 'GET' }, accessToken);
  }

  updateMyProfile(
    accessToken: string,
    payload: {
      full_name?: string;
      avatar_url?: string | null;
    },
  ): Promise<Profile> {
    return this.requestJson<Profile>(
      '/users/me',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  getAvatarUploadUrl(
    accessToken: string,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    return this.requestJson<{ upload_url: string; storage_key: string }>(
      '/users/me/avatar/upload-url',
      {
        method: 'POST',
        body: JSON.stringify({ content_type: contentType }),
      },
      accessToken,
    ).then((response) => ({
      uploadUrl: response.upload_url,
      storageKey: response.storage_key,
    }));
  }

  getTaskPhotoUploadUrl(
    accessToken: string,
    taskId: string | null,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const path = taskId ? `/tasks/${taskId}/photos/upload-url` : `/tasks/photos/upload-url`;
    return this.requestJson<{ upload_url: string; storage_key: string }>(
      path,
      {
        method: 'POST',
        body: JSON.stringify({ content_type: contentType }),
      },
      accessToken,
    ).then((response) => ({
      uploadUrl: response.upload_url,
      storageKey: response.storage_key,
    }));
  }

  activateTaskerRole(accessToken: string): Promise<User> {
    return this.requestJson<User>('/users/me/role/tasker', { method: 'POST' }, accessToken);
  }

  listCategories(accessToken: string): Promise<CursorPage<Category>> {
    return this.requestJson<CursorPage<Category>>('/categories', { method: 'GET' }, accessToken, {
      limit: 100,
    });
  }

  createTask(accessToken: string, payload: CreateTaskRequest): Promise<Task> {
    return this.requestJson<Task>(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>> {
    return this.requestJson<CursorPage<PublicTask>>('/tasks', { method: 'GET' }, accessToken, {
      category: filters?.categoryId,
      lat: filters?.lat,
      lng: filters?.lng,
      radius_km: filters?.radiusKm,
      limit: 100,
    });
  }

  listMyTasks(accessToken: string): Promise<CursorPage<Task>> {
    return this.requestJson<CursorPage<Task>>('/tasks/mine', { method: 'GET' }, accessToken, {
      limit: 100,
    });
  }

  applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication> {
    return this.requestJson<TaskApplication>(
      `/tasks/${taskId}/applications`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      },
      accessToken,
    );
  }

  listTaskApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>> {
    return this.requestJson<CursorPage<TaskApplication>>(
      `/tasks/${taskId}/applications`,
      { method: 'GET' },
      accessToken,
      { limit: 100 },
    );
  }

  acceptApplication(
    accessToken: string,
    taskId: string,
    applicationId: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking> {
    return this.requestJson<Booking>(
      `/tasks/${taskId}/applications/${applicationId}/accept`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          liability_disclaimer_accepted: liabilityDisclaimerAccepted,
        }),
      },
      accessToken,
    );
  }

  createBookingIntent(
    accessToken: string,
    taskId: string,
    source: 'REBOOK' | 'INSTANT_MATCH',
    taskerId: string,
    originalBookingId?: string,
    offerId?: string,
  ): Promise<BookingIntent> {
    return this.requestJson<BookingIntent>(
      `/tasks/${taskId}/booking-intents`,
      {
        method: 'POST',
        body: JSON.stringify({
          source,
          tasker_id: taskerId,
          original_booking_id: originalBookingId,
          offer_id: offerId,
        }),
      },
      accessToken,
    );
  }

  confirmBookingIntent(
    accessToken: string,
    bookingIntentId: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking> {
    return this.requestJson<Booking>(
      `/booking-intents/${bookingIntentId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          liability_disclaimer_accepted: liabilityDisclaimerAccepted,
        }),
      },
      accessToken,
    );
  }

  initiatePayment(
    accessToken: string,
    bookingId: string,
    idempotencyKey: string,
  ): Promise<{ paymentUrl: string; qrCode: string }> {
    return this.requestJson<{ payment_url: string; qr_code: string }>(
      `/payments/bookings/${bookingId}/initiate`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          liability_disclaimer_accepted: true,
        }),
      },
      accessToken,
    ).then((response) => ({
      paymentUrl: response.payment_url,
      qrCode: response.qr_code,
    }));
  }

  listBookings(accessToken: string, filters?: BookingFilters): Promise<CursorPage<Booking>> {
    return this.requestJson<CursorPage<Booking>>('/bookings', { method: 'GET' }, accessToken, {
      role: filters?.role,
      status: filters?.status,
      limit: 100,
    });
  }

  getBooking(accessToken: string, bookingId: string): Promise<Booking> {
    return this.requestJson<Booking>(`/bookings/${bookingId}`, { method: 'GET' }, accessToken);
  }

  cancelBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking> {
    return this.requestJson<Booking>(
      `/bookings/${bookingId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
      accessToken,
    );
  }

  completeBooking(
    accessToken: string,
    bookingId: string,
    idempotencyKey: string,
  ): Promise<Booking> {
    return this.requestJson<Booking>(
      `/bookings/${bookingId}/complete`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
      accessToken,
    );
  }

  submitReview(
    accessToken: string,
    bookingId: string,
    payload: {
      quality_rating: number;
      punctuality_rating: number;
      communication_rating: number;
      clarity_rating: number;
      respectfulness_rating: number;
      comment?: string | null;
    },
  ): Promise<Review> {
    return this.requestJson<Review>(
      `/bookings/${bookingId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  getUserReviews(accessToken: string, userId: string): Promise<CursorPage<Review>> {
    return this.requestJson<CursorPage<Review>>(
      `/users/${userId}/reviews`,
      { method: 'GET' },
      accessToken,
      { limit: 100 },
    );
  }

  raiseDispute(
    accessToken: string,
    bookingId: string,
    reason: string,
    idempotencyKey: string,
  ): Promise<Dispute> {
    return this.requestJson<Dispute>(
      `/bookings/${bookingId}/disputes`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ reason }),
      },
      accessToken,
    );
  }

  getDispute(accessToken: string, disputeId: string): Promise<Dispute> {
    return this.requestJson<Dispute>(`/disputes/${disputeId}`, { method: 'GET' }, accessToken);
  }

  listConversations(accessToken: string): Promise<CursorPage<Conversation>> {
    return this.requestJson<CursorPage<Conversation>>(
      '/conversations',
      { method: 'GET' },
      accessToken,
      { limit: 100 },
    );
  }

  listMessages(accessToken: string, conversationId: string): Promise<CursorPage<Message>> {
    return this.requestJson<CursorPage<Message>>(
      `/conversations/${conversationId}/messages`,
      { method: 'GET' },
      accessToken,
      { limit: 100 },
    );
  }

  sendMessage(accessToken: string, conversationId: string, content: string): Promise<Message> {
    return this.requestJson<Message>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      accessToken,
    );
  }

  registerDevice(
    accessToken: string,
    payload: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB' },
  ): Promise<string> {
    return this.requestJson<{ message?: string }>(
      '/notifications/devices',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    ).then((response) => response.message ?? 'Device registered.');
  }

  unregisterDevice(accessToken: string, token: string): Promise<void> {
    return this.requestVoid(
      `/notifications/devices/${encodeURIComponent(token)}`,
      { method: 'DELETE' },
      accessToken,
    );
  }

  devLogin(phone: string, role: 'CUSTOMER' | 'TASKER' | 'ADMIN'): Promise<AuthTokens> {
    return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/dev/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, role }),
      },
    ).then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    }));
  }

  // ─── Verification Methods ─────────────────────────────────────────

  getVerificationUploadUrl(
    accessToken: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    return this.requestJson<{ upload_url: string; storage_key: string }>(
      '/verification/upload-url',
      {
        method: 'POST',
        body: JSON.stringify({ content_type: contentType }),
      },
      accessToken,
    ).then((response) => ({
      uploadUrl: response.upload_url,
      storageKey: response.storage_key,
    }));
  }

  submitVerification(
    accessToken: string,
    payload: {
      id_card_front_key: string;
      id_card_back_key: string;
      consent_policy_version: string;
      consent_accepted: boolean;
    },
  ): Promise<VerificationStatus> {
    return this.requestJson<VerificationStatus>(
      '/verification/submit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  getVerificationStatus(accessToken: string): Promise<VerificationStatus> {
    return this.requestJson<VerificationStatus>(
      '/verification/status',
      { method: 'GET' },
      accessToken,
    );
  }
}

export function createApiClient(baseUrl?: string): ApiClient {
  return new HttpApiClient(baseUrl);
}
