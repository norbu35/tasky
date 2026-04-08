import { vi } from 'vitest';
import type { ApiClient } from '../../src/lib/apiClient';
import {
  baseBooking,
  baseCategory,
  baseConversation,
  baseDispute,
  baseMessage,
  baseProfile,
  baseReview,
  baseSession,
  baseUser,
} from './mockData';

export function buildApiClientMock(overrides: Partial<ApiClient> = {}): ApiClient {
  const mock: ApiClient = {
    loginWithFacebook: vi.fn().mockResolvedValue(baseSession),
    getMyProfile: vi.fn().mockResolvedValue(baseProfile),
    updateMyProfile: vi.fn().mockImplementation(async (_token, payload) => ({
      ...baseProfile,
      full_name: payload.full_name ?? baseProfile.full_name,
      avatar_url: payload.avatar_url ?? baseProfile.avatar_url,
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
      ...baseUser,
      role: 'TASKER',
      status: 'PENDING',
    }),
    listCategories: vi.fn().mockResolvedValue({
      data: [baseCategory],
      cursor: { next: null, has_more: false },
    }),
    createTask: vi.fn().mockResolvedValue({
      id: 'task-1',
      category_id: baseCategory.id,
      customer_id: baseUser.id,
      description: 'Apartment cleaning',
      budget: 85000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: 'Exact location',
      status: 'OPEN',
      scheduled_at: '2026-02-15T00:00:00Z',
      photos: [],
      created_at: '2026-02-14T00:00:00Z',
    }),
    listTasks: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'public-task-1',
          category: baseCategory,
          customer: {
            id: 'customer-1',
            full_name: 'Customer',
            avatar_url: null,
            rating_avg: 4.5,
          },
          description: 'Window cleaning',
          budget: 65000,
          approximate_location: 'Сүхбаатар дүүрэг',
          approximate_lat: 47.92,
          approximate_lng: 106.92,
          status: 'OPEN',
          scheduled_at: '2026-02-15T00:00:00Z',
          photo_urls: [],
          application_count: 0,
          created_at: '2026-02-14T00:00:00Z',
        },
      ],
      cursor: { next: null, has_more: false },
    }),
    listMyTasks: vi.fn().mockResolvedValue({
      data: [],
      cursor: { next: null, has_more: false },
    }),
    applyToTask: vi.fn().mockResolvedValue({
      id: 'app-1',
      task_id: 'public-task-1',
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
    listTaskApplications: vi.fn().mockResolvedValue({
      data: [],
      cursor: { next: null, has_more: false },
    }),
    acceptApplication: vi.fn().mockResolvedValue(baseBooking),
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
    confirmBookingIntent: vi.fn().mockResolvedValue(baseBooking),
    initiatePayment: vi.fn().mockResolvedValue({
      paymentUrl: 'https://qpay.example.test/pay/booking-1',
      qrCode: 'BASE64-QR',
    }),
    listBookings: vi.fn().mockResolvedValue({
      data: [baseBooking],
      cursor: { next: null, has_more: false },
    }),
    getBooking: vi.fn().mockResolvedValue(baseBooking),
    cancelBooking: vi.fn().mockResolvedValue({
      ...baseBooking,
      status: 'CANCELLED',
    }),
    completeBooking: vi.fn().mockResolvedValue({
      ...baseBooking,
      status: 'COMPLETED',
    }),
    submitReview: vi.fn().mockResolvedValue(baseReview),
    getUserReviews: vi.fn().mockResolvedValue({
      data: [baseReview],
      cursor: { next: null, has_more: false },
    }),
    raiseDispute: vi.fn().mockResolvedValue(baseDispute),
    getDispute: vi.fn().mockResolvedValue(baseDispute),
    listConversations: vi.fn().mockResolvedValue({
      data: [baseConversation],
      cursor: { next: null, has_more: false },
    }),
    listMessages: vi.fn().mockResolvedValue({
      data: [baseMessage],
      cursor: { next: null, has_more: false },
    }),
    sendMessage: vi.fn().mockResolvedValue({
      ...baseMessage,
      id: 'msg-2',
      content: 'Status update',
    }),
    registerDevice: vi.fn().mockResolvedValue('Device registered.'),
    unregisterDevice: vi.fn().mockResolvedValue(undefined),
    devLogin: vi.fn().mockResolvedValue(baseSession),

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

    // Admin methods
    adminSearchUsers: vi.fn().mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminBanUser: vi.fn().mockResolvedValue(baseUser),
    adminUnbanUser: vi.fn().mockResolvedValue(baseUser),
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
    adminListDisputes: vi.fn().mockResolvedValue({ data: [], cursor: { next: null, has_more: false } }),
    adminGetDispute: vi.fn().mockResolvedValue({
      dispute: baseDispute,
      booking: baseBooking,
      conversation_id: null,
      evidence_messages: [],
    }),
    adminResolveDispute: vi.fn().mockResolvedValue(baseDispute),
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
    adminConciergeAssignTask: vi.fn().mockResolvedValue(baseBooking),
    adminListCategories: vi
      .fn()
      .mockResolvedValue({ data: [baseCategory], cursor: { next: null, has_more: false } }),
    adminCreateCategory: vi.fn().mockResolvedValue(baseCategory),
    adminUpdateCategory: vi.fn().mockResolvedValue(baseCategory),
    adminListCategorySchemas: vi.fn().mockResolvedValue({ data: [] }),
    adminCreateCategorySchema: vi.fn().mockResolvedValue({ version: 1, status: 'DRAFT' }),
    adminActivateCategorySchema: vi.fn().mockResolvedValue({ version: 1, status: 'ACTIVE' }),
  };

  return { ...mock, ...overrides };
}
