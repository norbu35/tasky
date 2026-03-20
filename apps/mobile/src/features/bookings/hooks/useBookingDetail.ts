import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useBookingDetail(bookingId: string | undefined) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => api.getBooking(token!, bookingId!),
        enabled: !!token && !!bookingId,
    });
}
