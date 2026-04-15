import { useQuery } from '@tanstack/react-query';

import type { components } from '@tasky/sdk';

import type { CursorPage } from './useTasks';

export type Category = components['schemas']['Category'];

export interface CategoryApiClient {
  listCategories(accessToken: string): Promise<CursorPage<Category>>;
}

export function useCategoriesQuery(apiClient: CategoryApiClient, accessToken: string | undefined) {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => apiClient.listCategories(accessToken as string),
    enabled: !!accessToken,
  });
}
