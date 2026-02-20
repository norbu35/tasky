import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile, baseSession, baseBooking, baseReview, baseDispute } from "../setup/mockData";
import type { Booking } from "../../src/lib/apiClient";

describe("Booking Safety Integration", () => {
  it("TID-TASK-081-WEB-BOOKING-SAFETY-FLOW supports booking transitions, review, and dispute actions", async () => {
    const activeBooking: Booking = {
      ...baseBooking,
      status: "ASSIGNED"
    };

    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      getBooking: vi.fn().mockResolvedValue(activeBooking),
      cancelBooking: vi.fn().mockResolvedValue({ ...activeBooking, status: "CANCELLED" }),
      completeBooking: vi.fn().mockResolvedValue({ ...activeBooking, status: "COMPLETED" }),
      submitReview: vi.fn().mockResolvedValue(baseReview),
      raiseDispute: vi.fn().mockResolvedValue(baseDispute)
    });

    render(<App apiClient={apiClient} initialRoute="/booking/safety" initialSession={baseSession} />);

    await screen.findByRole("heading", { name: "Booking safety actions" });

    fireEvent.click(screen.getByRole("button", { name: "List bookings" }));
    await waitFor(() => {
      expect(apiClient.listBookings).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Booking ID"), { target: { value: "booking-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Load booking" }));
    await waitFor(() => {
      expect(apiClient.getBooking).toHaveBeenCalledWith("access-token", "booking-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await waitFor(() => {
      expect(apiClient.cancelBooking).toHaveBeenCalledWith("access-token", "booking-1", expect.any(String));
    });

    fireEvent.click(screen.getByRole("button", { name: "Complete booking" }));
    await waitFor(() => {
      expect(apiClient.completeBooking).toHaveBeenCalledWith("access-token", "booking-1", expect.any(String));
    });

    fireEvent.change(screen.getByLabelText("Review comment"), { target: { value: "Reliable and careful work." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
    await waitFor(() => {
      expect(apiClient.submitReview).toHaveBeenCalledWith(
        "access-token",
        "booking-1",
        expect.objectContaining({
          rating: 5,
          comment: "Reliable and careful work."
        })
      );
    });

    fireEvent.change(screen.getByLabelText("Dispute reason"), {
      target: { value: "There was a quality issue with part of the service." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Raise dispute" }));
    await waitFor(() => {
      expect(apiClient.raiseDispute).toHaveBeenCalledWith(
        "access-token",
        "booking-1",
        "There was a quality issue with part of the service.",
        expect.any(String)
      );
    });
  });
});
