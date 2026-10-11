import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { DemoBar, Persona } from "./components/DemoBar";
import { DemoScenarioDrawer } from "./components/DemoScenarioDrawer";
import { DemoProvider } from "./context/DemoContext";
import { HivesList } from "./routes/farmer/HivesList";
import { CreateBatch } from "./routes/farmer/CreateBatch";
import { VerifyJar } from "./routes/verify/VerifyJar";
import { HarvestWizard } from "./routes/farmer/HarvestWizard";

// Persona placeholder views for aggregator, lab, and regulator
const AggregatorView: React.FC = () => (
  <div className="max-w-md mx-auto min-h-screen p-6 bg-[#F5F7F4] space-y-4">
    <div className="bg-white p-5 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-2">
      <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">Aggregator Intake</div>
      <h2 className="text-xl font-bold text-[#1C2430]">Cooperative Intake Hub</h2>
      <p className="text-sm text-gray-600">
        Scan incoming lot tags from Kanchipuram apiary, verify refractometer moisture, and check tamper-evident seals before custody transfer.
      </p>
      <div className="pt-2">
        <span className="px-2.5 py-1 bg-[#E6EDF5] text-[#1E4B7A] rounded-lg text-xs font-semibold">
          FSSAI Lic: 10020042001188
        </span>
      </div>
    </div>
  </div>
);

const LabView: React.FC = () => (
  <div className="max-w-md mx-auto min-h-screen p-6 bg-[#F5F7F4] space-y-4">
    <div className="bg-white p-5 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-2">
      <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">Accredited Testing Lab</div>
      <h2 className="text-xl font-bold text-[#1C2430]">FSSAI / NABL Testing Portal</h2>
      <p className="text-sm text-gray-600">
        Receive sealed duplicate samples, log C4 sugar EA-IRMS analysis, and sign tamper-evident digital certificates for batch HC-0421.
      </p>
      <div className="pt-2">
        <span className="px-2.5 py-1 bg-[#E1F1E8] text-[#1E7B4C] rounded-lg text-xs font-semibold">
          NABL ISO/IEC 17025 Accredited
        </span>
      </div>
    </div>
  </div>
);

const RegulatorView: React.FC = () => (
  <div className="max-w-md mx-auto min-h-screen p-6 bg-[#F5F7F4] space-y-4">
    <div className="bg-white p-5 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-2">
      <div className="text-xs font-bold text-[#B3261E] uppercase tracking-wider">Regulator Audit View</div>
      <h2 className="text-xl font-bold text-[#1C2430]">FSSAI Enforcement & Audit</h2>
      <p className="text-sm text-gray-600">
        Review immutable custody chains, Merkle anchor receipts on Polygon Amoy, and flag tampered unit HC-0999 for field seizure.
      </p>
      <div className="pt-2">
        <span className="px-2.5 py-1 bg-[#FBE3E0] text-[#B3261E] rounded-lg text-xs font-semibold">
          National Honey Board Registry Access
        </span>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPersona, setCurrentPersona] = useState<Persona>("farmer");

  // Keep demo bar sync'ed with path where appropriate
  useEffect(() => {
    if (location.pathname.startsWith("/verify")) {
      setCurrentPersona("consumer");
    } else if (location.pathname.startsWith("/aggregator")) {
      setCurrentPersona("aggregator");
    } else if (location.pathname.startsWith("/lab")) {
      setCurrentPersona("lab");
    } else if (location.pathname.startsWith("/regulator")) {
      setCurrentPersona("regulator");
    } else if (location.pathname === "/" || location.pathname.startsWith("/farmer")) {
      setCurrentPersona("farmer");
    }
  }, [location.pathname]);

  const handleSwitchPersona = (p: Persona) => {
    setCurrentPersona(p);
    switch (p) {
      case "farmer":
        navigate("/");
        break;
      case "consumer":
        navigate("/verify?code=HC-0421");
        break;
      case "aggregator":
        navigate("/aggregator");
        break;
      case "lab":
        navigate("/lab");
        break;
      case "regulator":
        navigate("/regulator");
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F4]">
      <DemoBar currentPersona={currentPersona} onSwitch={handleSwitchPersona} />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HivesList />} />
          <Route path="/farmer/hives" element={<HivesList />} />
          <Route path="/farmer/batches/new" element={<CreateBatch />} />
          <Route path="/farmer/batch" element={<CreateBatch />} />
          <Route path="/farmer/batches" element={<CreateBatch />} />
          <Route path="/farmer/harvest" element={<HarvestWizard />} />
          <Route path="/farmer/market" element={<HivesList />} />
          <Route path="/verify" element={<VerifyJar />} />
          <Route path="/aggregator" element={<AggregatorView />} />
          <Route path="/lab" element={<LabView />} />
          <Route path="/regulator" element={<RegulatorView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <DemoScenarioDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DemoProvider>
        <AppContent />
      </DemoProvider>
    </BrowserRouter>
  );
};

export default App;
