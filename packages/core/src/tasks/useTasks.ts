import {useQuery} from "@tanstack/react-query";
import type {components} from "@tasky/sdk";

export type PublicTask = components["schemas"]["PublicTask"];
export interface CursorPage<T> {
    data: T[];
    cursor: {
        next: string | null;
        prev: string | null;
    };
}
export interface TaskFilters {
    categoryId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
}
export interface TaskApiClient {
    listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>>;
}

export function useTasksQuery(apiClient: TaskApiClient, accessToken: string | undefined, filters?: TaskFilters) {
    return useQuery({
        queryKey: ["tasks", filters],
        queryFn: async () => apiClient.listTasks(accessToken as string, filters),
        enabled: !!accessToken,
    });
}
