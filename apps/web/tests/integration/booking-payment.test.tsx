import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';
import { makeProfile, makeSession } from '../../src/test/factories';

describe('Booking Payment Integration', () => {
  it('TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance and disclaimer-gated confirmation', async () => {
    const apiClient = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
      selectApplication: vi.fn().mockResolvedValue({
        id: 'application-1',
        task_id: 'task-1',
        tasker: {
          id: 'tasker-1',
          full_name: 'Tasker',
          avatar_url: null,
          rating_avg: 4.6,
          completed_tasks: 7,
          is_pro: true,
        },
        message: 'I can do this task.',
        status: 'SELECTED',
        respond_by_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        created_at: '2026-02-14T00:00:00Z',
      }),
      listMyTasks: vi.fn().mockResolvedValue({ data: [] }),
      listTaskApplications: vi.fn().mockResolvedValue({ data: [] }),
    });

    render(
      <App
        apiClient={apiClient}
        initialRoute="/customer/booking-confirmation?taskId=task-1&applicationId=application-1"
        initialSession={makeSession()}
      />,
    );

    await screen.findByRole('heading', { name: 'Confirm Booking' });

    const disclaimerCheckbox = screen.getByLabelText(/Accept Terms & Liability Disclaimer/i);
    fireEvent.click(disclaimerCheckbox);

    const confirmButton = screen.getByRole('button', { name: 'Confirm Booking' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiClient.selectApplication).toHaveBeenCalledWith(
        'access-token',
        'task-1',
        'application-1',
      );
    });

    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
  });
});
