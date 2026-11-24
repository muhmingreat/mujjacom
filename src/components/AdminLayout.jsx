import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  ArrowLeftRight,
  FileSearch,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import BrandMark from "./BrandMark.jsx";

const navigation = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "PROPERTY MANAGEMENT",
    items: [
      {
        name: "All properties",
        path: "/admin/properties",
        icon: Building2,
      },
      {
        name: "Property reviews",
        path: "/admin/property-reviews",
        icon: ClipboardCheck,
      },
      {
        label: "Due Diligence",
        path: "/admin/due-diligence",
        icon: FileSearch,
      },
      {
        name: "Estate Showcase",
        path: "/admin/estates",
        icon: Building2,
      },
    ],
  },
  {
    label: "PLATFORM MANAGEMENT",
    items: [
      {
        name: "Applications",
        path: "/admin/applications",
        icon: FileText,
      },
      {
        name: "Members",
        path: "/admin/members",
        icon: Users,
      },
      {
        name: "Transactions",
        path: "/admin/transactions",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f4f8f6]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-gray-100 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
          <NavLink to="/admin" onClick={closeSidebar}>
            <BrandMark />
          </NavLink>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Administrator profile */}
        <div className="border-b border-gray-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#159447]">
              <ShieldCheck size={24} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {fullName || "Administrator"}
              </p>

              <p className="truncate text-xs text-gray-500">
                {user?.email || "Admin account"}
              </p>

              <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1769AA]">
                {user?.role || "Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-gray-400">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-green-50 text-[#159447]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#1769AA]"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-3">
                            <Icon size={18} />
                            {item.name}
                          </span>

                          {isActive && <ChevronRight size={16} />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-100 p-4">
          <NavLink
            to="/"
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#1769AA]"
          >
            <Home size={18} />
            Visit website
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#159447]">
                Administration
              </p>

              <p className="text-sm font-bold text-gray-900">
                AMANAH ESTATES CONTROL PANEL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-600 sm:block">
              {user?.firstName || "Administrator"}
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#1769AA]">
              <UserCircle size={23} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto min-h-[calc(100vh-145px)] w-full max-w-[1600px] p-4 sm:p-7 lg:p-9">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 px-6 py-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} AMANAH ESTATES. Administrative workspace.
        </footer>
      </div>
    </div>
  );
}
