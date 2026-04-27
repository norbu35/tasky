import type {
  User,
  PublicTask,
  Booking,
  Dispute,
  VerificationDetail,
  FeatureToggle,
  CursorPage,
  Category,
  Profile,
  AuthTokens,
  Review,
  Message,
  Conversation,
} from '../lib/apiClient';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    phone: '+97699001122',
    facebook_id: null,
    primary_auth: 'FACEBOOK',
    role: 'CUSTOMER',
    status: 'VERIFIED',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    phone: '+97699001122',
    role: 'CUSTOMER',
    status: 'PENDING',
    full_name: 'Test Customer',
    avatar_url: null,
    rating_avg: 0,
    completed_tasks: 0,
    is_pro: false,
    created_at: new Date().toISOString(),
    ...overrides,
  } as Profile;
}

export function makeSession(overrides: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: makeUser(),
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: '',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    assisted_distribution_enabled: false,
    intake_schema_version: 0,
    ...overrides,
  };
}

export function makeTask(overrides: Partial<PublicTask> = {}): PublicTask {
  return {
    id: 'task-1',
    category: makeCategory(),
    customer: { id: 'cust-1', full_name: 'Customer One', avatar_url: null, rating_avg: 4.5 },
    description: 'Clean my apartment',
    budget: 50000,
    approximate_location: 'Ulaanbaatar',
    status: 'OPEN',
    scheduled_at: new Date().toISOString(),
    photo_urls: [],
    application_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    task_id: 'task-1',
    tasker_id: 'tasker-1',
    customer_id: 'cust-1',
    price: 50000,
    status: 'ASSIGNED',
    confirmed_scheduled_at: new Date().toISOString(),
    liability_disclaimer_accepted: true,
    created_at: new Date().toISOString(),
    ...overrides,
  } as Booking;
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    booking_id: 'booking-1',
    reviewer_id: 'customer-1',
    reviewee_id: 'tasker-1',
    quality_rating: 5,
    punctuality_rating: 5,
    communication_rating: 5,
    clarity_rating: 5,
    respectfulness_rating: 5,
    comment: 'Great work',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: 'd-1',
    booking_id: 'b-1',
    raised_by: 'u-1',
    reason: 'Issue',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'customer-1',
    content: 'Hello tasker',
    sent_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-1',
    task_id: 'task-1',
    task_title: 'Apartment cleaning',
    counterparty_id: 'customer-1',
    counterparty_name: 'Customer One',
    last_message_content: 'Hello tasker',
    unread_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeFeatureToggle(overrides: Partial<FeatureToggle> = {}): FeatureToggle {
  return {
    feature_name: 'test_feature',
    is_enabled: true,
    updated_by: 'admin@tasky.mn',
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeVerification(overrides: Partial<VerificationDetail> = {}): VerificationDetail {
  return {
    id: 'v-1',
    user_id: 'u-1',
    user_phone: '+97699001122',
    user_name: 'Test User',
    id_card_front_url: 'https://cdn.example.test/id-front.jpg',
    id_card_back_url: 'https://cdn.example.test/id-back.jpg',
    selfie_url: 'https://cdn.example.test/selfie.jpg',
    status: 'PENDING',
    admin_notes: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    ...overrides,
  };
}

export function makeCursorPage<T>(data: T[], has_more = false): CursorPage<T> {
  return {
    data,
    cursor: { next: has_more ? 'token' : null, has_more },
  };
}

export function localDateTimeInput(addHours = 24) {
  const d = new Date();
  d.setHours(d.getHours() + addHours);
  return d.toISOString().slice(0, 16);
}
