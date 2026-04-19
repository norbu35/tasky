import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';

afterEach(() => {
  delete (window as Window & { FB?: unknown }).FB;
  delete (window as Window & { fbAsyncInit?: unknown }).fbAsyncInit;
});

describe('Auth Integration', () => {
  it('TID-TASK-080-WEB-AUTH-OAUTH-FLOW supports Facebook OAuth auth and profile setup', async () => {
    const facebookLogin = vi.fn(
      (callback: (response: { authResponse: { accessToken: string } }) => void) => {
        callback({
          authResponse: {
            accessToken: 'fb-access-token-1',
          },
        });
      },
    );

    Object.defineProperty(window, 'FB', {
      configurable: true,
      writable: true,
      value: {
        init: vi.fn(),
        login: facebookLogin,
      },
    });

    const apiClient = createMockApiClient();

    render(<App apiClient={apiClient} initialRoute="/auth" />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Facebook' }));

    await waitFor(() => {
      expect(apiClient.loginWithFacebook).toHaveBeenCalledWith('fb-access-token-1');
    });

    expect(
      await screen.findByRole('heading', { name: 'Profile setup and updates' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /your browser may prompt you to choose a photo when you update your avatar/i,
      ),
    ).toBeInTheDocument();
  });
});
