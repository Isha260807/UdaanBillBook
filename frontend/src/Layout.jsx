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
import { Smartphone, Monitor } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/register", "/verify-otp", "/admin/login", "/user/login", "/vendor", "/staff"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hydrated } = useMockAuth();
  const { isMobileOnly, currentPlan } = useSubscription();
  const [isDesktopScreen, setIsDesktopScreen] = React.useState(false);

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
      const user = mockAuth.get();
      const redirectPath = (user?.role?.toLowerCase() === "staff" || user?.role?.toLowerCase() === "viewer") ? "/staff/dashboard" : (user?.role?.toLowerCase() === "admin" ? "/admin" : "/vendor/dashboard");
      navigate(redirectPath, { replace: true });
    }
  }, [hydrated, isAuthenticated, isPublic, navigate, pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/auth/me")
        .then((res) => {
          const userName = res.data.name && res.data.name.trim() ? res.data.name : (res.data.businessName || res.data.phone || "Vendor");
          const bizName = res.data.businessName && res.data.businessName.trim() ? res.data.businessName : "My Business";
          mockAuth.updateUser({
            subscription: res.data.subscription,
            role: res.data.role,
            name: userName,
            business: bizName,
            businessName: bizName,
            address: res.data.businessAddress || "",
            businessAddress: res.data.businessAddress || "",
            gstin: res.data.gstin || "",
            phone: res.data.phone,
            email: res.data.email || ""
          });
        })
        .catch((err) => {
          console.error("Failed to sync user profile with database:", err);
        });
    }
  }, [isAuthenticated]);

  if (isPublic) {
    return (
      <>
        <Outlet />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Avoid flashing protected layout before redirect
  if (hydrated && !isAuthenticated) return null;

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
              <main className="flex-1 p-4 md:p-6 lg:p-8">
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
