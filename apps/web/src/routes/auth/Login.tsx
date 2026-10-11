import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, SEED_ACCOUNTS, UserRole } from "../../context/AuthContext";
import { getRoleHomePath } from "../../components/auth/ProtectedRoute";
import { ShieldCheck, LogIn, CheckCircle2, AlertCircle } from "lucide-react";

const HoneycombIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} text-[#E6A100]`}
    aria-hidden="true"
  >
    <path d="M12 2l7.5 4.33v8.66L12 22l-7.5-6.33V6.33L12 2z" fill="#E6A100" />
    <path d="M12 5.5l4.5 2.6v5.2L12 15.9l-4.5-2.6V8.1L12 5.5z" fill="#1E4B7A" />
  </svg>
);

export const Login: React.FC = () => {
  const { user, isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("farmer@honeychain.io");
  const [password, setPassword] = useState("Honey@123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to role home
  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = (location.state as any)?.from?.pathname || getRoleHomePath(user.role);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success) {
      // navigation handled by useEffect or here
    } else {
      setError(res.error || "Authentication failed. Please verify credentials.");
    }
  };

  const handleQuickLogin = async (roleKey: string) => {
    const acc = SEED_ACCOUNTS[roleKey];
    if (!acc) return;
    setIdentifier(acc.profile.email);
    setPassword(acc.password);
    setError(null);
    setSubmitting(true);

    const res = await login(acc.profile.email, acc.password);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || "Quick login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <HoneycombIcon className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-[#1E4B7A] tracking-tight">HoneyChain</h1>
        <p className="mt-1 text-sm text-gray-600 font-medium">
          National Honey Board & FSSAI Traceability Network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#D5DBD3] rounded-2xl sm:px-10 space-y-6">
          {/* Quick Persona Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Demo Persona (1-Click Login)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SEED_ACCOUNTS).map(([key, acc]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleQuickLogin(key)}
                  disabled={submitting}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-[#D5DBD3] hover:border-[#1E4B7A] hover:bg-[#E6EDF5]/40 transition text-left group"
                >
                  <span className="text-xs font-bold text-[#1E4B7A] group-hover:underline capitalize">
                    {key}
                  </span>
                  <span className="text-[11px] text-gray-600 font-medium truncate w-full">
                    {acc.profile.name}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate w-full">
                    {acc.profile.org_name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-xs text-gray-400 font-semibold uppercase">Or Sign In Manually</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-[#B3261E] rounded-lg flex items-center gap-2 text-sm text-[#B3261E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email or Mobile Phone
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="mt-1 block w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                placeholder="farmer@honeychain.io or +919876543210"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                placeholder="Honey@123"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#1E4B7A] hover:bg-[#163A5F] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4B7A] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? "Signing in..." : "Sign In to Portal"}</span>
            </button>
          </form>

          <div className="text-center pt-2 space-y-2">
            <div>
              <span className="text-xs text-gray-500">
                New to HoneyChain?{" "}
                <a href="/signup" className="text-[#1E4B7A] font-bold hover:underline">
                  Create an account
                </a>
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500">
                Need to verify a retail jar?{" "}
                <a href="/verify" className="text-[#1E4B7A] font-bold hover:underline">
                  Public Consumer Verification
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
