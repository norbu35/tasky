import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseBooking, baseDispute, baseProfile, baseReview, baseSession } from "../setup/mockData";
import type { Booking } from "../../src/lib/apiClient";

// 1. Mock the DropdownMenu so its items are just rendered inline for easy clicking in JSDOM
vi.mock("../../src/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: never) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuTrigger: ({ children }: never) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: never) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: never) => (
        <button role="menuitem" onClick={onClick}>{children}</button>
    ),
}));

describe("Booking Safety Integration", () => {
    it("TID-TASK-081-WEB-BOOKING-SAFETY-FLOW supports booking transitions, review, and dispute actions", async () => {
        const activeBooking: Booking = { ...baseBooking, status: "ASSIGNED", id: "active-bkg" };
        const completedBooking: Booking = { ...baseBooking, status: "COMPLETED", id: "complete-bkg" };

        const apiClient = buildApiClientMock({
            getMyProfile: vi.fn().mockResolvedValue(baseProfile),
            listBookings: vi.fn().mockImplementation(async (_token, params) => {
                if (params?.status === "ASSIGNED") return { data: [activeBooking], cursor: { next: null, prev: null } };
                if (params?.status === "COMPLETED") return { data: [completedBooking], cursor: { next: null, prev: null } };
                return { data: [], cursor: { next: null, prev: null } };
            }),
            cancelBooking: vi.fn().mockResolvedValue({ ...activeBooking, status: "CANCELLED" }),
            completeBooking: vi.fn().mockResolvedValue({ ...activeBooking, status: "COMPLETED" }),
            submitReview: vi.fn().mockResolvedValue(baseReview),
            raiseDispute: vi.fn().mockResolvedValue(baseDispute)
        });

        render(<App apiClient={apiClient} initialRoute="/booking/safety" initialSession={baseSession} />);

        await screen.findByRole("heading", { name: /Booking Management/i });

        await waitFor(() => {
            expect(apiClient.listBookings).toHaveBeenCalled();
        });

        // We should see the active booking
        await screen.findByText(/active-b/i);

        // Since we mocked Dropdown, the menuitem is already visible!
        // Click Complete Task
        const completeMenu = await screen.findByRole("menuitem", { name: /Complete Task/i });
        fireEvent.click(completeMenu);

        // Inside dialog
        const confirmCompleteBtn = await screen.findByRole("button", { name: "Mark Completed" });
        fireEvent.click(confirmCompleteBtn);

        await waitFor(() => {
            expect(apiClient.completeBooking).toHaveBeenCalledWith("access-token", "active-bkg", expect.any(String));
        });

        // Switch to Completed Tab
        const completedTab = screen.getByRole("tab", { name: "Completed" });
        fireEvent.mouseDown(completedTab);
        fireEvent.click(completedTab);

        // Let's also trigger focus and keydown just in case for Radix UI
        fireEvent.focus(completedTab);
        fireEvent.keyDown(completedTab, { key: "Enter", code: "Enter" });

        await waitFor(() => {
            expect(completedTab.getAttribute("aria-selected")).toBe("true");
        });

        // Wait for completed booking to appear from mock listBookings refetch
        await screen.findByText(/complete-b/i);

        // Click Leave Review
        const reviewMenu = await screen.findByRole("menuitem", { name: /Leave Review/i });
        fireEvent.click(reviewMenu);

        // Inside Review Dialog
        await screen.findByRole("heading", { name: "Leave a Review" });
        fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "Great job!" } });
        fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

        await waitFor(() => {
            expect(apiClient.submitReview).toHaveBeenCalledWith(
                "access-token",
                "complete-bkg",
                expect.objectContaining({ rating: 5, comment: "Great job!" })
            );
        });

        // Click Raise Dispute
        const disputeMenu = await screen.findByRole("menuitem", { name: /Raise Dispute/i });
        fireEvent.click(disputeMenu);

        // Inside Dispute Dialog
        await screen.findByRole("heading", { name: /Raise a Dispute/i });
        fireEvent.change(screen.getByLabelText("Reason Category"), { target: { value: "POOR_QUALITY" } });
        fireEvent.change(screen.getByLabelText("Additional Details"), { target: { value: "There was a quality issue with part of the service." } });
        fireEvent.click(screen.getByRole("button", { name: "Submit Dispute" }));

        await waitFor(() => {
            expect(apiClient.raiseDispute).toHaveBeenCalledWith(
                "access-token",
                "complete-bkg",
                "[POOR_QUALITY] There was a quality issue with part of the service.",
                expect.any(String)
            );
        });
    });
});
