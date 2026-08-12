import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, ArrowLeft, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMockAuth } from "@/lib/auth-store";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const userRole = user?.role?.toLowerCase() || "vendor";
  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Payment received",
      description: "Anil Sweets paid ₹24,500 for Invoice #INV-1092 via UPI",
      time: "10 mins ago",
      read: false,
      type: "payment",
      url: "/billing"
    },
    {
      id: 2,
      title: "Low stock alert",
      description: "Atta 10kg has only 8 units left in inventory stock",
      time: "1 hour ago",
      read: false,
      type: "stock",
      url: "/inventory"
    },
    {
      id: 3,
      title: "Reminder sent",
      description: "Payment reminder sent to Patel Stores for ₹36,200 due invoice",
      time: "3 hours ago",
      read: true,
      type: "reminder",
      url: "/parties"
    },
    {
      id: 4,
      title: "New Feature Available",
      description: "You can now customize GST calculation (Intra-state vs Inter-state) and Reverse Charge in settings",
      time: "1 day ago",
      read: true,
      type: "system",
      url: "/settings"
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification removed");
  };

  const handleNotificationClick = (notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    if (notification.url) {
      navigate(`${rolePrefix}${notification.url}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 pb-10 pt-1.5 px-0 sm:px-6">
      {/* Compact Top Header Section for Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-2 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg shrink-0">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-2xl font-bold tracking-tight flex items-center gap-1.5 flex-wrap">
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[9px] sm:text-xs px-1.5 py-0.2">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight">Manage system alerts & payment updates</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-md sm:rounded-lg gap-1 text-[10px] sm:text-xs h-6 sm:h-9 px-2 sm:px-3 font-medium">
              <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
              <span>Mark read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll} className="rounded-md sm:rounded-lg gap-1 text-[10px] sm:text-xs h-6 sm:h-9 px-2 sm:px-3 font-medium">
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span>Clear all</span>
            </Button>
          )}
        </div>
      </div>

      {/* Edge-to-edge full width mobile list & rounded desktop cards */}
      <div className="divide-y divide-slate-100 bg-white sm:bg-transparent sm:space-y-2.5 sm:divide-y-0 border-y sm:border-y-0 border-slate-200/80">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start justify-between p-3 sm:p-4 sm:rounded-2xl sm:border border-slate-200/80 sm:shadow-sm transition-all cursor-pointer hover:bg-slate-50 gap-2.5 sm:gap-4 ${
                !n.read ? "bg-emerald-50/60 sm:border-emerald-200/80" : "bg-white"
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                <div className={`mt-0.5 p-1.5 sm:p-2 rounded-xl shrink-0 ${
                  n.type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                  n.type === 'stock' ? 'bg-amber-100 text-amber-700' :
                  n.type === 'reminder' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {n.type === 'stock' ? <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className={`text-xs sm:text-sm font-semibold truncate ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal break-words">{n.description}</p>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block pt-0.5 font-medium">{n.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 self-center shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => deleteNotification(n.id, e)}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300 shrink-0" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 sm:py-16 space-y-3 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700">No notifications</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">You are all caught up! Clear alerts will show here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
