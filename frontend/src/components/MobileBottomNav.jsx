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

  if (path.endsWith('/sale/new') || path.endsWith('/purchase/new')) return null;

  const { toggleSidebar, openMobile } = useSidebar();
  const { user } = useMockAuth();

  const userRole = user?.role?.toLowerCase() || "user";
  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";

  const getRoleUrl = (url) => {
    if (url === "/") return `${rolePrefix}/dashboard`;
    return `${rolePrefix}${url}`;
  };

  const isActive = (url) => {
    const targetUrl = getRoleUrl(url);
    if (url === "/") {
      return path === "/" || path === `${rolePrefix}/dashboard` || path === `${rolePrefix}` || path === `${rolePrefix}/`;
    }
    return path.startsWith(targetUrl);
  };

  return (
    <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/95 backdrop-blur-lg border-t border-slate-200/80 pb-safe pb-2 pt-2 px-1 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const active = isActive(item.url);
        return (
          <Link
            key={item.title}
            to={getRoleUrl(item.url)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1 transition-all rounded-xl ${
              active ? "text-emerald-600" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${
              active ? "bg-emerald-100/90 text-emerald-600 font-bold scale-105 shadow-sm" : ""
            }`}>
              <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5px] text-emerald-600" : "stroke-[1.75px] text-slate-500"}`} />
            </div>
            <span className={`text-[10px] tracking-tight ${active ? "font-extrabold text-emerald-600" : "font-medium text-slate-500"}`}>
              {item.title}
            </span>
          </Link>
        );
      })}
      
      <button
        type="button"
        onClick={toggleSidebar}
        className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1 transition-all rounded-xl ${
          openMobile ? "text-emerald-600" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <div className={`flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${
          openMobile ? "bg-emerald-100/90 text-emerald-600 font-bold scale-105 shadow-sm" : ""
        }`}>
          <MoreHorizontal className={`h-5 w-5 ${openMobile ? "stroke-[2.5px] text-emerald-600" : "stroke-[1.75px] text-slate-500"}`} />
        </div>
        <span className={`text-[10px] tracking-tight ${openMobile ? "font-extrabold text-emerald-600" : "font-medium text-slate-500"}`}>
          More
        </span>
      </button>
    </div>
  );
}
