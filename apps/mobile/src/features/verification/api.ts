import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

export async function getVerificationStatus(accessToken: string): Promise<{
  status: string;
  admin_notes?: string;
  submitted_at?: string;
}> {
  return getClient().requestJson<{ status: string; admin_notes?: string; submitted_at?: string }>(
    '/verification/status',
    { method: 'GET' },
    accessToken,
  );
}

export async function getVerificationUploadUrl(
  accessToken: string,
  payload: { content_type: string; document_side: 'FRONT' | 'BACK' | 'SELFIE' },
): Promise<{ upload_url: string; storage_key: string }> {
  return getClient().requestJson<{ upload_url: string; storage_key: string }>(
    '/verification/upload-url',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export async function submitVerification(
  accessToken: string,
  payload: { id_card_front_key: string; id_card_back_key: string; selfie_key: string },
): Promise<void> {
  return getClient().requestVoid(
    '/verification/submit',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}
