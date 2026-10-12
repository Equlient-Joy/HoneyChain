import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, getRoleHomePath } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./routes/auth/Login";
import { Signup } from "./routes/auth/Signup";
import { HivesList } from "./routes/farmer/HivesList";
import { CreateBatch } from "./routes/farmer/CreateBatch";
import { HarvestWizard } from "./routes/farmer/HarvestWizard";
import { AggregatorDashboard } from "./routes/aggregator/AggregatorDashboard";
import { VerifyJar } from "./routes/verify/VerifyJar";
import { IdPortal } from "./routes/portal/IdPortal";

export {
  Signup,
  Login,
  IdPortal,
  HivesList,
  CreateBatch,
  HarvestWizard,
  AggregatorDashboard,
  VerifyJar,
  getRoleHomePath,
};

// Root route handler: redirects authenticated user to role home, otherwise to /login
export const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1E4B7A] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-600">Loading HoneyChain...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyJar />} />
      <Route path="/portal" element={<IdPortal />} />

      {/* Root Home Route */}
      <Route path="/" element={<IdPortal />} />

      {/* Farmer Routes */}
      <Route
        path="/farmer/hives"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="My Hives">
              <HivesList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/harvest"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Harvest Wizard">
              <HarvestWizard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batches/new"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Batches">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batches"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Batches">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batch"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Batches">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/market"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Marketplace">
              <HivesList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Aggregator Routes */}
      <Route
        path="/aggregator"
        element={
          <ProtectedRoute allowedRoles={["aggregator"]}>
            <AppLayout title="Aggregator Intake">
              <AggregatorDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aggregator/batches"
        element={
          <ProtectedRoute allowedRoles={["aggregator"]}>
            <AppLayout title="Aggregator Intake">
              <AggregatorDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
