import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock AppContext ──────────────────────────────────────────────────
vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    session: null,
    profile: null,
    signOut: vi.fn(),
  })),
}));

import { useAppContext } from '../../context/AppContext';
import { AdminRoute } from '../../router/AdminRoute';
import { AdminLayout } from '../AdminLayout';

// ── Helpers ──────────────────────────────────────────────────────────
function mockContext(overrides: Partial<ReturnType<typeof useAppContext>>) {
  vi.mocked(useAppContext).mockReturnValue({
    session: null,
    profile: null,
    signOut: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAppContext>);
}

const ADMIN_SESSION = { accessToken: 'tok', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } };
const CUSTOMER_SESSION = {
  accessToken: 'tok',
  refreshToken: 'rt',
  user: { id: '2', role: 'CUSTOMER' },
};
const TASKER_SESSION = {
  accessToken: 'tok',
  refreshToken: 'rt',
  user: { id: '3', role: 'TASKER' },
};

// ── AdminRoute tests ────────────────────────────────────────────────
describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /', () => {
    mockContext({ session: null, profile: null });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>admin-content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('home-page')).toBeInTheDocument();
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
  });

  it('redirects CUSTOMER role to /', () => {
    mockContext({
      session: CUSTOMER_SESSION as ReturnType<typeof useAppContext>['session'],
      profile: { role: 'CUSTOMER' } as ReturnType<typeof useAppContext>['profile'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>admin-content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('home-page')).toBeInTheDocument();
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
  });

  it('redirects TASKER role to /', () => {
    mockContext({
      session: TASKER_SESSION as ReturnType<typeof useAppContext>['session'],
      profile: { role: 'TASKER' } as ReturnType<typeof useAppContext>['profile'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>admin-content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('home-page')).toBeInTheDocument();
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
  });

  it('renders children for ADMIN role', () => {
    mockContext({
      session: ADMIN_SESSION as ReturnType<typeof useAppContext>['session'],
      profile: { role: 'ADMIN' } as ReturnType<typeof useAppContext>['profile'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>admin-content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('admin-content')).toBeInTheDocument();
    expect(screen.queryByText('home-page')).not.toBeInTheDocument();
  });
});

// ── AdminLayout tests ───────────────────────────────────────────────
describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext({
      session: ADMIN_SESSION as ReturnType<typeof useAppContext>['session'],
      profile: { role: 'ADMIN' } as ReturnType<typeof useAppContext>['profile'],
      signOut: vi.fn(),
    });
  });

  it('renders sidebar with all 6 navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/admin/verifications']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="verifications" element={<div>verifications-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('navigation', { name: /admin navigation$/i });

    expect(within(sidebar).getByRole('link', { name: /verifications/i })).toHaveAttribute(
      'href',
      '/admin/verifications',
    );
    expect(within(sidebar).getByRole('link', { name: /disputes/i })).toHaveAttribute(
      'href',
      '/admin/disputes',
    );
    expect(within(sidebar).getByRole('link', { name: /users/i })).toHaveAttribute(
      'href',
      '/admin/users',
    );
    expect(within(sidebar).getByRole('link', { name: /categories/i })).toHaveAttribute(
      'href',
      '/admin/categories',
    );
    expect(within(sidebar).getByRole('link', { name: /features/i })).toHaveAttribute(
      'href',
      '/admin/features',
    );
    expect(within(sidebar).getByRole('link', { name: /concierge/i })).toHaveAttribute(
      'href',
      '/admin/concierge',
    );
  });

  it('highlights active nav item based on route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/disputes']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="disputes" element={<div>disputes-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('navigation', { name: /admin navigation$/i });
    const disputesLink = within(sidebar).getByRole('link', { name: /disputes/i });
    const verificationsLink = within(sidebar).getByRole('link', { name: /verifications/i });

    // active link should have the active indicator class
    expect(disputesLink.className).toMatch(/text-primary|bg-primary/);
    // inactive link should NOT have the active indicator
    expect(verificationsLink.className).not.toMatch(/text-primary|bg-primary/);
  });

  it('renders sign-out button', () => {
    render(
      <MemoryRouter initialEntries={['/admin/verifications']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="verifications" element={<div>verifications-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('renders Outlet for child content', () => {
    render(
      <MemoryRouter initialEntries={['/admin/verifications']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="verifications" element={<div>child-outlet-content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('child-outlet-content')).toBeInTheDocument();
  });
});
