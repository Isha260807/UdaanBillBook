import React, { useState, useEffect } from "react";
import { Bell, Search, Moon, Sun, Command, LogOut, Settings as SettingsIcon, User as UserIcon, X } from "lucide-react";
import { useMockAuth, mockAuth } from "@/lib/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

export function SuperAdminTopbar() {
  const { user } = useMockAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Business Signup", description: "Keshav Travels registered", url: "/admin/businesses" },
    { id: 2, title: "Support Ticket #1024", description: "Payment pending issue", url: "/admin/tickets" },
    { id: 3, title: "Subscription Upgraded", description: "Sharma Traders moved to Gold", url: "/admin/subscriptions" }
  ]);

  const clearAllNotifications = (e) => {
    e.stopPropagation();
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const removeNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [data, setData] = useState({ businesses: [], users: [], tickets: [] });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchSearchData = async () => {
    setIsFocused(true);
    if (data.businesses.length > 0) return;
    setLoading(true);
    try {
      const [bizRes, usersRes, tktRes] = await Promise.all([
        api.get("/admin/businesses"),
        api.get("/admin/users"),
        api.get("/admin/tickets").catch(() => ({ data: [] }))
      ]);
      setData({
        businesses: bizRes.data || [],
        users: usersRes.data || [],
        tickets: tktRes.data || []
      });
    } catch (err) {
      console.error("Error loading search data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleLogout = () => {
    mockAuth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredBusinesses = query
    ? data.businesses.filter(b => 
        (b.name || "").toLowerCase().includes(query) ||
        (b.owner || "").toLowerCase().includes(query) ||
        (b.city || "").toLowerCase().includes(query) ||
        (b.plan || "").toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const filteredUsers = query
    ? data.users.filter(u =>
        (u.name || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query) ||
        (u.phone || "").toLowerCase().includes(query) ||
        (u.role || "").toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const filteredTickets = query
    ? data.tickets.filter(t =>
        (t.subject || "").toLowerCase().includes(query) ||
        (t.business || "").toLowerCase().includes(query) ||
        (t.status || "").toLowerCase().includes(query) ||
        (t.id || "").toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const hasResults = filteredBusinesses.length > 0 || filteredUsers.length > 0 || filteredTickets.length > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6 backdrop-blur-xl"
      style={{
        background: "oklch(0.16 0.03 257 / 85%)",
        borderColor: "oklch(1 0 0 / 8%)"
      }}
    >
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md relative">
        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search businesses, users, tickets..."
            className="w-full h-9 rounded-xl pl-9 pr-12 text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={fetchSearchData}
            onBlur={handleBlur}
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md bg-white/5 px-1.5 py-0.5 border border-white/10">
            <Command className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">K</span>
          </div>
        </div>

        {/* Search Results Dropdown Overlay */}
        {isFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 shadow-2xl p-4 overflow-y-auto max-h-[400px] z-50 backdrop-blur-xl bg-slate-900/95 text-left">
            {loading ? (
              <div className="flex py-6 items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span className="text-xs text-slate-400">Searching platform...</span>
              </div>
            ) : !hasResults ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No matching businesses, users, or tickets found.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Businesses */}
                {filteredBusinesses.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Businesses</h4>
                    <div className="space-y-1.5">
                      {filteredBusinesses.map(b => (
                        <Link
                          key={b.id || b._id}
                          to={`/admin/businesses?search=${b.name}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/3 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all text-xs"
                        >
                          <div className="text-left">
                            <p className="font-bold text-white">{b.name}</p>
                            <p className="text-[10px] text-slate-400">{b.owner} • {b.city}</p>
                          </div>
                          <span className="bg-emerald-500/15 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-semibold">{b.plan}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {filteredUsers.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Vendors / Users</h4>
                    <div className="space-y-1.5">
                      {filteredUsers.map(u => (
                        <Link
                          key={u._id}
                          to={`/admin/users?search=${u.name}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/3 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all text-xs"
                        >
                          <div className="text-left">
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email || u.phone}</p>
                          </div>
                          <span className="bg-blue-500/15 text-blue-400 text-[9px] px-2 py-0.5 rounded-full font-semibold capitalize">{u.role}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tickets */}
                {filteredTickets.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Support Tickets</h4>
                    <div className="space-y-1.5">
                      {filteredTickets.map(t => (
                        <Link
                          key={t.id}
                          to={`/admin/tickets?search=${t.id}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/3 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all text-xs"
                        >
                          <div className="text-left max-w-[70%]">
                            <p className="font-bold text-white truncate">{t.subject}</p>
                            <p className="text-[10px] text-slate-400 truncate">{t.business} • ID: {t.id}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${t.status === "Open" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>{t.status}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1">
                  {notifications.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-slate-900 border border-white/10 text-slate-200">
            <DropdownMenuLabel className="flex items-center justify-between font-semibold">
              <span className="text-white">Notifications</span>
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase hover:underline"
                >
                  Clear All
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            {notifications.length > 0 ? (
              <>
                {notifications.map((n) => (
                  <DropdownMenuItem 
                    key={n.id}
                    className="flex items-center justify-between cursor-pointer group pr-2 py-2 focus:bg-white/5 focus:text-white text-slate-300"
                    onClick={() => navigate(n.url)}
                  >
                    <div className="flex flex-col items-start gap-0.5 flex-1 pr-2">
                      <span className="text-xs font-semibold text-white">{n.title}</span>
                      <span className="text-[11px] text-slate-400">{n.description}</span>
                    </div>
                    <button
                      onClick={(e) => removeNotification(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/5 p-1 rounded transition-all text-slate-500 hover:text-slate-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  className="text-center justify-center text-xs font-semibold text-emerald-400 cursor-pointer hover:bg-white/5 py-2.5 focus:bg-white/5 focus:text-emerald-400"
                  onClick={() => navigate("/admin/notifications")}
                >
                  View All Notifications →
                </DropdownMenuItem>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                <p>All caught up! 🎉</p>
                <button 
                  onClick={() => navigate("/admin/notifications")}
                  className="text-xs text-emerald-400 font-semibold hover:underline mt-2 inline-block"
                >
                  Go to Notifications Page
                </button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:flex h-8 w-px bg-white/10 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 hover:bg-white/10 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold">
                  DA
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user?.name || "SuperAdmin"}
                </span>
                <span className="text-[10px] text-emerald-400 leading-tight">Platform Owner</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border border-white/10 text-slate-200">
            <DropdownMenuLabel className="flex flex-col border-b border-white/5 pb-2">
              <span className="text-white font-bold">{user?.name || "Demo Admin"}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {user?.email || "admin@udaan.com"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer">
              <Link to="/admin/settings" className="flex items-center w-full">
                <UserIcon className="mr-2 h-4 w-4 text-slate-400" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer">
              <Link to="/admin/settings" className="flex items-center w-full">
                <SettingsIcon className="mr-2 h-4 w-4 text-slate-400" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
