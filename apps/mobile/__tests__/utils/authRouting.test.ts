import type { AuthTokens } from '../../src/lib/mobileApiClient';
import { resolvePostAuthHref } from '../../src/utils/authRouting';

const baseSession: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-1',
    phone: '+97699001122',
    primary_auth: 'PHONE_OTP',
    role: 'CUSTOMER',
    status: 'PENDING',
    created_at: '2026-02-14T00:00:00Z',
  },
};

describe('resolvePostAuthHref', () => {
  it('routes guests to auth', () => {
    expect(resolvePostAuthHref(null, true)).toBe('/(auth)');
  });

  it('routes first-time authenticated users to onboarding', () => {
    expect(resolvePostAuthHref(baseSession, false)).toBe('/onboarding');
  });

  it('routes facebook-authenticated users to otp migration after onboarding', () => {
    expect(
      resolvePostAuthHref(
        {
          ...baseSession,
          user: { ...baseSession.user, primary_auth: 'FACEBOOK' },
        },
        true,
      ),
    ).toBe('/(auth)/otp-migration');
  });

  it('routes returning customers to my tasks', () => {
    expect(resolvePostAuthHref(baseSession, true)).toBe('/(customer)/tasks');
  });

  it('routes returning taskers to tabs', () => {
    expect(
      resolvePostAuthHref(
        {
          ...baseSession,
          user: { ...baseSession.user, role: 'TASKER' },
        },
        true,
      ),
    ).toBe('/(tabs)');
  });
});
