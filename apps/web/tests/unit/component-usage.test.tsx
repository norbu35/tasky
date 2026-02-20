import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";

describe("Component Usage Compliance", () => {
  it("TID-TASK-070-WEB-COMPONENT-USAGE-COMPLIANCE renders intake screen with shadcn components", async () => {
    const apiClient = buildApiClientMock();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole("button", { name: "Continue with Facebook" })).toBeInTheDocument();
    expect(screen.getByText("Developer Bypass")).toBeInTheDocument();
  });
});
