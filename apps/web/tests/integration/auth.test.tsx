import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseProfile } from "../setup/mockData";
import type { Profile } from "../../src/lib/apiClient";

describe("Auth Integration", () => {
  it("TID-TASK-080-WEB-AUTH-OTP-FLOW supports OTP auth and profile setup/update with avatar upload", async () => {
    const updatedProfile: Profile = {
      ...baseProfile,
      full_name: "Updated Profile Name",
      avatar_url: "https://cdn.tasky.local/uploads/avatars/avatar-1.png"
    };

    const apiClient = buildApiClientMock({
      updateMyProfile: vi.fn().mockResolvedValue(updatedProfile)
    });

    render(<App apiClient={apiClient} initialRoute="/auth" />);

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+97699112233" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Request OTP" }));

    await waitFor(() => {
      expect(apiClient.requestOtp).toHaveBeenCalledWith("+97699112233");
    });

    fireEvent.change(screen.getByLabelText("OTP code"), {
      target: { value: "123456" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify OTP" }));

    await screen.findByRole("heading", { name: "Profile setup and updates" });

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Updated Profile Name" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Generate avatar upload URL" }));
    await screen.findByText(/Issued avatar storage key:/);

    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(apiClient.updateMyProfile).toHaveBeenCalledWith(
        "access-token",
        expect.objectContaining({
          full_name: "Updated Profile Name",
          avatar_url: expect.stringContaining("uploads/avatars/avatar-1.png")
        })
      );
    });

    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
  });
});
