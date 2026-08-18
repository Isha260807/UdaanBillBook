import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, CreditCard, TrendingUp,
  ShieldAlert, Users, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Ticket, Activity,
  Sparkles, Crown, LayoutGrid, FileText
} from "lucide-react";
import { mockAuth } from "@/lib/auth-store";
import { toast } from "sonner";

const menuGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
      { title: "Revenue", url: "/admin/revenue", icon: TrendingUp },
      { title: "Vendors", url: "/admin/users", icon: Users },
      { title: "Categories", url: "/admin/categories", icon: LayoutGrid },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Tickets", url: "/admin/tickets", icon: Ticket },
      { title: "Activity", url: "/admin/activity", icon: Activity },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

export function SuperAdminSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url) =>
    url === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(url);

  const handleLogout = () => {
    mockAuth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
      style={{
        background: "linear-gradient(180deg, oklch(0.14 0.03 257) 0%, oklch(0.18 0.04 260) 100%)",
        borderColor: "oklch(1 0 0 / 8%)"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <Crown className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white tracking-tight">Udaan</span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Admin Console</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.url);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    title={collapsed ? item.title : undefined}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                      active
                        ? "bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                    }`} />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                    {/* Notification dot */}
                    {item.title === "Tickets" && (
                      <span className={`${collapsed ? "absolute right-2 top-1" : "ml-auto"} flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1.5`}>
                        7
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-300">Platform Owner</p>
              <p className="text-[10px] text-slate-500 truncate">Full access granted</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
