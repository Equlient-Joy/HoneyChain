import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, ArrowRight, Droplets } from "lucide-react";

export const IdPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithId, isAuthenticated, user } = useAuth();
  const [inputId, setInputId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "farmer" ? "/farmer/hives" : "/aggregator");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      handleResolve(queryId);
    }
  }, [searchParams]);

  const handleResolve = async (idToResolve: string) => {
    if (!idToResolve.trim()) return;
    setLoading(true);
    setError(null);
    const result = await loginWithId(idToResolve.trim());
    setLoading(false);
    if (result.success && result.targetUi) {
      navigate(result.targetUi);
    } else {
      setError(result.error || "User ID not found.");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleResolve(inputId);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex flex-col items-center justify-center p-4 text-[#1C2430]">
      <div className="w-full max-w-md bg-white border border-[#D5DBD3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E6EDF5] text-[#1E4B7A] rounded-2xl mx-auto flex items-center justify-center">
            <Droplets className="w-6 h-6 text-[#F2A900]" />
          </div>
          <h1 className="text-2xl font-black text-[#1E4B7A]">HoneyChain ID Portal</h1>
          <p className="text-xs text-gray-600">
            Enter your Beekeeper or Aggregator ID for instant access
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FBE3E0] border border-[#B3261E]/30 rounded-xl text-xs text-[#B3261E] font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Your Badge / ID</label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="e.g. BK-001 or AG-001"
              className="mt-1 w-full p-3.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl font-mono text-base font-bold text-[#1C2430] uppercase focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputId.trim()}
            className="w-full py-3.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-sm hover:bg-[#163A5F] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Resolving ID..." : "Open My Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase text-center">Instant One-Click IDs:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleResolve("BK-001")}
              className="p-2.5 bg-[#E6EDF5] hover:bg-[#d8e4f1] text-[#1E4B7A] font-bold rounded-xl transition text-center"
            >
              🐝 Beekeeper (BK-001)
            </button>
            <button
              onClick={() => handleResolve("AG-001")}
              className="p-2.5 bg-[#E1F1E8] hover:bg-[#d0ebd9] text-[#1E7B4C] font-bold rounded-xl transition text-center"
            >
              📦 Aggregator (AG-001)
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#1E4B7A] transition"
          >
            <ShieldCheck className="w-4 h-4 text-[#1E7B4C]" />
            <span>Public Consumer Verification (Jar Scan)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
