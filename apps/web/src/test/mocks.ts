import { vi } from 'vitest';

import type { AdminApiClient } from '../lib/adminApiClient';
import type { ApiClient } from '../lib/apiClient';

import {
  makeUser,
  makeProfile,
  makeSession,
  makeCategory,
  makeBooking,
  makeReview,
  makeDispute,
  makeMessage,
  makeConversation,
  makeTask,
  makeCursorPage,
} from './factories';

export function createMockApiClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    loginWithFacebook: vi.fn().mockResolvedValue(makeSession()),
    getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
    updateMyProfile: vi.fn().mockImplementation(async (_token, payload) => ({
      ...makeProfile(),
      full_name: payload.full_name ?? 'Updated Name',
      avatar_url: payload.avatar_url ?? null,
    })),
    getAvatarUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: 'https://upload.example.test/avatar',
      storageKey: 'uploads/avatars/avatar-1.png',
    }),
    getTaskPhotoUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: 'https://upload.example.test/task-photo',
      storageKey: 'uploads/tasks/task-1-photo-1.png',
    }),
    activateTaskerRole: vi.fn().mockResolvedValue({
      ...makeUser(),
      role: 'TASKER',
      status: 'PENDING',
    }),
    listCategories: vi.fn().mockResolvedValue(makeCursorPage([makeCategory()])),
    createTask: vi.fn().mockResolvedValue(makeTask()),
    listTasks: vi.fn().mockResolvedValue(makeCursorPage([makeTask()])),
    listMyTasks: vi.fn().mockResolvedValue(makeCursorPage([])),
    applyToTask: vi.fn().mockResolvedValue({
      id: 'app-1',
      task_id: 'task-1',
      tasker: {
        id: 'tasker-1',
        full_name: 'Tasker',
        avatar_url: null,
        rating_avg: 4.6,
        completed_tasks: 7,
        is_pro: true,
      },
      message: 'I can do this task tomorrow morning.',
      status: 'PENDING',
      created_at: '2026-02-14T00:00:00Z',
    }),
    listTaskApplications: vi.fn().mockResolvedValue(makeCursorPage([])),
    acceptApplication: vi.fn().mockResolvedValue(makeBooking()),
    createBookingIntent: vi.fn().mockResolvedValue({
      id: 'intent-1',
      task_id: 'task-1',
      tasker_id: 'tasker-1',
      customer_id: 'customer-1',
      source: 'REBOOK',
      status: 'PENDING',
      original_booking_id: 'booking-1',
      offer_id: null,
      expires_at: null,
      confirmed_booking_id: null,
      confirmed_at: null,
      created_at: '2026-02-14T00:00:00Z',
      updated_at: '2026-02-14T00:00:00Z',
    }),
    confirmBookingIntent: vi.fn().mockResolvedValue(makeBooking()),
    initiatePayment: vi.fn().mockResolvedValue({
      paymentUrl: 'https://qpay.example.test/pay/booking-1',
      qrCode: 'BASE64-QR',
    }),
    listBookings: vi.fn().mockResolvedValue(makeCursorPage([makeBooking()])),
    getBooking: vi.fn().mockResolvedValue(makeBooking()),
    cancelBooking: vi.fn().mockResolvedValue({
      ...makeBooking(),
      status: 'CANCELLED',
    }),
    completeBooking: vi.fn().mockResolvedValue({
      ...makeBooking(),
      status: 'COMPLETED',
    }),
    submitReview: vi.fn().mockResolvedValue(makeReview()),
    getUserReviews: vi.fn().mockResolvedValue(makeCursorPage([makeReview()])),
    raiseDispute: vi.fn().mockResolvedValue(makeDispute()),
    getDispute: vi.fn().mockResolvedValue(makeDispute()),
    listConversations: vi.fn().mockResolvedValue(makeCursorPage([makeConversation()])),
    listMessages: vi.fn().mockResolvedValue(makeCursorPage([makeMessage()])),
    sendMessage: vi.fn().mockResolvedValue({
      ...makeMessage(),
      id: 'msg-2',
      content: 'Status update',
    }),
    registerDevice: vi.fn().mockResolvedValue('Device registered.'),
    unregisterDevice: vi.fn().mockResolvedValue(undefined),
    devLogin: vi.fn().mockResolvedValue(makeSession()),

    // Verification methods
    getVerificationUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: 'https://upload.example.test/verification',
      storageKey: 'uploads/verifications/v-1.png',
    }),
    submitVerification: vi.fn().mockResolvedValue({
      status: 'PENDING',
      admin_notes: null,
      submitted_at: '2026-01-01T00:00:00Z',
      reviewed_at: null,
    }),
    getVerificationStatus: vi.fn().mockResolvedValue({
      status: 'NOT_SUBMITTED',
      admin_notes: null,
      submitted_at: null,
      reviewed_at: null,
    }),
    ...overrides,
  } as unknown as ApiClient;
}

export function createMockAdminApiClient(overrides: Partial<AdminApiClient> = {}): AdminApiClient {
  return {
    adminSearchUsers: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminBanUser: vi.fn().mockResolvedValue(makeUser()),
    adminUnbanUser: vi.fn().mockResolvedValue(makeUser()),
    adminListFlaggedMessages: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminListPendingVerifications: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminApproveVerification: vi.fn().mockResolvedValue({
      id: 'v-1',
      user_id: 'u-1',
      status: 'APPROVED',
      submitted_at: '2026-01-01T00:00:00Z',
    }),
    adminRejectVerification: vi.fn().mockResolvedValue({
      id: 'v-1',
      user_id: 'u-1',
      status: 'REJECTED',
      submitted_at: '2026-01-01T00:00:00Z',
    }),
    adminListDisputes: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminGetDispute: vi.fn().mockResolvedValue({
      dispute: makeDispute(),
      booking: makeBooking(),
      conversation_id: null,
      evidence_messages: [],
    }),
    adminResolveDispute: vi.fn().mockResolvedValue(makeDispute()),
    adminGetStrikePolicy: vi.fn().mockResolvedValue({
      strikeWindowDays: 30,
      strikeThreshold: 3,
      firstSuspensionDays: 7,
      repeatSuspensionDays: 30,
      repeatOffenseWindowDays: 90,
      autoUnsuspendEnabled: true,
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    adminUpdateStrikePolicy: vi.fn().mockResolvedValue({
      strikeWindowDays: 30,
      strikeThreshold: 3,
      firstSuspensionDays: 7,
      repeatSuspensionDays: 30,
      repeatOffenseWindowDays: 90,
      autoUnsuspendEnabled: true,
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    adminListPendingPayouts: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminProcessPayout: vi.fn().mockResolvedValue({
      id: 'payout-1',
      user_id: 'user-1',
      amount: 50000,
      bank_name: 'Khan Bank',
      bank_account: '1234567890',
      status: 'PROCESSED',
      created_at: '2026-01-01T00:00:00Z',
      processed_at: '2026-01-02T00:00:00Z',
    }),
    adminListLeadUnlockPrices: vi
      .fn()
      .mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminCreateLeadUnlockPrice: vi.fn().mockResolvedValue({
      id: 'price-1',
      category_id: 'cat-1',
      district_id: 'dist-1',
      credits_required: 100,
      effective_from: '2026-01-01T00:00:00Z',
      effective_to: null,
    }),
    adminListFeatureToggles: vi.fn().mockResolvedValue({ data: [] }),
    adminUpdateFeatureToggle: vi.fn().mockResolvedValue({
      feature_name: 'lead_fee_enabled',
      is_enabled: false,
      updated_by: null,
      updated_at: '2026-01-01T00:00:00Z',
    }),
    adminConciergeAssignTask: vi.fn().mockResolvedValue(makeBooking()),
    adminListCategories: vi
      .fn()
      .mockResolvedValue({ data: [makeCategory()], cursor: { next: null, has_more: false } }),
    adminCreateCategory: vi.fn().mockResolvedValue(makeCategory()),
    adminUpdateCategory: vi.fn().mockResolvedValue(makeCategory()),
    adminListCategorySchemas: vi.fn().mockResolvedValue({ data: [] }),
    adminCreateCategorySchema: vi.fn().mockResolvedValue({ version: 1, status: 'DRAFT' }),
    adminActivateCategorySchema: vi.fn().mockResolvedValue({ version: 1, status: 'ACTIVE' }),
    ...overrides,
  } as unknown as AdminApiClient;
}

export function mockCryptoUUID(value = 'test-uuid-1234') {
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => value),
  });
}
