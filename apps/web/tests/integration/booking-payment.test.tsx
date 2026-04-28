import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';
import { makeProfile, makeSession } from '../../src/test/factories';

describe('Booking Payment Integration', () => {
  it('TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance and disclaimer-gated confirmation', async () => {
    const apiClient = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
      acceptApplication: vi.fn().mockResolvedValue({
        id: 'intent-1',
        task_id: 'task-1',
        tasker_id: 'tasker-1',
        customer_id: 'customer-1',
        source: 'APPLICATION_SELECTION',
        status: 'PENDING',
        selected_application_id: 'application-1',
        original_booking_id: null,
        offer_id: null,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        confirmed_booking_id: null,
        confirmed_at: null,
        created_at: '2026-02-14T00:00:00Z',
        updated_at: '2026-02-14T00:00:00Z',
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
      expect(apiClient.acceptApplication).toHaveBeenCalledWith(
        'access-token',
        'task-1',
        'application-1',
        true,
        expect.any(String),
      );
    });

    expect(await screen.findByText(/Selection request sent/i)).toBeInTheDocument();
  });
});
