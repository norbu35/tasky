import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  AuthPage,
  AppUpdatePage,
  BookingConfirmationPage,
  BookingSafetyPage,
  ChatDetailPage,
  CustomerApplicantsPage,
  CustomerBookingConfirmedPage,
  CustomerBookingDetailPage,
  CustomerBookingsPage,
  CustomerDashboardPage,
  CustomerDisputeRaisePage,
  CustomerDisputeStatusPage,
  CustomerNoApplicantRescuePage,
  CustomerNoShowReminderDialog,
  CustomerRebookPage,
  CustomerReschedulePage,
  CustomerTaskDetailsPage,
  CustomerTasksListPage,
  CustomerTaskSuccessPage,
  CustomerTaskWizardPage,
  CustomerTaskerProfilePage,
  CustomerTimelinePage,
  DeleteAccountPage,
  EditProfilePage,
  HelpPage,
  InboxPage,
  MessagingNotificationsPage,
  NetworkErrorPage,
  NotificationsPage,
  ProfilePage,
  PrivacyPage,
  ReviewHardLockPage,
  RestrictedAccountPage,
  SessionExpiredPage,
  SettingsPage,
  SuspendedPage,
  TaskerApplicationSentPage,
  TaskerBookingDetailPage,
  TaskerFeedPage,
  TaskerJobsPage,
  TaskerPrivacyPage,
  TaskerStatsPage,
  TaskerTaskDetailPage,
  TaskerTasksPage,
  TermsPage,
  LandingPage,
  VerificationApprovedPage,
  VerificationConsentPage,
  VerificationGatePage,
  VerificationPendingPage,
  VerificationRejectedPage,
  VerificationSubmittedPage,
  VerificationUploadPage,
} from '../pages';
import {
  AdminVerificationsPage,
  AdminDisputesPage,
  AdminDisputeDetailPage,
  AdminUsersPage,
  AdminCategoriesPage,
  AdminFeaturesPage,
  AdminConciergePage,
  AdminModerationPage,
} from '../pages/admin';
import { ProtectedRoute, RoleGuard } from './RouteGuards';
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../layout/AdminLayout';
import { isRestrictedUser } from '../lib/userAccess';

export function HomeRedirect() {
  const { session, profile } = useAppContext();

  if (!session) {
    return <Navigate replace to="/auth" />;
  }

  if (isRestrictedUser(profile)) {
    return <Navigate replace to="/banned" />;
  }

  return <Navigate replace to="/profile" />;
}

export function AppRoutes() {
  const { session } = useAppContext();

  return (
    <Routes>
      <Route element={session ? <HomeRedirect /> : <LandingPage />} path="/" />
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
            <EditProfilePage />
          </ProtectedRoute>
        }
        path="/profile/edit"
      />
      <Route
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
        path="/profile/settings"
      />
      <Route
        element={
          <ProtectedRoute>
            <DeleteAccountPage />
          </ProtectedRoute>
        }
        path="/profile/delete"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/dashboard"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTasksListPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTaskWizardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/new"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTaskSuccessPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/success"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTaskDetailsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/:taskId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerApplicantsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/:taskId/applicants"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTaskerProfilePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/taskers/:taskerId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <BookingConfirmationPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/booking-confirmation"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerBookingsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerBookingDetailPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerBookingConfirmedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId/confirmed"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerTimelinePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId/timeline"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerReschedulePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId/reschedule"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerDisputeRaisePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId/dispute"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerDisputeStatusPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/disputes/:disputeId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerNoShowReminderDialog open onOpenChange={() => {}} />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/bookings/:bookingId/no-show"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerNoApplicantRescuePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks/:taskId/no-applicants"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="CUSTOMER">
              <CustomerRebookPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/rebook"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerFeedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/feed"
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
            <RoleGuard role="TASKER">
              <TaskerTasksPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/my-tasks"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerTaskDetailPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/tasks/:taskId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerApplicationSentPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/tasks/:taskId/applied"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerJobsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/jobs"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerBookingDetailPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/bookings/:bookingId"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerStatsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/stats"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <TaskerPrivacyPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/privacy"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationGatePage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationConsentPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/consent"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationUploadPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/upload"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationPendingPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/pending"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationApprovedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/approved"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationRejectedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/rejected"
      />
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard role="TASKER">
              <VerificationSubmittedPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/tasker/verification/submitted"
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
            <InboxPage />
          </ProtectedRoute>
        }
        path="/inbox"
      />
      <Route
        element={
          <ProtectedRoute>
            <ChatDetailPage />
          </ProtectedRoute>
        }
        path="/inbox/:conversationId"
      />
      <Route
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
        path="/notifications"
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
          <ProtectedRoute>
            <ReviewHardLockPage />
          </ProtectedRoute>
        }
        path="/review/locked"
      />
      <Route
        element={
          <ProtectedRoute>
            <NetworkErrorPage />
          </ProtectedRoute>
        }
        path="/network-error"
      />
      <Route
        element={
          <ProtectedRoute>
            <SessionExpiredPage />
          </ProtectedRoute>
        }
        path="/session-expired"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppUpdatePage />
          </ProtectedRoute>
        }
        path="/app-update"
      />
      <Route
        element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        }
        path="/help"
      />
      <Route
        element={
          <ProtectedRoute>
            <TermsPage />
          </ProtectedRoute>
        }
        path="/terms"
      />
      <Route
        element={
          <ProtectedRoute>
            <PrivacyPage />
          </ProtectedRoute>
        }
        path="/privacy"
      />
      <Route
        element={
          session ? (
            <SuspendedPage />
          ) : (
            <Navigate replace state={{ from: '/suspended' }} to="/auth" />
          )
        }
        path="/suspended"
      />
      <Route
        element={
          session ? (
            <RestrictedAccountPage />
          ) : (
            <Navigate replace state={{ from: '/banned' }} to="/auth" />
          )
        }
        path="/banned"
      />
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
        path="/admin"
      >
        <Route index element={<Navigate replace to="/admin/verifications" />} />
        <Route path="verifications" element={<AdminVerificationsPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
        <Route path="disputes/:disputeId" element={<AdminDisputeDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="features" element={<AdminFeaturesPage />} />
        <Route path="concierge" element={<AdminConciergePage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
