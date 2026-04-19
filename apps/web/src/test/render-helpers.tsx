import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { AppContext } from '../context/AppContext';
import type { AppContextValue } from '../context/AppContext';
import type { AdminApiClient } from '../lib/adminApiClient';
import { AdminApiClientContext } from '../lib/adminApiClient';
import type { ApiClient, AuthTokens } from '../lib/apiClient';

import { createMockApiClient, createMockAdminApiClient } from './mocks';

export type RenderWithAppContextOptions = {
  apiClient?: Partial<ApiClient>;
  adminApiClient?: Partial<AdminApiClient>;
  session?: Partial<AuthTokens>;
  route?: string;
  routes?: ReactElement;
};

export function renderWithAppContext(
  ui: ReactElement,
  options: RenderWithAppContextOptions = {},
): RenderResult & {
  ctx: AppContextValue;
  adminClient: AdminApiClient;
  user: ReturnType<typeof userEvent.setup>;
} {
  const api = createMockApiClient(options.apiClient);
  const adminApi = createMockAdminApiClient(options.adminApiClient);

  const ctx: AppContextValue = {
    apiClient: api,
    locale: 'en',
    session:
      options.session !== null
        ? ({
            accessToken: 'test-token',
            refreshToken: 'rt',
            user: { id: 'admin-1', role: 'ADMIN', phone: '+97699112233' },
            ...options.session,
          } as AuthTokens)
        : null,
    profile: null,
    profileBusy: false,
    profileError: null,
    setSession: vi.fn(),
    setProfile: vi.fn(),
    setProfileError: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    loadProfile: vi.fn().mockResolvedValue(undefined),
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
  };

  const user = userEvent.setup();

  const wrapper = render(
    <AppContext.Provider value={ctx}>
      <AdminApiClientContext.Provider value={adminApi}>
        <MemoryRouter initialEntries={[options.route || '/']}>
          {options.routes ? (
            <Routes>
              {options.routes}
              <Route path="*" element={ui} />
            </Routes>
          ) : (
            ui
          )}
        </MemoryRouter>
      </AdminApiClientContext.Provider>
    </AppContext.Provider>,
  );

  return { ...wrapper, ctx, adminClient: adminApi, user };
}
