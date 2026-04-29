import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Produces a loggable label from a query key without leaking secrets.
 *
 * Query keys embed the raw access token (a JWT) as a collision-avoidance
 * segment.  Logging the full key via `query.queryHash` would print the JWT
 * to console/logcat — a credential leak on shared or compromised devices.
 *
 * This helper extracts the **domain prefix** (first array element) and the
 * last element (usually a human-readable ID or filter object) while
 * redacting any string segment that resembles a JWT.
 */
function safeQueryLabel(key: unknown): string {
  if (!Array.isArray(key) || key.length === 0) return 'unknown';

  const redacted = key.map((segment) => {
    if (typeof segment === 'string' && segment.startsWith('eyJ')) return '[token]';
    return segment;
  });

  return JSON.stringify(redacted);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (__DEV__) {
        console.error(`[React Query Error] Query ${safeQueryLabel(query.queryKey)} failed:`, error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, _mutation) => {
      if (__DEV__) {
        console.error(`[React Query Error] Mutation failed:`, error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: isTestEnvironment ? false : 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: isTestEnvironment ? Infinity : undefined,
    },
    mutations: {
      retry: isTestEnvironment ? false : 0,
      gcTime: isTestEnvironment ? Infinity : undefined,
    },
  },
});
