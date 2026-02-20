import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile, baseSession } from "../setup/mockData";

// JSDOM does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Messaging & Notifications Integration", () => {
  it("TID-TASK-081-WEB-MSG-NOTIF-INTEGRATION supports messaging and notification device flows", async () => {
    const mockConv = { id: "conv-1", task_id: "task-1", task_title: "Fix Sink", booking_id: "book-1" };
    const mockMsg = { id: "msg-1", conversation_id: "conv-1", sender_id: baseProfile.id, content: "On my way", created_at: new Date().toISOString() };

    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      listConversations: vi.fn().mockResolvedValue({ data: [mockConv], cursor: { next: null, prev: null } }),
      listMessages: vi.fn().mockResolvedValue({ data: [{ ...mockMsg }], cursor: { next: null, prev: null } }),
      sendMessage: vi.fn().mockResolvedValue({ ...mockMsg, id: "msg-2", sender_id: baseProfile.id, content: "Great", created_at: new Date().toISOString() }),
      registerDevice: vi.fn().mockResolvedValue("Success"),
      unregisterDevice: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <App
        apiClient={apiClient}
        initialSession={baseSession}
        initialRoute="/communication"
      />
    );

    // Verify Header
    await screen.findByRole("heading", { name: "Inbox" });

    // Wait for Conversations to load and the mock one to be active
    // The title "Fix Sink" is rendered inside a div alongside the Avatar + in the active chat header
    await screen.findAllByText(/Fix Sink/i);

    await waitFor(() => {
      expect(apiClient.listConversations).toHaveBeenCalled();
      expect(apiClient.listMessages).toHaveBeenCalledWith(baseSession.accessToken, "conv-1");
    });

    // Current messages
    await screen.findByText("On my way");

    // Send a message
    const messageInput = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(messageInput, { target: { value: "Great" } });

    const sendButton = screen.getByRole("button", { name: "Send" });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(apiClient.sendMessage).toHaveBeenCalledWith("access-token", "conv-1", "Great");
    });

    // Test push toggle (Notifications Switch)
    const pushToggle = screen.getByRole("switch");

    // Turn ON
    fireEvent.click(pushToggle);
    await waitFor(() => {
      expect(apiClient.registerDevice).toHaveBeenCalledWith("access-token", {
        token: expect.stringContaining("mock-web"),
        platform: "WEB"
      });
    });

    // Turn OFF
    fireEvent.click(pushToggle);
    await waitFor(() => {
      expect(apiClient.unregisterDevice).toHaveBeenCalledWith("access-token", "mock-token");
    });
  });
});
