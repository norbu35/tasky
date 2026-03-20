import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

interface CreateTaskPayload {
    category_id: string;
    description: string;
    budget: number;
    location_lat: number;
    location_lng: number;
    location_text: string;
    scheduled_at: string;
    photo_keys?: string[];
}

export function useCreateTask() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTaskPayload) => api.createTask(token!, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
