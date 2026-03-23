import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  AuthPage,
  BookingConfirmationPage,
  BookingSafetyPage,
  CustomerDashboardPage,
  CustomerTaskDetailsPage,
  CustomerTaskPage,
  MessagingNotificationsPage,
  ProfilePage,
  RestrictedAccountPage,
  TaskerFeedPage,
  TaskerTasksPage,
  LandingPage,
  VerificationPage,
} from '../pages';
import {
  AdminVerificationsPage,
  AdminDisputesPage,
  AdminDisputeDetailPage,
  AdminUsersPage,
  AdminCategoriesPage,
  AdminFeaturesPage,
  AdminConciergePage,
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
              <CustomerTaskPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/customer/tasks"
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
              <BookingConfirmationPage />
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
              <VerificationPage />
            </RoleGuard>
          </ProtectedRoute>
        }
        path="/verification"
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
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
