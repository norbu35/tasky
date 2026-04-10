import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    session: {
      accessToken: 'tok',
      refreshToken: 'rt',
      user: { id: 'user-1', role: 'ADMIN' },
    },
    profile: { role: 'ADMIN' },
  })),
}));

vi.mock('../RouteGuards', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../AdminRoute', () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../layout/AdminLayout', () => ({
  AdminLayout: () => <div>admin-layout</div>,
}));

vi.mock('../../lib/userAccess', () => ({
  isRestrictedUser: () => false,
}));

vi.mock('../../pages', () => ({
  AuthPage: () => <div>auth-page</div>,
  AppUpdatePage: () => <div>app-update-page</div>,
  BookingConfirmationPage: () => <div>booking-confirmation-page</div>,
  BookingSafetyPage: () => <div>booking-safety-page</div>,
  ChatDetailPage: () => <div>chat-detail-page</div>,
  CustomerApplicantsPage: () => <div>customer-applicants-page</div>,
  CustomerBookingConfirmedPage: () => <div>customer-booking-confirmed-page</div>,
  CustomerBookingDetailPage: () => <div>customer-booking-detail-page</div>,
  CustomerBookingsPage: () => <div>customer-bookings-page</div>,
  CustomerDashboardPage: () => <div>customer-dashboard-page</div>,
  CustomerDisputeRaisePage: () => <div>customer-dispute-raise-page</div>,
  CustomerDisputeStatusPage: () => <div>customer-dispute-status-page</div>,
  CustomerNoApplicantRescuePage: () => <div>customer-no-applicant-rescue-page</div>,
  CustomerNoShowReminderDialog: () => <div>customer-no-show-reminder-page</div>,
  CustomerRebookPage: () => <div>customer-rebook-page</div>,
  CustomerReschedulePage: () => <div>customer-reschedule-page</div>,
  CustomerTaskDetailsPage: () => <div>customer-task-details-page</div>,
  CustomerTasksListPage: () => <div>customer-tasks-list-page</div>,
  CustomerTaskSuccessPage: () => <div>customer-task-success-page</div>,
  CustomerTaskWizardPage: () => <div>customer-task-wizard-page</div>,
  CustomerTaskerProfilePage: () => <div>customer-tasker-profile-page</div>,
  CustomerTimelinePage: () => <div>customer-timeline-page</div>,
  DeleteAccountPage: () => <div>delete-account-page</div>,
  EditProfilePage: () => <div>edit-profile-page</div>,
  HelpPage: () => <div>help-page</div>,
  InboxPage: () => <div>inbox-page</div>,
  LandingPage: () => <div>landing-page</div>,
  MessagingNotificationsPage: () => <div>messaging-notifications-page</div>,
  NetworkErrorPage: () => <div>network-error-page</div>,
  NotificationsPage: () => <div>notifications-page</div>,
  PrivacyPage: () => <div>privacy-page</div>,
  ProfilePage: () => <div>profile-page</div>,
  RestrictedAccountPage: () => <div>restricted-account-page</div>,
  ReviewHardLockPage: () => <div>review-hard-lock-page</div>,
  SessionExpiredPage: () => <div>session-expired-page</div>,
  SettingsPage: () => <div>settings-page</div>,
  SuspendedPage: () => <div>suspended-page</div>,
  TaskerApplicationSentPage: () => <div>tasker-application-sent-page</div>,
  TaskerBookingDetailPage: () => <div>tasker-booking-detail-page</div>,
  TaskerFeedPage: () => <div>tasker-feed-page</div>,
  TaskerJobsPage: () => <div>tasker-jobs-page</div>,
  TaskerPrivacyPage: () => <div>tasker-privacy-page</div>,
  TaskerProfilePolishPage: () => <div>tasker-profile-polish-page</div>,
  TaskerStatsPage: () => <div>tasker-stats-page</div>,
  TaskerTaskDetailPage: () => <div>tasker-task-detail-page</div>,
  TaskerTasksPage: () => <div>tasker-tasks-page</div>,
  TermsPage: () => <div>terms-page</div>,
  VerificationApprovedPage: () => <div>verification-approved-page</div>,
  VerificationConsentPage: () => <div>verification-consent-page</div>,
  VerificationGatePage: () => <div>verification-gate-page</div>,
  VerificationPage: () => <div>verification-page</div>,
  VerificationPendingPage: () => <div>verification-pending-page</div>,
  VerificationRejectedPage: () => <div>verification-rejected-page</div>,
  VerificationSubmittedPage: () => <div>verification-submitted-page</div>,
  VerificationUploadPage: () => <div>verification-upload-page</div>,
}));

vi.mock('../../pages/admin', () => ({
  AdminCategoriesPage: () => <div>admin-categories-page</div>,
  AdminConciergePage: () => <div>admin-concierge-page</div>,
  AdminDisputeDetailPage: () => <div>admin-dispute-detail-page</div>,
  AdminDisputesPage: () => <div>admin-disputes-page</div>,
  AdminFeaturesPage: () => <div>admin-features-page</div>,
  AdminLeadPricingPage: () => <div>admin-lead-pricing-page</div>,
  AdminModerationPage: () => <div>admin-moderation-page</div>,
  AdminPayoutsPage: () => <div>admin-payouts-page</div>,
  AdminUsersPage: () => <div>admin-users-page</div>,
  AdminVerificationsPage: () => <div>admin-verifications-page</div>,
}));

import { AppRoutes } from '../AppRoutes';

describe('AppRoutes scope hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/customer/booking-payment', 'booking-confirmation-page'],
    ['/tasker/profile/polish', 'tasker-profile-polish-page'],
    ['/verification', 'verification-page'],
    ['/admin/payouts', 'admin-payouts-page'],
    ['/admin/pricing', 'admin-lead-pricing-page'],
  ])('redirects removed route %s to the live app surface', (path, removedMarker) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('profile-page')).toBeInTheDocument();
    expect(screen.queryByText(removedMarker)).not.toBeInTheDocument();
  });
});
