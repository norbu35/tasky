import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../context/AppContext";
import type { PublicTask, User, Booking } from "../../../lib/apiClient";

type PageState = "idle" | "loading" | "error" | "ready" | "assigning" | "success" | "assign-error";

export function AdminConciergePage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  // ── Tasks state ──────────────────────────────────────────────────
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("idle");

  // ── Tasker search state ──────────────────────────────────────────
  const [phoneQuery, setPhoneQuery] = useState("");
  const [taskerResults, setTaskerResults] = useState<User[]>([]);
  const [selectedTaskerId, setSelectedTaskerId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Assignment form state ────────────────────────────────────────
  const [overrideReason, setOverrideReason] = useState("");
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  // ── Result state ─────────────────────────────────────────────────
  const [booking, setBooking] = useState<Booking | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const accessToken = session?.accessToken ?? "";

  // ── Load open tasks ──────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setPageState("loading");
    try {
      const result = await apiClient.listTasks(accessToken);
      setTasks(result.data.filter((task) => task.status === "OPEN"));
      setPageState("ready");
    } catch {
      setPageState("error");
    }
  }, [apiClient, accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadTasks();
    }
  }, [accessToken, loadTasks]);

  // ── Search taskers ───────────────────────────────────────────────
  const handleSearchTaskers = async () => {
    if (!phoneQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await apiClient.adminSearchUsers(accessToken, phoneQuery.trim());
      setTaskerResults(result.data.filter((user) => user.role === "TASKER"));
    } catch {
      setTaskerResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Assign task ──────────────────────────────────────────────────
  const canAssign =
    selectedTaskId !== null &&
    selectedTaskerId !== null &&
    overrideReason.length >= 3 &&
    disclaimerChecked;

  const handleAssign = async () => {
    if (!canAssign || !selectedTaskId || !selectedTaskerId) return;
    setPageState("assigning");
    setAssignError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await apiClient.adminConciergeAssignTask(
        accessToken,
        selectedTaskId,
        selectedTaskerId,
        overrideReason,
        true,
        idempotencyKey
      );
      setBooking(result);
      setPageState("success");
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Assignment failed");
      setPageState("assign-error");
    }
  };

  // ── Error state ──────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("admin.concierge.title", "Concierge Dispatch")}</h1>
        <p>{t("admin.concierge.loadError", "Failed to load tasks.")}</p>
        <button onClick={loadTasks}>{t("common.retry", "Retry")}</button>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────
  if (pageState === "success" && booking) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("admin.concierge.title", "Concierge Dispatch")}</h1>
        <div data-testid="assignment-success">
          <h2 className="text-lg font-semibold">
            {t("admin.concierge.assignmentSuccess", "Assignment Successful")}
          </h2>
          <p>
            {t("admin.concierge.bookingId", "Booking ID")}: {booking.id}
          </p>
          <p>
            {t("admin.concierge.status", "Status")}: {booking.status}
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────
  if (pageState === "loading" || pageState === "idle") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("admin.concierge.title", "Concierge Dispatch")}</h1>
        <div data-testid="concierge-loading">
          <p>{t("common.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  // ── Main content ─────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.concierge.title", "Concierge Dispatch")}</h1>

      {/* Section 1: Open Tasks */}
      <section className="mt-4">
        <h2 className="text-lg font-semibold">
          {t("admin.concierge.selectTask", "Select an Open Task")}
        </h2>
        <div className="mt-2 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              data-testid={`task-row-${task.id}`}
              data-selected={selectedTaskId === task.id ? "true" : "false"}
              className={`cursor-pointer rounded border p-3 ${
                selectedTaskId === task.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <p className="font-medium">{task.description}</p>
              <p className="text-sm text-gray-500">
                {task.category.name} &middot; {task.budget.toLocaleString()}
                {t("common.currency", " MNT")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Find a Tasker */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">
          {t("admin.concierge.findTasker", "Find a Tasker")}
        </h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder={t("admin.concierge.phonePlaceholder", "Phone number")}
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <button
            onClick={handleSearchTaskers}
            disabled={searchLoading}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {t("admin.concierge.search", "Search")}
          </button>
        </div>

        {taskerResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {taskerResults.map((user) => (
              <div
                key={user.id}
                data-testid={`user-row-${user.id}`}
                data-selected={selectedTaskerId === user.id ? "true" : "false"}
                className={`cursor-pointer rounded border p-3 ${
                  selectedTaskerId === user.id ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
                onClick={() => setSelectedTaskerId(user.id)}
              >
                <p className="font-medium">{user.phone ?? user.id}</p>
                <p className="text-sm text-gray-500">
                  {user.role} &middot; {user.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Assignment Form */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">
          {t("admin.concierge.assignmentForm", "Assignment")}
        </h2>
        <div className="mt-2 space-y-3">
          <input
            type="text"
            placeholder={t("admin.concierge.reasonPlaceholder", "Override reason (min 3 chars)")}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={disclaimerChecked}
              onChange={(e) => setDisclaimerChecked(e.target.checked)}
            />
            {t(
              "admin.concierge.disclaimerLabel",
              "I accept liability for this manual assignment"
            )}
          </label>

          {pageState === "assign-error" && assignError && (
            <div data-testid="assignment-error" className="text-red-600">
              <p>{assignError}</p>
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={!canAssign || pageState === "assigning"}
            className="rounded bg-green-600 px-6 py-2 text-white disabled:opacity-50"
          >
            {pageState === "assigning"
              ? t("common.loading", "Loading...")
              : t("admin.concierge.assign", "Assign")}
          </button>
        </div>
      </section>
    </div>
  );
}
