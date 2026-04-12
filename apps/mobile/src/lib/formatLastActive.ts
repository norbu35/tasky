export type LastActiveResult = {
  label: string | null;
  isActive: boolean;
};

export function formatLastActive(isoTimestamp: string | null | undefined): LastActiveResult {
  const none: LastActiveResult = { label: null, isActive: false };

  if (!isoTimestamp) return none;

  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return none;

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return none;

  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 5) {
    return { label: 'Active now', isActive: true };
  }

  if (diffMin < 60) {
    return { label: `Active ${diffMin}m ago`, isActive: false };
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return { label: `Active ${diffHours}h ago`, isActive: false };
  }

  return none;
}
