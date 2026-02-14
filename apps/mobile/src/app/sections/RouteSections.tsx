import { Text, View } from "react-native";
import { Button, FormField, Input } from "../../components/ui";
import type {
  Booking,
  Conversation,
  Dispute,
  Message,
  Profile,
  PublicTask,
  Review,
  Task
} from "../../lib/mobileApiClient";
import type { MobileRoute } from "../types";
import { styles } from "../styles";

type BusyAction = () => void;

export type AuthSectionProps = {
  busy: boolean;
  phone: string;
  otpCode: string;
  otpRequested: boolean;
  setPhone: (value: string) => void;
  setOtpCode: (value: string) => void;
  onRequestOtp: BusyAction;
  onVerifyOtp: BusyAction;
};

export function AuthSection({
  busy,
  phone,
  otpCode,
  otpRequested,
  setPhone,
  setOtpCode,
  onRequestOtp,
  onVerifyOtp
}: AuthSectionProps) {
  return (
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
        <Button label="Request OTP" variant="secondary" onPress={onRequestOtp} loading={busy} />
        <Button
          label="Verify OTP"
          onPress={onVerifyOtp}
          disabled={!otpRequested}
          loading={busy}
        />
      </View>
    </View>
  );
}

export type ProfileSectionProps = {
  busy: boolean;
  profile: Profile | null;
  fullName: string;
  avatarUrl: string;
  setFullName: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  onGenerateAvatarUpload: BusyAction;
  onSaveProfile: BusyAction;
  onActivateTaskerRole: BusyAction;
  onNavigate: (route: MobileRoute) => void;
};

export function ProfileSection({
  busy,
  profile,
  fullName,
  avatarUrl,
  setFullName,
  setAvatarUrl,
  onGenerateAvatarUpload,
  onSaveProfile,
  onActivateTaskerRole,
  onNavigate
}: ProfileSectionProps) {
  return (
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
          onPress={onGenerateAvatarUpload}
          loading={busy}
        />
        <Button label="Save profile" onPress={onSaveProfile} loading={busy} />
      </View>
      <View style={styles.rowActions}>
        <Button label="Customer flow" variant="ghost" onPress={() => onNavigate("customer")} />
        <Button label="Tasker flow" variant="ghost" onPress={() => onNavigate("tasker")} />
      </View>
      <View style={styles.rowActions}>
        <Button label="Booking payment" variant="ghost" onPress={() => onNavigate("payment")} />
        <Button label="Booking safety" variant="ghost" onPress={() => onNavigate("safety")} />
        <Button label="Messaging" variant="ghost" onPress={() => onNavigate("communication")} />
      </View>
      {profile?.role === "CUSTOMER" ? (
        <Button label="Activate tasker role" variant="secondary" onPress={onActivateTaskerRole} />
      ) : null}
    </View>
  );
}

export type CustomerSectionProps = {
  busy: boolean;
  categoryId: string;
  description: string;
  budget: string;
  locationText: string;
  locationLat: string;
  locationLng: string;
  createdTask: Task | null;
  setCategoryId: (value: string) => void;
  setDescription: (value: string) => void;
  setBudget: (value: string) => void;
  setLocationText: (value: string) => void;
  setLocationLat: (value: string) => void;
  setLocationLng: (value: string) => void;
  onLoadCategories: BusyAction;
  onCreateTask: BusyAction;
  onBack: BusyAction;
};

export function CustomerSection({
  busy,
  categoryId,
  description,
  budget,
  locationText,
  locationLat,
  locationLng,
  createdTask,
  setCategoryId,
  setDescription,
  setBudget,
  setLocationText,
  setLocationLat,
  setLocationLng,
  onLoadCategories,
  onCreateTask,
  onBack
}: CustomerSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Customer task creation</Text>
      <View style={styles.rowActions}>
        <Button label="Load categories" variant="secondary" onPress={onLoadCategories} loading={busy} />
        <Button label="Back to profile" variant="ghost" onPress={onBack} />
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
      <Button label="Create task" onPress={onCreateTask} loading={busy} />
      {createdTask ? (
        <Text style={styles.metaText}>Created task: {createdTask.id}</Text>
      ) : null}
    </View>
  );
}

export type TaskerSectionProps = {
  busy: boolean;
  filterCategory: string;
  filterRadiusKm: string;
  tasks: PublicTask[];
  applyDrafts: Record<string, string>;
  setFilterCategory: (value: string) => void;
  setFilterRadiusKm: (value: string) => void;
  onSetApplyDraft: (taskId: string, value: string) => void;
  onApplyToTask: (taskId: string) => void;
  onLoadTaskFeed: BusyAction;
  onBack: BusyAction;
};

export function TaskerSection({
  busy,
  filterCategory,
  filterRadiusKm,
  tasks,
  applyDrafts,
  setFilterCategory,
  setFilterRadiusKm,
  onSetApplyDraft,
  onApplyToTask,
  onLoadTaskFeed,
  onBack
}: TaskerSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Tasker discovery and apply</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={onBack} />
        <Button label="Load task feed" variant="secondary" onPress={onLoadTaskFeed} loading={busy} />
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
                onChangeText={(value) => onSetApplyDraft(task.id, value)}
                placeholder="I can complete this task."
              />
            </FormField>
            <Button label="Apply to task" onPress={() => onApplyToTask(task.id)} loading={busy} />
          </View>
        ))
      )}
    </View>
  );
}

export type PaymentSectionProps = {
  busy: boolean;
  acceptTaskId: string;
  acceptApplicationId: string;
  paymentBookingId: string;
  disclaimerAccepted: boolean;
  acceptedBooking: Booking | null;
  paymentUrl: string;
  paymentQr: string;
  setAcceptTaskId: (value: string) => void;
  setAcceptApplicationId: (value: string) => void;
  setPaymentBookingId: (value: string) => void;
  onToggleDisclaimer: BusyAction;
  onAcceptApplication: BusyAction;
  onInitiatePayment: BusyAction;
  onBack: BusyAction;
};

export function PaymentSection({
  busy,
  acceptTaskId,
  acceptApplicationId,
  paymentBookingId,
  disclaimerAccepted,
  acceptedBooking,
  paymentUrl,
  paymentQr,
  setAcceptTaskId,
  setAcceptApplicationId,
  setPaymentBookingId,
  onToggleDisclaimer,
  onAcceptApplication,
  onInitiatePayment,
  onBack
}: PaymentSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Booking payment</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={onBack} />
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
      <Button label="Accept application" onPress={onAcceptApplication} loading={busy} />
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
        onPress={onToggleDisclaimer}
      />
      <Button
        label="Initiate payment"
        onPress={onInitiatePayment}
        disabled={!disclaimerAccepted}
        loading={busy}
      />
      {acceptedBooking ? <Text style={styles.metaText}>Booking status: {acceptedBooking.status}</Text> : null}
      {paymentUrl ? <Text style={styles.metaText}>Payment URL: {paymentUrl}</Text> : null}
      {paymentQr ? <Text style={styles.metaText}>QR payload: {paymentQr}</Text> : null}
    </View>
  );
}

export type SafetySectionProps = {
  busy: boolean;
  bookingRoleFilter: "" | "customer" | "tasker";
  bookingStatusFilter: "" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED";
  safetyBookingId: string;
  activeBooking: Booking | null;
  reviewRating: string;
  reviewComment: string;
  reviewUserId: string;
  disputeReason: string;
  activeDispute: Dispute | null;
  bookings: Booking[];
  reviews: Review[];
  setBookingRoleFilter: (value: "" | "customer" | "tasker") => void;
  setBookingStatusFilter: (value: "" | "PENDING_PAYMENT" | "PAID" | "COMPLETED" | "CANCELLED") => void;
  setSafetyBookingId: (value: string) => void;
  setReviewRating: (value: string) => void;
  setReviewComment: (value: string) => void;
  setReviewUserId: (value: string) => void;
  setDisputeReason: (value: string) => void;
  onListBookings: BusyAction;
  onLoadBooking: BusyAction;
  onCancelBooking: BusyAction;
  onCompleteBooking: BusyAction;
  onSubmitReview: BusyAction;
  onLoadReviews: BusyAction;
  onRaiseDispute: BusyAction;
  onRefreshDispute: BusyAction;
  onBack: BusyAction;
};

export function SafetySection({
  busy,
  bookingRoleFilter,
  bookingStatusFilter,
  safetyBookingId,
  activeBooking,
  reviewRating,
  reviewComment,
  reviewUserId,
  disputeReason,
  activeDispute,
  bookings,
  reviews,
  setBookingRoleFilter,
  setBookingStatusFilter,
  setSafetyBookingId,
  setReviewRating,
  setReviewComment,
  setReviewUserId,
  setDisputeReason,
  onListBookings,
  onLoadBooking,
  onCancelBooking,
  onCompleteBooking,
  onSubmitReview,
  onLoadReviews,
  onRaiseDispute,
  onRefreshDispute,
  onBack
}: SafetySectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Booking safety</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={onBack} />
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
      <Button label="List bookings" variant="secondary" onPress={onListBookings} loading={busy} />
      <FormField label="Booking ID">
        <Input
          accessibilityLabel="Safety booking ID input"
          value={safetyBookingId}
          onChangeText={setSafetyBookingId}
          placeholder="booking-uuid"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Load booking" variant="secondary" onPress={onLoadBooking} loading={busy} />
        <Button label="Cancel booking" onPress={onCancelBooking} loading={busy} />
        <Button label="Complete booking" onPress={onCompleteBooking} loading={busy} />
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
        <Button label="Submit review" onPress={onSubmitReview} loading={busy} />
      </View>
      <FormField label="Review user ID">
        <Input
          accessibilityLabel="Review user ID input"
          value={reviewUserId}
          onChangeText={setReviewUserId}
          placeholder="user-uuid"
        />
      </FormField>
      <Button label="Load reviews" variant="secondary" onPress={onLoadReviews} loading={busy} />
      <FormField label="Dispute reason">
        <Input
          accessibilityLabel="Dispute reason input"
          value={disputeReason}
          onChangeText={setDisputeReason}
          placeholder="Describe dispute reason"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Raise dispute" onPress={onRaiseDispute} loading={busy} />
        <Button label="Refresh dispute" variant="secondary" onPress={onRefreshDispute} loading={busy} />
      </View>
      {activeDispute ? <Text style={styles.metaText}>Dispute status: {activeDispute.status}</Text> : null}
      {bookings.length > 0 ? <Text style={styles.metaText}>Bookings loaded: {bookings.length}</Text> : null}
      {reviews.length > 0 ? <Text style={styles.metaText}>Reviews loaded: {reviews.length}</Text> : null}
    </View>
  );
}

export type CommunicationSectionProps = {
  busy: boolean;
  activeConversationId: string;
  messageDraft: string;
  deviceToken: string;
  conversations: Conversation[];
  messages: Message[];
  setActiveConversationId: (value: string) => void;
  setMessageDraft: (value: string) => void;
  setDeviceToken: (value: string) => void;
  onLoadConversations: BusyAction;
  onLoadMessages: BusyAction;
  onSendMessage: BusyAction;
  onRegisterDevice: BusyAction;
  onUnregisterDevice: BusyAction;
  onBack: BusyAction;
};

export function CommunicationSection({
  busy,
  activeConversationId,
  messageDraft,
  deviceToken,
  conversations,
  messages,
  setActiveConversationId,
  setMessageDraft,
  setDeviceToken,
  onLoadConversations,
  onLoadMessages,
  onSendMessage,
  onRegisterDevice,
  onUnregisterDevice,
  onBack
}: CommunicationSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Messaging and notifications</Text>
      <View style={styles.rowActions}>
        <Button label="Back to profile" variant="ghost" onPress={onBack} />
      </View>
      <Button label="Load conversations" variant="secondary" onPress={onLoadConversations} loading={busy} />
      <FormField label="Conversation ID">
        <Input
          accessibilityLabel="Conversation ID input"
          value={activeConversationId}
          onChangeText={setActiveConversationId}
          placeholder="conversation-uuid"
        />
      </FormField>
      <Button label="Load messages" variant="secondary" onPress={onLoadMessages} loading={busy} />
      <FormField label="Message content">
        <Input
          accessibilityLabel="Message content input"
          value={messageDraft}
          onChangeText={setMessageDraft}
          placeholder="Booking update message"
        />
      </FormField>
      <Button label="Send message" onPress={onSendMessage} loading={busy} />
      <FormField label="Device token">
        <Input
          accessibilityLabel="Device token input"
          value={deviceToken}
          onChangeText={setDeviceToken}
          placeholder="ExponentPushToken[...]"
        />
      </FormField>
      <View style={styles.rowActions}>
        <Button label="Register device" onPress={onRegisterDevice} loading={busy} />
        <Button label="Unregister device" variant="secondary" onPress={onUnregisterDevice} loading={busy} />
      </View>
      {conversations.length > 0 ? <Text style={styles.metaText}>Conversations: {conversations.length}</Text> : null}
      {messages.length > 0 ? <Text style={styles.metaText}>Messages: {messages.length}</Text> : null}
    </View>
  );
}

export type RestrictedSectionProps = {
  profile: Profile | null;
  onSignOut: BusyAction;
};

export function RestrictedSection({ profile, onSignOut }: RestrictedSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Account restricted</Text>
      <Text style={styles.metaText}>
        Your account status is {profile?.status ?? "unknown"}. Contact support for review.
      </Text>
      <Button label="Sign out" onPress={onSignOut} />
    </View>
  );
}

export type GuardSectionProps = {
  guardError: string | null;
  onGoProfile: BusyAction;
};

export function GuardSection({ guardError, onGoProfile }: GuardSectionProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Route guard</Text>
      <Text style={styles.metaText}>{guardError}</Text>
      <Button label="Go to profile" variant="secondary" onPress={onGoProfile} />
    </View>
  );
}
