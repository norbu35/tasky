import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AppContext — CUSTOMER role
vi.mock("../../context/AppContext", () => ({
  useAppContext: vi.fn(() => ({ profile: { role: "CUSTOMER" } })),
}));

import { BottomNavBar } from "../BottomNavBar";
import { useAppContext } from "../../context/AppContext";

describe("BottomNavBar", () => {
  beforeEach(() => {
    vi.mocked(useAppContext).mockReturnValue({ profile: { role: "CUSTOMER" } } as ReturnType<typeof useAppContext>);
  });

  it("renders 4 customer tabs", () => {
    render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders 4 tasker tabs", () => {
    vi.mocked(useAppContext).mockReturnValue({ profile: { role: "TASKER" } } as ReturnType<typeof useAppContext>);
    render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(screen.getByText("Find Work")).toBeInTheDocument();
    expect(screen.getByText("My Jobs")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders nothing for ADMIN role", () => {
    vi.mocked(useAppContext).mockReturnValue({ profile: { role: "ADMIN" } } as ReturnType<typeof useAppContext>);
    const { container } = render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when profile is null (guest)", () => {
    vi.mocked(useAppContext).mockReturnValue({ profile: null } as ReturnType<typeof useAppContext>);
    const { container } = render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
