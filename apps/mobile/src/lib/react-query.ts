import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[React Query Error] Query [${query.queryHash}] failed:`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error(`[React Query Error] Mutation failed:`, error);
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
