import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="max-w-4xl mx-auto space-y-6 pb-10 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Manage and view all your system alerts & payment updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-xl gap-1.5 text-xs">
              <CheckCheck className="h-4 w-4 text-emerald-600" />
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll} className="rounded-xl gap-1.5 text-xs">
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start justify-between p-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                  !n.read ? "bg-emerald-50/40" : ""
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 pr-4">
                  <div className={`mt-0.5 p-2 rounded-xl ${
                    n.type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                    n.type === 'stock' ? 'bg-amber-100 text-amber-700' :
                    n.type === 'reminder' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {n.type === 'stock' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                    <span className="text-[11px] text-slate-400 block pt-0.5">{n.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No notifications</h3>
              <p className="text-xs text-muted-foreground">You are all caught up! Clear alerts will show here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
