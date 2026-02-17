import type {ReactNode} from "react";
import {Navigate, NavLink, useLocation} from "react-router-dom";
import {Button} from "../../components/ui/button";
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from "../../components/ui/card";
import {useAppContext} from "../context/AppContext";
import {LoadingCard} from "../layout/LoadingCard";
import {ScreenFrame} from "../layout/ScreenFrame";
import type {Role} from "../types";
import {isRestrictedUser} from "../utils/userAccess";

export function ProtectedRoute({children}: { children: ReactNode }) {
    const {session, profile, profileBusy} = useAppContext();
    const location = useLocation();

    if (!session) {
        return <Navigate replace state={{from: location.pathname}} to="/auth"/>;
    }

    if (isRestrictedUser(profile)) {
        return <Navigate replace to="/banned"/>;
    }

    if (profileBusy && !profile) {
        return <LoadingCard message="Loading your account profile..."/>;
    }

    return <>{children}</>;
}

export function RoleGuard({role, children}: { role: Role; children: ReactNode }) {
    const {profile} = useAppContext();

    if (!profile) {
        return <LoadingCard message="Resolving role access..."/>;
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
