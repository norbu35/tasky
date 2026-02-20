import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseSession, baseProfile, baseUser } from "../setup/mockData";
import type { Profile, AuthTokens } from "../../src/lib/apiClient";

describe("Authorization Guards Integration", () => {
  it("TID-TASK-080-WEB-AUTHZ-GUARDS enforce auth state, role gating, and banned-user UX", async () => {
    const guestApi = buildApiClientMock();
    const guestRender = render(<App apiClient={guestApi} initialRoute="/customer/tasks/new" />);

    expect(await screen.findByRole("heading", { name: "OTP Login" })).toBeInTheDocument();

    guestRender.unmount();

    const customerApi = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile)
    });
    const customerRender = render(
      <App apiClient={customerApi} initialRoute="/tasker/tasks" initialSession={baseSession} />
    );

    expect(await screen.findByRole("heading", { name: "Tasker role required" })).toBeInTheDocument();

    customerRender.unmount();

    const bannedProfile: Profile = {
      ...baseProfile,
      status: "BANNED"
    };

    const bannedSession: AuthTokens = {
      ...baseSession,
      user: {
        ...baseUser,
        status: "BANNED"
      }
    };

    const bannedApi = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(bannedProfile)
    });

    render(<App apiClient={bannedApi} initialRoute="/profile" initialSession={bannedSession} />);

    expect(await screen.findByRole("heading", { name: "Account restricted" })).toBeInTheDocument();
  });
});
