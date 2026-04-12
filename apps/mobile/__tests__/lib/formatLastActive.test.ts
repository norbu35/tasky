import { formatLastActive } from '../../src/lib/formatLastActive';

describe('formatLastActive', () => {
  it('returns null label for null input', () => {
    expect(formatLastActive(null)).toEqual({ label: null, isActive: false });
  });

  it('returns null label for undefined input', () => {
    expect(formatLastActive(undefined)).toEqual({ label: null, isActive: false });
  });

  it('returns "Active now" for timestamps within 5 minutes', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const result = formatLastActive(twoMinAgo);
    expect(result.label).toBe('Active now');
    expect(result.isActive).toBe(true);
  });

  it('returns "Active Xm ago" for timestamps within 1 hour', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const result = formatLastActive(thirtyMinAgo);
    expect(result.label).toBe('Active 30m ago');
    expect(result.isActive).toBe(false);
  });

  it('returns "Active Xh ago" for timestamps within 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const result = formatLastActive(threeHoursAgo);
    expect(result.label).toBe('Active 3h ago');
    expect(result.isActive).toBe(false);
  });

  it('returns null label for timestamps older than 24 hours', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(twoDaysAgo)).toEqual({ label: null, isActive: false });
  });

  it('returns null label for invalid date string', () => {
    expect(formatLastActive('not-a-date')).toEqual({ label: null, isActive: false });
  });
});
