import {useQuery} from '@tanstack/react-query';
import {useAuthStore} from '../../../store/authStore';
import {createMobileApiClient} from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useTasks() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.listTasks(token!, { }), 
    enabled: !!token,
  });
}
