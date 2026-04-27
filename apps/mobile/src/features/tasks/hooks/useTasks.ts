import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useMyProfile } from '@/features/profile';
import type { CursorPage, TaskDetail, TaskFeedItem, TaskFilters } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getTask, listTasks } from '../api';

const TASK_FEED_PAGE_SIZE = 20;

type TaskFeedFilters = Omit<TaskFilters, 'cursor' | 'limit'>;

export function useTasks(filters?: TaskFeedFilters) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const queryFilters = useMemo<TaskFeedFilters>(
    () => ({
      categoryId: filters?.categoryId,
      lat: filters?.lat,
      lng: filters?.lng,
      radiusKm: filters?.radiusKm,
    }),
    [filters?.categoryId, filters?.lat, filters?.lng, filters?.radiusKm],
  );

  const query = useInfiniteQuery({
    queryKey: queryKeys.tasks.feed(token!, queryFilters),
    queryFn: ({ pageParam }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : undefined;
      return listTasks(token!, {
        ...queryFilters,
        cursor,
        limit: TASK_FEED_PAGE_SIZE,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: CursorPage<TaskFeedItem>) => lastPage.cursor.next ?? undefined,
    enabled: !!token,
  });

  const data = useMemo<CursorPage<TaskFeedItem> | undefined>(() => {
    if (!query.data) return undefined;
    const pages = query.data.pages;
    const lastPage = pages[pages.length - 1];
    return {
      data: pages.flatMap((page) => page.data),
      cursor: lastPage?.cursor ?? { next: null, has_more: false },
    };
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export interface TaskDetailState {
  task: TaskDetail | null;
  isLoading: boolean;
  isError: boolean;
  isVerified: boolean;
  hasApplied: boolean;
  capReached: boolean;
  refetch: () => void;
}

export function useTaskDetail(taskId: string): TaskDetailState {
  const session = useAuthStore((s) => s.session);
  const { data: profile } = useMyProfile();
  const token = session?.accessToken;

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.detail(token!, taskId),
    queryFn: () => getTask(token!, taskId),
    enabled: !!token && !!taskId,
  });

  const isVerified = profile?.status === 'VERIFIED';
  const hasApplied = false; // Will be enhanced with application state tracking
  const capReached = false; // Will be enhanced with cap checking

  return {
    task: tasksQuery.data ?? null,
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    isVerified,
    hasApplied,
    capReached,
    refetch: tasksQuery.refetch,
  };
}
