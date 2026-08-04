import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ReceiptText,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Plus,
  Calculator,
  ClipboardCheck,
  ShoppingBasket,
  FileText,
  UserCheck,
  Truck,
  Package,
  MoreHorizontal,
  Bell,
  Loader2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { GstCalculatorDialog } from "@/components/GstCalculatorDialog";
import { useMockAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

const salesData = [
  { d: "Mon", sales: 18400, expense: 7200 },
  { d: "Tue", sales: 22100, expense: 8400 },
  { d: "Wed", sales: 19800, expense: 6900 },
  { d: "Thu", sales: 28600, expense: 9100 },
  { d: "Fri", sales: 31200, expense: 10400 },
  { d: "Sat", sales: 38900, expense: 11800 },
  { d: "Sun", sales: 26400, expense: 8800 },
];

const topProducts = [
  { name: "Basmati Rice 5kg", sold: 142, revenue: 56800, stock: 78 },
  { name: "Sunflower Oil 1L", sold: 118, revenue: 21240, stock: 32 },
  { name: "Toor Dal 1kg", sold: 96, revenue: 14400, stock: 12 },
  { name: "Tata Salt 1kg", sold: 87, revenue: 2175, stock: 156 },
  { name: "Atta 10kg", sold: 64, revenue: 32000, stock: 8 },
];

const pending = [
  { name: "Anil Sweets", amount: 24500, days: 12, status: "overdue" },
  { name: "Sharma Kirana", amount: 12800, days: 5, status: "due" },
  { name: "Green Mart", amount: 8400, days: 2, status: "due" },
  { name: "Patel Stores", amount: 36200, days: 21, status: "overdue" },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function Kpi({
  label,
  value,
  delta,
  up,
  icon: Icon,
  tint,
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-[var(--shadow-card)]">
      <CardContent className="p-2 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-0.5 sm:mt-2 text-base sm:text-2xl font-bold tracking-tight truncate">{value}</p>
            <div className="mt-0.5 sm:mt-2 flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs">
              {up ? (
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-destructive" />
              )}
              <span className={up ? "font-semibold text-success truncate" : "font-semibold text-destructive truncate"}>
                {delta}
              </span>
              <span className="hidden sm:inline text-muted-foreground">vs last week</span>
            </div>
          </div>
          <div className={`flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${tint}`}>
            <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MainDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGstCalculatorOpen, setIsGstCalculatorOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const { user } = useMockAuth();
  const { canAccessFeature } = useSubscription();

  const userRole = user?.role?.toLowerCase() || "user";
  const isVendor = userRole === "vendor" || userRole === "admin";
  const permissions = user?.permissions || [];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const totalSales = data?.sales?.totalSales || 0;
  const invoiceCount = data?.sales?.invoiceCount || 0;
  const totalPurchases = data?.purchases || 0;
  const totalExpenses = data?.expenses || 0;
  const netProfit = data?.netProfit || 0;

  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";
  const getRoleUrl = (url) => url.replace(/^\/vendor/, rolePrefix);

  const allActions = [
    { label: "Sale", feature: "billing", icon: ClipboardCheck, color: "text-red-500", bg: "bg-red-50/50", border: "border-red-100", link: "/vendor/billing?type=sale" },
    { label: "Purchase", feature: "billing", icon: ShoppingBasket, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", link: "/vendor/billing?type=purchase" },
    { label: "Expenses", feature: "expenses", icon: ReceiptText, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", link: "/vendor/expenses" },
    { label: "Estimate", feature: "billing", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", link: "/vendor/billing" },
    { label: "E-Way Bill", feature: "billing", icon: Truck, color: "text-purple-600", bg: "bg-purple-50/50", border: "border-purple-100", link: "/vendor/sale/new?ewaybill=true" },
    { label: "Customers", feature: "parties", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", link: "/vendor/parties?type=customer" },
    { label: "Suppliers", feature: "parties", icon: Truck, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", link: "/vendor/parties?type=supplier" },
    { label: "Products", feature: "inventory", icon: Package, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", link: "/vendor/inventory" },
  ];

  const allowedActions = allActions.filter((action) => {
    if (isVendor) return true;
    if (!canAccessFeature(action.feature)) return false;
    const hasPermission = permissions.length === 0
      ? ["dashboard", "billing", "inventory", "parties", "expenses", "accounting"].includes(action.feature)
      : permissions.includes(action.feature);
    return hasPermission;
  });

  const handleTestNotification = useCallback(async () => {
    setSendingTest(true);
    try {
      const res = await api.post('/notifications/test', {
        title: '🔔 Test Notification',
        body: 'Push notifications are working! — Udaan BillBook',
      });
      toast.success('Notification sent!', {
        description: `Success: ${res.data.successCount || 0}, Failed: ${res.data.failureCount || 0}`,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error('Notification failed', { description: msg });
    } finally {
      setSendingTest(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title=""
        actions={
          <div className="flex w-full sm:w-auto items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="rounded-xl px-2.5 sm:px-4 text-xs sm:text-sm">
              <Download className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> <span>Export</span>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0" onClick={() => setIsGstCalculatorOpen(true)} title="GST Calculator">
              <Calculator className="h-4 w-4" />
            </Button>
            <Button size="sm" className="rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-semibold shrink-0" onClick={() => setSearchParams({ "create-invoice": "true" })}>
              <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> <span>New Invoice</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Total Sales" value={fmt(totalSales)} delta={`+${invoiceCount} Bills`} up icon={IndianRupee} tint="bg-primary-soft text-primary" />
        <Kpi label="Total Purchase" value={fmt(totalPurchases)} delta="Real-time" up icon={ShoppingBasket} tint="bg-accent-soft text-accent" />
        <Kpi label="Expenses" value={fmt(totalExpenses)} delta="Total spent" up={false} icon={Wallet} tint="bg-secondary text-secondary-foreground" />
        <Kpi label="Net Profit" value={fmt(netProfit)} delta="Calculated" up icon={PiggyBank} tint="bg-success-soft text-success" />
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-[var(--shadow-card)] border-0">
        <h2 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-y-4 sm:gap-y-6 gap-x-2">
          {allowedActions.map((action) => (
            <Link key={action.label} to={getRoleUrl(action.link)} className="flex flex-col items-center gap-1.5 sm:gap-2 group">
              <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full border ${action.border} ${action.bg} ${action.color} transition-transform group-hover:scale-105 shadow-sm`}>
                <action.icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <span className="text-[9px] sm:text-xs font-semibold text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Sales vs Expenses</CardTitle>
              <p className="text-xs text-muted-foreground">Monthly Overview</p>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[180px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "₹0" : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 11,
                      padding: "4px 8px"
                    }}
                    formatter={(v) => fmt(v)}
                  />
                  <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gSales)" />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-accent)" strokeWidth={2} fill="url(#gExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-card)]">
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Cash Flow</CardTitle>
            <p className="text-[10px] sm:text-xs text-muted-foreground">This month</p>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-5">
            <div className="rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.18_150)] p-3 sm:p-4 text-primary-foreground shadow-[var(--shadow-glow)]">
              <p className="text-[10px] sm:text-xs opacity-80">Available balance</p>
              <p className="mt-0.5 text-xl sm:text-3xl font-bold tracking-tight">{fmt((data?.sales?.totalSales || 0) - (data?.expenses || 0))}</p>
              <div className="mt-2 flex gap-3 sm:gap-4 text-[10px] sm:text-xs">
                <div>
                  <p className="opacity-75">Inflow</p>
                  <p className="font-semibold">{fmt(data?.sales?.totalSales || 0)}</p>
                </div>
                <div>
                  <p className="opacity-75">Outflow</p>
                  <p className="font-semibold">{fmt(data?.expenses || 0)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-xs sm:text-sm">Receivables</span>
                <span className="font-semibold text-xs sm:text-sm">{fmt(data?.receivables || 0)}</span>
              </div>
              <Progress value={(data?.receivables || 0) + (data?.payables || 0) === 0 ? 0 : Math.round(((data?.receivables || 0) / ((data?.receivables || 0) + (data?.payables || 0))) * 100)} className="h-1.5 sm:h-2" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-xs sm:text-sm">Payables</span>
                <span className="font-semibold text-xs sm:text-sm">{fmt(data?.payables || 0)}</span>
              </div>
              <Progress value={(data?.receivables || 0) + (data?.payables || 0) === 0 ? 0 : Math.round(((data?.payables || 0) / ((data?.receivables || 0) + (data?.payables || 0))) * 100)} className="h-1.5 sm:h-2 [&>div]:bg-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Top Products</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {!data?.topProducts || data.topProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">No sales registered yet.</p>
              ) : (
                data.topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name || "Unnamed Item"}</p>
                      <p className="text-xs text-muted-foreground">{p.sold} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(p.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Pending Payments</CardTitle>
              <p className="text-xs text-muted-foreground">{fmt(data?.pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0)} total due</p>
            </div>
            <TrendingDown className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.pendingPayments || data.pendingPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">No pending payments.</p>
            ) : (
              data.pendingPayments.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      {c.name ? c.name.split(" ").map((s) => s[0]).join("") : "WC"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(c.amount)}</p>
                    <Badge
                      variant="outline"
                      className={
                        c.status === "unpaid"
                          ? "border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
                          : "border-accent/30 bg-accent-soft text-[10px] text-accent-foreground"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[var(--shadow-card)]">
        <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
          <CardTitle className="text-sm sm:text-base">Monthly Revenue</CardTitle>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Compare revenue across the last 6 months</p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="h-[160px] sm:h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "₹0" : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}k`} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11, padding: "4px 8px" }} formatter={(v) => fmt(v)} />
                <Bar dataKey="sales" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <GstCalculatorDialog open={isGstCalculatorOpen} onOpenChange={setIsGstCalculatorOpen} />
    </div>
  );
}
