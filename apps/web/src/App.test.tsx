import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { App } from "./App";
import { createMemoryClientAnalyticsTracker } from "./lib/clientAnalytics";
import type {
  ApiClient,
  AuthTokens,
  Booking,
  Category,
  Conversation,
  Dispute,
  Message,
  Profile,
  Review,
  Task,
  User
} from "./lib/apiClient";

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

const baseBooking: Booking = {
  id: "booking-1",
  task_id: "task-1",
  tasker_id: "tasker-1",
  customer_id: "customer-1",
  price: 120000,
  status: "PENDING_PAYMENT",
  cancellation_fee: null,
  created_at: "2026-02-14T00:00:00Z"
};

const baseReview: Review = {
  id: "review-1",
  booking_id: "booking-1",
  reviewer_id: "customer-1",
  reviewee_id: "tasker-1",
  rating: 5,
  comment: "Great work",
  created_at: "2026-02-14T00:00:00Z"
};

const baseDispute: Dispute = {
  id: "dispute-1",
  booking_id: "booking-1",
  raised_by: "customer-1",
  reason: "Service quality issue",
  status: "OPEN",
  resolution: null,
  resolution_amount: null,
  resolution_notes: null,
  created_at: "2026-02-14T00:00:00Z",
  resolved_at: null
};

const baseMessage: Message = {
  id: "msg-1",
  conversation_id: "conv-1",
  sender_id: "customer-1",
  content: "Hello tasker",
  created_at: "2026-02-14T00:00:00Z"
};

const baseConversation: Conversation = {
  id: "conv-1",
  task_id: "task-1",
  task_title: "Apartment cleaning",
  customer_id: "customer-1",
  tasker_id: "tasker-1",
  last_message: baseMessage,
  unread_count: 0,
  created_at: "2026-02-14T00:00:00Z"
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
    }),
    acceptApplication: vi.fn().mockResolvedValue(baseBooking),
    initiatePayment: vi.fn().mockResolvedValue({
      paymentUrl: "https://qpay.example.test/pay/booking-1",
      qrCode: "BASE64-QR"
    }),
    listBookings: vi.fn().mockResolvedValue({
      data: [baseBooking],
      cursor: { next: null, prev: null }
    }),
    getBooking: vi.fn().mockResolvedValue(baseBooking),
    cancelBooking: vi.fn().mockResolvedValue({
      ...baseBooking,
      status: "CANCELLED"
    }),
    completeBooking: vi.fn().mockResolvedValue({
      ...baseBooking,
      status: "COMPLETED"
    }),
    submitReview: vi.fn().mockResolvedValue(baseReview),
    getUserReviews: vi.fn().mockResolvedValue({
      data: [baseReview],
      cursor: { next: null, prev: null }
    }),
    raiseDispute: vi.fn().mockResolvedValue(baseDispute),
    getDispute: vi.fn().mockResolvedValue(baseDispute),
    listConversations: vi.fn().mockResolvedValue({
      data: [baseConversation],
      cursor: { next: null, prev: null }
    }),
    listMessages: vi.fn().mockResolvedValue({
      data: [baseMessage],
      cursor: { next: null, prev: null }
    }),
    sendMessage: vi.fn().mockResolvedValue({
      ...baseMessage,
      id: "msg-2",
      content: "Status update"
    }),
    registerDevice: vi.fn().mockResolvedValue("Device registered."),
    unregisterDevice: vi.fn().mockResolvedValue(undefined),
    devLogin: vi.fn().mockResolvedValue(baseSession)
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

  it("TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW supports applicant acceptance, disclaimer, and payment initiation", async () => {
    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      acceptApplication: vi.fn().mockResolvedValue(baseBooking),
      initiatePayment: vi.fn().mockResolvedValue({
        paymentUrl: "https://qpay.example.test/pay/booking-1",
        qrCode: "BASE64-QR"
      })
    });

    render(
      <App apiClient={apiClient} initialRoute="/customer/booking-payment" initialSession={baseSession} />
    );

    await screen.findByRole("heading", { name: "Booking acceptance and payment" });

    fireEvent.change(screen.getByLabelText("Task ID"), { target: { value: "task-1" } });
    fireEvent.change(screen.getByLabelText("Application ID"), { target: { value: "application-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Accept application" }));

    await waitFor(() => {
      expect(apiClient.acceptApplication).toHaveBeenCalledWith(
        "access-token",
        "task-1",
        "application-1",
        expect.any(String)
      );
    });

    fireEvent.click(screen.getByLabelText(/I acknowledge the liability disclaimer/i));
    fireEvent.click(screen.getByRole("button", { name: "Initiate payment" }));

    await waitFor(() => {
      expect(apiClient.initiatePayment).toHaveBeenCalledWith("access-token", "booking-1", expect.any(String));
    });
    expect(await screen.findByText(/Payment URL:/)).toBeInTheDocument();
  });

  it("TID-TASK-081-WEB-BOOKING-SAFETY-FLOW supports booking transitions, review, and dispute actions", async () => {
    const paidBooking: Booking = {
      ...baseBooking,
      status: "PAID"
    };

    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile),
      getBooking: vi.fn().mockResolvedValue(paidBooking),
      cancelBooking: vi.fn().mockResolvedValue({ ...paidBooking, status: "CANCELLED" }),
      completeBooking: vi.fn().mockResolvedValue({ ...paidBooking, status: "COMPLETED" }),
      submitReview: vi.fn().mockResolvedValue(baseReview),
      raiseDispute: vi.fn().mockResolvedValue(baseDispute)
    });

    render(<App apiClient={apiClient} initialRoute="/booking/safety" initialSession={baseSession} />);

    await screen.findByRole("heading", { name: "Booking safety actions" });

    fireEvent.click(screen.getByRole("button", { name: "List bookings" }));
    await waitFor(() => {
      expect(apiClient.listBookings).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Booking ID"), { target: { value: "booking-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Load booking" }));
    await waitFor(() => {
      expect(apiClient.getBooking).toHaveBeenCalledWith("access-token", "booking-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await waitFor(() => {
      expect(apiClient.cancelBooking).toHaveBeenCalledWith("access-token", "booking-1", expect.any(String));
    });

    fireEvent.click(screen.getByRole("button", { name: "Complete booking" }));
    await waitFor(() => {
      expect(apiClient.completeBooking).toHaveBeenCalledWith("access-token", "booking-1", expect.any(String));
    });

    fireEvent.change(screen.getByLabelText("Review comment"), { target: { value: "Reliable and careful work." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
    await waitFor(() => {
      expect(apiClient.submitReview).toHaveBeenCalledWith(
        "access-token",
        "booking-1",
        expect.objectContaining({
          rating: 5,
          comment: "Reliable and careful work."
        })
      );
    });

    fireEvent.change(screen.getByLabelText("Dispute reason"), {
      target: { value: "There was a quality issue with part of the service." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Raise dispute" }));
    await waitFor(() => {
      expect(apiClient.raiseDispute).toHaveBeenCalledWith(
        "access-token",
        "booking-1",
        "There was a quality issue with part of the service.",
        expect.any(String)
      );
    });
  });

  it("TID-TASK-081-WEB-MSG-NOTIF-INTEGRATION supports messaging and notification device flows", async () => {
    const apiClient = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(baseProfile)
    });

    render(<App apiClient={apiClient} initialRoute="/communication" initialSession={baseSession} />);

    await screen.findByRole("heading", { name: "Messaging and notifications" });

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

  it("TID-TASK-090-OBS-CLIENT-EVENTS emits aligned client events with platform, locale, and actor role", async () => {
    const analytics = createMemoryClientAnalyticsTracker();

    const createdTask: Task = {
      id: "task-analytics-1",
      category_id: baseCategory.id,
      customer_id: baseUser.id,
      description: "Analytics task",
      budget: 98000,
      location_lat: 47.9184,
      location_lng: 106.9177,
      location_text: "Analytics location",
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
      <App
        apiClient={customerApi}
        initialRoute="/customer/tasks/new"
        initialSession={baseSession}
        locale="mn-MN"
        analyticsTracker={analytics.track}
      />
    );

    await screen.findByRole("heading", { name: "Create task" });
    fireEvent.change(screen.getByLabelText("Task details"), {
      target: { value: "Analytics deep cleaning request for TID-090 coverage." }
    });
    fireEvent.change(screen.getByLabelText("Budget (MNT)"), {
      target: { value: "98000" }
    });
    fireEvent.change(screen.getByLabelText("Address description"), {
      target: { value: "БГД 3-р хороо" }
    });
    fireEvent.change(screen.getByLabelText("Scheduled at"), {
      target: { value: localDateTimeInput(24) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    await waitFor(() => {
      expect(customerApi.createTask).toHaveBeenCalled();
    });

    customerRender.unmount();

    const taskerProfile: Profile = {
      ...baseProfile,
      role: "TASKER",
      status: "VERIFIED",
      full_name: "Analytics Tasker"
    };
    const taskerSession: AuthTokens = {
      ...baseSession,
      user: {
        ...baseUser,
        role: "TASKER",
        status: "VERIFIED"
      }
    };
    const taskerApi = buildApiClientMock({
      getMyProfile: vi.fn().mockResolvedValue(taskerProfile)
    });
    render(
      <App
        apiClient={taskerApi}
        initialRoute="/tasker/tasks"
        initialSession={taskerSession}
        locale="mn-MN"
        analyticsTracker={analytics.track}
      />
    );

    await screen.findByRole("heading", { name: "Open task feed" });
    fireEvent.change(screen.getByLabelText("Application message"), {
      target: { value: "Analytics instrumentation test task application." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply to task" }));
    await waitFor(() => {
      expect(taskerApi.applyToTask).toHaveBeenCalled();
    });

    const events = analytics.getEvents();
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_name: "TASK_POSTED",
          platform: "WEB",
          locale: "mn-MN",
          actor_role: "CUSTOMER",
          task_id: "task-analytics-1"
        }),
        expect.objectContaining({
          event_name: "APPLICATION_SUBMITTED",
          platform: "WEB",
          locale: "mn-MN",
          actor_role: "TASKER",
          task_id: "public-task-1"
        })
      ])
    );
  });
});
