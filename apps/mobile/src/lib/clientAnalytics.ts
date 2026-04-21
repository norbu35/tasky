export type ClientEventName =
  | 'TASK_POSTED'
  | 'APPLICATION_SUBMITTED'
  | 'TASKER_ACCEPTED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_INITIATED'
  | 'BOOKING_COMPLETED'
  | 'DISPUTE_RAISED'
  | 'profile_polish_viewed'
  | 'profile_polish_requested'
  | 'profile_polish_applied'
  | 'profile_polish_rejected';

export type ActorRole = 'CUSTOMER' | 'TASKER' | 'ADMIN' | 'UNKNOWN';
export type ClientPlatform = 'WEB' | 'MOBILE';

export interface ClientAnalyticsEvent {
  event_name: ClientEventName;
  platform: ClientPlatform;
  locale: string;
  actor_role: ActorRole;
  task_id?: string;
  booking_id?: string;
  timestamp: string;
}

export type ClientAnalyticsTracker = (event: ClientAnalyticsEvent) => void;

export interface MemoryClientAnalytics {
  track: ClientAnalyticsTracker;
  getEvents: () => ClientAnalyticsEvent[];
}

export function createMemoryClientAnalyticsTracker(): MemoryClientAnalytics {
  const events: ClientAnalyticsEvent[] = [];
  return {
    track: (event) => {
      events.push(event);
    },
    getEvents: () => [...events],
  };
}

export function createConsoleClientAnalyticsTracker(): ClientAnalyticsTracker {
  return (event) => {
    // Keep payload logging deterministic for local observability and test/debug parity.

    if (__DEV__) {
      console.info('CLIENT_ANALYTICS event=%s payload=%o', event.event_name, event);
    }
  };
}

export function resolveClientLocale(explicitLocale?: string): string {
  if (typeof explicitLocale === 'string' && explicitLocale.trim().length > 0) {
    return explicitLocale;
  }
  return 'mn-MN';
}
