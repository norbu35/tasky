import { createMobileApiClient } from '@/lib/mobileApiClient';

const getClient = () => createMobileApiClient();

export async function getVerificationStatus(accessToken: string): Promise<{
  status: string;
  admin_notes?: string;
  submitted_at?: string;
}> {
  return getClient().getVerificationStatus(accessToken);
}

export async function getVerificationUploadUrl(
  accessToken: string,
  payload: { content_type: string; document_side: 'FRONT' | 'BACK' | 'SELFIE' },
): Promise<{ upload_url: string; storage_key: string }> {
  return getClient().getVerificationUploadUrl(accessToken, payload);
}

export async function submitVerification(
  accessToken: string,
  payload: { id_card_front_key: string; id_card_back_key: string; selfie_key: string },
): Promise<void> {
  return getClient().submitVerification(accessToken, payload);
}
