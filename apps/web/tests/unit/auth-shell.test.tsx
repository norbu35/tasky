import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";

describe("Auth Shell", () => {
  it("TID-TASK-000-WEB-UNIT renders the auth shell with SDK wiring baseline", () => {
    const apiClient = buildApiClientMock();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText(/OpenAPI SDK binding loaded:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Facebook" })).toBeInTheDocument();
  });
});
