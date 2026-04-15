import { useState, useCallback } from 'react';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useVerificationUpload() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const [isUploading, setIsUploading] = useState(false);

  const getUploadUrl = useCallback(
    async (documentSide: 'FRONT' | 'BACK' | 'SELFIE') => {
      if (!token) throw new Error('Not authenticated');
      return api.getVerificationUploadUrl(token, {
        content_type: 'image/jpeg',
        document_side: documentSide,
      });
    },
    [token],
  );

  const uploadPhoto = useCallback(
    async (uri: string, documentSide: 'FRONT' | 'BACK' | 'SELFIE'): Promise<string> => {
      setIsUploading(true);
      try {
        const { upload_url, storage_key } = await getUploadUrl(documentSide);

        const response = await fetch(uri);
        const blob = await response.blob();

        await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: blob,
        });

        return storage_key;
      } finally {
        setIsUploading(false);
      }
    },
    [getUploadUrl],
  );

  return {
    getUploadUrl,
    uploadPhoto,
    isUploading,
  };
}
