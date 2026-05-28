import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { AdminApiClient } from '../../../lib/adminApiClient';
import type {
  ApiClient,
  Category,
  CursorPage,
  CategorySchemaVersion,
} from '../../../lib/apiClient';
import { AdminCategoriesPage } from '../AdminCategoriesPage';

// ── Mock AppContext ──────────────────────────────────────────────────
const mockAdminApiClient: Partial<AdminApiClient> = {
  adminListCategories: vi.fn(),
  adminCreateCategory: vi.fn(),
  adminUpdateCategory: vi.fn(),
  adminListCategorySchemas: vi.fn(),
  adminCreateCategorySchema: vi.fn(),
  adminActivateCategorySchema: vi.fn(),
};

const mockSession = {
  accessToken: 'test-token',
  refreshToken: 'rt',
  user: { id: '1', role: 'ADMIN' },
};

const mockApiClient = {} as ApiClient;
vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: mockSession,
  })),
}));

vi.mock('../../../lib/adminApiClient', () => ({
  useAdminApiClient: () => mockAdminApiClient,
}));

// ── Mock sonner toast ────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Test Data ────────────────────────────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Cleaning',
    name_mn: '\u0426\u044d\u0432\u044d\u0440\u043b\u044d\u0433\u044d\u044d',
    icon_url: 'https://example.com/cleaning.png',
    is_active: true,
    sort_order: 1,
    intake_enabled: true,
    assisted_distribution_enabled: true,
    intake_schema_version: 1,
    intake_schema_json: null,
  },
  {
    id: 'cat-2',
    name: 'Plumbing',
    name_mn: '\u0421\u0430\u043d\u0442\u0435\u0445\u043d\u0438\u043a',
    icon_url: 'https://example.com/plumbing.png',
    is_active: false,
    sort_order: 2,
    intake_enabled: false,
    assisted_distribution_enabled: false,
    intake_schema_version: 0,
    intake_schema_json: null,
  },
  {
    id: 'cat-3',
    name: 'Electrical',
    name_mn: '\u0426\u0430\u0445\u0438\u043b\u0433\u0430\u0430\u043d',
    icon_url: 'https://example.com/electrical.png',
    is_active: true,
    sort_order: 3,
    intake_enabled: true,
    assisted_distribution_enabled: false,
    intake_schema_version: 2,
    intake_schema_json: null,
  },
];

const MOCK_CATEGORIES_PAGE: CursorPage<Category> = {
  data: MOCK_CATEGORIES,
  cursor: { next: null, has_more: false },
};

const MOCK_SCHEMA_VERSIONS: CategorySchemaVersion[] = [
  {
    version: 1,
    status: 'ACTIVE',
    schema_json: { type: 'object', properties: { size: { type: 'string' } } },
    created_at: '2026-03-20T10:00:00Z',
  },
  {
    version: 2,
    status: 'DRAFT',
    schema_json: { type: 'object', properties: { rooms: { type: 'number' } } },
    created_at: '2026-03-21T12:00:00Z',
  },
  {
    version: 3,
    status: 'ROLLED_BACK',
    schema_json: { type: 'object' },
    created_at: '2026-03-22T08:00:00Z',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────
function renderPage() {
  return render(<AdminCategoriesPage />);
}

describe('AdminCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockAdminApiClient.adminListCategories!).mockResolvedValue(MOCK_CATEGORIES_PAGE);
    vi.mocked(mockAdminApiClient.adminCreateCategory!).mockImplementation(
      async (_token, payload) => ({
        id: 'cat-new',
        name: payload.name,
        name_mn: payload.name_mn,
        icon_url: payload.icon_url,
        is_active: true,
        sort_order: payload.sort_order,
        intake_enabled: payload.intake_enabled,
        assisted_distribution_enabled: payload.assisted_distribution_enabled,
        intake_schema_version: 0,
        intake_schema_json: null,
      }),
    );
    vi.mocked(mockAdminApiClient.adminUpdateCategory!).mockImplementation(
      async (_token, categoryId, payload) => {
        const existing = MOCK_CATEGORIES.find((c) => c.id === categoryId)!;
        return { ...existing, ...payload };
      },
    );
    vi.mocked(mockAdminApiClient.adminListCategorySchemas!).mockResolvedValue(MOCK_SCHEMA_VERSIONS);
    vi.mocked(mockAdminApiClient.adminCreateCategorySchema!).mockImplementation(
      async (_token, _categoryId, schemaJson) => ({
        version: 4,
        status: 'DRAFT',
        schema_json: schemaJson,
        created_at: new Date().toISOString(),
      }),
    );
    vi.mocked(mockAdminApiClient.adminActivateCategorySchema!).mockImplementation(
      async (_token, _categoryId, version) => ({
        version,
        status: 'ACTIVE',
        schema_json: {},
        created_at: new Date().toISOString(),
      }),
    );
  });

  // ── Loading state ──────────────────────────────────────────────────
  it('shows loading skeleton initially', () => {
    vi.mocked(mockAdminApiClient.adminListCategories!).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByTestId('categories-loading')).toBeInTheDocument();
  });

  // ── Category list ──────────────────────────────────────────────────
  it('renders category list after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();

    // Check Mongolian names are shown
    expect(
      screen.getByText('\u0426\u044d\u0432\u044d\u0440\u043b\u044d\u0433\u044d\u044d'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('\u0421\u0430\u043d\u0442\u0435\u0445\u043d\u0438\u043a'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('\u0426\u0430\u0445\u0438\u043b\u0433\u0430\u0430\u043d'),
    ).toBeInTheDocument();
  });

  it('shows is_active status for each category', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    expect(within(row1).getByText(/active/i)).toBeInTheDocument();

    const row2 = screen.getByTestId('category-row-cat-2');
    expect(within(row2).getByText(/inactive/i)).toBeInTheDocument();
  });

  it('shows sort_order and intake_enabled for each category', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    expect(within(row1).getByText(/Sort order/i)).toBeInTheDocument();
    expect(within(row1).getByText('1')).toBeInTheDocument();

    const row3 = screen.getByTestId('category-row-cat-3');
    expect(within(row3).getByText(/Sort order/i)).toBeInTheDocument();
    expect(within(row3).getByText('3')).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────
  it('shows empty state when no categories', async () => {
    vi.mocked(mockAdminApiClient.adminListCategories!).mockResolvedValue({
      data: [],
      cursor: { next: null, has_more: false },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/^empty$/i)).toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────────
  it('shows error state with retry', async () => {
    vi.mocked(mockAdminApiClient.adminListCategories!).mockRejectedValue(
      new Error('Network error'),
    );

    renderPage();

    const retryButton = await screen.findByRole('button', { name: /retry/i });
    expect(screen.getByText(/load error/i)).toBeInTheDocument();

    // Now fix the mock and retry
    vi.mocked(mockAdminApiClient.adminListCategories!).mockResolvedValue(MOCK_CATEGORIES_PAGE);

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });
  });

  // ── Create category ────────────────────────────────────────────────
  it('create category dialog submits correctly', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    // Open create dialog
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Moving' } });
    fireEvent.change(screen.getByLabelText(/name_mn/i), {
      target: { value: '\u0417\u04e9\u04e9\u0445' },
    });
    fireEvent.change(screen.getByLabelText(/icon/i), {
      target: { value: 'https://example.com/moving.png' },
    });
    fireEvent.change(screen.getByLabelText(/sort.?order/i), { target: { value: '4' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminCreateCategory).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          name: 'Moving',
          name_mn: '\u0417\u04e9\u04e9\u0445',
          icon_url: 'https://example.com/moving.png',
          sort_order: 4,
          assisted_distribution_enabled: false,
        }),
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ── Edit category ──────────────────────────────────────────────────
  it('edit category updates existing', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    fireEvent.click(within(row1).getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    });

    // Verify pre-filled values
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Cleaning');
    expect(screen.getByLabelText(/name_mn/i)).toHaveValue(
      '\u0426\u044d\u0432\u044d\u0440\u043b\u044d\u0433\u044d\u044d',
    );

    // Change name
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Deep Cleaning' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminUpdateCategory).toHaveBeenCalledWith(
        'test-token',
        'cat-1',
        expect.objectContaining({
          name: 'Deep Cleaning',
          assisted_distribution_enabled: true,
        }),
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ── Toggle active status ───────────────────────────────────────────
  it('toggle active status calls adminUpdateCategory', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    const toggle = within(row1).getByRole('switch');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockAdminApiClient.adminUpdateCategory).toHaveBeenCalledWith('test-token', 'cat-1', {
        is_active: false,
      });
    });
  });

  // ── Schema versions ────────────────────────────────────────────────
  it('schema versions list shows for expanded category', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    fireEvent.click(within(row1).getByRole('button', { name: /schema/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminListCategorySchemas).toHaveBeenCalledWith(
        'test-token',
        'cat-1',
      );
    });

    // Wait for schema versions to appear
    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('ROLLED_BACK')).toBeInTheDocument();
  });

  // ── Create schema version ──────────────────────────────────────────
  it('create schema version works', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    // Expand schema section
    const row1 = screen.getByTestId('category-row-cat-1');
    fireEvent.click(within(row1).getByRole('button', { name: /schema/i }));

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    // Click create schema button
    fireEvent.click(screen.getByRole('button', { name: /create schema/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/schema json/i)).toBeInTheDocument();
    });

    // Enter JSON
    const schemaInput = screen.getByLabelText(/schema json/i);
    fireEvent.change(schemaInput, {
      target: { value: '{"type":"object","properties":{"area":{"type":"number"}}}' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminCreateCategorySchema).toHaveBeenCalledWith(
        'test-token',
        'cat-1',
        { type: 'object', properties: { area: { type: 'number' } } },
        undefined,
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ── Activate schema ────────────────────────────────────────────────
  it('activate schema calls adminActivateCategorySchema', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    // Expand schema section
    const row1 = screen.getByTestId('category-row-cat-1');
    fireEvent.click(within(row1).getByRole('button', { name: /schema/i }));

    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });

    // Click activate on the DRAFT version (v2)
    const draftRow = screen.getByTestId('schema-row-2');
    fireEvent.click(within(draftRow).getByRole('button', { name: /activate/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminActivateCategorySchema).toHaveBeenCalledWith(
        'test-token',
        'cat-1',
        2,
        'ACTIVE',
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('rollback schema calls adminActivateCategorySchema with last-known-good mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
    });

    const row1 = screen.getByTestId('category-row-cat-1');
    fireEvent.click(within(row1).getByRole('button', { name: /schema/i }));

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    const activeRow = screen.getByTestId('schema-row-1');
    fireEvent.click(within(activeRow).getByRole('button', { name: /rollback/i }));

    await waitFor(() => {
      expect(mockAdminApiClient.adminActivateCategorySchema).toHaveBeenCalledWith(
        'test-token',
        'cat-1',
        1,
        'ROLLBACK_TO_LAST_KNOWN_GOOD',
      );
    });
  });
});
