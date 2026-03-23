import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile } = useAppContext();

  if (!session) {
    return <Navigate replace to="/" />;
  }

  if (!profile || profile.role !== "ADMIN") {
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
}
