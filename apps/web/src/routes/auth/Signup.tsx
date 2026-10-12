import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "../../context/AuthContext";
import { getRoleHomePath } from "../../components/auth/ProtectedRoute";
import {
  ShieldCheck,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
  Building,
  MapPin,
  Sparkles,
} from "lucide-react";

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

const ROLES: { id: UserRole; title: string; subtitle: string; icon: string }[] = [
  {
    id: "farmer",
    title: "Beekeeper / Apiary",
    subtitle: "Log apiary hives, scale telemetry, harvest extraction & purity",
    icon: "🐝",
  },
  {
    id: "aggregator",
    title: "Aggregator / Coop Packer",
    subtitle: "Batch intake, refractometer adulteration check & custody",
    icon: "📦",
  },
];

const TN_DISTRICTS = [
  "Kanchipuram",
  "Chennai",
  "Salem",
  "Madurai",
  "Coimbatore",
  "Tiruchirappalli",
  "Tirunelveli",
  "Erode",
  "Vellore",
  "Thanjavur",
  "Dindigul",
  "Other",
];

export const Signup: React.FC = () => {
  const { signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [state, setState] = useState("Tamil Nadu");
  const [district, setDistrict] = useState("Kanchipuram");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to role home
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide an email address or mobile phone.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!orgName.trim()) {
      setError("Organization or Apiary name is required.");
      return;
    }

    setSubmitting(true);
    const result = await signup({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      password,
      role,
      org_name: orgName.trim(),
      state: state.trim(),
      district: district.trim(),
    });
    setSubmitting(false);

    if (result.success) {
      navigate(getRoleHomePath(role), { replace: true });
    } else {
      setError(result.error || "Signup failed. Please verify your details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex">
      {/* Desktop Left Side Branding Banner (hidden on mobile, visible on lg) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#1E4B7A] via-[#163A5F] to-[#0E2742] text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E6A100]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1E7B4C]/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <HoneycombIcon className="w-10 h-10" />
            <span className="text-2xl font-black tracking-tight text-white">HoneyChain</span>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold text-[#E6A100] border border-[#E6A100]/30 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            National Honey Board & FSSAI Traceability
          </span>

          <h2 className="text-3xl font-extrabold leading-tight text-white mb-4">
            Join India's Trust Network for Pure, Tamper-Evident Honey
          </h2>
          <p className="text-sm text-gray-200 leading-relaxed">
            From apiary hive scales to NTAG 424 DNA cryptographic seals and Polygon Amoy Merkle anchors — join the unified standard for bee farmer empowerment and consumer food safety.
          </p>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E6A100]/20 flex items-center justify-center shrink-0 text-[#E6A100] font-bold text-sm">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Madhukranti Portal Integration</h4>
              <p className="text-xs text-gray-300">
                Direct compliance alignment with National Bee Board certification registries.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-[#1E7B4C]/20 flex items-center justify-center shrink-0 text-[#1E7B4C] font-bold text-sm">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Dual-Key IoT Cryptography</h4>
              <p className="text-xs text-gray-300">
                Ed25519 sensor signatures prevent sugar syrup adulteration before extraction.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-[#1E4B7A]/40 flex items-center justify-center shrink-0 text-sky-300 font-bold text-sm">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Public Consumer Verification</h4>
              <p className="text-xs text-gray-300">
                Zero app install required. Retail customers tap NFC jars to verify purity on-chain.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-gray-300 flex items-center justify-between">
          <span>Supported across 38 Tamil Nadu Districts</span>
          <span className="font-semibold text-[#E6A100]">ISO/IEC 17025 Ready</span>
        </div>
      </div>

      {/* Right Side Form (full width on mobile, 7/12 on desktop) */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-16 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Mobile Top Brand Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="flex justify-center mb-2">
              <HoneycombIcon className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-[#1E4B7A] tracking-tight">HoneyChain</h1>
            <p className="text-xs text-gray-600">National Honey Board & FSSAI Traceability</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-6">
            <div>
              <h2 className="text-2xl font-black text-[#1C2430] tracking-tight">
                Create your account
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Select your supply chain role and register your apiary, cooperative, or testing facility.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-[#B3261E] rounded-lg flex items-center gap-2 text-sm text-[#B3261E]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  1. Select Your Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const selected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                          selected
                            ? "border-[#1E4B7A] bg-[#E6EDF5]/70 ring-2 ring-[#1E4B7A]"
                            : "border-[#D5DBD3] bg-white hover:border-[#1E4B7A]/60 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1C2430] flex items-center gap-1">
                            <span>{r.title}</span>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4B7A]" />}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                            {r.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal & Credential Fields */}
              <div className="space-y-4 pt-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. User Details & Credentials
                </label>

                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Murugan K or Dr. Priya Raman"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Contact: Email & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="beekeeper@apiary.in"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1">
                      Mobile Phone *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="+919876543210"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Organization & Location Fields */}
              <div className="space-y-4 pt-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  3. Organization & Location
                </label>

                {/* Org Name */}
                <div>
                  <label htmlFor="orgName" className="block text-xs font-semibold text-gray-600 mb-1">
                    Organization / Apiary / Facility Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      placeholder="e.g. Kanchipuram Natural Apiaries FPO"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* State & District Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="state" className="block text-xs font-semibold text-gray-600 mb-1">
                      State
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        id="state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-xs font-semibold text-gray-600 mb-1">
                      District *
                    </label>
                    <select
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A] focus:border-transparent"
                    >
                      {TN_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#1E4B7A] hover:bg-[#163A5F] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4B7A] disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? "Registering Account..." : "Create HoneyChain Account"}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-[#1E4B7A] font-bold hover:underline">
                  Sign in here
                </Link>
              </span>

              <Link to="/verify" className="text-xs text-gray-500 hover:text-[#1E4B7A] hover:underline">
                Consumer Jar Verification →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
