/**
 * React Query key factory. Prevents key collisions across feature domains.
 */

export const queryKeys = {
  // ── Auth / Profile ──────────────────────────────────────────────
  me: {
    all: (token: string) => ['me', token] as const,
  },

  // ── Tasks ───────────────────────────────────────────────────────
  tasks: {
    all: (token: string) => ['tasks', token] as const,
    feed: (token: string, filters?: Record<string, unknown>) =>
      ['tasks', 'feed', token, filters ?? {}] as const,
    my: (token: string) => ['myTasks', token] as const,
    detail: (token: string, taskId: string) => ['tasks', 'detail', token, taskId] as const,
    categories: (token: string) => ['categories', token] as const,
    applications: (token: string, taskId: string) => ['applications', token, taskId] as const,
    recentLocations: (token: string) => ['recentLocations', token] as const,
  },

  // ── Bookings ────────────────────────────────────────────────────
  bookings: {
    all: (token: string, filters?: Record<string, string | undefined>) =>
      ['bookings', token, filters] as const,
    detail: (token: string, bookingId: string) => ['booking', token, bookingId] as const,
    timeline: (token: string, bookingId: string) => ['bookingTimeline', token, bookingId] as const,
  },

  // ── Chat ────────────────────────────────────────────────────────
  chat: {
    conversations: (token: string) => ['conversations', token] as const,
    messages: (token: string, conversationId: string) =>
      ['messages', token, conversationId] as const,
    unreadCount: (token: string) => ['unreadCount', token] as const,
  },

  // ── Reviews ─────────────────────────────────────────────────────
  reviews: {
    pending: (token: string) => ['pendingReviews', token] as const,
    user: (token: string, userId: string) => ['userReviews', token, userId] as const,
  },

  // ── Verification ────────────────────────────────────────────────
  verification: {
    status: (token: string) => ['verificationStatus', token] as const,
  },

  // ── Profile ─────────────────────────────────────────────────────
  profile: {
    stats: (token: string) => ['myStats', token] as const,
  },

  // ── Notifications ───────────────────────────────────────────────
  notifications: {
    list: (token: string) => ['notifications', token] as const,
  },

  // ── Disputes ────────────────────────────────────────────────────
  disputes: {
    all: (token: string) => ['disputes', token] as const,
    detail: (token: string, disputeId: string) => ['dispute', token, disputeId] as const,
  },
} as const;
