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
export type BookingScheduleEvent = components['schemas']['BookingScheduleEvent'];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CursorPage<T> {
  data: T[];
  cursor: {
    next: string | null;
    prev: string | null;
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

export interface ProfilePolishPreviewPayload {
  bio: string;
  tone: 'friendly' | 'professional' | 'concise';
}

export interface MobileApiClient {
  requestOtp(phone: string): Promise<string>;

  verifyOtp(phone: string, code: string): Promise<AuthTokens>;

  devLogin(phone: string, role: 'CUSTOMER' | 'TASKER'): Promise<AuthTokens>;

  getMyProfile(accessToken: string): Promise<Profile>;

  getPublicProfile(accessToken: string, userId: string): Promise<Profile>;

  updateMyProfile(
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string | null; bio?: string },
  ): Promise<Profile>;

  getProfilePolishPreview(
    accessToken: string,
    payload: ProfilePolishPreviewPayload,
  ): Promise<{ suggested_bio: string }>;

  getAvatarUploadUrl(
    accessToken: string,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp',
  ): Promise<{ uploadUrl: string; storageKey: string }>;

  activateTaskerRole(accessToken: string): Promise<User>;

  listCategories(accessToken: string): Promise<CursorPage<Category>>;

  createTask(
    accessToken: string,
    payload: CreateTaskRequest,
  ): Promise<Task>;

  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>>;

  applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication>;

  listApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>>;

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

  rescheduleBooking(
    accessToken: string,
    bookingId: string,
    payload: { proposed_scheduled_at: string; reason?: string },
    idempotencyKey: string,
  ): Promise<BookingScheduleEvent>;

  submitReview(
    accessToken: string,
    bookingId: string,
    payload: {
      quality_rating?: number;
      punctuality_rating?: number;
      communication_rating?: number;
      clarity_rating?: number;
      respectfulness_rating?: number;
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

  getVerificationStatus(accessToken: string): Promise<{
    status: string;
    admin_notes?: string;
    submitted_at?: string;
  }>;

  getVerificationUploadUrl(
    accessToken: string,
    payload: { content_type: string; document_side: 'FRONT' | 'BACK' | 'SELFIE' },
  ): Promise<{ upload_url: string; storage_key: string }>;

  submitVerification(
    accessToken: string,
    payload: { id_card_front_key: string; id_card_back_key: string; selfie_key: string },
  ): Promise<void>;

  flagNoShow(accessToken: string, bookingId: string): Promise<void>;

  deleteMyAccount(accessToken: string): Promise<void>;

  getMyStats(accessToken: string): Promise<{
    jobs_completed: number;
    average_rating: number;
    response_time_minutes: number;
    reliability_score: number;
  }>;

  listMyTasks(accessToken: string): Promise<CursorPage<Task>>;

  markBookingDone(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;

  getBookingTimeline(
    accessToken: string,
    bookingId: string,
  ): Promise<
    {
      event: string;
      timestamp: string;
      actor: string;
    }[]
  >;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const API_PATH_PREFIX = '/api/v1';

function normalizeBaseUrl(rawBaseUrl: string): string {
  const parsed = new URL(rawBaseUrl.trim());
  const normalizedPath = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname =
    normalizedPath === '' || normalizedPath === '/' ? API_PATH_PREFIX : normalizedPath;
  return parsed.toString();
}

function resolveApiUrl(baseUrl: string, path: string): URL {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(relativePath, normalizedBase);
}

export function buildBaseUrl(): string {
  const maybeGlobal = globalThis as { __TASKY_API_BASE_URL__?: string };
  if (
    typeof maybeGlobal.__TASKY_API_BASE_URL__ === 'string' &&
    maybeGlobal.__TASKY_API_BASE_URL__
  ) {
    return normalizeBaseUrl(maybeGlobal.__TASKY_API_BASE_URL__);
  }
  return normalizeBaseUrl('http://localhost:8080');
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
  } catch {
    // Fall back to generic response message.
  }
  return `Request failed with status ${response.status}`;
}

export class HttpMobileApiClient implements MobileApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = buildBaseUrl()) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  async requestOtp(phone: string): Promise<string> {
    const response = await this.requestJson<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return response.message;
  }

  verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      },
    ).then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    }));
  }

  devLogin(phone: string, role: 'CUSTOMER' | 'TASKER'): Promise<AuthTokens> {
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

  getMyProfile(accessToken: string): Promise<Profile> {
    return this.requestJson<Profile>('/users/me', { method: 'GET' }, accessToken);
  }

  getPublicProfile(accessToken: string, userId: string): Promise<Profile> {
    return this.requestJson<Profile>(`/users/${userId}`, { method: 'GET' }, accessToken);
  }

  updateMyProfile(
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string | null; bio?: string },
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

  getProfilePolishPreview(
    accessToken: string,
    payload: ProfilePolishPreviewPayload,
  ): Promise<{ suggested_bio: string }> {
    return this.requestJson<{
      suggested_bio?: string;
      suggestion?: string;
      preview?: string;
      bio?: string;
    }>(
      '/users/me/profile-polish-preview',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    ).then((response) => ({
      suggested_bio:
        response.suggested_bio ?? response.suggestion ?? response.preview ?? response.bio ?? '',
    }));
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

  activateTaskerRole(accessToken: string): Promise<User> {
    return this.requestJson<User>('/users/me/role/tasker', { method: 'POST' }, accessToken);
  }

  listCategories(accessToken: string): Promise<CursorPage<Category>> {
    return this.requestJson<CursorPage<Category>>('/categories', { method: 'GET' }, accessToken, {
      limit: 100,
    });
  }

  createTask(
    accessToken: string,
    payload: CreateTaskRequest,
  ): Promise<Task> {
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

  listApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>> {
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

  rescheduleBooking(
    accessToken: string,
    bookingId: string,
    payload: { proposed_scheduled_at: string; reason?: string },
    idempotencyKey: string,
  ): Promise<BookingScheduleEvent> {
    return this.requestJson<BookingScheduleEvent>(
      `/bookings/${bookingId}/reschedule`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  submitReview(
    accessToken: string,
    bookingId: string,
    payload: {
      quality_rating?: number;
      punctuality_rating?: number;
      communication_rating?: number;
      clarity_rating?: number;
      respectfulness_rating?: number;
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

  getVerificationStatus(accessToken: string): Promise<{
    status: string;
    admin_notes?: string;
    submitted_at?: string;
  }> {
    return this.requestJson<{ status: string; admin_notes?: string; submitted_at?: string }>(
      '/verification/status',
      { method: 'GET' },
      accessToken,
    );
  }

  getVerificationUploadUrl(
    accessToken: string,
    payload: { content_type: string; document_side: 'FRONT' | 'BACK' | 'SELFIE' },
  ): Promise<{ upload_url: string; storage_key: string }> {
    return this.requestJson<{ upload_url: string; storage_key: string }>(
      '/verification/upload-url',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  submitVerification(
    accessToken: string,
    payload: { id_card_front_key: string; id_card_back_key: string; selfie_key: string },
  ): Promise<void> {
    return this.requestVoid(
      '/verification/submit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  flagNoShow(accessToken: string, bookingId: string): Promise<void> {
    return this.requestVoid(`/bookings/${bookingId}/no-show`, { method: 'POST' }, accessToken);
  }

  deleteMyAccount(accessToken: string): Promise<void> {
    return this.requestVoid('/users/me', { method: 'DELETE' }, accessToken);
  }

  getMyStats(accessToken: string): Promise<{
    jobs_completed: number;
    average_rating: number;
    response_time_minutes: number;
    reliability_score: number;
  }> {
    return this.requestJson<{
      jobs_completed: number;
      average_rating: number;
      response_time_minutes: number;
      reliability_score: number;
    }>('/users/me/stats', { method: 'GET' }, accessToken);
  }

  listMyTasks(accessToken: string): Promise<CursorPage<Task>> {
    return this.requestJson<CursorPage<Task>>('/tasks/mine', { method: 'GET' }, accessToken, {
      limit: 100,
    });
  }

  markBookingDone(
    accessToken: string,
    bookingId: string,
    idempotencyKey: string,
  ): Promise<Booking> {
    return this.requestJson<Booking>(
      `/bookings/${bookingId}/mark-done`,
      {
        method: 'PUT',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
      accessToken,
    );
  }

  getBookingTimeline(
    accessToken: string,
    bookingId: string,
  ): Promise<
    {
      event: string;
      timestamp: string;
      actor: string;
    }[]
  > {
    return this.requestJson<{ event: string; timestamp: string; actor: string }[]>(
      `/bookings/${bookingId}/timeline`,
      { method: 'GET' },
      accessToken,
    );
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
    accessToken?: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = resolveApiUrl(this.baseUrl, path);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...init,
        headers,
      });
    } catch (err) {
      console.error(`[ApiClient Error] Network failure fetching ${init.method || 'GET'} ${url.toString()}:`, err);
      throw err;
    }

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      console.error(`[ApiClient Error] ${init.method || 'GET'} ${url.toString()} failed with status ${response.status}: ${errorMessage}`);
      throw new ApiError(response.status, errorMessage);
    }

    return (await response.json()) as T;
  }

  private async requestVoid(path: string, init: RequestInit, accessToken?: string): Promise<void> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = resolveApiUrl(this.baseUrl, path).toString();

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers,
      });
    } catch (err) {
      console.error(`[ApiClient Error] Network failure fetching ${init.method || 'GET'} ${url}:`, err);
      throw err;
    }

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      console.error(`[ApiClient Error] ${init.method || 'GET'} ${url} failed with status ${response.status}: ${errorMessage}`);
      throw new ApiError(response.status, errorMessage);
    }
  }
}

export function createMobileApiClient(baseUrl?: string): MobileApiClient {
  return new HttpMobileApiClient(baseUrl);
}
