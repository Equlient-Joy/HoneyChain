import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../../context/AuthContext";

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "farmer":
      return "/farmer/hives";
    case "aggregator":
      return "/aggregator";
    case "lab":
      return "/lab";
    case "regulator":
      return "/regulator";
    case "station":
    default:
      return "/";
  }
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1E4B7A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-600">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const homePath = getRoleHomePath(user.role);
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};
