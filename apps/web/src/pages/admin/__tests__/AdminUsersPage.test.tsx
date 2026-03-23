import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, User, Message } from '../../../lib/apiClient';

// ── Mock AppContext ──────────────────────────────────────────────────
const mockApiClient: Partial<ApiClient> = {
  adminSearchUsers: vi.fn(),
  adminBanUser: vi.fn(),
  adminUnbanUser: vi.fn(),
  adminListFlaggedMessages: vi.fn(),
};

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

// ── Mock sonner toast ────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { AdminUsersPage } from '../AdminUsersPage';

// ── Test Data ────────────────────────────────────────────────────────
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    phone: '+97699001122',
    facebook_id: 'fb-1',
    primary_auth: 'PHONE_OTP',
    role: 'CUSTOMER',
    status: 'VERIFIED',
    created_at: '2026-01-15T10:00:00Z',
  } as unknown as User,
  {
    id: 'user-2',
    phone: '+97699003344',
    facebook_id: 'fb-2',
    primary_auth: 'FACEBOOK',
    role: 'TASKER',
    status: 'BANNED',
    created_at: '2026-02-20T14:30:00Z',
  } as unknown as User,
];

const MOCK_FLAGGED_MESSAGES: Message[] = [
  {
    id: 'msg-flag-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Call me at +97699005566 for details',
    created_at: '2026-03-10T09:00:00Z',
  } as unknown as Message,
  {
    id: 'msg-flag-2',
    conversation_id: 'conv-2',
    sender_id: 'user-3',
    content: 'My number is +97688112233',
    created_at: '2026-03-11T12:00:00Z',
  } as unknown as Message,
];

// ── Helpers ──────────────────────────────────────────────────────────
function renderPage() {
  return render(<AdminUsersPage />);
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminSearchUsers!).mockResolvedValue({
      data: MOCK_USERS,
      cursor: { next: null, prev: null },
    });
    vi.mocked(mockApiClient.adminBanUser!).mockImplementation(
      async (_token: string, userId: string) => ({
        ...MOCK_USERS.find((u) => u.id === userId)!,
        status: 'BANNED',
      }),
    );
    vi.mocked(mockApiClient.adminUnbanUser!).mockImplementation(
      async (_token: string, userId: string) => ({
        ...MOCK_USERS.find((u) => u.id === userId)!,
        status: 'VERIFIED',
      }),
    );
    vi.mocked(mockApiClient.adminListFlaggedMessages!).mockResolvedValue({
      data: MOCK_FLAGGED_MESSAGES,
      cursor: { next: null, prev: null },
    });
  });

  it('renders search input and button', () => {
    renderPage();

    expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('search calls adminSearchUsers with phone', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97699001122' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockApiClient.adminSearchUsers).toHaveBeenCalledWith('test-token', '+97699001122');
    });
  });

  it('displays user results in table', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('+97699001122')).toBeInTheDocument();
    });

    expect(screen.getByText('+97699003344')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
    expect(screen.getByText('TASKER')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    expect(screen.getByText('BANNED')).toBeInTheDocument();
  });

  it('ban button opens dialog, submitting calls adminBanUser', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('+97699001122')).toBeInTheDocument();
    });

    // Find the ban button for the first user (VERIFIED, so should have Ban button)
    const banButtons = screen.getAllByRole('button', { name: /^ban$/i });
    expect(banButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(banButtons[0]);

    // Dialog should open with reason input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/reason/i)).toBeInTheDocument();
    });

    // Enter reason and confirm
    const reasonInput = screen.getByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Spam behavior' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockApiClient.adminBanUser).toHaveBeenCalledWith(
        'test-token',
        'user-1',
        'Spam behavior',
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('unban button calls adminUnbanUser', async () => {
    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97699003344' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('+97699003344')).toBeInTheDocument();
    });

    // The second user is BANNED, so should have Unban button
    const unbanButton = screen.getByRole('button', { name: /unban/i });
    fireEvent.click(unbanButton);

    await waitFor(() => {
      expect(mockApiClient.adminUnbanUser).toHaveBeenCalledWith('test-token', 'user-2');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('flagged messages tab shows messages', async () => {
    renderPage();

    // Radix Tabs use pointer events internally; dispatch pointerdown then click
    const flaggedTab = screen.getByRole('tab', { name: /flagged/i });
    fireEvent.pointerDown(flaggedTab, { button: 0, pointerId: 1 });
    fireEvent.click(flaggedTab);

    await waitFor(() => {
      expect(mockApiClient.adminListFlaggedMessages).toHaveBeenCalledWith('test-token');
    });

    await waitFor(() => {
      expect(screen.getByText(/Call me at \+97699005566 for details/)).toBeInTheDocument();
    });

    expect(screen.getByText(/My number is \+97688112233/)).toBeInTheDocument();
  });

  it('empty search results show message', async () => {
    vi.mocked(mockApiClient.adminSearchUsers!).mockResolvedValue({
      data: [],
      cursor: { next: null, prev: null },
    });

    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97600000000' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  it('error state with retry', async () => {
    vi.mocked(mockApiClient.adminSearchUsers!).mockRejectedValue(new Error('Network error'));

    renderPage();

    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, { target: { value: '+97699001122' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to search/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // Fix the mock and retry
    vi.mocked(mockApiClient.adminSearchUsers!).mockResolvedValue({
      data: MOCK_USERS,
      cursor: { next: null, prev: null },
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('+97699001122')).toBeInTheDocument();
    });
  });
});
