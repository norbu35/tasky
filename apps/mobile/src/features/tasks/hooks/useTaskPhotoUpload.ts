import { useState, useCallback } from 'react';

import { useAuthStore } from '@/store/authStore';

import { getTaskPhotoUploadUrl } from '../api';

export function useTaskPhotoUpload() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhoto = useCallback(
    async (uri: string): Promise<string> => {
      if (!token) throw new Error('Not authenticated');
      setIsUploading(true);
      try {
        const { upload_url, storage_key } = await getTaskPhotoUploadUrl(token, 'image/jpeg');

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
    [token],
  );

  return { uploadPhoto, isUploading };
}
