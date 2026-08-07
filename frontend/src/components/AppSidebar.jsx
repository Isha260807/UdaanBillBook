import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  Boxes,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Sparkles,
  Calculator,
  ShieldCheck,
  UserCog,
  LogOut,
  Lock,
  Ticket,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMockAuth, mockAuth } from "@/lib/auth-store";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { usePlatformSettings } from "@/lib/platform-settings";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
const logo = "/udaan-logo-removebg-preview.png";

const main = [
  { title: "Dashboard", url: "/vendor/dashboard", icon: LayoutDashboard },
  { title: "Billing", url: "/vendor/billing", icon: ReceiptText },
  { title: "Inventory", url: "/vendor/inventory", icon: Boxes },
  { title: "Parties", url: "/vendor/parties", icon: Users },
  { title: "Expenses", url: "/vendor/expenses", icon: Wallet },
  { title: "Accounting", url: "/vendor/accounting", icon: Calculator },
  { title: "GST & Tax", url: "/vendor/gst", icon: ShieldCheck },
  { title: "Reports", url: "/vendor/reports", icon: BarChart3 },
];

const adminItems = [
  { title: "Staff Management", url: "/vendor/staff-management", icon: UserCog },
  { title: "Support", url: "/vendor/tickets", icon: Ticket },
  { title: "Settings", url: "/vendor/settings", icon: Settings }
];

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useMockAuth();
  const { currentPlan, isFree, canAccessFeature } = useSubscription();
  const { setOpenMobile, isMobile } = useSidebar();
  
  // Use actual user role from auth store, default to user if missing
  const userRole = user?.role?.toLowerCase() || "user"; 
  const isVendor = userRole === "vendor" || userRole === "admin"; // Admin also gets access just in case

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const { settings } = usePlatformSettings();
  const enableItem = settings?.itemSettings?.enableItem !== false;

  // Filter sections based on permissions
  const filteredMain = main.filter(item => {
    const featureKey = (item.url.split("/").pop() || "dashboard").toLowerCase();

    // If Item Module is turned OFF in settings, hide Inventory
    if (featureKey === "inventory" && !enableItem) return false;

    if (isVendor) return true;
    if (["staff", "viewer", "user"].includes(userRole)) {
      // 1. Check custom permission
      const permissions = user?.permissions || [];
      const hasPermission = featureKey === "dashboard" || permissions.includes(featureKey);
      
      if (!hasPermission) return false;

      // 2. Hide locked premium features from staff members entirely so no lock icons show up
      return canAccessFeature(featureKey);
    }
    return false;
  });

  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";
  const getRoleUrl = (url) => url.replace(/^\/vendor/, rolePrefix);

  const isActive = (url) => {
    const roleUrl = getRoleUrl(url);
    return roleUrl === `${rolePrefix}/dashboard` ? path === roleUrl : path.startsWith(roleUrl);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    mockAuth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={logo} alt="Udaan" className="h-9 w-9 rounded-xl object-cover shadow-[var(--shadow-glow)]" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-tight">Udaan BillBook</span>
            <span className="text-[11px] text-muted-foreground leading-tight">Business Accounting</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Business Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMain.map((item) => {
                // To determine the feature name from the URL (e.g., /vendor/billing -> billing)
                const featureKey = item.url.split("/").pop() || "dashboard";
                const hasAccess = canAccessFeature(featureKey);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)} 
                      tooltip={item.title} 
                      onClick={closeSidebar}
                      className={!hasAccess ? "opacity-50 hover:opacity-100" : ""}
                    >
                      <Link to={hasAccess ? getRoleUrl(item.url) : `${rolePrefix}/pricing`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isVendor && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const featureKey = item.url.split("/").pop() || "settings";
                  const hasAccess = canAccessFeature(featureKey);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)} 
                        tooltip={item.title} 
                        onClick={closeSidebar}
                        className={!hasAccess ? "opacity-50 hover:opacity-100" : ""}
                      >
                        <Link to={hasAccess ? item.url : `${rolePrefix}/pricing`}>
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          {/* User Profile Info Card */}
          <SidebarMenuItem className="mb-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="h-9 w-9 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 uppercase">
                {(user?.name || user?.businessName || "U")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || user?.businessName || "User Profile"}
                </p>
                <p className="text-[10px] font-medium text-slate-500 truncate capitalize flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user?.role || "Vendor"} {user?.phone ? `• ${user.phone}` : ""}
                </p>
              </div>
            </div>
          </SidebarMenuItem>

          {isVendor && (
            <SidebarMenuItem className="mb-2 group-data-[collapsible=icon]:hidden">
              {isFree ? (
                <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-background rounded-md shadow-sm">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">Free Plan</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Limited features</p>
                    </div>
                  </div>
                  <Link to="/vendor/pricing" onClick={closeSidebar}>
                    <button className="w-full text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 rounded-lg transition-colors">
                      Upgrade to Premium
                    </button>
                  </Link>
                </div>
              ) : (
                <Link to="/vendor/pricing" onClick={closeSidebar}>
                  <div className="flex items-center gap-3 rounded-xl bg-primary-soft p-3 hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{currentPlan} Plan</p>
                      <p className="text-[11px] text-muted-foreground">All features unlocked</p>
                    </div>
                  </div>
                </Link>
              )}
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
