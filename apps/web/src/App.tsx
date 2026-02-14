import type { paths } from "@tasky/sdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import {
  ApiError,
  createApiClient,
  type ApiClient,
  type AuthTokens,
  type Booking,
  type Category,
  type Conversation,
  type Dispute,
  type Message,
  type Profile,
  type Review,
  type Task,
  type TaskApplication,
  type User
} from "./lib/apiClient";
import {
  createConsoleClientAnalyticsTracker,
  resolveClientLocale,
  type ActorRole,
  type ClientAnalyticsTracker,
  type ClientEventName
} from "./lib/clientAnalytics";

type Role = "CUSTOMER" | "TASKER";

type AppContextValue = {
  apiClient: ApiClient;
  locale: string;
  session: AuthTokens | null;
  profile: Profile | null;
  profileBusy: boolean;
  profileError: string | null;
  setSession: (session: AuthTokens | null) => void;
  setProfile: (profile: Profile | null) => void;
  setProfileError: (message: string | null) => void;
  refreshProfile: () => Promise<void>;
  updateSessionUser: (user: User) => void;
  signOut: () => void;
  trackClientEvent: (eventName: ClientEventName, refs?: { taskId?: string; bookingId?: string }) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("App context is missing.");
  }
  return context;
}

function isRestrictedUser(profile: Profile | null): boolean {
  return profile?.status === "BANNED" || profile?.status === "SUSPENDED";
}

function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error. Please try again.";
}

function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function Header() {
  const { profile, signOut } = useAppContext();

  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
    ].join(" ");

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tasky Web MVP
        </p>
        <p className="text-sm text-foreground">{profile ? `${profile.full_name} (${profile.role})` : "Guest"}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
        <NavLink className={linkClass} to="/profile">
          Profile
        </NavLink>
        <NavLink className={linkClass} to="/customer/tasks/new">
          Customer
        </NavLink>
        <NavLink className={linkClass} to="/customer/booking-payment">
          Payment
        </NavLink>
        <NavLink className={linkClass} to="/booking/safety">
          Safety
        </NavLink>
        <NavLink className={linkClass} to="/tasker/tasks">
          Tasker
        </NavLink>
        <NavLink className={linkClass} to="/communication">
          Inbox
        </NavLink>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </nav>
    </header>
  );
}

function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-6">
        <Header />
        {children}
      </section>
    </main>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}

function RestrictedAccountPage() {
  const { profile, signOut } = useAppContext();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Account restricted</CardTitle>
            <CardDescription>
              This account is {profile?.status?.toLowerCase() ?? "restricted"}. Contact support for review.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={signOut}>Return to login</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

function AuthPage() {
  const contractLoaded: boolean = typeof ({} as paths) === "object";
  const { apiClient, setSession, setProfile, refreshProfile } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("+976");
  const [code, setCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof (location.state as { from?: string }).from === "string"
      ? (location.state as { from: string }).from
      : "/profile";

  const handleRequestOtp = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const message = await apiClient.requestOtp(phone.trim());
      setRequestMessage(message);
      setOtpRequested(true);
    } catch (error) {
      setErrorMessage(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const session = await apiClient.verifyOtp(phone.trim(), code.trim());
      setSession(session);
      setProfile(null);
      await refreshProfile();
      navigate(returnPath, { replace: true });
    } catch (error) {
      setErrorMessage(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-xl gap-6">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tasky Web MVP
            </p>
            <CardTitle>OTP Login</CardTitle>
            <CardDescription>
              OpenAPI SDK binding loaded: {String(contractLoaded)}. Authenticate to continue to profile and task
              workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+97699001122"
              />
            </div>
            {otpRequested ? (
              <div className="grid gap-2">
                <Label htmlFor="otp-code">OTP code</Label>
                <Input
                  id="otp-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                />
              </div>
            ) : null}
            {requestMessage ? <p className="text-sm text-muted-foreground">{requestMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button disabled={loading || phone.trim().length < 4} variant="secondary" onClick={handleRequestOtp}>
              Request OTP
            </Button>
            <Button disabled={loading || !otpRequested || code.trim().length < 4} onClick={handleVerify}>
              Verify OTP
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, profileBusy } = useAppContext();
  const location = useLocation();

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth" />;
  }

  if (isRestrictedUser(profile)) {
    return <Navigate replace to="/banned" />;
  }

  if (profileBusy && !profile) {
    return <LoadingCard message="Loading your account profile..." />;
  }

  return <>{children}</>;
}

function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAppContext();

  if (!profile) {
    return <LoadingCard message="Resolving role access..." />;
  }

  if (profile.role !== role) {
    return (
      <ScreenFrame>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{role === "TASKER" ? "Tasker role required" : "Customer role required"}</CardTitle>
            <CardDescription>
              Route guard blocked this path because your account role is currently {profile.role}.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <NavLink to="/profile">Go to profile</NavLink>
            </Button>
          </CardFooter>
        </Card>
      </ScreenFrame>
    );
  }

  return <>{children}</>;
}

function ProfilePage() {
  const {
    apiClient,
    session,
    profile,
    profileError,
    setProfile,
    setProfileError,
    refreshProfile,
    updateSessionUser
  } = useAppContext();

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [contentType, setContentType] = useState<"image/jpeg" | "image/png" | "image/webp">("image/png");
  const [generatedStorageKey, setGeneratedStorageKey] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const generateAvatarUploadUrl = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const response = await apiClient.getAvatarUploadUrl(session.accessToken, contentType);
      setGeneratedStorageKey(response.storageKey);
      setAvatarUrl(`https://cdn.tasky.local/${response.storageKey}`);
      setSuccessMessage("Avatar upload slot issued. Upload the file to the returned URL, then save profile.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const saveProfile = async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const updated = await apiClient.updateMyProfile(session.accessToken, {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim().length > 0 ? avatarUrl.trim() : null
      });
      setProfile(updated);
      setSuccessMessage("Profile saved.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const activateTaskerRole = async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setSuccessMessage(null);
    setProfileError(null);
    try {
      const user = await apiClient.activateTaskerRole(session.accessToken);
      updateSessionUser(user);
      await refreshProfile();
      setSuccessMessage("Tasker role activated.");
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Profile setup and updates</CardTitle>
          <CardDescription>
            Status: <span className="font-medium">{profile?.status ?? "UNKNOWN"}</span> | Role:{" "}
            <span className="font-medium">{profile?.role ?? "UNKNOWN"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Бат-Эрдэнэ"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-content-type">Avatar content type</Label>
            <select
              id="avatar-content-type"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={contentType}
              onChange={(event) => {
                setContentType(event.target.value as "image/jpeg" | "image/png" | "image/webp");
              }}
            >
              <option value="image/png">image/png</option>
              <option value="image/jpeg">image/jpeg</option>
              <option value="image/webp">image/webp</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://cdn.tasky.local/uploads/..."
            />
          </div>
          {generatedStorageKey ? (
            <p className="text-sm text-muted-foreground">Issued avatar storage key: {generatedStorageKey}</p>
          ) : null}
          {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-3">
          <Button disabled={working} onClick={generateAvatarUploadUrl} variant="secondary">
            Generate avatar upload URL
          </Button>
          <Button disabled={working} onClick={saveProfile}>
            Save profile
          </Button>
          {profile?.role === "CUSTOMER" ? (
            <Button disabled={working} onClick={activateTaskerRole} variant="ghost">
              Activate tasker role
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </ScreenFrame>
  );
}

function CustomerTaskPage() {
  const { apiClient, session, setProfileError, trackClientEvent } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("50000");
  const [locationText, setLocationText] = useState("");
  const [locationLat, setLocationLat] = useState("47.9184");
  const [locationLng, setLocationLng] = useState("106.9177");
  const [scheduledAt, setScheduledAt] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [applicationsByTask, setApplicationsByTask] = useState<Record<string, TaskApplication[]>>({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async (): Promise<void> => {
      if (!session) {
        return;
      }
      try {
        const response = await apiClient.listCategories(session.accessToken);
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId((previous) => previous || response.data[0].id);
        }
      } catch (error) {
        setProfileError(parseError(error));
      }
    };

    void loadCategories();
  }, [apiClient, session, setProfileError]);

  const createTask = async (): Promise<void> => {
    if (!session) {
      return;
    }

    if (!scheduledAt) {
      setMessage("Please choose a future schedule.");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setMessage("Invalid schedule format.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const created = await apiClient.createTask(session.accessToken, {
        category_id: categoryId,
        description: description.trim(),
        budget: Number(budget),
        location_lat: Number(locationLat),
        location_lng: Number(locationLng),
        location_text: locationText.trim(),
        scheduled_at: scheduledDate.toISOString()
      });
      setCreatedTasks((previous) => [created, ...previous]);
      trackClientEvent("TASK_POSTED", { taskId: created.id });
      setMessage("Task created.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadApplications = async (taskId: string): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listTaskApplications(session.accessToken, taskId);
      setApplicationsByTask((previous) => ({ ...previous, [taskId]: response.data }));
      setMessage(`Loaded ${response.data.length} application(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle>Create task</CardTitle>
            <CardDescription>
              Customer can create a task with category, location, schedule, and budget.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-category">Category</Label>
              <select
                id="task-category"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Task details</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="1-bedroom apartment deep cleaning"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-budget">Budget (MNT)</Label>
                <Input
                  id="task-budget"
                  inputMode="numeric"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-scheduled-at">Scheduled at</Label>
                <Input
                  id="task-scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-location-text">Address description</Label>
              <Input
                id="task-location-text"
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                placeholder="ХУД, 15-р хороо, Олимп хотхон"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-location-lat">Latitude</Label>
                <Input
                  id="task-location-lat"
                  inputMode="decimal"
                  value={locationLat}
                  onChange={(event) => setLocationLat(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-location-lng">Longitude</Label>
                <Input
                  id="task-location-lng"
                  inputMode="decimal"
                  value={locationLng}
                  onChange={(event) => setLocationLng(event.target.value)}
                />
              </div>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              disabled={
                working ||
                !categoryId ||
                description.trim().length < 10 ||
                locationText.trim().length < 5 ||
                !scheduledAt
              }
              onClick={createTask}
            >
              Create task
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My created tasks</CardTitle>
            <CardDescription>Load applications to validate customer-side applicant visibility.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {createdTasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks created yet.</p> : null}
            {createdTasks.map((task) => (
              <article className="rounded-md border border-border p-3" key={task.id}>
                <p className="text-sm font-medium">{task.description}</p>
                <p className="text-xs text-muted-foreground">Task ID: {task.id}</p>
                <p className="text-xs text-muted-foreground">Status: {task.status}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={working}
                    onClick={() => {
                      void loadApplications(task.id);
                    }}
                  >
                    Load applications
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Applications: {applicationsByTask[task.id]?.length ?? 0}
                  </span>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}

function TaskerFeedPage() {
  const { apiClient, session, setProfileError, trackClientEvent } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<{
    categoryId: string;
    lat: string;
    lng: string;
    radiusKm: string;
  }>({
    categoryId: "",
    lat: "47.9184",
    lng: "106.9177",
    radiusKm: "10"
  });
  const [taskCards, setTaskCards] = useState<Array<{ id: string; approximate_location: string; budget: number; description: string }>>(
    []
  );
  const [applyDrafts, setApplyDrafts] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async (): Promise<void> => {
    if (!session) {
      return;
    }
    try {
      const response = await apiClient.listCategories(session.accessToken);
      setCategories(response.data);
      if (response.data.length > 0) {
        setFilters((previous) => ({
          ...previous,
          categoryId: previous.categoryId || response.data[0].id
        }));
      }
    } catch (error) {
      setProfileError(parseError(error));
    }
  }, [apiClient, session, setProfileError]);

  const loadTaskFeed = useCallback(async (): Promise<void> => {
    if (!session) {
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listTasks(session.accessToken, {
        categoryId: filters.categoryId || undefined,
        lat: Number(filters.lat),
        lng: Number(filters.lng),
        radiusKm: Number(filters.radiusKm)
      });
      // Intentionally project only privacy-safe fields for feed display.
      setTaskCards(
        response.data.map((task) => ({
          id: task.id,
          approximate_location: task.approximate_location,
          budget: task.budget,
          description: task.description
        }))
      );
      setMessage(`Loaded ${response.data.length} open task(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  }, [apiClient, filters.categoryId, filters.lat, filters.lng, filters.radiusKm, session]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTaskFeed();
  }, [loadTaskFeed]);

  const applyToTask = async (taskId: string): Promise<void> => {
    if (!session) {
      return;
    }

    const draft = (applyDrafts[taskId] ?? "").trim();
    if (draft.length < 10) {
      setMessage("Application message must be at least 10 characters.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      await apiClient.applyToTask(session.accessToken, taskId, draft);
      setApplyDrafts((previous) => ({ ...previous, [taskId]: "" }));
      trackClientEvent("APPLICATION_SUBMITTED", { taskId });
      setMessage("Application sent.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Open task feed</CardTitle>
          <CardDescription>
            Feed uses privacy-safe approximate locations and lets verified taskers apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="feed-category">Category</Label>
              <select
                id="feed-category"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.categoryId}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, categoryId: event.target.value }));
                }}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-lat">Latitude</Label>
              <Input
                id="feed-lat"
                value={filters.lat}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, lat: event.target.value }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-lng">Longitude</Label>
              <Input
                id="feed-lng"
                value={filters.lng}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, lng: event.target.value }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feed-radius">Radius (km)</Label>
              <Input
                id="feed-radius"
                value={filters.radiusKm}
                onChange={(event) => {
                  setFilters((previous) => ({ ...previous, radiusKm: event.target.value }));
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={working} onClick={() => void loadTaskFeed()} variant="secondary">
              Refresh feed
            </Button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid gap-3">
            {taskCards.length === 0 ? <p className="text-sm text-muted-foreground">No open tasks found.</p> : null}
            {taskCards.map((task) => (
              <article className="rounded-md border border-border p-4" key={task.id}>
                <p className="text-sm font-medium">{task.description}</p>
                <p className="text-sm">Budget: {task.budget.toLocaleString("en-US")} MNT</p>
                <p className="text-sm text-muted-foreground">Approximate location: {task.approximate_location}</p>
                <div className="mt-3 grid gap-2">
                  <Label htmlFor={`apply-${task.id}`}>Application message</Label>
                  <Textarea
                    id={`apply-${task.id}`}
                    value={applyDrafts[task.id] ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setApplyDrafts((previous) => ({ ...previous, [task.id]: nextValue }));
                    }}
                    placeholder="I can complete this task by your requested time."
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={working}
                      onClick={() => {
                        void applyToTask(task.id);
                      }}
                      size="sm"
                    >
                      Apply to task
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </ScreenFrame>
  );
}

function BookingPaymentPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const [taskId, setTaskId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [acceptedBooking, setAcceptedBooking] = useState<Booking | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const acceptApplication = async (): Promise<void> => {
    if (!session) {
      return;
    }
    if (!taskId.trim() || !applicationId.trim()) {
      setMessage("Task ID and Application ID are required.");
      return;
    }

    setWorking(true);
    setMessage(null);
    setPaymentUrl(null);
    setQrCode(null);
    try {
      const booking = await apiClient.acceptApplication(
        session.accessToken,
        taskId.trim(),
        applicationId.trim(),
        createIdempotencyKey("accept")
      );
      setAcceptedBooking(booking);
      setBookingId(booking.id);
      trackClientEvent("TASKER_ACCEPTED", { taskId: taskId.trim(), bookingId: booking.id });
      setMessage(`Application accepted. Booking created: ${booking.id}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const initiatePayment = async (): Promise<void> => {
    if (!session) {
      return;
    }

    const bookingTarget = bookingId.trim() || acceptedBooking?.id;
    if (!bookingTarget) {
      setMessage("Booking ID is required before initiating payment.");
      return;
    }
    if (!disclaimerAccepted) {
      setMessage("Liability disclaimer must be accepted before payment.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const payment = await apiClient.initiatePayment(
        session.accessToken,
        bookingTarget,
        createIdempotencyKey("payment")
      );
      setPaymentUrl(payment.paymentUrl);
      setQrCode(payment.qrCode);
      trackClientEvent("PAYMENT_INITIATED", { bookingId: bookingTarget });
      setMessage("Payment initiated.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Booking acceptance and payment</CardTitle>
          <CardDescription>
            Accept an applicant, acknowledge the liability disclaimer, and initiate QPay payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="accept-task-id">Task ID</Label>
              <Input
                id="accept-task-id"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                placeholder="task-uuid"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accept-application-id">Application ID</Label>
              <Input
                id="accept-application-id"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="application-uuid"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={working} onClick={() => void acceptApplication()}>
              Accept application
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-booking-id">Booking ID</Label>
            <Input
              id="payment-booking-id"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              placeholder="booking-uuid"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground" htmlFor="liability-disclaimer">
            <input
              id="liability-disclaimer"
              checked={disclaimerAccepted}
              onChange={(event) => setDisclaimerAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>I acknowledge the liability disclaimer and want to proceed with payment.</span>
          </label>
          <div className="flex justify-end">
            <Button disabled={working || !disclaimerAccepted} onClick={() => void initiatePayment()}>
              Initiate payment
            </Button>
          </div>
          {paymentUrl ? (
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
              <p>
                Payment URL: <span className="font-medium">{paymentUrl}</span>
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">QR payload: {qrCode}</p>
            </div>
          ) : null}
          {acceptedBooking ? (
            <p className="text-sm text-muted-foreground">
              Booking status: <span className="font-medium">{acceptedBooking.status}</span>
            </p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </ScreenFrame>
  );
}

function BookingSafetyPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const [bookingId, setBookingId] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "customer" | "tasker">("customer");
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED">(
    ""
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewUserId, setReviewUserId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const listBookings = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.listBookings(session.accessToken, {
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setBookings(response.data);
      setMessage(`Loaded ${response.data.length} booking(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadBooking = async (): Promise<void> => {
    if (!session || !bookingId.trim()) {
      setMessage("Booking ID is required.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.getBooking(session.accessToken, bookingId.trim());
      setActiveBooking(booking);
      setReviewUserId(booking.tasker_id);
      setMessage("Booking loaded.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const cancelBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.cancelBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("cancel")
      );
      setActiveBooking(booking);
      setMessage("Booking cancelled.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const completeBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const booking = await apiClient.completeBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("complete")
      );
      setActiveBooking(booking);
      trackClientEvent("BOOKING_COMPLETED", {
        bookingId: booking.id,
        taskId: booking.task_id
      });
      setMessage("Booking marked complete.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const submitReview = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      setMessage("Rating must be between 1 and 5.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      await apiClient.submitReview(session.accessToken, activeBooking.id, {
        rating: numericRating,
        comment: reviewComment.trim() || null
      });
      setMessage("Review submitted.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const loadReviews = async (): Promise<void> => {
    if (!session || !reviewUserId.trim()) {
      setMessage("Review user ID is required.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const response = await apiClient.getUserReviews(session.accessToken, reviewUserId.trim());
      setReviews(response.data);
      setMessage(`Loaded ${response.data.length} review(s).`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const raiseDispute = async (): Promise<void> => {
    if (!session || !activeBooking) {
      setMessage("Load a booking first.");
      return;
    }
    if (disputeReason.trim().length < 10) {
      setMessage("Dispute reason must be at least 10 characters.");
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const dispute = await apiClient.raiseDispute(
        session.accessToken,
        activeBooking.id,
        disputeReason.trim(),
        createIdempotencyKey("dispute")
      );
      setActiveDispute(dispute);
      trackClientEvent("DISPUTE_RAISED", {
        bookingId: dispute.booking_id,
        taskId: activeBooking.task_id
      });
      setMessage(`Dispute raised: ${dispute.id}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const refreshDispute = async (): Promise<void> => {
    if (!session || !activeDispute) {
      return;
    }
    setWorking(true);
    setMessage(null);
    try {
      const dispute = await apiClient.getDispute(session.accessToken, activeDispute.id);
      setActiveDispute(dispute);
      setMessage(`Dispute status: ${dispute.status}`);
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle>Booking safety actions</CardTitle>
            <CardDescription>
              Track booking transitions, cancellations, completion, reviews, and disputes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="booking-role-filter">Booking role filter</Label>
                <select
                  id="booking-role-filter"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value as "" | "customer" | "tasker");
                  }}
                >
                  <option value="">All</option>
                  <option value="customer">customer</option>
                  <option value="tasker">tasker</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="booking-status-filter">Booking status filter</Label>
                <select
                  id="booking-status-filter"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value as "" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED"
                    );
                  }}
                >
                  <option value="">All</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAID">PAID</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={working} onClick={() => void listBookings()} variant="secondary">
                List bookings
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="safety-booking-id">Booking ID</Label>
              <Input
                id="safety-booking-id"
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                placeholder="booking-uuid"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={working} onClick={() => void loadBooking()} variant="secondary">
                Load booking
              </Button>
              <Button disabled={working || !activeBooking} onClick={() => void cancelBooking()}>
                Cancel booking
              </Button>
              <Button disabled={working || !activeBooking} onClick={() => void completeBooking()}>
                Complete booking
              </Button>
            </div>
            {activeBooking ? (
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                <p>
                  Current booking status: <span className="font-medium">{activeBooking.status}</span>
                </p>
                <p className="text-muted-foreground">Booking ID: {activeBooking.id}</p>
              </div>
            ) : null}
            <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)]">
              <div className="grid gap-2">
                <Label htmlFor="review-rating">Rating</Label>
                <Input
                  id="review-rating"
                  inputMode="numeric"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="review-comment">Review comment</Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Quality, punctuality, and communication feedback."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={working || !activeBooking} onClick={() => void submitReview()}>
                Submit review
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="review-user-id">Review user ID</Label>
                <Input
                  id="review-user-id"
                  value={reviewUserId}
                  onChange={(event) => setReviewUserId(event.target.value)}
                  placeholder="user-uuid"
                />
              </div>
              <Button disabled={working} onClick={() => void loadReviews()} variant="secondary">
                Load reviews
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dispute-reason">Dispute reason</Label>
              <Textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Describe what happened and what resolution you seek."
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={working || !activeBooking} onClick={() => void raiseDispute()}>
                Raise dispute
              </Button>
              <Button disabled={working || !activeDispute} onClick={() => void refreshDispute()} variant="secondary">
                Refresh dispute
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety snapshot</CardTitle>
            <CardDescription>Loaded bookings, reviews, and dispute detail.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <p className="text-sm font-medium">Bookings</p>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings loaded.</p>
              ) : (
                bookings.map((booking) => (
                  <p className="text-sm text-muted-foreground" key={booking.id}>
                    {booking.id}: {booking.status}
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Reviews</p>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews loaded.</p>
              ) : (
                reviews.map((review) => (
                  <p className="text-sm text-muted-foreground" key={review.id}>
                    {review.id}: {review.rating}/5
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Dispute</p>
              {activeDispute ? (
                <p className="text-sm text-muted-foreground">
                  {activeDispute.id}: {activeDispute.status}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No dispute loaded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}

function MessagingNotificationsPage() {
  const { apiClient, session } = useAppContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [working, setWorking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadConversations = useCallback(async (): Promise<void> => {
    if (!session) {
      return;
    }
    setWorking(true);
    setStatusMessage(null);
    try {
      const response = await apiClient.listConversations(session.accessToken);
      setConversations(response.data);
      setConversationId((previous) => previous || response.data[0]?.id || "");
      setStatusMessage(`Loaded ${response.data.length} conversation(s).`);
    } catch (error) {
      setStatusMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessages = async (): Promise<void> => {
    if (!session || !conversationId.trim()) {
      setStatusMessage("Conversation ID is required.");
      return;
    }
    setWorking(true);
    setStatusMessage(null);
    try {
      const response = await apiClient.listMessages(session.accessToken, conversationId.trim());
      setMessages(response.data);
      setStatusMessage(`Loaded ${response.data.length} message(s).`);
    } catch (error) {
      setStatusMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!session || !conversationId.trim()) {
      setStatusMessage("Conversation ID is required.");
      return;
    }
    if (messageDraft.trim().length < 1) {
      setStatusMessage("Message content is required.");
      return;
    }
    setWorking(true);
    setStatusMessage(null);
    try {
      const sent = await apiClient.sendMessage(session.accessToken, conversationId.trim(), messageDraft.trim());
      setMessages((previous) => [sent, ...previous]);
      setMessageDraft("");
      setStatusMessage("Message sent.");
    } catch (error) {
      setStatusMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const registerDevice = async (): Promise<void> => {
    if (!session || !deviceToken.trim()) {
      setStatusMessage("Device token is required.");
      return;
    }
    setWorking(true);
    setStatusMessage(null);
    try {
      const result = await apiClient.registerDevice(session.accessToken, {
        token: deviceToken.trim(),
        platform: "WEB"
      });
      setStatusMessage(result);
    } catch (error) {
      setStatusMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  const unregisterDevice = async (): Promise<void> => {
    if (!session || !deviceToken.trim()) {
      setStatusMessage("Device token is required.");
      return;
    }
    setWorking(true);
    setStatusMessage(null);
    try {
      await apiClient.unregisterDevice(session.accessToken, deviceToken.trim());
      setStatusMessage("Device unregistered.");
    } catch (error) {
      setStatusMessage(parseError(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border-border/70 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle>Messaging and notifications</CardTitle>
            <CardDescription>
              REST fallback messaging and push token registration for booking milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="conversation-id">Conversation ID</Label>
                <Input
                  id="conversation-id"
                  value={conversationId}
                  onChange={(event) => setConversationId(event.target.value)}
                  placeholder="conversation-uuid"
                />
              </div>
              <Button disabled={working} onClick={() => void loadConversations()} variant="secondary">
                Refresh conversations
              </Button>
            </div>
            <div className="flex justify-end">
              <Button disabled={working || !conversationId.trim()} onClick={() => void loadMessages()} variant="secondary">
                Load messages
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message-content">Message content</Label>
              <Textarea
                id="message-content"
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Send a message to update booking progress."
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={working || !conversationId.trim()} onClick={() => void sendMessage()}>
                Send message
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="push-device-token">Push device token</Label>
                <Input
                  id="push-device-token"
                  value={deviceToken}
                  onChange={(event) => setDeviceToken(event.target.value)}
                  placeholder="ExponentPushToken[...] or web token"
                />
              </div>
              <Button disabled={working || !deviceToken.trim()} onClick={() => void registerDevice()}>
                Register device
              </Button>
              <Button
                disabled={working || !deviceToken.trim()}
                onClick={() => void unregisterDevice()}
                variant="secondary"
              >
                Unregister device
              </Button>
            </div>
            {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <p className="text-sm font-medium">Conversations</p>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations loaded.</p>
              ) : (
                conversations.map((conversation) => (
                  <p className="text-sm text-muted-foreground" key={conversation.id}>
                    {conversation.id}: {conversation.task_title ?? "Task conversation"}
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Messages</p>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages loaded.</p>
              ) : (
                messages.map((message) => (
                  <p className="text-sm text-muted-foreground" key={message.id}>
                    {message.sender_id}: {message.content}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}

function HomeRedirect() {
  const { session, profile } = useAppContext();

  if (!session) {
    return <Navigate replace to="/auth" />;
  }

  if (isRestrictedUser(profile)) {
    return <Navigate replace to="/banned" />;
  }

  return <Navigate replace to="/profile" />;
}

function AppRoutes() {
  const { session } = useAppContext();

  return (
    <Routes>
      <Route element={<HomeRedirect />} path="/" />
      <Route element={session ? <Navigate replace to="/profile" /> : <AuthPage />} path="/auth" />
      <Route
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
        path="/profile"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTaskPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/new"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <BookingPaymentPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/booking-payment"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerFeedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/tasks"
      />
      <Route
        element={
          <ProtectedRoute>
            <BookingSafetyPage />
          </ProtectedRoute>
        }
        path="/booking/safety"
      />
      <Route
        element={
          <ProtectedRoute>
            <MessagingNotificationsPage />
          </ProtectedRoute>
        }
        path="/communication"
      />
      <Route
        element={
          session ? (
            <RestrictedAccountPage />
          ) : (
            <Navigate replace state={{ from: "/banned" }} to="/auth" />
          )
        }
        path="/banned"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

function AppShell({
  apiClient,
  initialSession,
  locale,
  analyticsTracker
}: {
  apiClient: ApiClient;
  initialSession: AuthTokens | null;
  locale: string;
  analyticsTracker: ClientAnalyticsTracker;
}) {
  const [session, setSession] = useState<AuthTokens | null>(initialSession);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileBusy, setProfileBusy] = useState(Boolean(initialSession));
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!session) {
      setProfile(null);
      setProfileBusy(false);
      return;
    }

    setProfileBusy(true);
    setProfileError(null);

    try {
      const loaded = await apiClient.getMyProfile(session.accessToken);
      setProfile(loaded);
    } catch (error) {
      setProfileError(parseError(error));
    } finally {
      setProfileBusy(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(() => {
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setProfileBusy(false);
  }, []);

  const updateSessionUser = useCallback((user: User) => {
    setSession((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        user
      };
    });
  }, []);

  const trackClientEvent = useCallback(
    (eventName: ClientEventName, refs?: { taskId?: string; bookingId?: string }) => {
      const actorRole = (profile?.role ?? session?.user?.role ?? "UNKNOWN") as ActorRole;
      analyticsTracker({
        event_name: eventName,
        platform: "WEB",
        locale,
        actor_role: actorRole,
        task_id: refs?.taskId,
        booking_id: refs?.bookingId,
        timestamp: new Date().toISOString()
      });
    },
    [analyticsTracker, locale, profile?.role, session?.user?.role]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      apiClient,
      locale,
      session,
      profile,
      profileBusy,
      profileError,
      setSession,
      setProfile,
      setProfileError,
      refreshProfile,
      updateSessionUser,
      signOut,
      trackClientEvent
    }),
    [
      apiClient,
      locale,
      profile,
      profileBusy,
      profileError,
      refreshProfile,
      session,
      setSession,
      signOut,
      trackClientEvent,
      updateSessionUser
    ]
  );

  return (
    <AppContext.Provider value={value}>
      <AppRoutes />
    </AppContext.Provider>
  );
}

export interface AppProps {
  apiClient?: ApiClient;
  initialRoute?: string;
  initialSession?: AuthTokens | null;
  locale?: string;
  analyticsTracker?: ClientAnalyticsTracker;
}

export function App({
  apiClient,
  initialRoute,
  initialSession = null,
  locale,
  analyticsTracker
}: AppProps) {
  const resolvedApiClient = apiClient ?? createApiClient();
  const resolvedLocale = resolveClientLocale(locale);
  const resolvedAnalyticsTracker = analyticsTracker ?? createConsoleClientAnalyticsTracker();

  if (initialRoute) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppShell
          apiClient={resolvedApiClient}
          initialSession={initialSession}
          locale={resolvedLocale}
          analyticsTracker={resolvedAnalyticsTracker}
        />
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShell
        apiClient={resolvedApiClient}
        initialSession={initialSession}
        locale={resolvedLocale}
        analyticsTracker={resolvedAnalyticsTracker}
      />
    </BrowserRouter>
  );
}
