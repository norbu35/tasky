import type {
    AuthTokens,
    Booking,
    Category,
    Conversation,
    Dispute,
    Message,
    Profile,
    Review,
    User
} from "../../src/lib/apiClient";

export function localDateTimeInput(hoursAhead: number): string {
    const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const baseUser = {
    id: "user-1",
    phone: "+97699001122",
    facebook_id: "fb-user-1",
    role: "CUSTOMER",
    status: "PENDING",
    created_at: "2026-02-14T00:00:00Z"
} as any as User;

export const baseProfile = {
    id: "user-1",
    phone: "+97699001122",
    role: "CUSTOMER",
    status: "PENDING",
    full_name: "Test Customer",
    avatar_url: null,
    rating_avg: 0,
    completed_tasks: 0,
    is_pro: false,
    created_at: "2026-02-14T00:00:00Z"
} as any as Profile;

export const baseSession = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: baseUser
} as any as AuthTokens;

export const baseCategory = {
    id: "cat-cleaning",
    name: "Cleaning",
    name_mn: "Цэвэрлэгээ",
    icon_url: "https://example.test/icon.png",
    is_active: true,
    sort_order: 1
} as any as Category;

export const baseBooking = {
    id: "booking-1",
    task_id: "task-1",
    tasker_id: "tasker-1",
    customer_id: "customer-1",
    price: 120000,
    status: "ASSIGNED",
    cancellation_fee: null,
    created_at: "2026-02-14T00:00:00Z"
} as any as Booking;

export const baseReview = {
    id: "review-1",
    booking_id: "booking-1",
    reviewer_id: "customer-1",
    reviewee_id: "tasker-1",
    rating: 5,
    comment: "Great work",
    created_at: "2026-02-14T00:00:00Z"
} as any as Review;

export const baseDispute = {
    id: "dispute-1",
    booking_id: "booking-1",
    raised_by: "customer-1",
    reason: "Service quality issue",
    status: "OPEN",
    resolution: null,
    resolution_amount: null,
    resolution_notes: null,
    created_at: "2026-02-14T00:00:00Z",
    resolved_at: null
} as any as Dispute;

export const baseMessage = {
    id: "msg-1",
    conversation_id: "conv-1",
    sender_id: "customer-1",
    content: "Hello tasker",
    created_at: "2026-02-14T00:00:00Z"
} as any as Message;

export const baseConversation = {
    id: "conv-1",
    task_id: "task-1",
    task_title: "Apartment cleaning",
    customer_id: "customer-1",
    tasker_id: "tasker-1",
    last_message: baseMessage,
    unread_count: 0,
    created_at: "2026-02-14T00:00:00Z"
} as any as Conversation;
