import { useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useDisputeDetail(disputeId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => api.getDispute(token!, disputeId!),
    enabled: !!token && !!disputeId,
  });
}
