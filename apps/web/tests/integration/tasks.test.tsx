import '../../src/lib/i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';
import {
  makeCategory,
  makeProfile,
  makeSession,
  makeUser,
  localDateTimeInput,
} from '../../src/test/factories';
import type { AuthTokens, Profile, Task } from '../../src/lib/apiClient';

describe('Tasks Integration', () => {
  it('TID-TASK-080-WEB-TASK-APPLICATION-FLOW supports task create, privacy-safe feed browsing, and tasker apply', async () => {
    const createdTask = {
      id: 'task-created-1',
      category_id: makeCategory().id,
      customer_id: makeUser().id,
      description: 'Deep clean two-bedroom apartment',
      budget: 120000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: 'Exact address kept private',
      status: 'OPEN',
      scheduled_at: '2026-02-16T00:00:00Z',
      photos: [],
      created_at: '2026-02-14T00:00:00Z',
    } as unknown as Task;

    const customerApi = createMockApiClient({
      createTask: vi.fn().mockResolvedValue(createdTask),
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
    });

    const customerRender = render(
      <App
        apiClient={customerApi}
        initialRoute="/customer/tasks/new"
        initialSession={makeSession()}
      />,
    );

    await screen.findByRole('heading', { name: 'Post a new task' });
    expect(
      screen.getByText(/add photos and place the map pin so taskers can find the job/i),
    ).toBeInTheDocument();

    const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
    await waitFor(() => {
      expect(categorySelect.options.length).toBeGreaterThan(1);
    });
    fireEvent.change(categorySelect, {
      target: { value: makeCategory().id },
    });
    fireEvent.change(screen.getByLabelText('Task details'), {
      target: { value: 'Deep clean two-bedroom apartment with kitchen and bathroom.' },
    });
    fireEvent.change(screen.getByLabelText('Estimated budget (MNT)'), {
      target: { value: '120000' },
    });
    fireEvent.change(screen.getByLabelText('Address description'), {
      target: { value: 'ХУД 15-р хороо' },
    });
    fireEvent.change(screen.getByLabelText('Scheduled at'), {
      target: { value: localDateTimeInput(24) },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(
      () => {
        expect(customerApi.createTask).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
    expect(await screen.findByText('Task created successfully.')).toBeInTheDocument();

    customerRender.unmount();

    const taskerProfile = {
      ...makeProfile(),
      role: 'TASKER',
      status: 'VERIFIED',
      full_name: 'Verified Tasker',
    } as unknown as Profile;

    const taskerSession: AuthTokens = {
      ...makeSession(),
      user: {
        ...makeUser(),
        role: 'TASKER',
        status: 'VERIFIED',
      },
    };

    const privacySafeTask = {
      id: 'public-task-privacy-1',
      category: makeCategory(),
      customer: {
        id: 'customer-99',
        full_name: 'Customer',
        avatar_url: null,
        rating_avg: 4.7,
      },
      description: 'Move furniture',
      budget: 90000,
      approximate_location: 'Баянзүрх дүүрэг',
      approximate_lat: 47.92,
      approximate_lng: 106.95,
      status: 'OPEN' as const,
      scheduled_at: '2026-02-16T00:00:00Z',
      photo_urls: [],
      application_count: 1,
      created_at: '2026-02-14T00:00:00Z',
      location_text: 'SHOULD NOT RENDER',
    };

    const taskerApi = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(taskerProfile),
      listTasks: vi.fn().mockResolvedValue({
        data: [privacySafeTask],
        cursor: { next: null, has_more: false },
      }),
    });

    render(
      <App apiClient={taskerApi} initialRoute="/tasker/tasks" initialSession={taskerSession} />,
    );

    await screen.findByRole('heading', { name: 'Open task feed' });
    await screen.findByText('Баянзүрх дүүрэг');
    expect(screen.queryByText('SHOULD NOT RENDER')).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'View Details & Apply' }));
    fireEvent.change(await screen.findByLabelText('Application message'), {
      target: { value: 'I can complete this task quickly and safely.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply to task' }));

    await waitFor(() => {
      expect(taskerApi.applyToTask).toHaveBeenCalledWith(
        'access-token',
        'public-task-privacy-1',
        'I can complete this task quickly and safely.',
        null,
      );
    });
    expect(await screen.findByText('Application sent.')).toBeInTheDocument();
  });
});
