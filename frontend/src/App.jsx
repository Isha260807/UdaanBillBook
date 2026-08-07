import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Layout from "./Layout";
import { InvoiceProvider } from "./contexts/InvoiceContext";

// Auth Pages
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";

// Dashboard Pages
import { MainDashboard } from "./modules/dashboard/MainDashboard";
import { AccountingDashboard } from "./modules/accounting/AccountingDashboard";
import { UserManagement } from "./modules/admin/UserManagement";
import { BillingDashboard } from "./modules/billing/BillingDashboard";
import NewSale from "./modules/billing/NewSale";
import NewPurchase from "./modules/billing/NewPurchase";
import { ExpensesDashboard } from "./modules/expenses/ExpensesDashboard";
import { GstDashboard } from "./modules/gst/GstDashboard";
import { InventoryDashboard } from "./modules/inventory/InventoryDashboard";
import { PartiesDashboard } from "./modules/parties/PartiesDashboard";
import { ReportsDashboard } from "./modules/reports/ReportsDashboard";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import UserTickets from "./pages/UserTickets";
import NotificationsPage from "./pages/NotificationsPage";
import PublicInvoiceView from "./pages/PublicInvoiceView";
import PublicPaymentPage from "./pages/PublicPaymentPage";
import { useSubscription } from "./hooks/useSubscription";
import { useMockAuth } from "./lib/auth-store";

// SuperAdmin imports
import { SuperAdminLayout } from "./modules/superadmin/layouts/SuperAdminLayout";
import { SADashboard } from "./modules/superadmin/pages/SADashboard";
import { BusinessManagement } from "./modules/superadmin/pages/BusinessManagement";
import { SubscriptionManager } from "./modules/superadmin/pages/SubscriptionManager";
import { RevenueTransactions } from "./modules/superadmin/pages/RevenueTransactions";
import { SecurityCenter } from "./modules/superadmin/pages/SecurityCenter";
import { PlatformAnalytics } from "./modules/superadmin/pages/PlatformAnalytics";
import { UserManagementSA } from "./modules/superadmin/pages/UserManagementSA";
import { SupportTickets } from "./modules/superadmin/pages/SupportTickets";
import { ActivityLog } from "./modules/superadmin/pages/ActivityLog";
import { SASettings } from "./modules/superadmin/pages/SASettings";
import { BusinessCategories } from "./modules/superadmin/pages/BusinessCategories";
import { InvoiceTemplateManager } from "./modules/superadmin/pages/InvoiceTemplateManager";

import { toast } from "sonner";

function StaffPermissionGuard({ children, feature }) {
  const { user, hydrated } = useMockAuth();
  const { canAccessFeature } = useSubscription();

  if (!hydrated) return null;

  const role = user?.role?.toLowerCase();
  const isStaff = role === "staff" || role === "viewer";

  if (isStaff && feature) {
    if (feature === "pricing") {
      toast.error("Access Restricted: Staff members cannot access the Pricing section.");
      return <Navigate to="/staff/dashboard" replace />;
    }

    const permissions = user?.permissions || [];
    const hasPermission = feature === "dashboard" || permissions.includes(feature);

    if (!hasPermission) {
      toast.error(`Access Restricted: You do not have permission to access '${feature}'.`);
      return <Navigate to="/staff/dashboard" replace />;
    }
  }

  // Pricing page is always accessible to Vendors
  if (feature && feature !== "pricing" && !canAccessFeature(feature)) {
    return <Navigate to={isStaff ? "/staff/dashboard" : "/vendor/pricing"} replace />;
  }

  return children;
}

function SuperAdminGuard({ children }) {
  const { user, hydrated } = useMockAuth();

  if (!hydrated) return null;

  if (!user || user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user, hydrated } = useMockAuth();
  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  const role = user.role?.toLowerCase();
  if (role === "staff" || role === "viewer") {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return <Navigate to="/vendor/dashboard" replace />;
}

export default function App() {
  return (
    <InvoiceProvider>
    <BrowserRouter>
      <Routes>
        {/* Standalone External Public Pages (No Vendor Sidebar/Header) */}
        <Route path="/invoice/:id" element={<PublicInvoiceView />} />
        <Route path="/pay/:id" element={<PublicPaymentPage />} />

        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/login" element={<Login role="vendor" />} />
          <Route path="/vendor" element={<Navigate to="/login" replace />} />
          <Route path="/staff" element={<Navigate to="/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Protected Business Routes */}
          <Route path="/:roleType/dashboard" element={<MainDashboard />} />
          <Route path="/:roleType/accounting" element={<StaffPermissionGuard feature="accounting"><AccountingDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/staff-management" element={<StaffPermissionGuard feature="admin"><UserManagement /></StaffPermissionGuard>} />
          <Route path="/:roleType/billing" element={<StaffPermissionGuard feature="billing"><BillingDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/sale/new" element={<StaffPermissionGuard feature="billing"><NewSale /></StaffPermissionGuard>} />
          <Route path="/:roleType/purchase/new" element={<StaffPermissionGuard feature="billing"><NewPurchase /></StaffPermissionGuard>} />
          <Route path="/:roleType/expenses" element={<StaffPermissionGuard feature="expenses"><ExpensesDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/gst" element={<StaffPermissionGuard feature="gst"><GstDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/inventory" element={<StaffPermissionGuard feature="inventory"><InventoryDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/parties" element={<StaffPermissionGuard feature="parties"><PartiesDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/reports" element={<StaffPermissionGuard feature="reports"><ReportsDashboard /></StaffPermissionGuard>} />
          <Route path="/:roleType/settings" element={<StaffPermissionGuard feature="settings"><Settings /></StaffPermissionGuard>} />
          <Route path="/:roleType/pricing" element={<StaffPermissionGuard feature="pricing"><Pricing /></StaffPermissionGuard>} />
          <Route path="/:roleType/notifications" element={<NotificationsPage />} />
          <Route path="/:roleType/tickets" element={<UserTickets />} />

          {/* Root Redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ====== Admin Routes (completely separate layout) ====== */}
        <Route element={<SuperAdminGuard><SuperAdminLayout /></SuperAdminGuard>}>
          <Route path="/admin" element={<SADashboard />} />
          <Route path="/admin/analytics" element={<PlatformAnalytics />} />
          <Route path="/admin/businesses" element={<BusinessManagement />} />
          <Route path="/admin/subscriptions" element={<SubscriptionManager />} />
          <Route path="/admin/revenue" element={<RevenueTransactions />} />
          <Route path="/admin/users" element={<UserManagementSA />} />
          <Route path="/admin/security" element={<SecurityCenter />} />
          <Route path="/admin/tickets" element={<SupportTickets />} />
          <Route path="/admin/activity" element={<ActivityLog />} />
          <Route path="/admin/settings" element={<SASettings />} />
          <Route path="/admin/categories" element={<BusinessCategories />} />
          <Route path="/admin/templates" element={<InvoiceTemplateManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </InvoiceProvider>
  );
}
