import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getVerificationUploadUrl, submitVerification } from '../api';
import { useAuthStore } from '@/store/authStore';

interface VerificationSubmitPayload {
  frontUri: string;
  backUri: string;
  selfieUri: string;
}

async function uploadToS3(uploadUrl: string, data: Blob) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: data,
  });
  if (!response.ok) throw new Error(`Upload failed to S3: ${response.statusText}`);
}

export function useVerificationSubmit() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frontUri, backUri, selfieUri }: VerificationSubmitPayload) => {
      const token = session!.accessToken;

      const [front, back, selfie] = await Promise.all([
        getVerificationUploadUrl(token, { content_type: 'image/jpeg', document_side: 'FRONT' }),
        getVerificationUploadUrl(token, { content_type: 'image/jpeg', document_side: 'BACK' }),
        getVerificationUploadUrl(token, { content_type: 'image/jpeg', document_side: 'SELFIE' }),
      ]);

      const [frontBlob, backBlob, selfieBlob] = await Promise.all([
        fetch(frontUri).then((r) => r.blob()),
        fetch(backUri).then((r) => r.blob()),
        fetch(selfieUri).then((r) => r.blob()),
      ]);

      await Promise.all([
        uploadToS3(front.upload_url, frontBlob),
        uploadToS3(back.upload_url, backBlob),
        uploadToS3(selfie.upload_url, selfieBlob),
      ]);

      return submitVerification(token, {
        id_card_front_key: front.storage_key,
        id_card_back_key: back.storage_key,
        selfie_key: selfie.storage_key,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['verificationStatus'] });
    },
  });
}
