import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Layers,
  Droplets,
  Package,
  FileText,
  CheckCircle,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth, UserRole } from "../../context/AuthContext";

export interface AppLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RoleConfig {
  roleLabel: string;
  navItems: NavItemConfig[];
}

const HoneycombIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} text-[#E6A100] shrink-0`}
    aria-hidden="true"
  >
    <path d="M12 2l7.5 4.33v8.66L12 22l-7.5-6.33V6.33L12 2z" fill="#E6A100" />
    <path d="M12 5.5l4.5 2.6v5.2L12 15.9l-4.5-2.6V8.1L12 5.5z" fill="#1E4B7A" />
  </svg>
);

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  farmer: {
    roleLabel: "Beekeeper Portal",
    navItems: [
      { label: "Hives", path: "/farmer/hives", icon: Layers },
      { label: "Harvest", path: "/farmer/harvest", icon: Droplets },
      { label: "Batches", path: "/farmer/batches", icon: Package },
      { label: "Verify", path: "/verify", icon: ShieldCheck },
    ],
  },
  aggregator: {
    roleLabel: "Aggregator Hub",
    navItems: [
      { label: "Intake Hub", path: "/aggregator", icon: Package },
      { label: "Custody Lots", path: "/aggregator", icon: FileText },
      { label: "Verify", path: "/verify", icon: ShieldCheck },
    ],
  },
  lab: {
    roleLabel: "Testing Lab",
    navItems: [
      { label: "Testing Portal", path: "/lab", icon: FileText },
      { label: "Certificates", path: "/lab", icon: CheckCircle },
      { label: "Verify", path: "/verify", icon: ShieldCheck },
    ],
  },
  regulator: {
    roleLabel: "Regulator Audit",
    navItems: [
      { label: "Audit Queue", path: "/regulator", icon: ShieldCheck },
      { label: "Registry Queue", path: "/regulator", icon: FileText },
      { label: "Verify", path: "/verify", icon: CheckCircle },
    ],
  },
  station: {
    roleLabel: "Honey Station",
    navItems: [
      { label: "Dashboard", path: "/", icon: Layers },
      { label: "Verify", path: "/verify", icon: ShieldCheck },
    ],
  },
};

const DEFAULT_CONFIG: RoleConfig = {
  roleLabel: "HoneyChain Portal",
  navItems: [
    { label: "Dashboard", path: "/", icon: Layers },
    { label: "Verify", path: "/verify", icon: ShieldCheck },
  ],
};

function getInitials(name?: string): string {
  if (!name) return "HC";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDefaultTitle(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/farmer/hives")) return "Hives & Apiary Telemetry";
  if (pathname.startsWith("/farmer/harvest")) return "Harvest Extraction Wizard";
  if (pathname.startsWith("/farmer/batches/new")) return "Create Packaging Batch";
  if (pathname.startsWith("/farmer/batch")) return "Batch Management";
  if (pathname.startsWith("/farmer/market")) return "Honey Market & Inventory";
  if (pathname.startsWith("/aggregator")) return "Aggregator Intake & Custody";
  if (pathname.startsWith("/lab")) return "Testing Lab Portal";
  if (pathname.startsWith("/regulator")) return "Regulatory Oversight & Audit";
  if (pathname.startsWith("/verify")) return "Public Traceability Verification";
  return "HoneyChain Platform";
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = user?.role;
  const config = currentRole && ROLE_CONFIGS[currentRole] ? ROLE_CONFIGS[currentRole] : DEFAULT_CONFIG;
  const activeTitle = title || getDefaultTitle(location.pathname);
  const districtTag = user?.org_district ? `${user.org_district}, TN` : "Kanchipuram, TN";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath === "/farmer/hives") {
      return location.pathname === "/" || location.pathname.startsWith("/farmer/hives");
    }
    if (itemPath === "/farmer/batches") {
      return location.pathname.startsWith("/farmer/batch");
    }
    if (itemPath === "/") {
      return location.pathname === "/";
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex flex-col md:flex-row text-[#1C2430]">
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (>= 768px, fixed, 240px wide)            */}
      {/* ========================================================= */}
      <aside
        aria-label="Desktop Sidebar"
        className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#D5DBD3] z-30 justify-between select-none"
      >
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="p-5 border-b border-[#D5DBD3]/60 flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2.5">
              <HoneycombIcon className="w-7 h-7" />
              <span className="text-xl font-black text-[#1E4B7A] tracking-tight">HoneyChain</span>
            </Link>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[#E6EDF5] text-[#1E4B7A] px-2.5 py-0.5 rounded-full border border-[#1E4B7A]/20">
                {config.roleLabel}
              </span>
            </div>
          </div>

          {/* Role-specific Navigation */}
          <nav aria-label="Sidebar Navigation" className="p-3 space-y-1">
            {config.navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-[#E6EDF5] text-[#1E4B7A] font-bold shadow-2xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#1E4B7A]" : "text-gray-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-[#D5DBD3]/60 bg-white">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50/70 border border-[#D5DBD3]/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E6EDF5] text-[#1E4B7A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#1E4B7A]/20">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1C2430] truncate">{user?.name || "Guest User"}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.org_name || "HoneyChain"}</div>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-500 hover:text-[#B3261E] hover:bg-red-50 rounded-lg transition shrink-0"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-[#1E4B7A] hover:underline shrink-0 px-1"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* DESKTOP & MOBILE MAIN CONTENT WRAPPER                     */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col md:pl-[240px] min-w-0">
        {/* Desktop Sticky Top Navbar (>= 768px) */}
        <header
          aria-label="Desktop Top Navbar"
          className="hidden md:flex sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-[#D5DBD3] px-8 py-3.5 items-center justify-between"
        >
          <div>
            <h1 className="text-lg font-bold text-[#1C2430] tracking-tight">{activeTitle}</h1>
            <p className="text-xs text-gray-500">Immutable Honey Provenance & Quality Ledger</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-[#E6EDF5] text-[#1E4B7A] px-3 py-1 rounded-full border border-[#1E4B7A]/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E7B4C] inline-block animate-pulse" />
              {districtTag}
            </span>

            {user && (
              <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                {user.name} ({config.roleLabel})
              </span>
            )}
          </div>
        </header>

        {/* Mobile Compact App Bar (< 768px) */}
        <header
          aria-label="Mobile Top Bar"
          className="md:hidden sticky top-0 z-20 bg-white border-b border-[#D5DBD3] px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <HoneycombIcon className="w-6 h-6" />
            <div>
              <span className="text-base font-black text-[#1E4B7A]">HoneyChain</span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider bg-[#E6EDF5] text-[#1E4B7A] px-1.5 py-0.5 rounded">
                {config.roleLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-[#E6EDF5] text-[#1E4B7A] px-2 py-0.5 rounded-full border border-[#1E4B7A]/20">
              {districtTag}
            </span>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-500 hover:text-[#B3261E] rounded-lg"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/login" className="text-xs font-bold text-[#1E4B7A]">
                Login
              </Link>
            )}
          </div>
        </header>

        {/* Content Container (desktop: takes full advantage of PC monitors) */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-24 md:p-8 md:pb-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MOBILE STICKY BOTTOM THUMB NAVIGATION (< 768px)           */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#D5DBD3] px-3 py-2 flex justify-around items-center z-40"
      >
        {config.navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-xs transition ${
                active ? "text-[#1E4B7A] font-bold" : "text-gray-500 hover:text-[#1E4B7A] font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#1E4B7A]" : "text-gray-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
