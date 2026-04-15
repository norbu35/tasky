import { useMutation } from '@tanstack/react-query';

import {
  createMobileApiClient,
  type ProfilePolishPreviewPayload,
} from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useProfilePolishPreview() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useMutation({
    mutationFn: (payload: ProfilePolishPreviewPayload) =>
      api.getProfilePolishPreview(token!, payload),
  });
}
