import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { App } from "./App";
import type { ApiClient, AuthTokens, Category, Profile, Task, User } from "./lib/apiClient";

function localDateTimeInput(hoursAhead: number): string {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const baseUser: User = {
  id: "user-1",
  phone: "+97699001122",
  role: "CUSTOMER",
  status: "PENDING",
  created_at: "2026-02-14T00:00:00Z"
};

const baseProfile: Profile = {
  id: "user-1",
  phone: "+97699001122",
  role: "CUSTOMER",
  status: "PENDING",
  full_name: "Test Customer",
  avatar_url: null,
  rating_avg: 0,
  completed_tasks: 0,
  is_pro: false,
  created_at: "2026-02-14T00:00:00Z"
};

const baseSession: AuthTokens = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: baseUser
};

const baseCategory: Category = {
  id: "cat-cleaning",
  name: "Cleaning",
  name_mn: "Цэвэрлэгээ",
  icon_url: "https://example.test/icon.png",
  is_active: true,
  sort_order: 1
};

function buildApiClientMock(overrides: Partial<ApiClient> = {}): ApiClient {
  const mock: ApiClient = {
    requestOtp: vi.fn().mockResolvedValue("OTP sent to +97699****22"),
    verifyOtp: vi.fn().mockResolvedValue(baseSession),
    getMyProfile: vi.fn().mockResolvedValue(baseProfile),
    updateMyProfile: vi.fn().mockImplementation(async (_token, payload) => ({
      ...baseProfile,
      full_name: payload.full_name ?? baseProfile.full_name,
      avatar_url: payload.avatar_url ?? baseProfile.avatar_url
    })),
    getAvatarUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: "https://upload.example.test/avatar",
      storageKey: "uploads/avatars/avatar-1.png"
    }),
    activateTaskerRole: vi.fn().mockResolvedValue({
      ...baseUser,
      role: "TASKER",
      status: "PENDING"
    }),
    listCategories: vi.fn().mockResolvedValue({
      data: [baseCategory],
      cursor: { next: null, prev: null }
    }),
    createTask: vi.fn().mockResolvedValue({
      id: "task-1",
      category_id: baseCategory.id,
      customer_id: baseUser.id,
      description: "Apartment cleaning",
      budget: 85000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: "Exact location",
      status: "OPEN",
      scheduled_at: "2026-02-15T00:00:00Z",
      photos: [],
      created_at: "2026-02-14T00:00:00Z"
    }),
    listTasks: vi.fn().mockResolvedValue({
      data: [
        {
          id: "public-task-1",
          category: baseCategory,
          customer: {
            id: "customer-1",
            full_name: "Customer",
            avatar_url: null,
            rating_avg: 4.5
          },
          description: "Window cleaning",
          budget: 65000,
          approximate_location: "Сүхбаатар дүүрэг",
          approximate_lat: 47.92,
          approximate_lng: 106.92,
          status: "OPEN",
          scheduled_at: "2026-02-15T00:00:00Z",
          photo_urls: [],
          application_count: 0,
          created_at: "2026-02-14T00:00:00Z"
        }
      ],
      cursor: { next: null, prev: null }
    }),
    applyToTask: vi.fn().mockResolvedValue({
      id: "app-1",
      task_id: "public-task-1",
      tasker: {
        id: "tasker-1",
        full_name: "Tasker",
        avatar_url: null,
        rating_avg: 4.6,
        completed_tasks: 7,
        is_pro: true
      },
      message: "I can do this task tomorrow morning.",
      status: "PENDING",
      created_at: "2026-02-14T00:00:00Z"
    }),
    listTaskApplications: vi.fn().mockResolvedValue({
      data: [],
      cursor: { next: null, prev: null }
    })
  };

  return { ...mock, ...overrides };
}

describe("App", () => {
  it("TID-TASK-000-WEB-UNIT renders the auth shell with SDK wiring baseline", () => {
    const apiClient = buildApiClientMock();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole("heading", { name: "OTP Login" })).toBeInTheDocument();
    expect(screen.getByText(/OpenAPI SDK binding loaded:/)).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
  });

  it("TID-TASK-070-WEB-SHADCN-PRIMITIVES initializes shadcn primitives under components/ui", () => {
    render(
      <div>
        <Button>Primary Action</Button>
        <Input aria-label="Sample input" />
      </div>
    );

    expect(screen.getByRole("button", { name: "Primary Action" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sample input")).toBeInTheDocument();
  });

  it("TID-TASK-070-WEB-TOKEN-BINDING binds shared tokens to tailwind theme variables", () => {
    const stylesSource = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    const sharedTokenSource = readFileSync(
      resolve(process.cwd(), "../../packages/design-tokens/tokens.css"),
      "utf8"
    );
    const tailwindConfigSource = readFileSync(resolve(process.cwd(), "tailwind.config.ts"), "utf8");

    expect(stylesSource).toContain('@import "../../../packages/design-tokens/tokens.css"');
    expect(stylesSource).toContain("--background: var(--tasky-color-background);");
    expect(sharedTokenSource).toContain("--tasky-color-primary:");
    expect(tailwindConfigSource).toContain('background: "hsl(var(--background))"');
  });

  it("TID-TASK-070-WEB-COMPONENT-USAGE-COMPLIANCE renders intake screen with shadcn components", async () => {
    const apiClient = buildApiClientMock();
    render(<App apiClient={apiClient} initialRoute="/auth" />);

    expect(screen.getByRole("button", { name: "Request OTP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify OTP" })).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
  });

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

  it("TID-TASK-080-WEB-TASK-APPLICATION-FLOW supports task create, privacy-safe feed browsing, and tasker apply", async () => {
    const createdTask: Task = {
      id: "task-created-1",
      category_id: baseCategory.id,
      customer_id: baseUser.id,
      description: "Deep clean two-bedroom apartment",
      budget: 120000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: "Exact address kept private",
      status: "OPEN",
      scheduled_at: "2026-02-16T00:00:00Z",
      photos: [],
      created_at: "2026-02-14T00:00:00Z"
    };

    const customerApi = buildApiClientMock({
      createTask: vi.fn().mockResolvedValue(createdTask),
      getMyProfile: vi.fn().mockResolvedValue(baseProfile)
    });

    const customerRender = render(
      <App apiClient={customerApi} initialRoute="/customer/tasks/new" initialSession={baseSession} />
    );

    await screen.findByRole("heading", { name: "Create task" });

    fireEvent.change(screen.getByLabelText("Task details"), {
      target: { value: "Deep clean two-bedroom apartment with kitchen and bathroom." }
    });
    fireEvent.change(screen.getByLabelText("Budget (MNT)"), {
      target: { value: "120000" }
    });
    fireEvent.change(screen.getByLabelText("Address description"), {
      target: { value: "ХУД 15-р хороо" }
    });
    fireEvent.change(screen.getByLabelText("Scheduled at"), {
      target: { value: localDateTimeInput(24) }
    });

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(customerApi.createTask).toHaveBeenCalled();
    });
    expect(await screen.findByText("Task created.")).toBeInTheDocument();

    customerRender.unmount();

    const taskerProfile: Profile = {
      ...baseProfile,
      role: "TASKER",
      status: "VERIFIED",
      full_name: "Verified Tasker"
    };

    const taskerSession: AuthTokens = {
      ...baseSession,
      user: {
        ...baseUser,
        role: "TASKER",
        status: "VERIFIED"
      }
    };

    const privacySafeTask = {
      id: "public-task-privacy-1",
      category: baseCategory,
      customer: {
        id: "customer-99",
        full_name: "Customer",
        avatar_url: null,
        rating_avg: 4.7
      },
      description: "Move furniture",
      budget: 90000,
      approximate_location: "Баянзүрх дүүрэг",
      approximate_lat: 47.92,
      approximate_lng: 106.95,
      status: "OPEN" as const,
      scheduled_at: "2026-02-16T00:00:00Z",
      photo_urls: [],
      application_count: 1,
      created_at: "2026-02-14T00:00:00Z",
      location_text: "SHOULD NOT RENDER"
    };

    const taskerApi = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(taskerProfile),
      listTasks: vi.fn().mockResolvedValue({
        data: [privacySafeTask],
        cursor: { next: null, prev: null }
      })
    });

    render(<App apiClient={taskerApi} initialRoute="/tasker/tasks" initialSession={taskerSession} />);

    await screen.findByRole("heading", { name: "Open task feed" });
    expect(screen.getByText(/Approximate location: Баянзүрх дүүрэг/)).toBeInTheDocument();
    expect(screen.queryByText("SHOULD NOT RENDER")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Application message"), {
      target: { value: "I can complete this task quickly and safely." }
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply to task" }));

    await waitFor(() => {
      expect(taskerApi.applyToTask).toHaveBeenCalledWith(
        "access-token",
        "public-task-privacy-1",
        "I can complete this task quickly and safely."
      );
    });
    expect(await screen.findByText("Application sent.")).toBeInTheDocument();
  });

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
