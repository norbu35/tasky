import '../../src/lib/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AppContext } from '../../src/context/AppContext';
import type { AppContextValue } from '../../src/context/AppContext';

import { CustomerTaskCancelDialog } from '../../src/pages/customer/CustomerTaskCancelDialog';
import { CustomerTaskSuccessPage } from '../../src/pages/customer/CustomerTaskSuccessPage';
import { CustomerTasksListPage } from '../../src/pages/customer/CustomerTasksListPage';
import { CustomerTaskerProfilePage } from '../../src/pages/customer/CustomerTaskerProfilePage';
import { CustomerTaskWizardPage } from '../../src/pages/customer/CustomerTaskWizardPage';
import { createMockApiClient } from '../../src/test/mocks';
import {
  makeCategory,
  makeProfile,
  makeSession,
  makeUser,
  localDateTimeInput,
} from '../../src/test/factories';

function createContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
  const apiClient = overrides.apiClient ?? createMockApiClient();

  return {
    apiClient,
    locale: 'en',
    session: makeSession(),
    profile: makeProfile(),
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
    ...overrides,
  };
}

function renderWithProviders(ui: ReactElement, apiClient = createMockApiClient()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={createContext({ apiClient })}>{ui}</AppContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Customer phase 1 parity', () => {
  it('renders the customer tasks list shell with task cards', async () => {
    const apiClient = createMockApiClient({
      listMyTasks: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'task-1',
            category_id: makeCategory().id,
            description: 'Deep clean apartment',
            budget: 120000,
            location_text: 'Exact location kept private',
            status: 'OPEN',
            scheduled_at: '2026-02-16T10:00:00Z',
            created_at: '2026-02-14T00:00:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
    });

    renderWithProviders(<CustomerTasksListPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'My tasks' })).toBeInTheDocument();
    expect(await screen.findByText('Deep clean apartment')).toBeInTheDocument();
    expect(await screen.findByText('Exact location kept private')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post new task' })).toBeInTheDocument();
  });

  it('SCN-TASK-001: Task-post form loads the active intake schema for the selected category', async () => {
    const apiClient = createMockApiClient({
      listCategories: vi.fn().mockResolvedValue({
        data: [
          {
            ...makeCategory(),
            intake_enabled: true,
            intake_schema_version: 1,
            intake_schema_json: [
              {
                key: 'room_count',
                label: 'Room count',
                label_mn: 'Өрөөний тоо',
                type: 'numeric_counter',
                required: true,
                min: 1,
                max: 5,
              },
            ],
          },
        ],
        cursor: { next: null, has_more: false },
      }),
    });

    renderWithProviders(<CustomerTaskWizardPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'Post a new task' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });
    expect(screen.getByRole('spinbutton', { name: /Room count/i })).toBeInTheDocument();
  });

  it('TID-TASK-000-WEB-TASK-WIZARD-SUBMIT renders the routed task wizard with location, budget, and submit controls', async () => {
    const apiClient = createMockApiClient({
      listCategories: vi.fn().mockResolvedValue({
        data: [
          {
            ...makeCategory(),
            intake_enabled: true,
            intake_schema_version: 1,
            intake_schema_json: [
              {
                key: 'room_count',
                label: 'Room count',
                label_mn: 'Өрөөний тоо',
                type: 'numeric_counter',
                required: true,
                min: 1,
                max: 5,
              },
            ],
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      createTask: vi.fn().mockResolvedValue({
        id: 'task-created-1',
        category_id: makeCategory().id,
        customer_id: makeUser().id,
        description: 'Room count: 2',
        budget: 120000,
        location_lat: 47.9184,
        location_lng: 106.9177,
        location_text: 'ХУД 15-р хороо',
        status: 'OPEN',
        scheduled_at: '2026-02-16T10:00:00Z',
        photos: [],
        created_at: '2026-02-14T00:00:00Z',
      }),
    });

    const user = userEvent.setup();

    renderWithProviders(<CustomerTaskWizardPage />, apiClient);

    expect(await screen.findByRole('heading', { name: 'Post a new task' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('spinbutton', { name: /Room count/i })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('spinbutton', { name: /Room count/i }), '2');
    await user.clear(screen.getByLabelText('Estimated budget (MNT)'));
    await user.type(screen.getByLabelText('Estimated budget (MNT)'), '120000');
    await user.clear(screen.getByLabelText('Address description'));
    await user.type(screen.getByLabelText('Address description'), 'ХУД 15-р хороо');
    await user.type(screen.getByLabelText('Scheduled at'), localDateTimeInput(24));
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => {
      expect(apiClient.createTask).toHaveBeenCalledWith(
        makeSession().accessToken,
        expect.objectContaining({
          category_id: makeCategory().id,
          budget: 120000,
          location_text: 'ХУД 15-р хороо',
        }),
      );
    });

    expect(await screen.findByText('Task created successfully.')).toBeInTheDocument();
  });

  it('renders the customer task success page with follow-up actions', () => {
    renderWithProviders(<CustomerTaskSuccessPage />);

    expect(screen.getByRole('heading', { name: 'Task posted successfully' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post another task' })).toBeInTheDocument();
  });

  it('renders the customer tasker profile page with profile and review summary', () => {
    renderWithProviders(<CustomerTaskerProfilePage />);

    expect(screen.getByRole('heading', { name: 'Tasker profile' })).toBeInTheDocument();
    expect(screen.getByText('ID-verified Tasker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message tasker' })).toBeInTheDocument();
  });

  it('renders the customer task cancel dialog with confirm and dismiss actions', () => {
    renderWithProviders(<CustomerTaskCancelDialog />);

    expect(screen.getByRole('heading', { name: 'Cancel task?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel task' })).toBeInTheDocument();
  });
});
