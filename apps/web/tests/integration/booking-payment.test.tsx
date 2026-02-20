import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile, baseSession, baseBooking } from "../setup/mockData";

describe("Booking Payment Integration", () => {
  it("TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance and disclaimer-gated confirmation", async () => {
    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      acceptApplication: vi.fn().mockResolvedValue(baseBooking),
      listMyTasks: vi.fn().mockResolvedValue({ data: [] }),
      listTaskApplications: vi.fn().mockResolvedValue({ data: [] })
    });

    render(
      <App apiClient={apiClient} initialRoute="/customer/booking-confirmation?taskId=task-1&applicationId=application-1" initialSession={baseSession} />
    );

    await screen.findByRole("heading", { name: "Confirm Booking" });

    const disclaimerCheckbox = screen.getByLabelText(/Accept Terms & Liability Disclaimer/i);
    fireEvent.click(disclaimerCheckbox);

    const confirmButton = screen.getByRole("button", { name: "Confirm Booking" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiClient.acceptApplication).toHaveBeenCalledWith(
        "access-token",
        "task-1",
        "application-1",
        true,
        expect.any(String)
      );
    });

    expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
  });
});
