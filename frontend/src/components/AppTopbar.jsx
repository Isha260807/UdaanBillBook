import React, { useState, useEffect } from "react";
import { Bell, Search, Plus, LogOut, Settings as SettingsIcon, User, Menu, X, Calculator } from "lucide-react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
const logo = "/udaan-logo-removebg-preview.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewInvoiceDialog } from "@/components/NewInvoiceDialog";
import { GstCalculatorDialog } from "@/components/GstCalculatorDialog";
import { useMockAuth, mockAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export function AppTopbar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("create-invoice") === "true";
  const setOpen = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set("create-invoice", "true");
      } else {
        next.delete("create-invoice");
      }
      return next;
    });
  };
  const { user } = useMockAuth();
  const [isGstCalculatorOpen, setIsGstCalculatorOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Payment received", description: "Anil Sweets paid ₹24,500", url: "/billing" },
    { id: 2, title: "Low stock alert", description: "Atta 10kg has only 8 units left", url: "/inventory" },
    { id: 3, title: "Reminder sent", description: "Patel Stores · ₹36,200 due", url: "/parties" }
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

  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem('pendingDialogInvoice')) {
      setOpen(true);
    }
  }, []);

  const path = location.pathname;
  if (path.endsWith('/sale/new') || path.endsWith('/purchase/new')) return null;

  const userRole = user?.role?.toLowerCase() || "vendor";
  const isStaff = userRole === "staff" || userRole === "viewer";

  const initials = (user?.name || "RK")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onLogout = () => {
    mockAuth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  const rolePrefix = isStaff ? "/staff" : "/vendor";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 px-3 backdrop-blur md:px-6">
        
        {/* Mobile Left: Logo & Business Name */}
        <div className="flex items-center gap-2 md:hidden">
          <Avatar className="h-8 w-8 shadow-sm">
            <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">
              {user?.business?.substring(0, 2).toUpperCase() || "ST"}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{user?.business ?? "Sharma Traders"}</span>
        </div>

        {/* Desktop Left: Sidebar Trigger */}
        <div className="hidden md:flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>

        {/* Removed top search bar */}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* New Invoice & E-Way Bill Buttons (Desktop Only) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-xl px-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              asChild
            >
              <Link to={`${rolePrefix}/sale/new?ewaybill=true`}>
                <Plus className="mr-1 h-4 w-4" />
                E-Way Bill
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-xl px-4"
              asChild
            >
              <Link to={`${rolePrefix}/sale/new`}>
                <Plus className="mr-1 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>

          {/* Calculator Icon (Mobile Only - next to Bell icon) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-xl"
            onClick={() => setIsGstCalculatorOpen(true)}
            title="GST Calculator"
          >
            <Calculator className="h-5 w-5" />
          </Button>

          {/* Bell Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-destructive p-0 px-1 text-[10px]">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center justify-between font-semibold">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <>
                  {notifications.map((n) => (
                    <DropdownMenuItem 
                      key={n.id}
                      className="flex items-center justify-between cursor-pointer group pr-2 py-2"
                      onClick={() => navigate(`${rolePrefix}${n.url}`)}
                    >
                      <div className="flex flex-col items-start gap-0.5 flex-1 pr-2">
                        <span className="text-xs font-semibold">{n.title}</span>
                        <span className="text-[11px] text-muted-foreground">{n.description}</span>
                      </div>
                      <button
                        onClick={(e) => removeNotification(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-slate-100 p-1 rounded transition-all text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center justify-center text-xs font-semibold text-primary cursor-pointer hover:bg-slate-50 py-2.5"
                    onClick={() => navigate(`${rolePrefix}/notifications`)}
                  >
                    View All Notifications →
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p>All caught up! 🎉</p>
                  <button 
                    onClick={() => navigate(`${rolePrefix}/notifications`)}
                    className="text-xs text-primary font-semibold hover:underline mt-2 inline-block"
                  >
                    Go to Notifications Page
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop: Profile Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border bg-card px-2 py-1.5 transition-colors hover:bg-secondary">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left leading-tight">
                    <p className="text-xs font-semibold">{user?.name ?? "Guest User"}</p>
                    <p className="text-[10px] text-muted-foreground">{user?.business ?? "—"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{user?.name ?? "Guest User"}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {user?.phone ? `+91 ${user.phone}` : "Not signed in"}
                  </span>
                </DropdownMenuLabel>
                {(!isStaff || (user?.permissions || []).includes("settings")) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`${isStaff ? "/staff" : "/vendor"}/settings`}><User className="mr-2 h-4 w-4" /> Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${isStaff ? "/staff" : "/vendor"}/settings`}><SettingsIcon className="mr-2 h-4 w-4" /> Settings</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: Hamburger Menu (Replacing Profile) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl md:hidden text-foreground"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>

        </div>
      </header>
      <NewInvoiceDialog open={open} onOpenChange={setOpen} />
      <GstCalculatorDialog open={isGstCalculatorOpen} onOpenChange={setIsGstCalculatorOpen} />
    </>
  );
}
