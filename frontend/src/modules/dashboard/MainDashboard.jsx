import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  to,
}) {
  const content = (
    <Card className="overflow-hidden border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
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

  return to ? <Link to={to} className="block">{content}</Link> : content;
}

export function MainDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGstCalculatorOpen, setIsGstCalculatorOpen] = useState(false);
  const [topProductsModalOpen, setTopProductsModalOpen] = useState(false);
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

  const handleExport = useCallback(() => {
    try {
      const doc = new jsPDF();

      // Title & Header
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Udaan BillBook - Dashboard Summary", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated on: ${dateStr}`, 14, 28);

      // Section 1: Overview Metrics
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Business Overview", 14, 38);

      const overviewRows = [
        ["Total Sales", `Rs. ${totalSales.toLocaleString("en-IN")}`, `${invoiceCount} Bills`],
        ["Total Purchase", `Rs. ${totalPurchases.toLocaleString("en-IN")}`, "Real-time"],
        ["Expenses", `Rs. ${totalExpenses.toLocaleString("en-IN")}`, "Total spent"],
        ["Net Profit", `Rs. ${netProfit.toLocaleString("en-IN")}`, "Calculated"],
      ];

      autoTable(doc, {
        startY: 42,
        head: [["Metric", "Amount", "Note"]],
        body: overviewRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      let finalY = (doc).lastAutoTable?.finalY ? (doc).lastAutoTable.finalY + 14 : 90;

      // Section 2: Monthly Breakdown if available
      if (data?.chartData && data.chartData.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text("Monthly Overview Breakdown", 14, finalY);

        const chartRows = data.chartData.map((item) => [
          item.d || item.day || item.month || "-",
          `Rs. ${(item.sales || item.salesAmount || 0).toLocaleString("en-IN")}`,
          `Rs. ${(item.expense || item.expenses || 0).toLocaleString("en-IN")}`,
        ]);

        autoTable(doc, {
          startY: finalY + 4,
          head: [["Period / Day", "Sales Amount", "Expenses Amount"]],
          body: chartRows,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9, cellPadding: 3 },
        });
      }

      const today = new Date().toISOString().split("T")[0];
      doc.save(`Udaan_Dashboard_Report_${today}.pdf`);
      toast.success("Dashboard report PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Failed to generate PDF report.");
    }
  }, [totalSales, invoiceCount, totalPurchases, totalExpenses, netProfit, data]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title=""
        actions={
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              size="sm"
              className="md:hidden flex-1 rounded-xl px-2.5 text-xs h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white justify-center font-medium shadow-sm shrink-0"
              asChild
            >
              <Link to={getRoleUrl("/vendor/sale/new")}>
                <Plus className="mr-1 h-3.5 w-3.5 shrink-0" />
                <span>New Invoice</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-initial rounded-xl px-2.5 sm:px-4 text-xs sm:text-sm h-8.5 sm:h-10 justify-center font-medium border-slate-200 shadow-sm"
              onClick={handleExport}
            >
              <Download className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:inline-flex h-10 w-10 rounded-xl shrink-0 border-slate-200"
              onClick={() => setIsGstCalculatorOpen(true)}
              title="GST Calculator"
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Total Sales" value={fmt(totalSales)} delta={`+${invoiceCount} Bills`} up icon={IndianRupee} tint="bg-primary-soft text-primary" to={getRoleUrl("/vendor/billing?type=sale")} />
        <Kpi label="Total Purchase" value={fmt(totalPurchases)} delta="Real-time" up icon={ShoppingBasket} tint="bg-accent-soft text-accent" to={getRoleUrl("/vendor/billing?type=purchase")} />
        <Kpi label="Expenses" value={fmt(totalExpenses)} delta="Total spent" up={false} icon={Wallet} tint="bg-secondary text-secondary-foreground" to={getRoleUrl("/vendor/expenses")} />
        <Kpi label="Net Profit" value={fmt(netProfit)} delta="Calculated" up icon={PiggyBank} tint="bg-success-soft text-success" to={getRoleUrl("/vendor/reports")} />
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
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setTopProductsModalOpen(true)}>View all</Button>
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

      {/* Top Products Modal for Mobile & Quick View */}
      <Dialog open={topProductsModalOpen} onOpenChange={setTopProductsModalOpen}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl p-4 sm:p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center justify-between">
              Top Selling Products
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Highest performing items ranked by revenue
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-2.5 custom-scrollbar my-1 pr-1">
            {!data?.topProducts || data.topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No sales registered yet.</p>
            ) : (
              data.topProducts.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-xl p-2.5 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-800">{p.name || "Unnamed Item"}</p>
                    <p className="text-[11px] text-muted-foreground">{p.sold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-emerald-600">{fmt(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
            <Link to={getRoleUrl("/vendor/inventory")} onClick={() => setTopProductsModalOpen(false)} className="w-full">
              <Button className="w-full rounded-xl text-xs font-semibold">
                Go to Full Inventory Page
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
