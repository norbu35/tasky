import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../../../context/AppContext';
import { parseError } from '../../../lib/errorHandling';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

interface PhotoUploadManagerProps {
  photoKeys: string[];
  onPhotoKeysChange: (keys: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploadManager({
  photoKeys,
  onPhotoKeysChange,
  maxPhotos = 3,
}: PhotoUploadManagerProps) {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('taskCreation.photoUpload.invalidType'));
      return;
    }

    if (photoKeys.length >= maxPhotos) {
      setError(t('taskCreation.photoUpload.maxPhotosError', { maxPhotos }));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get presigned URL
      const { uploadUrl, storageKey } = await apiClient.getTaskPhotoUploadUrl(
        session.accessToken,
        null,
        file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      );

      // Upload to storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        setError(t('taskCreation.photoUpload.uploadFailed'));
        return;
      }

      onPhotoKeysChange([...photoKeys, storageKey]);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    onPhotoKeysChange(photoKeys.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="grid gap-2">
      <Label>
        {t('taskCreation.photoUpload.label')} ({photoKeys.length}/{maxPhotos})
      </Label>
      <div className="flex flex-wrap gap-4">
        {photoKeys.map((key, index) => (
          <div
            key={index}
            className="relative h-24 w-24 rounded-sm border border-border bg-muted flex flex-col items-center justify-center p-2 text-center overflow-hidden shadow-[var(--shadow-card)]"
          >
            <span className="text-[10px] text-muted-foreground w-full truncate break-all">
              {key.split('/').pop()}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => removePhoto(index)}
              disabled={uploading}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {photoKeys.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-24 w-24 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t('taskCreation.photoUpload.addPhoto')}
                </span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
}
