import '../../src/lib/i18n';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '../../src/App';
import type { Task } from '../../src/lib/apiClient';
import { buildApiClientMock } from '../setup/mockApiClient';
import { baseProfile, baseSession, baseUser } from '../setup/mockData';

afterEach(() => {
  cleanup();
});

function renderApp(initialRoute: string, role: 'CUSTOMER' | 'TASKER' = 'CUSTOMER') {
  const task = {
    id: 'task-1',
    category_id: 'cat-cleaning',
    description: 'Deep clean apartment',
    budget: 120000,
    location_lat: 47.9184,
    location_lng: 106.9177,
    location_text: 'Exact location kept private',
    status: 'OPEN',
    scheduled_at: '2026-02-16T10:00:00Z',
    photos: [],
    intake_schema_version: 1,
    created_at: '2026-02-14T00:00:00Z',
  } as unknown as Task;

  const apiClient = buildApiClientMock({
    getMyProfile: async () => ({
      ...baseProfile,
      role,
      full_name: role === 'TASKER' ? 'Verified Tasker' : baseProfile.full_name,
    }),
    listMyTasks: async () => ({
      data: [task],
      cursor: { next: null, has_more: false },
    }),
  });

  return render(
    <App
      apiClient={apiClient}
      initialSession={{
        ...baseSession,
        user: {
          ...baseUser,
          role,
        },
      }}
      initialRoute={initialRoute}
    />,
  );
}

describe('Navigation phase 1 parity', () => {
  it('routes the shared inbox surface through the real app shell', async () => {
    renderApp('/inbox');

    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
  });

  it('routes the shared profile edit surface through the real app shell', async () => {
    renderApp('/profile/edit');

    expect(await screen.findByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
  });

  it('routes the customer task list surface through the real app shell', async () => {
    renderApp('/customer/tasks');

    expect(await screen.findByRole('heading', { name: 'My tasks' })).toBeInTheDocument();
  });

  it('routes the customer task success surface through the real app shell', async () => {
    renderApp('/customer/tasks/success');

    expect(
      await screen.findByRole('heading', { name: 'Task posted successfully' }),
    ).toBeInTheDocument();
  });

  it('routes the customer applicants surface through the real app shell', async () => {
    renderApp('/customer/tasks/task-1/applicants');

    expect(await screen.findByRole('heading', { name: 'Applicants' })).toBeInTheDocument();
  });

  it('routes the customer tasker profile surface through the real app shell', async () => {
    renderApp('/customer/taskers/tasker-1');

    expect(await screen.findByRole('heading', { name: 'Tasker profile' })).toBeInTheDocument();
  });

  it('routes the app update and customer bookings surfaces through the real app shell', async () => {
    renderApp('/app-update');
    expect(await screen.findByRole('heading', { name: 'Update required' })).toBeInTheDocument();

    cleanup();

    renderApp('/customer/bookings');
    expect(await screen.findByRole('heading', { name: 'Bookings' })).toBeInTheDocument();
  });

  it('routes the tasker parity surfaces through the real app shell', async () => {
    renderApp('/tasker/jobs', 'TASKER');
    expect(await screen.findByRole('heading', { name: 'My jobs' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Find Work' })).toSatisfy((links) =>
      links.every((link: HTMLAnchorElement) => link.getAttribute('href') === '/tasker/feed'),
    );
    expect(screen.getAllByRole('link', { name: 'My Jobs' })).toSatisfy((links) =>
      links.every((link: HTMLAnchorElement) => link.getAttribute('href') === '/tasker/jobs'),
    );
    expect(screen.getAllByRole('link', { name: 'Inbox' })).toSatisfy((links) =>
      links.every((link: HTMLAnchorElement) => link.getAttribute('href') === '/communication'),
    );

    cleanup();

    renderApp('/tasker/verification', 'TASKER');
    expect(
      await screen.findByRole('heading', { name: 'Identity verification' }),
    ).toBeInTheDocument();
  });
});
