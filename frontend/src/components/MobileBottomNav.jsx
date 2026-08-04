import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ReceiptText, Boxes, Users, MoreHorizontal } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useMockAuth } from "@/lib/auth-store";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Parties", url: "/parties", icon: Users },
  { title: "Billing", url: "/billing", icon: ReceiptText },
  { title: "Inventory", url: "/inventory", icon: Boxes },
];

export function MobileBottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { toggleSidebar } = useSidebar();
  const { user } = useMockAuth();

  const userRole = user?.role?.toLowerCase() || "user";
  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";

  const getRoleUrl = (url) => {
    if (url === "/") return "/";
    return `${rolePrefix}${url}`;
  };

  const isActive = (url) => {
    const targetUrl = getRoleUrl(url);
    return targetUrl === "/" ? path === "/" : path.startsWith(targetUrl);
  };

  return (
    <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe pb-2 pt-2 px-1 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const active = isActive(item.url);
        return (
          <Link
            key={item.title}
            to={getRoleUrl(item.url)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] rounded-xl py-1 transition-colors ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`flex items-center justify-center p-1.5 rounded-xl transition-all duration-300 ${active ? "bg-primary-soft text-primary shadow-sm scale-110" : ""}`}>
              <item.icon className={`h-5 w-5 ${active ? "fill-primary/20 stroke-[2.5px]" : "stroke-2"}`} />
            </div>
            <span className={`text-[10px] font-medium tracking-tight ${active ? "font-semibold" : ""}`}>
              {item.title}
            </span>
          </Link>
        );
      })}
      
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-1 min-w-[64px] rounded-xl py-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center justify-center p-1.5 rounded-xl transition-all duration-300">
          <MoreHorizontal className="h-5 w-5 stroke-2" />
        </div>
        <span className="text-[10px] font-medium tracking-tight">More</span>
      </button>
    </div>
  );
}
