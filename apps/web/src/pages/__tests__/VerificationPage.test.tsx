import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppContext } from '../../context/AppContext';
import type { AppContextValue } from '../../context/AppContext';
import type { ApiClient } from '../../lib/apiClient';
import { VerificationPage } from '../VerificationPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockApiClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getVerificationStatus: vi.fn().mockResolvedValue({
      status: 'NOT_SUBMITTED',
      admin_notes: null,
      submitted_at: null,
      reviewed_at: null,
    }),
    getVerificationUploadUrl: vi
      .fn()
      .mockResolvedValueOnce({ uploadUrl: 'https://upload.test/front', storageKey: 'front-key' })
      .mockResolvedValueOnce({ uploadUrl: 'https://upload.test/back', storageKey: 'back-key' })
      .mockResolvedValueOnce({ uploadUrl: 'https://upload.test/selfie', storageKey: 'selfie-key' }),
    submitVerification: vi.fn().mockResolvedValue({
      status: 'PENDING',
      admin_notes: null,
      submitted_at: '2026-04-09T00:00:00Z',
      reviewed_at: null,
    }),
    ...overrides,
  } as unknown as ApiClient;
}

function createAppContext(apiClient: ApiClient): AppContextValue {
  return {
    apiClient,
    locale: 'en',
    session: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 'user-1',
        phone: '+97699001122',
        primary_auth: 'PHONE_OTP',
        role: 'TASKER',
        status: 'PENDING',
        created_at: '2026-04-09T00:00:00Z',
      },
    },
    profile: null,
    profileBusy: false,
    profileError: null,
    setSession: vi.fn(),
    setProfile: vi.fn(),
    setProfileError: vi.fn(),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    updateSessionUser: vi.fn(),
    signOut: vi.fn(),
    trackClientEvent: vi.fn(),
  };
}

function renderPage(apiClient?: ApiClient) {
  const resolvedApiClient = apiClient ?? createMockApiClient();
  const context = createAppContext(resolvedApiClient);

  render(
    <MemoryRouter>
      <AppContext.Provider value={context}>
        <VerificationPage />
      </AppContext.Provider>
    </MemoryRouter>,
  );

  return { apiClient: resolvedApiClient };
}

describe('VerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('submits front, back, and selfie storage keys after upload', async () => {
    const { apiClient } = renderPage();
    const client = apiClient as ReturnType<typeof createMockApiClient>;

    await waitFor(() => {
      expect(screen.getByText('Upload ID Card')).toBeInTheDocument();
    });

    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs).toHaveLength(3);

    fireEvent.change(fileInputs[0] as HTMLInputElement, {
      target: { files: [new File(['front'], 'front.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(fileInputs[1] as HTMLInputElement, {
      target: { files: [new File(['back'], 'back.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(fileInputs[2] as HTMLInputElement, {
      target: { files: [new File(['selfie'], 'selfie.jpg', { type: 'image/jpeg' })] },
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Verification' }));

    await waitFor(() => {
      expect(client.submitVerification).toHaveBeenCalledWith('test-access-token', {
        id_card_front_key: 'front-key',
        id_card_back_key: 'back-key',
        selfie_key: 'selfie-key',
        consent_policy_version: 'v1.0',
        consent_accepted: true,
      });
    });
  });
});
