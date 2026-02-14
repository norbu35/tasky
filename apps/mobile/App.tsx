import type { paths } from "@tasky/sdk";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, FormField, Input, Toast } from "./src/components/ui";
import { mobileTheme } from "./src/design/tokenAdapter";
import {
  ApiError,
  createMobileApiClient,
  type AuthTokens,
  type MobileApiClient,
  type Profile,
  type PublicTask,
  type Task
} from "./src/lib/mobileApiClient";

type MobileRoute = "auth" | "profile" | "customer" | "tasker" | "restricted";
type ToastVariant = "info" | "success" | "error";

type AppProps = {
  apiClient?: MobileApiClient;
  initialRoute?: MobileRoute;
  initialSession?: AuthTokens | null;
  initialProfile?: Profile | null;
};

function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error. Please try again.";
}

function isRestricted(profile: Profile | null): boolean {
  return profile?.status === "BANNED" || profile?.status === "SUSPENDED";
}

function toFutureIso(hoursAhead: number): string {
  return new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();
}

export default function App({
  apiClient = createMobileApiClient(),
  initialRoute,
  initialSession = null,
  initialProfile = null
}: AppProps) {
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";

  const [session, setSession] = useState<AuthTokens | null>(initialSession);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [route, setRoute] = useState<MobileRoute>(
    initialRoute ?? (initialSession ? "profile" : "auth")
  );
  const [busy, setBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");

  const [phone, setPhone] = useState("+976");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("50000");
  const [locationText, setLocationText] = useState("");
  const [locationLat, setLocationLat] = useState("47.9184");
  const [locationLng, setLocationLng] = useState("106.9177");
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterRadiusKm, setFilterRadiusKm] = useState("10");
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [applyDrafts, setApplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setRoute("auth");
      return;
    }

    if (profile) {
      return;
    }

    const loadProfile = async (): Promise<void> => {
      setBusy(true);
      try {
        const loaded = await apiClient.getMyProfile(session.accessToken);
        setProfile(loaded);
        setFullName(loaded.full_name);
        setAvatarUrl(loaded.avatar_url ?? "");
      } catch (error) {
        setToastVariant("error");
        setToastMessage(parseError(error));
      } finally {
        setBusy(false);
      }
    };

    void loadProfile();
  }, [apiClient, profile, session]);

  useEffect(() => {
    if (isRestricted(profile)) {
      setRoute("restricted");
    }
  }, [profile]);

  const guardError = useMemo(() => {
    if (!session && route !== "auth") {
      return "Authentication required";
    }
    if (route === "customer" && profile?.role !== "CUSTOMER") {
      return "Customer route is blocked for your role.";
    }
    if (route === "tasker" && profile?.role !== "TASKER") {
      return "Tasker route is blocked for your role.";
    }
    return null;
  }, [profile?.role, route, session]);

  const showToast = (message: string, variant: ToastVariant = "info"): void => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const signOut = (): void => {
    setSession(null);
    setProfile(null);
    setRoute("auth");
    setOtpCode("");
    setOtpRequested(false);
    showToast("Signed out.", "info");
  };

  const requestOtp = async (): Promise<void> => {
    setBusy(true);
    try {
      const message = await apiClient.requestOtp(phone.trim());
      setOtpRequested(true);
      showToast(message, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (): Promise<void> => {
    setBusy(true);
    try {
      const nextSession = await apiClient.verifyOtp(phone.trim(), otpCode.trim());
      setSession(nextSession);
      const loaded = await apiClient.getMyProfile(nextSession.accessToken);
      setProfile(loaded);
      setFullName(loaded.full_name);
      setAvatarUrl(loaded.avatar_url ?? "");
      setRoute("profile");
      showToast("Authenticated successfully.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const generateAvatarUpload = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const upload = await apiClient.getAvatarUploadUrl(session.accessToken, "image/png");
      setAvatarUrl(`https://cdn.tasky.local/${upload.storageKey}`);
      showToast(`Avatar upload key issued: ${upload.storageKey}`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const updated = await apiClient.updateMyProfile(session.accessToken, {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim().length > 0 ? avatarUrl.trim() : null
      });
      setProfile(updated);
      showToast("Profile saved.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const activateTaskerRole = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const user = await apiClient.activateTaskerRole(session.accessToken);
      const loaded = await apiClient.getMyProfile(session.accessToken);
      setSession({ ...session, user });
      setProfile(loaded);
      showToast("Tasker role activated.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadCategories = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.listCategories(session.accessToken);
      const firstCategoryId = response.data[0]?.id ?? "";
      setCategoryId(firstCategoryId);
      setFilterCategory(firstCategoryId);
      showToast(`Loaded ${response.data.length} categories.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const created = await apiClient.createTask(session.accessToken, {
        category_id: categoryId.trim(),
        description: description.trim(),
        budget: Number(budget),
        location_lat: Number(locationLat),
        location_lng: Number(locationLng),
        location_text: locationText.trim(),
        scheduled_at: toFutureIso(24)
      });
      setCreatedTask(created);
      showToast("Task created.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadTaskFeed = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.listTasks(session.accessToken, {
        categoryId: filterCategory.trim() || undefined,
        lat: 47.9184,
        lng: 106.9177,
        radiusKm: Number(filterRadiusKm)
      });
      setTasks(response.data);
      showToast(`Loaded ${response.data.length} open tasks.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const applyToTask = async (taskId: string): Promise<void> => {
    if (!session) {
      return;
    }
    const message = (applyDrafts[taskId] ?? "").trim();
    if (message.length < 10) {
      showToast("Application message must be at least 10 characters.", "error");
      return;
    }

    setBusy(true);
    try {
      await apiClient.applyToTask(session.accessToken, taskId, message);
      setApplyDrafts((previous) => ({ ...previous, [taskId]: "" }));
      showToast("Application submitted.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const renderAuth = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>OTP sign-in</Text>
      <FormField label="Phone" helperText="Use E.164 format.">
        <Input
          accessibilityLabel="Phone input"
          value={phone}
          onChangeText={setPhone}
          placeholder="+97699001122"
        />
      </FormField>
      <FormField label="OTP code" helperText="Request OTP first.">
        <Input
          accessibilityLabel="OTP code input"
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="123456"
          keyboardType="number-pad"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Request OTP" variant="secondary" onPress={() => void requestOtp()} loading={busy} />
        <Button
          label="Verify OTP"
          onPress={() => void verifyOtp()}
          disabled={!otpRequested}
          loading={busy}
        />
      </View>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Profile setup</Text>
      <Text style={styles.metaText}>
        Role: {profile?.role ?? "-"} | Status: {profile?.status ?? "-"}
      </Text>
      <FormField label="Full name">
        <Input
          accessibilityLabel="Full name input"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Бат-Эрдэнэ"
        />
      </FormField>
      <FormField label="Avatar URL">
        <Input
          accessibilityLabel="Avatar URL input"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://cdn.tasky.local/uploads/..."
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button
          label="Generate avatar upload"
          variant="secondary"
          onPress={() => void generateAvatarUpload()}
          loading={busy}
        />
        <Button label="Save profile" onPress={() => void saveProfile()} loading={busy} />
      </View>
      <View style={styles.rowActions}>
        <Button label="Customer flow" variant="ghost" onPress={() => setRoute("customer")} />
        <Button label="Tasker flow" variant="ghost" onPress={() => setRoute("tasker")} />
      </View>
      {profile?.role === "CUSTOMER" ? (
        <Button label="Activate tasker role" variant="secondary" onPress={() => void activateTaskerRole()} />
      ) : null}
    </View>
  );

  const renderCustomer = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Customer task creation</Text>
      <View style={styles.rowActions}>
        <Button label="Load categories" variant="secondary" onPress={() => void loadCategories()} loading={busy} />
        <Button label="Back to profile" variant="ghost" onPress={() => setRoute("profile")} />
      </View>
      <FormField label="Category ID">
        <Input
          accessibilityLabel="Category ID input"
          value={categoryId}
          onChangeText={setCategoryId}
          placeholder="category-uuid"
        />
      </FormField>
      <FormField label="Description">
        <Input
          accessibilityLabel="Task description input"
          value={description}
          onChangeText={setDescription}
          placeholder="Deep cleaning task"
        />
      </FormField>
      <FormField label="Budget (MNT)">
        <Input
          accessibilityLabel="Budget input"
          value={budget}
          onChangeText={setBudget}
          placeholder="120000"
          keyboardType="numeric"
        />
      </FormField>
      <FormField label="Address description">
        <Input
          accessibilityLabel="Address text input"
          value={locationText}
          onChangeText={setLocationText}
          placeholder="ХУД 15-р хороо"
        />
      </FormField>
      <View style={styles.rowActions}>
        <FormField label="Latitude">
          <Input
            accessibilityLabel="Latitude input"
            value={locationLat}
            onChangeText={setLocationLat}
            placeholder="47.9184"
          />
        </FormField>
        <FormField label="Longitude">
          <Input
            accessibilityLabel="Longitude input"
            value={locationLng}
            onChangeText={setLocationLng}
            placeholder="106.9177"
          />
        </FormField>
      </View>
      <Button label="Create task" onPress={() => void createTask()} loading={busy} />
      {createdTask ? (
        <Text style={styles.metaText}>Created task: {createdTask.id}</Text>
      ) : null}
    </View>
  );

  const renderTasker = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Tasker discovery and apply</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={() => setRoute("profile")} />
        <Button label="Load task feed" variant="secondary" onPress={() => void loadTaskFeed()} loading={busy} />
      </View>
      <FormField label="Filter category ID">
        <Input
          accessibilityLabel="Filter category input"
          value={filterCategory}
          onChangeText={setFilterCategory}
          placeholder="category-uuid"
        />
      </FormField>
      <FormField label="Filter radius (km)">
        <Input
          accessibilityLabel="Filter radius input"
          value={filterRadiusKm}
          onChangeText={setFilterRadiusKm}
          placeholder="10"
          keyboardType="numeric"
        />
      </FormField>
      {tasks.length === 0 ? (
        <Text style={styles.metaText}>No open tasks loaded.</Text>
      ) : (
        tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.description}</Text>
            <Text style={styles.metaText}>Approximate location: {task.approximate_location}</Text>
            <Text style={styles.metaText}>Budget: {task.budget} MNT</Text>
            <FormField label="Apply message">
              <Input
                accessibilityLabel={`Apply message input ${task.id}`}
                value={applyDrafts[task.id] ?? ""}
                onChangeText={(value) =>
                  setApplyDrafts((previous) => ({
                    ...previous,
                    [task.id]: value
                  }))
                }
                placeholder="I can complete this task."
              />
            </FormField>
            <Button label="Apply to task" onPress={() => void applyToTask(task.id)} loading={busy} />
          </View>
        ))
      )}
    </View>
  );

  const renderRestricted = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Account restricted</Text>
      <Text style={styles.metaText}>
        Your account status is {profile?.status ?? "unknown"}. Contact support for review.
      </Text>
      <Button label="Sign out" onPress={signOut} />
    </View>
  );

  const renderGuard = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Route guard</Text>
      <Text style={styles.metaText}>{guardError}</Text>
      <Button label="Go to profile" variant="secondary" onPress={() => setRoute("profile")} />
    </View>
  );

  const content = (() => {
    if (route === "restricted") {
      return renderRestricted();
    }

    if (guardError) {
      return renderGuard();
    }

    if (route === "auth") {
      return renderAuth();
    }
    if (route === "profile") {
      return renderProfile();
    }
    if (route === "customer") {
      return renderCustomer();
    }
    return renderTasker();
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tasky Mobile MVP</Text>
        <Text style={styles.subtitle}>Shared token adapter active: {String(typedContractLoaded)}</Text>
        <Text style={styles.subtitle}>Current route: {route}</Text>
        {toastMessage ? <Toast message={toastMessage} variant={toastVariant} /> : null}
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background
  },
  container: {
    paddingHorizontal: mobileTheme.spacing.xl,
    paddingVertical: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.lg
  },
  title: {
    fontSize: mobileTheme.typography.heading,
    fontWeight: "700",
    color: mobileTheme.colors.foreground
  },
  subtitle: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.mutedForeground
  },
  panel: {
    gap: mobileTheme.spacing.md,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    padding: mobileTheme.spacing.lg,
    backgroundColor: mobileTheme.colors.card
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.body,
    fontWeight: "700",
    color: mobileTheme.colors.foreground
  },
  rowActions: {
    flexDirection: "row",
    gap: mobileTheme.spacing.md,
    flexWrap: "wrap"
  },
  metaText: {
    fontSize: mobileTheme.typography.caption,
    color: mobileTheme.colors.mutedForeground
  },
  taskCard: {
    gap: mobileTheme.spacing.sm,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.md,
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.secondary
  },
  taskTitle: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.secondaryForeground,
    fontWeight: "600"
  }
});
