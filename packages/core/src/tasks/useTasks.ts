import { useQuery } from '@tanstack/react-query';

import type { components } from '@tasky/sdk';

export type PublicTask = components['schemas']['PublicTask'];
export type TaskFeedItem = components['schemas']['TaskFeedItem'];
export type CursorPagination = components['schemas']['CursorPagination'];
export interface CursorPage<T> {
  data: T[];
  cursor: CursorPagination;
}
export interface TaskFilters {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}
export interface TaskApiClient {
  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<TaskFeedItem>>;
}

export function useTasksQuery(
  apiClient: TaskApiClient,
  accessToken: string | undefined,
  filters?: TaskFilters,
) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => apiClient.listTasks(accessToken as string, filters),
    enabled: !!accessToken,
  });
}
