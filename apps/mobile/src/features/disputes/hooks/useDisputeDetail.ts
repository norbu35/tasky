import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getDispute } from '../api';

export function useDisputeDetail(disputeId: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.disputes.detail(uid!, disputeId!),
    queryFn: () => getDispute(token!, disputeId!),
    enabled: !!token && !!disputeId,
  });
}
