import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App";
import { buildApiClientMock } from "../setup/mockApiClient";
import { baseCategory, baseUser, baseSession, baseProfile, localDateTimeInput } from "../setup/mockData";
import { createMemoryClientAnalyticsTracker } from "../../src/lib/clientAnalytics";
import type { Task, Profile, AuthTokens } from "../../src/lib/apiClient";

describe("Analytics Integration", () => {
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
    const categorySelect = screen.getByLabelText("Category") as HTMLSelectElement;
    await waitFor(() => {
      expect(categorySelect.options.length).toBeGreaterThan(1);
    });
    fireEvent.change(categorySelect, {
      target: { value: baseCategory.id }
    });
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
    const appMessageBox = await screen.findByLabelText("Application message");
    fireEvent.change(appMessageBox, {
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
