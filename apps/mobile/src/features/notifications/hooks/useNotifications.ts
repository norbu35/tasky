import { useQuery } from '@tanstack/react-query';
import type { CursorPage } from '../../../lib/mobileApiClient';

export interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

/**
 * Hook-ready for Phase 2 notifications endpoint.
 * Currently returns mock structure; will be wired to GET /notifications when available.
 */
export function useNotifications() {
    return useQuery<CursorPage<Notification>>({
        queryKey: ['notifications'],
        queryFn: async () => ({
            data: [],
            cursor: { next: null, prev: null },
        }),
    });
}
