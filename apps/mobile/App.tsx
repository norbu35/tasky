import type { paths } from "@tasky/sdk";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, FormField, Input, Toast } from "./src/components/ui";
import { mobileTheme } from "./src/design/tokenAdapter";
import {
  ApiError,
  createMobileApiClient,
  type AuthTokens,
  type Booking,
  type Conversation,
  type Dispute,
  type Message,
  type MobileApiClient,
  type Profile,
  type PublicTask,
  type Review,
  type Task
} from "./src/lib/mobileApiClient";

type MobileRoute =
  | "auth"
  | "profile"
  | "customer"
  | "tasker"
  | "payment"
  | "safety"
  | "communication"
  | "restricted";
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

function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
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

  const [acceptTaskId, setAcceptTaskId] = useState("");
  const [acceptApplicationId, setAcceptApplicationId] = useState("");
  const [paymentBookingId, setPaymentBookingId] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [acceptedBooking, setAcceptedBooking] = useState<Booking | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentQr, setPaymentQr] = useState("");

  const [safetyBookingId, setSafetyBookingId] = useState("");
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookingRoleFilter, setBookingRoleFilter] = useState<"" | "customer" | "tasker">("customer");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<
    "" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED"
  >("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewUserId, setReviewUserId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [deviceToken, setDeviceToken] = useState("");

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
    if ((route === "customer" || route === "payment") && profile?.role !== "CUSTOMER") {
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

  const acceptApplication = async (): Promise<void> => {
    if (!session) {
      return;
    }
    if (!acceptTaskId.trim() || !acceptApplicationId.trim()) {
      showToast("Task ID and application ID are required.", "error");
      return;
    }
    setBusy(true);
    try {
      const booking = await apiClient.acceptApplication(
        session.accessToken,
        acceptTaskId.trim(),
        acceptApplicationId.trim(),
        createIdempotencyKey("accept")
      );
      setAcceptedBooking(booking);
      setPaymentBookingId(booking.id);
      showToast(`Booking created: ${booking.id}`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const initiatePayment = async (): Promise<void> => {
    if (!session) {
      return;
    }
    const bookingId = paymentBookingId.trim() || acceptedBooking?.id;
    if (!bookingId) {
      showToast("Booking ID is required for payment.", "error");
      return;
    }
    if (!disclaimerAccepted) {
      showToast("Liability disclaimer must be accepted.", "error");
      return;
    }
    setBusy(true);
    try {
      const payment = await apiClient.initiatePayment(
        session.accessToken,
        bookingId,
        createIdempotencyKey("payment")
      );
      setPaymentUrl(payment.paymentUrl);
      setPaymentQr(payment.qrCode);
      showToast("Payment initiated.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const listBookingsSafety = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.listBookings(session.accessToken, {
        role: bookingRoleFilter || undefined,
        status: bookingStatusFilter || undefined
      });
      setBookings(response.data);
      showToast(`Loaded ${response.data.length} bookings.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadSafetyBooking = async (): Promise<void> => {
    if (!session || !safetyBookingId.trim()) {
      showToast("Booking ID is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const booking = await apiClient.getBooking(session.accessToken, safetyBookingId.trim());
      setActiveBooking(booking);
      setReviewUserId(booking.tasker_id);
      showToast("Booking loaded.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const cancelSafetyBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      showToast("Load booking first.", "error");
      return;
    }
    setBusy(true);
    try {
      const booking = await apiClient.cancelBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("cancel")
      );
      setActiveBooking(booking);
      showToast("Booking cancelled.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const completeSafetyBooking = async (): Promise<void> => {
    if (!session || !activeBooking) {
      showToast("Load booking first.", "error");
      return;
    }
    setBusy(true);
    try {
      const booking = await apiClient.completeBooking(
        session.accessToken,
        activeBooking.id,
        createIdempotencyKey("complete")
      );
      setActiveBooking(booking);
      showToast("Booking completed.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const submitSafetyReview = async (): Promise<void> => {
    if (!session || !activeBooking) {
      showToast("Load booking first.", "error");
      return;
    }
    const rating = Number(reviewRating);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      showToast("Review rating must be between 1 and 5.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiClient.submitReview(session.accessToken, activeBooking.id, {
        rating,
        comment: reviewComment.trim() || null
      });
      showToast("Review submitted.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadSafetyReviews = async (): Promise<void> => {
    if (!session || !reviewUserId.trim()) {
      showToast("Review user ID is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.getUserReviews(session.accessToken, reviewUserId.trim());
      setReviews(response.data);
      showToast(`Loaded ${response.data.length} reviews.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const raiseSafetyDispute = async (): Promise<void> => {
    if (!session || !activeBooking) {
      showToast("Load booking first.", "error");
      return;
    }
    if (disputeReason.trim().length < 10) {
      showToast("Dispute reason must be at least 10 characters.", "error");
      return;
    }
    setBusy(true);
    try {
      const dispute = await apiClient.raiseDispute(
        session.accessToken,
        activeBooking.id,
        disputeReason.trim(),
        createIdempotencyKey("dispute")
      );
      setActiveDispute(dispute);
      showToast(`Dispute raised: ${dispute.id}`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const refreshSafetyDispute = async (): Promise<void> => {
    if (!session || !activeDispute) {
      return;
    }
    setBusy(true);
    try {
      const dispute = await apiClient.getDispute(session.accessToken, activeDispute.id);
      setActiveDispute(dispute);
      showToast(`Dispute status: ${dispute.status}`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadConversations = async (): Promise<void> => {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.listConversations(session.accessToken);
      setConversations(response.data);
      setActiveConversationId(response.data[0]?.id ?? "");
      showToast(`Loaded ${response.data.length} conversations.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const loadConversationMessages = async (): Promise<void> => {
    if (!session || !activeConversationId.trim()) {
      showToast("Conversation ID is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await apiClient.listMessages(session.accessToken, activeConversationId.trim());
      setMessages(response.data);
      showToast(`Loaded ${response.data.length} messages.`, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const sendConversationMessage = async (): Promise<void> => {
    if (!session || !activeConversationId.trim()) {
      showToast("Conversation ID is required.", "error");
      return;
    }
    if (messageDraft.trim().length === 0) {
      showToast("Message content is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const sent = await apiClient.sendMessage(
        session.accessToken,
        activeConversationId.trim(),
        messageDraft.trim()
      );
      setMessages((previous) => [sent, ...previous]);
      setMessageDraft("");
      showToast("Message sent.", "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const registerPushDevice = async (): Promise<void> => {
    if (!session || !deviceToken.trim()) {
      showToast("Device token is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const message = await apiClient.registerDevice(session.accessToken, {
        token: deviceToken.trim(),
        platform: "WEB"
      });
      showToast(message, "success");
    } catch (error) {
      showToast(parseError(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const unregisterPushDevice = async (): Promise<void> => {
    if (!session || !deviceToken.trim()) {
      showToast("Device token is required.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiClient.unregisterDevice(session.accessToken, deviceToken.trim());
      showToast("Device unregistered.", "success");
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
      <View style={styles.rowActions}>
        <Button label="Booking payment" variant="ghost" onPress={() => setRoute("payment")} />
        <Button label="Booking safety" variant="ghost" onPress={() => setRoute("safety")} />
        <Button label="Messaging" variant="ghost" onPress={() => setRoute("communication")} />
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

  const renderPayment = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Booking payment</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={() => setRoute("profile")} />
      </View>
      <FormField label="Task ID">
        <Input
          accessibilityLabel="Accept task ID input"
          value={acceptTaskId}
          onChangeText={setAcceptTaskId}
          placeholder="task-uuid"
        />
      </FormField>
      <FormField label="Application ID">
        <Input
          accessibilityLabel="Accept application ID input"
          value={acceptApplicationId}
          onChangeText={setAcceptApplicationId}
          placeholder="application-uuid"
        />
      </FormField>
      <Button label="Accept application" onPress={() => void acceptApplication()} loading={busy} />
      <FormField label="Booking ID">
        <Input
          accessibilityLabel="Payment booking ID input"
          value={paymentBookingId}
          onChangeText={setPaymentBookingId}
          placeholder="booking-uuid"
        />
      </FormField>
      <Button
        label={disclaimerAccepted ? "Disclaimer acknowledged" : "Acknowledge disclaimer"}
        variant="secondary"
        onPress={() => setDisclaimerAccepted((previous) => !previous)}
      />
      <Button
        label="Initiate payment"
        onPress={() => void initiatePayment()}
        disabled={!disclaimerAccepted}
        loading={busy}
      />
      {acceptedBooking ? <Text style={styles.metaText}>Booking status: {acceptedBooking.status}</Text> : null}
      {paymentUrl ? <Text style={styles.metaText}>Payment URL: {paymentUrl}</Text> : null}
      {paymentQr ? <Text style={styles.metaText}>QR payload: {paymentQr}</Text> : null}
    </View>
  );

  const renderSafety = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Booking safety</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={() => setRoute("profile")} />
      </View>
      <FormField label="Booking role filter">
        <Input
          accessibilityLabel="Booking role filter input"
          value={bookingRoleFilter}
          onChangeText={(value) => setBookingRoleFilter((value as "customer" | "tasker") || "customer")}
          placeholder="customer | tasker"
        />
      </FormField>
      <FormField label="Booking status filter">
        <Input
          accessibilityLabel="Booking status filter input"
          value={bookingStatusFilter}
          onChangeText={(value) =>
            setBookingStatusFilter(
              (value as "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED") || ""
            )
          }
          placeholder="PENDING_PAYMENT | PAID | COMPLETED | CANCELLED"
        />
      </FormField>
      <Button label="List bookings" variant="secondary" onPress={() => void listBookingsSafety()} loading={busy} />
      <FormField label="Booking ID">
        <Input
          accessibilityLabel="Safety booking ID input"
          value={safetyBookingId}
          onChangeText={setSafetyBookingId}
          placeholder="booking-uuid"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Load booking" variant="secondary" onPress={() => void loadSafetyBooking()} loading={busy} />
        <Button label="Cancel booking" onPress={() => void cancelSafetyBooking()} loading={busy} />
        <Button label="Complete booking" onPress={() => void completeSafetyBooking()} loading={busy} />
      </View>
      {activeBooking ? (
        <Text style={styles.metaText}>Current booking status: {activeBooking.status}</Text>
      ) : null}
      <FormField label="Review rating">
        <Input
          accessibilityLabel="Review rating input"
          value={reviewRating}
          onChangeText={setReviewRating}
          keyboardType="numeric"
          placeholder="1-5"
        />
      </FormField>
      <FormField label="Review comment">
        <Input
          accessibilityLabel="Review comment input"
          value={reviewComment}
          onChangeText={setReviewComment}
          placeholder="Review details"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Submit review" onPress={() => void submitSafetyReview()} loading={busy} />
      </View>
      <FormField label="Review user ID">
        <Input
          accessibilityLabel="Review user ID input"
          value={reviewUserId}
          onChangeText={setReviewUserId}
          placeholder="user-uuid"
        />
      </FormField>
      <Button label="Load reviews" variant="secondary" onPress={() => void loadSafetyReviews()} loading={busy} />
      <FormField label="Dispute reason">
        <Input
          accessibilityLabel="Dispute reason input"
          value={disputeReason}
          onChangeText={setDisputeReason}
          placeholder="Describe dispute reason"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Raise dispute" onPress={() => void raiseSafetyDispute()} loading={busy} />
        <Button label="Refresh dispute" variant="secondary" onPress={() => void refreshSafetyDispute()} loading={busy} />
      </View>
      {activeDispute ? <Text style={styles.metaText}>Dispute status: {activeDispute.status}</Text> : null}
      {bookings.length > 0 ? <Text style={styles.metaText}>Bookings loaded: {bookings.length}</Text> : null}
      {reviews.length > 0 ? <Text style={styles.metaText}>Reviews loaded: {reviews.length}</Text> : null}
    </View>
  );

  const renderCommunication = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Messaging and notifications</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={() => setRoute("profile")} />
      </View>
      <Button label="Load conversations" variant="secondary" onPress={() => void loadConversations()} loading={busy} />
      <FormField label="Conversation ID">
        <Input
          accessibilityLabel="Conversation ID input"
          value={activeConversationId}
          onChangeText={setActiveConversationId}
          placeholder="conversation-uuid"
        />
      </FormField>
      <Button label="Load messages" variant="secondary" onPress={() => void loadConversationMessages()} loading={busy} />
      <FormField label="Message content">
        <Input
          accessibilityLabel="Message content input"
          value={messageDraft}
          onChangeText={setMessageDraft}
          placeholder="Booking update message"
        />
      </FormField>
      <Button label="Send message" onPress={() => void sendConversationMessage()} loading={busy} />
      <FormField label="Device token">
        <Input
          accessibilityLabel="Device token input"
          value={deviceToken}
          onChangeText={setDeviceToken}
          placeholder="ExponentPushToken[...]"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Register device" onPress={() => void registerPushDevice()} loading={busy} />
        <Button label="Unregister device" variant="secondary" onPress={() => void unregisterPushDevice()} loading={busy} />
      </View>
      {conversations.length > 0 ? <Text style={styles.metaText}>Conversations: {conversations.length}</Text> : null}
      {messages.length > 0 ? <Text style={styles.metaText}>Messages: {messages.length}</Text> : null}
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
    if (route === "tasker") {
      return renderTasker();
    }
    if (route === "payment") {
      return renderPayment();
    }
    if (route === "safety") {
      return renderSafety();
    }
    return renderCommunication();
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
