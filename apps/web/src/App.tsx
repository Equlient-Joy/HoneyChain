import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./routes/auth/Login";
import { HivesList } from "./routes/farmer/HivesList";
import { CreateBatch } from "./routes/farmer/CreateBatch";
import { VerifyJar } from "./routes/verify/VerifyJar";
import { HarvestWizard } from "./routes/farmer/HarvestWizard";

// Persona placeholder views for aggregator, lab, and regulator
export const AggregatorView: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3">
      <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">Aggregator Intake</div>
      <h2 className="text-xl font-bold text-[#1C2430]">Cooperative Intake Hub</h2>
      <p className="text-sm text-gray-600">
        Scan incoming lot tags from Kanchipuram apiary, verify refractometer moisture, and check tamper-evident seals before custody transfer.
      </p>
      <div className="pt-2">
        <span className="px-3 py-1 bg-[#E6EDF5] text-[#1E4B7A] rounded-lg text-xs font-semibold">
          FSSAI Lic: 10020042001188
        </span>
      </div>
    </div>
  </div>
);

export const LabView: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3">
      <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">Accredited Testing Lab</div>
      <h2 className="text-xl font-bold text-[#1C2430]">FSSAI / NABL Testing Portal</h2>
      <p className="text-sm text-gray-600">
        Receive sealed duplicate samples, log C4 sugar EA-IRMS analysis, and sign tamper-evident digital certificates for batch HC-0421.
      </p>
      <div className="pt-2">
        <span className="px-3 py-1 bg-[#E1F1E8] text-[#1E7B4C] rounded-lg text-xs font-semibold">
          NABL ISO/IEC 17025 Accredited
        </span>
      </div>
    </div>
  </div>
);

export const RegulatorView: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3">
      <div className="text-xs font-bold text-[#B3261E] uppercase tracking-wider">Regulator Audit View</div>
      <h2 className="text-xl font-bold text-[#1C2430]">FSSAI Enforcement & Audit</h2>
      <p className="text-sm text-gray-600">
        Review immutable custody chains, Merkle anchor receipts on Polygon Amoy, and flag tampered unit HC-0999 for field seizure.
      </p>
      <div className="pt-2">
        <span className="px-3 py-1 bg-[#FBE3E0] text-[#B3261E] rounded-lg text-xs font-semibold">
          National Honey Board Registry Access
        </span>
      </div>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/verify"
        element={
          <AppLayout title="Public Verification">
            <VerifyJar />
          </AppLayout>
        }
      />

      {/* Farmer Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Hives & Apiary Telemetry">
              <HivesList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/hives"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Hives & Apiary Telemetry">
              <HivesList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batches/new"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Create Packaging Batch">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batch"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Batch Management">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/batches"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Batch Management">
              <CreateBatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/harvest"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Harvest Logging">
              <HarvestWizard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/market"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AppLayout title="Honey Market & Inventory">
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
            <AppLayout title="Aggregator Intake & Custody">
              <AggregatorView />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Lab Routes */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={["lab"]}>
            <AppLayout title="Testing Lab Portal">
              <LabView />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Regulator Routes */}
      <Route
        path="/regulator"
        element={
          <ProtectedRoute allowedRoles={["regulator"]}>
            <AppLayout title="Regulatory Oversight & Audit">
              <RegulatorView />
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
