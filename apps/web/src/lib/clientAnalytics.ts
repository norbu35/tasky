export type ClientEventName =
  | 'TASK_POSTED'
  | 'APPLICATION_SUBMITTED'
  | 'TASKER_ACCEPTED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_INITIATED'
  | 'BOOKING_COMPLETED'
  | 'DISPUTE_RAISED'
  | 'ERROR_LOGGED';

export type ActorRole = 'CUSTOMER' | 'TASKER' | 'ADMIN' | 'UNKNOWN';
export type ClientPlatform = 'WEB' | 'MOBILE';

export interface ClientAnalyticsEvent {
  event_name: ClientEventName;
  platform: ClientPlatform;
  locale: string;
  actor_role: ActorRole;
  task_id?: string;
  booking_id?: string;
  error_message?: string;
  error_stack?: string;
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
    if (import.meta.env.DEV) {
      console.info('CLIENT_ANALYTICS event=%s payload=%o', event.event_name, event);
    }
  };
}

export function resolveClientLocale(explicitLocale?: string): string {
  if (typeof explicitLocale === 'string' && explicitLocale.trim().length > 0) {
    return explicitLocale;
  }
  if (typeof navigator !== 'undefined' && navigator.language.length > 0) {
    return navigator.language;
  }
  return 'mn-MN';
}
