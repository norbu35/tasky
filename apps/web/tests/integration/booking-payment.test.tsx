import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { createMockApiClient } from '../../src/test/mocks';
import { makeBooking, makeProfile, makeSession } from '../../src/test/factories';

describe('Booking Payment Integration', () => {
  it('TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance and disclaimer-gated confirmation', async () => {
    const apiClient = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
      acceptApplication: vi.fn().mockResolvedValue(makeBooking()),
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

    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
  });
});
