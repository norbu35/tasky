import { Navigate, Route, Routes } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
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
    LandingPage
} from "../pages";
import { ProtectedRoute, RoleGuard } from "./RouteGuards";
import { isRestrictedUser } from "../utils/userAccess";

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
            <Route
                element={session ? <HomeRedirect /> : <LandingPage />}
                path="/"
            />
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
