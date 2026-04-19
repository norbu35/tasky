import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { IntakeSchema } from '../../components/feature/task-creation/IntakeFormRenderer';
import { AppContext } from '../../context/AppContext';
import type { AppContextValue } from '../../context/AppContext';
import type { ApiClient, Category, CursorPage, Task } from '../../lib/apiClient';
import { CustomerTaskPage } from '../CustomerTaskPage';

// ─── Intake Schema Fixtures ────────────────────────────────────────────────

const CLEANING_INTAKE_SCHEMA: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'room_count',
      label: 'Room count',
      label_mn: 'Өрөөний тоо',
      type: 'numeric_counter',
      required: true,
      min: 1,
      max: 10,
    },
    {
      name: 'cleaning_type',
      label: 'Cleaning type',
      label_mn: 'Цэвэрлэгээний төрөл',
      type: 'single_select',
      required: true,
      options: [
        { value: 'standard', label: 'Standard cleaning', label_mn: 'Энгийн цэвэрлэгээ' },
        { value: 'deep', label: 'Deep cleaning', label_mn: 'Гүнзгий цэвэрлэгээ' },
      ],
    },
    {
      name: 'has_pets',
      label: 'Has pets',
      label_mn: 'Тэжээвэр амьтантай юу',
      type: 'yes_no',
      required: false,
    },
  ],
};

// ─── Category Fixtures ─────────────────────────────────────────────────────

const CATEGORY_WITH_SCHEMA: Category = {
  id: 'cat-cleaning',
  name: 'Cleaning',
  name_mn: 'Цэвэрлэгээ',
  icon_url: 'https://example.com/cleaning.svg',
  is_active: true,
  sort_order: 1,
  intake_enabled: true,
  intake_schema_version: 1,
  intake_schema_json: CLEANING_INTAKE_SCHEMA.fields.map((f) => ({
    key: f.name,
    label: f.label,
    label_mn: f.label_mn,
    type: f.type,
    required: f.required,
    options: f.options,
    min: f.min ?? null,
    max: f.max ?? null,
  })),
} as Category;

const CATEGORY_WITHOUT_SCHEMA: Category = {
  id: 'cat-plumbing',
  name: 'Plumbing',
  name_mn: 'Сантехник',
  icon_url: 'https://example.com/plumbing.svg',
  is_active: true,
  sort_order: 2,
  intake_enabled: false,
  intake_schema_version: 0,
  intake_schema_json: null,
} as Category;

const TASK_RESPONSE: Task = {
  id: 'task-001',
  category_id: 'cat-cleaning',
  description: 'Room count: 3\nCleaning type: Deep cleaning\nHas pets: Yes',
  budget: 50000,
  location_lat: 47.9184,
  location_lng: 106.9177,
  location_text: 'Test address location',
  status: 'OPEN',
  scheduled_at: '2026-04-01T10:00:00.000Z',
  intake_answers: { room_count: 3, cleaning_type: 'deep', has_pets: true },
  intake_schema_version: 1,
  created_at: '2026-03-23T08:00:00Z',
} as unknown as Task;

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockApiClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listCategories: vi.fn().mockResolvedValue({
      data: [CATEGORY_WITH_SCHEMA, CATEGORY_WITHOUT_SCHEMA],
      cursor: { next: null, has_more: false },
    } satisfies CursorPage<Category>),
    createTask: vi.fn().mockResolvedValue(TASK_RESPONSE),
    listTaskApplications: vi.fn().mockResolvedValue({
      data: [],
      cursor: { next: null, has_more: false },
    }),
    ...overrides,
  } as unknown as ApiClient;
}

function createAppContext(apiClient: ApiClient): AppContextValue {
  return {
    apiClient,
    locale: 'en',
    session: {
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      user: {
        id: 'user-1',
        phone: '99001122',
        role: 'CUSTOMER',
      } as AppContextValue['session'] extends { user: infer U } ? U : never,
    } as AppContextValue['session'],
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
}

function renderPage(apiClient?: ApiClient) {
  const api = apiClient ?? createMockApiClient();
  const ctx = createAppContext(api);
  render(
    <MemoryRouter>
      <AppContext.Provider value={ctx}>
        <CustomerTaskPage />
      </AppContext.Provider>
    </MemoryRouter>,
  );
  return { api, ctx };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('CustomerTaskPage – Intake Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows intake form when selected category has an active intake schema', async () => {
    renderPage();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Cleaning')).toBeInTheDocument();
    });

    // The intake form fields should be visible for the default selected category (Cleaning)
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });
    expect(screen.getByText('Cleaning type')).toBeInTheDocument();
    expect(screen.getByText('Has pets')).toBeInTheDocument();
  });

  it('falls back to free-text description when category has no intake schema', async () => {
    renderPage();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Cleaning')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Switch to Plumbing (no schema)
    const select = screen.getByLabelText(/category/i);
    await user.selectOptions(select, 'cat-plumbing');

    // Should show the free-text textarea
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/1-bedroom apartment deep cleaning/i)).toBeInTheDocument();
    });

    // Intake form fields should NOT be visible
    expect(screen.queryByText('Room count')).not.toBeInTheDocument();
    expect(screen.queryByText('Cleaning type')).not.toBeInTheDocument();
  });

  it('generates a deterministic job scope summary from intake answers', async () => {
    renderPage();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Fill in intake form fields
    // Room count: set to 3 via the number input
    const roomInput = screen.getByRole('spinbutton', { name: /room count/i });
    await user.clear(roomInput);
    await user.type(roomInput, '3');

    // Cleaning type: select "Deep cleaning"
    const deepOption = screen.getByLabelText('Deep cleaning');
    await user.click(deepOption);

    // Has pets: select "Yes"
    const yesOption = within(screen.getByText('Has pets').closest('[data-field]')!).getByLabelText(
      'Yes',
    );
    await user.click(yesOption);

    // The generated summary should appear in the description textarea
    await waitFor(() => {
      const textarea = screen.getByLabelText(/task details/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Room count: 3');
      expect(textarea.value).toContain('Cleaning type: Deep cleaning');
      expect(textarea.value).toContain('Has pets: Yes');
    });
  });

  it('summary is editable before submit', async () => {
    renderPage();

    // Wait for intake form
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Fill a field to generate summary
    const deepOption = screen.getByLabelText('Deep cleaning');
    await user.click(deepOption);

    // Verify summary appeared
    await waitFor(() => {
      const textarea = screen.getByLabelText(/task details/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Cleaning type: Deep cleaning');
    });

    // Edit the summary manually
    const textarea = screen.getByLabelText(/task details/i) as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'Custom edited description for the task');

    expect(textarea.value).toBe('Custom edited description for the task');
  });

  it('submits structured intake answers with task creation', async () => {
    const api = createMockApiClient();
    renderPage(api);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Fill intake form
    const roomInput = screen.getByRole('spinbutton', { name: /room count/i });
    await user.clear(roomInput);
    await user.type(roomInput, '3');

    const deepOption = screen.getByLabelText('Deep cleaning');
    await user.click(deepOption);

    const yesOption = within(screen.getByText('Has pets').closest('[data-field]')!).getByLabelText(
      'Yes',
    );
    await user.click(yesOption);

    // Wait for summary to be generated
    await waitFor(() => {
      const textarea = screen.getByLabelText(/task details/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Room count: 3');
    });

    // Fill remaining required fields
    const budgetInput = screen.getByLabelText(/budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '50000');

    const addressInput = screen.getByLabelText(/address description/i);
    await user.clear(addressInput);
    await user.type(addressInput, 'Test address location');

    const scheduledInput = screen.getByLabelText(/scheduled at/i);
    await user.clear(scheduledInput);
    await user.type(scheduledInput, '2026-04-01T10:00');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Verify createTask was called with intake_answers and intake_schema_version
    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          category_id: 'cat-cleaning',
          intake_answers: expect.objectContaining({
            room_count: 3,
            cleaning_type: 'deep',
            has_pets: true,
          }),
          intake_schema_version: 1,
          description: expect.stringContaining('Room count: 3'),
        }),
      );
    });
  });

  it('category selection loads the appropriate schema', async () => {
    renderPage();

    // Wait for categories to load with default Cleaning selected
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Switch to Plumbing (no schema)
    const select = screen.getByLabelText(/category/i);
    await user.selectOptions(select, 'cat-plumbing');

    // Intake fields should disappear
    await waitFor(() => {
      expect(screen.queryByText('Room count')).not.toBeInTheDocument();
    });

    // Free-text textarea should appear
    expect(screen.getByPlaceholderText(/1-bedroom apartment deep cleaning/i)).toBeInTheDocument();

    // Switch back to Cleaning
    await user.selectOptions(select, 'cat-cleaning');

    // Intake fields should reappear
    await waitFor(() => {
      expect(screen.getByText('Room count')).toBeInTheDocument();
    });
  });
});
