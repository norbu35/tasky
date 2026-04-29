/**
 * React Query key factory. Prevents key collisions across feature domains.
 *
 * Keys use a non-sensitive user identifier (`uid`) rather than the raw access
 * token.  This keeps the JWT out of the React Query cache, the query hash,
 * and any downstream logging.  The `uid` must still uniquely identify a
 * session scope so that re-auth as a different user invalidates stale cache.
 */

export const queryKeys = {
  // ── Auth / Profile ──────────────────────────────────────────────
  me: {
    all: (uid: string) => ['me', uid] as const,
  },

  // ── Tasks ───────────────────────────────────────────────────────
  tasks: {
    all: (uid: string) => ['tasks', uid] as const,
    feed: (uid: string, filters?: Record<string, unknown>) =>
      ['tasks', 'feed', uid, filters ?? {}] as const,
    my: (uid: string) => ['myTasks', uid] as const,
    detail: (uid: string, taskId: string) => ['tasks', 'detail', uid, taskId] as const,
    categories: (uid: string) => ['categories', uid] as const,
    applications: (uid: string, taskId: string) => ['applications', uid, taskId] as const,
    recentLocations: (uid: string) => ['recentLocations', uid] as const,
  },

  // ── Bookings ────────────────────────────────────────────────────
  bookings: {
    all: (uid: string, filters?: Record<string, string | undefined>) =>
      ['bookings', uid, filters] as const,
    detail: (uid: string, bookingId: string) => ['booking', uid, bookingId] as const,
    timeline: (uid: string, bookingId: string) => ['bookingTimeline', uid, bookingId] as const,
  },

  // ── Chat ────────────────────────────────────────────────────────
  chat: {
    conversations: (uid: string) => ['conversations', uid] as const,
    messages: (uid: string, conversationId: string) => ['messages', uid, conversationId] as const,
    unreadCount: (uid: string) => ['unreadCount', uid] as const,
  },

  // ── Reviews ─────────────────────────────────────────────────────
  reviews: {
    pending: (uid: string) => ['pendingReviews', uid] as const,
    user: (uid: string, userId: string) => ['userReviews', uid, userId] as const,
  },

  // ── Verification ────────────────────────────────────────────────
  verification: {
    status: (uid: string) => ['verificationStatus', uid] as const,
  },

  // ── Profile ─────────────────────────────────────────────────────
  profile: {
    stats: (uid: string) => ['myStats', uid] as const,
  },

  // ── Notifications ───────────────────────────────────────────────
  notifications: {
    list: (uid: string) => ['notifications', uid] as const,
  },

  // ── Disputes ────────────────────────────────────────────────────
  disputes: {
    all: (uid: string) => ['disputes', uid] as const,
    detail: (uid: string, disputeId: string) => ['dispute', uid, disputeId] as const,
  },
} as const;
