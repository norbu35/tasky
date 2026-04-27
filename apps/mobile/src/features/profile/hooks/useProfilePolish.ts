import { useMutation } from '@tanstack/react-query';

import type { ProfilePolishPreviewPayload } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';

import { getProfilePolishPreview } from '../api';

export function useProfilePolishPreview() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useMutation({
    mutationFn: (payload: ProfilePolishPreviewPayload) => getProfilePolishPreview(token!, payload),
  });
}
