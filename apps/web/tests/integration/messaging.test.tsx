import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile, baseSession } from "../setup/mockData";

describe("Messaging & Notifications Integration", () => {
  it("TID-TASK-081-WEB-MSG-NOTIF-INTEGRATION supports messaging and notification device flows", async () => {
    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile)
    });

    render(<App apiClient={apiClient} initialRoute="/communication" initialSession={baseSession} />);

    await screen.findByRole("heading", { name: "Messaging and notifications" });
    await screen.findByText("Loaded 1 conversation(s).");

    fireEvent.click(screen.getByRole("button", { name: "Load messages" }));
    await waitFor(() => {
      expect(apiClient.listMessages).toHaveBeenCalledWith("access-token", "conv-1");
    });

    fireEvent.change(screen.getByLabelText("Message content"), { target: { value: "Status update" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      expect(apiClient.sendMessage).toHaveBeenCalledWith("access-token", "conv-1", "Status update");
    });

    fireEvent.change(screen.getByLabelText("Push device token"), {
      target: { value: "ExponentPushToken[abc123]" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Register device" }));
    await waitFor(() => {
      expect(apiClient.registerDevice).toHaveBeenCalledWith("access-token", {
        token: "ExponentPushToken[abc123]",
        platform: "WEB"
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Unregister device" }));
    await waitFor(() => {
      expect(apiClient.unregisterDevice).toHaveBeenCalledWith("access-token", "ExponentPushToken[abc123]");
    });
  });
});
