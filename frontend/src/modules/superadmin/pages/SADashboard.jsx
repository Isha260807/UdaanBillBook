import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2, CreditCard, TrendingUp, Users, Clock,
  AlertTriangle, Ticket, ArrowUpRight, ArrowDownRight,
  Activity, Zap, Globe
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { toast } from "sonner";
import api from "@/lib/api";
import { fmt } from "../data/mockData";

/* ──────── KPI Card ──────── */
function KpiCard({ label, value, delta, up, icon: Icon, gradient, iconBg, url }) {
  const cardContent = (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/8 p-4 md:p-5 transition-all duration-300 ${url ? "hover:border-emerald-500/30 cursor-pointer" : ""} hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5`}
      style={{ background: "oklch(0.19 0.035 257)" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</p>
          {delta && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {up ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span className={up ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
                {delta}
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg || "bg-emerald-500/15"}`}>
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
      </div>
      {/* Glow accent */}
      <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-2xl ${gradient || "bg-emerald-500"}`} />
    </div>
  );

  if (url) {
    return <Link to={url}>{cardContent}</Link>;
  }
  return cardContent;
}

/* ──────── Chart Card Wrapper ──────── */
function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/8 p-5 ${className}`}
      style={{ background: "oklch(0.19 0.035 257)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ──────── Activity Type Icon ──────── */
const activityIcons = {
  business: { icon: Building2, color: "text-blue-400", bg: "bg-blue-500/15" },
  subscription: { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  payment: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/15" },
  security: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/15" },
  support: { icon: Ticket, color: "text-purple-400", bg: "bg-purple-500/15" },
};

/* ──────── Custom Tooltip ──────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-2xl z-50">
      {label && <p className="font-semibold text-slate-200 mb-1.5 border-b border-slate-800 pb-1">{label}</p>}
      {payload.map((entry, i) => {
        const itemColor = entry.color || entry.fill || entry.payload?.fill || "#38bdf8";
        const itemName = entry.name || entry.payload?.name || "Count";
        const itemVal = typeof entry.value === "number" && entry.value > 1000 ? fmt(entry.value) : entry.value;
        return (
          <div key={i} className="flex items-center gap-2 font-medium my-0.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: itemColor }} />
            <span className="text-slate-300">{itemName}:</span>
            <span className="font-bold text-white ml-auto">{itemVal}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────── Main Dashboard ──────── */
export function SADashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center space-y-4">
        <p className="text-rose-400 font-semibold">Failed to load platform dashboard data.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = data.platformKPIs;
  const revenueChartData = data.revenueChartData;
  const businessGrowthData = data.businessGrowthData;
  const subscriptionDistribution = data.subscriptionDistribution;
  const dailySignups = data.dailySignups;
  const businesses = data.businesses;
  const transactions = data.transactions;
  const recentActivities = data.recentActivities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, SuperAdmin. Here's your platform overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Total Vendors" value={kpis.totalBusinesses.toLocaleString()} delta="+12.4%" up icon={Building2} gradient="bg-blue-500" iconBg="bg-blue-500/15" url="/admin/businesses" />
        <KpiCard label="Active Subscriptions" value={kpis.activeSubscriptions.toLocaleString()} delta="+8.1%" up icon={CreditCard} gradient="bg-emerald-500" url="/admin/subscriptions" />
        <KpiCard label="Monthly Revenue" value={fmt(kpis.monthlyRevenue)} delta="+18.4%" up icon={TrendingUp} gradient="bg-purple-500" iconBg="bg-purple-500/15" url="/admin/revenue" />
        <KpiCard label="Active Vendors" value={kpis.activeUsers.toLocaleString()} delta="+15.2%" up icon={Users} gradient="bg-amber-500" iconBg="bg-amber-500/15" url="/admin/users" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard label="Platform Growth" value={`${kpis.platformGrowth}%`} icon={Zap} gradient="bg-emerald-500" url="/admin/analytics" />
        <KpiCard label="Pending Approvals" value={kpis.pendingApprovals.toString()} icon={Clock} gradient="bg-amber-500" iconBg="bg-amber-500/15" url="/admin/businesses" />
        <KpiCard label="Failed Payments" value={kpis.failedPayments.toString()} icon={AlertTriangle} gradient="bg-rose-500" iconBg="bg-rose-500/15" url="/admin/revenue" />
        <KpiCard label="Support Tickets" value={kpis.supportTickets.toString()} icon={Ticket} gradient="bg-purple-500" iconBg="bg-purple-500/15" url="/admin/tickets" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <ChartCard title="Revenue Analytics" subtitle="Last 6 months" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="saRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="saExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#saRevGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#saExpGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Subscription Distribution */}
        <ChartCard title="Plan Distribution" subtitle="Active subscribers">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={subscriptionDistribution}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {subscriptionDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {subscriptionDistribution.map((plan) => (
              <div key={plan.name} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: plan.fill }} />
                <span className="text-slate-400">{plan.name}</span>
                <span className="ml-auto font-semibold text-white">{plan.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Business Growth */}
        <ChartCard title="Business Growth" subtitle="Monthly trend">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={businessGrowthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="businesses" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} name="Businesses" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Signups */}
        <ChartCard title="Daily Signups" subtitle="This week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySignups}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="signups" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={36} name="Signups" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row: Activities + Top Businesses + Recent Transactions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((item, i) => {
              const config = activityIcons[item.type] || activityIcons.business;
              const IconComp = config.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <IconComp className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{item.action}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 whitespace-nowrap">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Businesses */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Top Businesses</h3>
          <div className="space-y-2.5">
            {businesses
              .filter(b => b.status === "Active")
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((biz, i) => (
                <div key={biz.id || biz._id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-bold text-blue-400">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{biz.name}</p>
                    <p className="text-[10px] text-slate-500">{biz.city} · {biz.plan}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{fmt(biz.revenue)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Latest Transactions</h3>
          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  txn.status === "Success" ? "bg-emerald-500/15" : txn.status === "Failed" ? "bg-rose-500/15" : "bg-amber-500/15"
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    txn.status === "Success" ? "text-emerald-400" : txn.status === "Failed" ? "text-rose-400" : "text-amber-400"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{txn.business}</p>
                  <p className="text-[10px] text-slate-500">{txn.id} · {txn.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{fmt(txn.amount)}</p>
                  <span className={`text-[10px] font-medium ${
                    txn.status === "Success" ? "text-emerald-400" : txn.status === "Failed" ? "text-rose-400" : "text-amber-400"
                  }`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Status Bar */}
      <div className="rounded-2xl border border-white/8 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: "oklch(0.19 0.035 257)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Platform Status:</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>API: <span className="text-emerald-400 font-semibold">99.9%</span></span>
          <span>Uptime: <span className="text-emerald-400 font-semibold">99.99%</span></span>
          <span>Latency: <span className="text-emerald-400 font-semibold">42ms</span></span>
        </div>
      </div>
    </div>
  );
}
