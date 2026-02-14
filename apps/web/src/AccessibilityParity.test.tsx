import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { designTokens } from "../../../packages/design-tokens/tokens";
import { App } from "./App";
import type { ApiClient } from "./lib/apiClient";

function hexToRgb(hexColor: string): [number, number, number] {
  const clean = hexColor.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const int = Number.parseInt(normalized, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function relativeLuminance(hexColor: string): number {
  const [r, g, b] = hexToRgb(hexColor);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function buildApiClientMock(): ApiClient {
  return {
    requestOtp: vi.fn().mockResolvedValue("OTP sent"),
    verifyOtp: vi.fn().mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        phone: "+97699001122",
        role: "CUSTOMER",
        status: "PENDING",
        created_at: "2026-02-14T00:00:00Z"
      }
    }),
    getMyProfile: vi.fn().mockResolvedValue({
      id: "user-1",
      phone: "+97699001122",
      role: "CUSTOMER",
      status: "PENDING",
      full_name: "User",
      avatar_url: null,
      rating_avg: 0,
      completed_tasks: 0,
      is_pro: false,
      created_at: "2026-02-14T00:00:00Z"
    }),
    updateMyProfile: vi.fn(),
    getAvatarUploadUrl: vi.fn(),
    activateTaskerRole: vi.fn(),
    listCategories: vi.fn(),
    createTask: vi.fn(),
    listTasks: vi.fn(),
    applyToTask: vi.fn(),
    listTaskApplications: vi.fn(),
    acceptApplication: vi.fn(),
    initiatePayment: vi.fn(),
    listBookings: vi.fn(),
    getBooking: vi.fn(),
    cancelBooking: vi.fn(),
    completeBooking: vi.fn(),
    submitReview: vi.fn(),
    getUserReviews: vi.fn(),
    raiseDispute: vi.fn(),
    getDispute: vi.fn(),
    listConversations: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    registerDevice: vi.fn(),
    unregisterDevice: vi.fn(),
    devLogin: vi.fn()
  };
}

describe("Accessibility and parity gates", () => {
  it("TID-TASK-072-WEB-A11Y-KEYBOARD keeps key controls focusable for keyboard navigation", async () => {
    render(<App apiClient={buildApiClientMock()} initialRoute="/auth" />);

    const phoneInput = screen.getByLabelText("Phone number");
    const requestButton = screen.getByRole("button", { name: "Request OTP" });

    phoneInput.focus();
    expect(phoneInput).toHaveFocus();

    requestButton.focus();
    expect(requestButton).toHaveFocus();

    fireEvent.click(requestButton);

    const codeInput = await screen.findByLabelText("OTP code");
    const verifyButton = screen.getByRole("button", { name: "Verify OTP" });

    codeInput.focus();
    expect(codeInput).toHaveFocus();

    fireEvent.change(codeInput, { target: { value: "123456" } });

    verifyButton.focus();
    expect(verifyButton).toHaveFocus();
  });

  it("TID-TASK-072-WEB-A11Y-CONTRAST-AA enforces WCAG AA contrast for core token pairs", () => {
    const ratios = [
      contrastRatio(designTokens.colors.foreground.hex, designTokens.colors.background.hex),
      contrastRatio(designTokens.colors.primaryForeground.hex, designTokens.colors.primary.hex),
      contrastRatio(designTokens.colors.secondaryForeground.hex, designTokens.colors.secondary.hex)
    ];

    ratios.forEach((ratio) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("TID-TASK-072-CROSS-PLATFORM-PARITY-CHECK validates token usage and component state parity", () => {
    const webStyles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    const webButton = readFileSync(resolve(process.cwd(), "src/components/ui/button.tsx"), "utf8");
    const mobileButton = readFileSync(
      resolve(process.cwd(), "../mobile/src/components/ui/Button.tsx"),
      "utf8"
    );
    const mobileInput = readFileSync(
      resolve(process.cwd(), "../mobile/src/components/ui/Input.tsx"),
      "utf8"
    );
    const mobileAdapter = readFileSync(
      resolve(process.cwd(), "../mobile/src/design/tokenAdapter.ts"),
      "utf8"
    );

    expect(webStyles).toContain("--primary: var(--tasky-color-primary);");
    expect(webButton).toContain("secondary");
    expect(webButton).toContain("ghost");
    expect(mobileButton).toContain("loading");
    expect(mobileButton).toContain("disabled");
    expect(mobileInput).toContain("invalid");
    expect(mobileAdapter).toContain("designTokens.colors.primary.hex");
  });
});
