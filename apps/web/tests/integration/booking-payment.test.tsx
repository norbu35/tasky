import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile, baseSession, baseBooking } from "../setup/mockData";

describe("Booking Payment Integration", () => {
  it("TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance and disclaimer-gated confirmation", async () => {
    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      acceptApplication: vi.fn().mockResolvedValue(baseBooking)
    });

    render(
      <App apiClient={apiClient} initialRoute="/customer/booking-confirmation" initialSession={baseSession} />
    );

    await screen.findByRole("heading", { name: "Booking confirmation" });

    fireEvent.change(screen.getByLabelText("Task ID"), { target: { value: "task-1" } });
    fireEvent.change(screen.getByLabelText("Application ID"), { target: { value: "application-1" } });
    fireEvent.click(screen.getByLabelText(/I acknowledge the liability disclaimer/i));
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    await waitFor(() => {
      expect(apiClient.acceptApplication).toHaveBeenCalledWith(
        "access-token",
        "task-1",
        "application-1",
        true,
        expect.any(String)
      );
    });
    expect(await screen.findByText(/Booking confirmed:/)).toBeInTheDocument();
  });
});
