import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import App from "../App";
import { mobileTheme } from "../src/design/tokenAdapter";
import { designTokens } from "../../../packages/design-tokens/tokens";
import type {
  AuthTokens,
  MobileApiClient,
  Profile,
  PublicTask,
  User
} from "../src/lib/mobileApiClient";

const baseUser: User = {
  id: "user-1",
  phone: "+97699001122",
  role: "CUSTOMER",
  status: "PENDING",
  created_at: "2026-02-14T00:00:00Z"
};

const baseSession: AuthTokens = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: baseUser
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

function buildMobileApiMock(overrides: Partial<MobileApiClient> = {}): MobileApiClient {
  const mock: MobileApiClient = {
    requestOtp: jest.fn().mockResolvedValue("OTP sent"),
    verifyOtp: jest.fn().mockResolvedValue(baseSession),
    getMyProfile: jest.fn().mockResolvedValue(baseProfile),
    updateMyProfile: jest.fn().mockImplementation(async (_token, payload) => ({
      ...baseProfile,
      full_name: payload.full_name ?? baseProfile.full_name,
      avatar_url: payload.avatar_url ?? baseProfile.avatar_url
    })),
    getAvatarUploadUrl: jest.fn().mockResolvedValue({
      uploadUrl: "https://upload.example.test/avatar",
      storageKey: "uploads/avatars/mobile-avatar.png"
    }),
    activateTaskerRole: jest.fn().mockResolvedValue({
      ...baseUser,
      role: "TASKER",
      status: "PENDING"
    }),
    listCategories: jest.fn().mockResolvedValue({
      data: [
        {
          id: "cat-cleaning",
          name: "Cleaning",
          name_mn: "Цэвэрлэгээ",
          icon_url: "https://example/icon.png",
          is_active: true,
          sort_order: 1
        }
      ],
      cursor: { next: null, prev: null }
    }),
    createTask: jest.fn().mockResolvedValue({
      id: "task-1",
      category_id: "cat-cleaning",
      customer_id: "user-1",
      description: "Apartment cleaning",
      budget: 90000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: "Hidden exact location",
      status: "OPEN",
      scheduled_at: "2026-02-15T00:00:00Z",
      photos: [],
      created_at: "2026-02-14T00:00:00Z"
    }),
    listTasks: jest.fn().mockResolvedValue({
      data: [
        {
          id: "public-task-1",
          category: {
            id: "cat-cleaning",
            name: "Cleaning",
            name_mn: "Цэвэрлэгээ",
            icon_url: "https://example/icon.png",
            is_active: true,
            sort_order: 1
          },
          customer: {
            id: "customer-1",
            full_name: "Customer",
            avatar_url: null,
            rating_avg: 4.7
          },
          description: "Window cleaning",
          budget: 70000,
          approximate_location: "Сүхбаатар дүүрэг",
          approximate_lat: 47.92,
          approximate_lng: 106.92,
          status: "OPEN",
          scheduled_at: "2026-02-16T00:00:00Z",
          photo_urls: [],
          application_count: 1,
          created_at: "2026-02-14T00:00:00Z"
        }
      ],
      cursor: { next: null, prev: null }
    }),
    applyToTask: jest.fn().mockResolvedValue({
      id: "app-1",
      task_id: "public-task-1",
      tasker: {
        id: "tasker-1",
        full_name: "Tasker",
        avatar_url: null,
        rating_avg: 4.9,
        completed_tasks: 12,
        is_pro: true
      },
      message: "I can complete this task.",
      status: "PENDING",
      created_at: "2026-02-14T00:00:00Z"
    })
  };

  return { ...mock, ...overrides };
}

describe("App", () => {
  it("TID-TASK-000-MOBILE-UNIT renders the mobile shell with SDK wiring baseline", () => {
    render(<App apiClient={buildMobileApiMock()} />);
    expect(screen.getByText("Tasky Mobile MVP")).toBeTruthy();
    expect(screen.getByText(/Shared token adapter active:/)).toBeTruthy();
    expect(screen.getByText(/Current route: auth/)).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-TOKEN-ADAPTER consumes shared design tokens via adapter", () => {
    expect(mobileTheme.colors.background).toBe(designTokens.colors.background.hex);
    expect(mobileTheme.colors.primary).toBe(designTokens.colors.primary.hex);

    render(<App apiClient={buildMobileApiMock()} />);
    expect(screen.getByText("Tasky Mobile MVP")).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-COMPONENT-PARITY-BASE renders core parity components and states", () => {
    render(<App apiClient={buildMobileApiMock()} />);

    expect(screen.getByRole("button", { name: "Request OTP" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Verify OTP" })).toBeTruthy();
    expect(screen.getByLabelText("Phone input")).toBeTruthy();
    expect(screen.getByLabelText("OTP code input")).toBeTruthy();
  });

  it("TID-TASK-071-MOBILE-STATE-SEMANTIC-PARITY enforces parity matrix documentation linkage", () => {
    const parityMatrix = readFileSync(resolve(process.cwd(), "../../docs/UI_PARITY_MATRIX.md"), "utf8");
    const architectureDoc = readFileSync(resolve(process.cwd(), "../../docs/ARCHITECTURE.md"), "utf8");

    expect(parityMatrix).toContain("Button");
    expect(parityMatrix).toContain("Modal/Sheet");
    expect(architectureDoc).toContain("docs/UI_PARITY_MATRIX.md");
  });

  it("TID-TASK-082-MOBILE-AUTH-OTP-FLOW supports OTP login and profile update with avatar upload", async () => {
    const apiClient = buildMobileApiMock();
    render(<App apiClient={apiClient} />);

    fireEvent.changeText(screen.getByLabelText("Phone input"), "+97699112233");
    fireEvent.press(screen.getByRole("button", { name: "Request OTP" }));

    await waitFor(() => {
      expect(apiClient.requestOtp).toHaveBeenCalledWith("+97699112233");
    });

    fireEvent.changeText(screen.getByLabelText("OTP code input"), "123456");
    fireEvent.press(screen.getByRole("button", { name: "Verify OTP" }));

    await waitFor(() => {
      expect(screen.getByText("Profile setup")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText("Full name input"), "Updated Mobile Name");
    fireEvent.press(screen.getByRole("button", { name: "Generate avatar upload" }));
    await waitFor(() => {
      expect(apiClient.getAvatarUploadUrl).toHaveBeenCalledWith("access-token", "image/png");
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save profile" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(apiClient.updateMyProfile).toHaveBeenCalledWith(
        "access-token",
        expect.objectContaining({
          full_name: "Updated Mobile Name",
          avatar_url: expect.stringContaining("uploads/avatars/mobile-avatar.png")
        })
      );
    });
  });

  it("TID-TASK-082-MOBILE-TASK-APPLICATION-FLOW supports customer create and tasker discover/apply", async () => {
    const customerApi = buildMobileApiMock();

    render(
      <App
        apiClient={customerApi}
        initialRoute="customer"
        initialSession={baseSession}
        initialProfile={baseProfile}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "Load categories" }));
    await waitFor(() => {
      expect(customerApi.listCategories).toHaveBeenCalled();
    });
    fireEvent.changeText(screen.getByLabelText("Task description input"), "Deep cleaning and disinfection");
    fireEvent.changeText(screen.getByLabelText("Address text input"), "ХУД 15-р хороо");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create task" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(customerApi.createTask).toHaveBeenCalled();
    });

    const taskerProfile: Profile = {
      ...baseProfile,
      role: "TASKER",
      status: "VERIFIED",
      full_name: "Tasker"
    };

    const taskerSession: AuthTokens = {
      ...baseSession,
      user: {
        ...baseUser,
        role: "TASKER",
        status: "VERIFIED"
      }
    };

    const privacyTask: PublicTask = {
      id: "public-task-privacy",
      category: {
        id: "cat-cleaning",
        name: "Cleaning",
        name_mn: "Цэвэрлэгээ",
        icon_url: "https://example/icon.png",
        is_active: true,
        sort_order: 1
      },
      customer: {
        id: "customer-1",
        full_name: "Customer",
        avatar_url: null,
        rating_avg: 4.6
      },
      description: "Move furniture",
      budget: 100000,
      approximate_location: "Баянзүрх дүүрэг",
      approximate_lat: 47.92,
      approximate_lng: 106.95,
      status: "OPEN",
      scheduled_at: "2026-02-16T00:00:00Z",
      photo_urls: [],
      application_count: 0,
      created_at: "2026-02-14T00:00:00Z"
    };

    const taskerApi = buildMobileApiMock({
      getMyProfile: jest.fn().mockResolvedValue(taskerProfile),
      listTasks: jest.fn().mockResolvedValue({
        data: [
          {
            ...privacyTask,
            location_text: "SHOULD_NOT_RENDER"
          } as PublicTask
        ],
        cursor: { next: null, prev: null }
      })
    });

    render(
      <App
        apiClient={taskerApi}
        initialRoute="tasker"
        initialSession={taskerSession}
        initialProfile={taskerProfile}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "Load task feed" }));
    await waitFor(() => {
      expect(taskerApi.listTasks).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Approximate location: Баянзүрх дүүрэг/)).toBeTruthy();
    });
    expect(screen.queryByText("SHOULD_NOT_RENDER")).toBeNull();

    fireEvent.changeText(
      screen.getByLabelText("Apply message input public-task-privacy"),
      "I can complete this task by your deadline."
    );
    fireEvent.press(screen.getByRole("button", { name: "Apply to task" }));

    await waitFor(() => {
      expect(taskerApi.applyToTask).toHaveBeenCalledWith(
        "access-token",
        "public-task-privacy",
        "I can complete this task by your deadline."
      );
    });
  });

  it("TID-TASK-082-MOBILE-AUTHZ-GUARDS enforces auth, role gating, and banned-user handling", async () => {
    const unauthApi = buildMobileApiMock();
    const unauthRender = render(<App apiClient={unauthApi} initialRoute="customer" />);

    expect(screen.getByText("OTP sign-in")).toBeTruthy();
    expect(screen.getByText(/Current route: auth/)).toBeTruthy();

    unauthRender.unmount();

    const customerApi = buildMobileApiMock();
    const customerRender = render(
      <App
        apiClient={customerApi}
        initialRoute="tasker"
        initialSession={baseSession}
        initialProfile={baseProfile}
      />
    );
    expect(screen.getByText("Tasker route is blocked for your role.")).toBeTruthy();

    customerRender.unmount();

    const bannedProfile: Profile = {
      ...baseProfile,
      status: "BANNED"
    };

    render(
      <App
        apiClient={buildMobileApiMock({ getMyProfile: jest.fn().mockResolvedValue(bannedProfile) })}
        initialRoute="profile"
        initialSession={{
          ...baseSession,
          user: {
            ...baseUser,
            status: "BANNED"
          }
        }}
        initialProfile={bannedProfile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Account restricted")).toBeTruthy();
    });
  });
});
