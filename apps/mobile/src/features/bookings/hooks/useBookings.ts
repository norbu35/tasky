import {useQuery} from '@tanstack/react-query';
import {useAuthStore} from '../../../store/authStore';
import {createMobileApiClient} from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useBookings() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['bookings'],
        queryFn: () => api.listBookings(token!, {}),
        enabled: !!token,
    });
}
