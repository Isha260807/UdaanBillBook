import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import { useMockAuth, mockAuth } from "@/lib/auth-store";
import { useNotifications } from "@/hooks/useNotifications";
import api from "@/lib/api";

import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, XCircle } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/register", "/verify-otp", "/admin/login", "/user/login", "/vendor", "/staff"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hydrated, user } = useMockAuth();
  const { isMobileOnly, currentPlan } = useSubscription();
  const [isDesktopScreen, setIsDesktopScreen] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(false);
  const [authSynced, setAuthSynced] = React.useState(false);

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await api.get("/auth/me");
      if (res.data.status === "Active") {
        mockAuth.updateUser({ status: "Active" });
        toast.success("Congratulations! Your account has been approved by SuperAdmin!");
        window.location.reload();
      } else if (res.data.status === "Rejected") {
        mockAuth.updateUser({ status: "Rejected" });
        toast.error("Your account registration was not approved.");
      } else {
        toast.info("Your registration is still under review. We will notify you once approved.");
      }
    } catch (err) {
      toast.error("Failed to check status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktopScreen(window.innerWidth >= 768);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Initialize push notifications for authenticated users
  useNotifications();
  const isPublic = PUBLIC_ROUTES.some((p) => {
    if (p === "/vendor" || p === "/staff") {
      return location.pathname === p;
    }
    return location.pathname.startsWith(p);
  });

  const pathname = location.pathname;
  const isPricingPage = pathname.includes("/pricing");

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && !isPublic) {
      navigate("/login");
    } else if (isAuthenticated && (pathname === "/login" || pathname === "/register" || pathname === "/verify-otp")) {
      const userObj = mockAuth.get();
      const redirectPath = (userObj?.role?.toLowerCase() === "staff" || userObj?.role?.toLowerCase() === "viewer") ? "/staff/dashboard" : (userObj?.role?.toLowerCase() === "admin" ? "/admin" : "/vendor/dashboard");
      navigate(redirectPath, { replace: true });
    }
  }, [hydrated, isAuthenticated, isPublic, navigate, pathname]);

  const syncProfile = React.useCallback(() => {
    if (!isAuthenticated) return;
    api.get("/auth/me")
      .then((res) => {
        const userName = res.data.name && res.data.name.trim() ? res.data.name : (res.data.businessName || res.data.phone || "Vendor");
        const bizName = res.data.businessName && res.data.businessName.trim() ? res.data.businessName : "My Business";
        mockAuth.updateUser({
          subscription: res.data.subscription,
          role: res.data.role,
          status: res.data.status || "Active",
          permissions: res.data.permissions || [],
          name: userName,
          business: bizName,
          businessName: bizName,
          address: res.data.businessAddress || "",
          businessAddress: res.data.businessAddress || "",
          gstin: res.data.gstin || "",
          phone: res.data.phone,
          email: res.data.email || ""
        });
        setAuthSynced(true);
      })
      .catch((err) => {
        console.error("Failed to sync user profile with database:", err);
        setAuthSynced(true);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    syncProfile();

    if (!isAuthenticated) return;

    // Real-time permission sync only when user focuses the tab
    const onFocus = () => syncProfile();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, syncProfile]);

  if (isPublic) {
    return (
      <>
        <Outlet />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Avoid flashing protected layout before redirect / sync
  if ((hydrated && !isAuthenticated) || (isAuthenticated && !authSynced)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Compact Light-Theme Account Under Review Screen for Pending Vendors
  if (user?.role !== "admin" && user?.status === "Pending") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Under Review</h2>
            <p className="text-xs text-slate-500 leading-relaxed px-1">
              Welcome, <strong className="text-slate-800">{user?.name || user?.businessName}</strong>! Your registration has been submitted and is currently being reviewed by SuperAdmin.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2 text-left">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
              <span className="text-slate-500">Mobile Number:</span>
              <span className="font-semibold text-slate-900">+91 {user?.phone}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
              <span className="text-slate-500">Business Name:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[150px]">{user?.businessName || "My Business"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Status:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pending Approval
              </span>
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <Button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow flex items-center justify-center gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingStatus ? "animate-spin" : ""}`} />
              {checkingStatus ? "Checking Status..." : "Check Approval Status"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                mockAuth.signOut();
                navigate("/login");
              }}
              className="w-full h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center justify-center gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  // Compact Light-Theme Account Rejected Screen
  if (user?.role !== "admin" && user?.status === "Rejected") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="max-w-sm w-full bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
            <XCircle className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-rose-600 tracking-tight">Registration Not Approved</h2>
            <p className="text-xs text-slate-500 leading-relaxed px-1">
              Your vendor registration request for <strong className="text-slate-800">{user?.businessName}</strong> could not be approved at this time.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              mockAuth.signOut();
              navigate("/login");
            }}
            className="w-full h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center justify-center gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Return to Login
          </Button>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  const showMobileOnlyRestriction = isMobileOnly && isDesktopScreen && !isPricingPage;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">

        {showMobileOnlyRestriction ? (
          <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 min-h-screen">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border shadow-xl text-center space-y-5">
              <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Smartphone className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Desktop Access Restricted</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Your current subscription <span className="font-semibold text-slate-800">({currentPlan} Plan)</span> is restricted to <span className="font-semibold text-amber-600">Mobile Only</span>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 border text-left space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-primary" /> Want Desktop & Laptop Access?
                </p>
                <p>Upgrade to <strong>Silver</strong> or <strong>Gold</strong> plan to unlock full Desktop & Web Browser access.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Button 
                  onClick={() => navigate("/vendor/pricing")} 
                  className="w-full h-11 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  Upgrade Plan for Desktop Access
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 w-full">
            <AppSidebar />
            <SidebarInset className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
              <AppTopbar />
              <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
                <Outlet />
              </main>
              <MobileBottomNav />
            </SidebarInset>
          </div>
        )}
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
