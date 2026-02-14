import type { paths } from "@tasky/sdk";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text } from "react-native";
import { Toast } from "../components/ui";
import {
  createConsoleClientAnalyticsTracker,
  resolveClientLocale,
  type ActorRole,
  type ClientEventName
} from "../lib/clientAnalytics";
import {
  createMobileApiClient,
  type AuthTokens,
  type Booking,
  type Conversation,
  type Dispute,
  type Message,
  type Profile,
  type PublicTask,
  type Review,
  type Task
} from "../lib/mobileApiClient";
import {
  AuthSection,
  CommunicationSection,
  CustomerSection,
  GuardSection,
  PaymentSection,
  ProfileSection,
  RestrictedSection,
  SafetySection,
  TaskerSection
} from "./sections";
import { styles } from "./styles";
import type { AppProps, MobileRoute, ToastVariant } from "./types";
import { parseError } from "./utils/errorHandling";
import { createIdempotencyKey, toFutureIso } from "./utils/primitives";
import { isRestricted } from "./utils/routeGuard";

export default function App({
  apiClient = createMobileApiClient(),
  initialRoute,
  initialSession = null,
  initialProfile = null,
  locale,
  analyticsTracker = createConsoleClientAnalyticsTracker()
}: AppProps) {
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";
  const resolvedLocale = resolveClientLocale(locale);

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

  const trackClientEvent = (
    eventName: ClientEventName,
    refs?: { taskId?: string; bookingId?: string }
  ): void => {
    const actorRole = (profile?.role ?? session?.user?.role ?? "UNKNOWN") as ActorRole;
    analyticsTracker({
      event_name: eventName,
      platform: "MOBILE",
      locale: resolvedLocale,
      actor_role: actorRole,
      task_id: refs?.taskId,
      booking_id: refs?.bookingId,
      timestamp: new Date().toISOString()
    });
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
      trackClientEvent("TASK_POSTED", { taskId: created.id });
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
      trackClientEvent("APPLICATION_SUBMITTED", { taskId });
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
      trackClientEvent("TASKER_ACCEPTED", {
        taskId: acceptTaskId.trim(),
        bookingId: booking.id
      });
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
      trackClientEvent("PAYMENT_INITIATED", { bookingId });
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
      trackClientEvent("BOOKING_COMPLETED", {
        bookingId: booking.id,
        taskId: booking.task_id
      });
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
      trackClientEvent("DISPUTE_RAISED", {
        bookingId: dispute.booking_id,
        taskId: activeBooking.task_id
      });
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

  const content = (() => {
    if (route === "restricted") {
      return <RestrictedSection profile={profile} onSignOut={signOut} />;
    }

    if (guardError) {
      return <GuardSection guardError={guardError} onGoProfile={() => setRoute("profile")} />;
    }

    if (route === "auth") {
      return (
        <AuthSection
          busy={busy}
          phone={phone}
          otpCode={otpCode}
          otpRequested={otpRequested}
          setPhone={setPhone}
          setOtpCode={setOtpCode}
          onRequestOtp={() => {
            void requestOtp();
          }}
          onVerifyOtp={() => {
            void verifyOtp();
          }}
        />
      );
    }

    if (route === "profile") {
      return (
        <ProfileSection
          busy={busy}
          profile={profile}
          fullName={fullName}
          avatarUrl={avatarUrl}
          setFullName={setFullName}
          setAvatarUrl={setAvatarUrl}
          onGenerateAvatarUpload={() => {
            void generateAvatarUpload();
          }}
          onSaveProfile={() => {
            void saveProfile();
          }}
          onActivateTaskerRole={() => {
            void activateTaskerRole();
          }}
          onNavigate={setRoute}
        />
      );
    }

    if (route === "customer") {
      return (
        <CustomerSection
          busy={busy}
          categoryId={categoryId}
          description={description}
          budget={budget}
          locationText={locationText}
          locationLat={locationLat}
          locationLng={locationLng}
          createdTask={createdTask}
          setCategoryId={setCategoryId}
          setDescription={setDescription}
          setBudget={setBudget}
          setLocationText={setLocationText}
          setLocationLat={setLocationLat}
          setLocationLng={setLocationLng}
          onLoadCategories={() => {
            void loadCategories();
          }}
          onCreateTask={() => {
            void createTask();
          }}
          onBack={() => setRoute("profile")}
        />
      );
    }

    if (route === "tasker") {
      return (
        <TaskerSection
          busy={busy}
          filterCategory={filterCategory}
          filterRadiusKm={filterRadiusKm}
          tasks={tasks}
          applyDrafts={applyDrafts}
          setFilterCategory={setFilterCategory}
          setFilterRadiusKm={setFilterRadiusKm}
          onSetApplyDraft={(taskId, value) => {
            setApplyDrafts((previous) => ({
              ...previous,
              [taskId]: value
            }));
          }}
          onApplyToTask={(taskId) => {
            void applyToTask(taskId);
          }}
          onLoadTaskFeed={() => {
            void loadTaskFeed();
          }}
          onBack={() => setRoute("profile")}
        />
      );
    }

    if (route === "payment") {
      return (
        <PaymentSection
          busy={busy}
          acceptTaskId={acceptTaskId}
          acceptApplicationId={acceptApplicationId}
          paymentBookingId={paymentBookingId}
          disclaimerAccepted={disclaimerAccepted}
          acceptedBooking={acceptedBooking}
          paymentUrl={paymentUrl}
          paymentQr={paymentQr}
          setAcceptTaskId={setAcceptTaskId}
          setAcceptApplicationId={setAcceptApplicationId}
          setPaymentBookingId={setPaymentBookingId}
          onToggleDisclaimer={() => {
            setDisclaimerAccepted((previous) => !previous);
          }}
          onAcceptApplication={() => {
            void acceptApplication();
          }}
          onInitiatePayment={() => {
            void initiatePayment();
          }}
          onBack={() => setRoute("profile")}
        />
      );
    }

    if (route === "safety") {
      return (
        <SafetySection
          busy={busy}
          bookingRoleFilter={bookingRoleFilter}
          bookingStatusFilter={bookingStatusFilter}
          safetyBookingId={safetyBookingId}
          activeBooking={activeBooking}
          reviewRating={reviewRating}
          reviewComment={reviewComment}
          reviewUserId={reviewUserId}
          disputeReason={disputeReason}
          activeDispute={activeDispute}
          bookings={bookings}
          reviews={reviews}
          setBookingRoleFilter={setBookingRoleFilter}
          setBookingStatusFilter={setBookingStatusFilter}
          setSafetyBookingId={setSafetyBookingId}
          setReviewRating={setReviewRating}
          setReviewComment={setReviewComment}
          setReviewUserId={setReviewUserId}
          setDisputeReason={setDisputeReason}
          onListBookings={() => {
            void listBookingsSafety();
          }}
          onLoadBooking={() => {
            void loadSafetyBooking();
          }}
          onCancelBooking={() => {
            void cancelSafetyBooking();
          }}
          onCompleteBooking={() => {
            void completeSafetyBooking();
          }}
          onSubmitReview={() => {
            void submitSafetyReview();
          }}
          onLoadReviews={() => {
            void loadSafetyReviews();
          }}
          onRaiseDispute={() => {
            void raiseSafetyDispute();
          }}
          onRefreshDispute={() => {
            void refreshSafetyDispute();
          }}
          onBack={() => setRoute("profile")}
        />
      );
    }

    return (
      <CommunicationSection
        busy={busy}
        activeConversationId={activeConversationId}
        messageDraft={messageDraft}
        deviceToken={deviceToken}
        conversations={conversations}
        messages={messages}
        setActiveConversationId={setActiveConversationId}
        setMessageDraft={setMessageDraft}
        setDeviceToken={setDeviceToken}
        onLoadConversations={() => {
          void loadConversations();
        }}
        onLoadMessages={() => {
          void loadConversationMessages();
        }}
        onSendMessage={() => {
          void sendConversationMessage();
        }}
        onRegisterDevice={() => {
          void registerPushDevice();
        }}
        onUnregisterDevice={() => {
          void unregisterPushDevice();
        }}
        onBack={() => setRoute("profile")}
      />
    );
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
