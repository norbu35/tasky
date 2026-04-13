const LOCAL_CDN_BASE = 'https://cdn.tasky.local/';
const PROD_CDN_BASE = 'https://cdn.tasky.mn/';

export function avatarValueToPreviewUrl(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.startsWith('uploads/') ? `${LOCAL_CDN_BASE}${value}` : value;
}

export function avatarValueToApiPayload(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('uploads/')) {
    return trimmed;
  }
  if (trimmed.startsWith(LOCAL_CDN_BASE)) {
    return trimmed.slice(LOCAL_CDN_BASE.length);
  }
  if (trimmed.startsWith(PROD_CDN_BASE)) {
    return trimmed.slice(PROD_CDN_BASE.length);
  }
  return trimmed;
}
