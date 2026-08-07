import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, ArrowUpRight, Target, Activity } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import api from "@/lib/api";
import { fmt } from "../data/mockData";

function Tip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-2xl z-50">
      {label && <p className="font-semibold text-slate-200 mb-1.5 border-b border-slate-800 pb-1">{label}</p>}
      {payload.map((e, i) => {
        const itemColor = e.color || e.fill || e.payload?.fill || "#38bdf8";
        const itemName = e.name || e.payload?.name || "Count";
        const itemVal = typeof e.value === "number" && e.value > 100 ? fmt(e.value) : e.value;
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

export function PlatformAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setData(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
        <p className="text-rose-400 font-semibold">Failed to load platform analytics data.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const geoData = data.geoData || [];
  const featureUsage = data.featureUsage || [];
  const userEngagement = data.userEngagement || [];
  const conversionFunnel = data.conversionFunnel || [];
  const forecastData = data.forecastData || [];
  const kpis = data.kpis || { dau: 0, sessionDuration: "0m 0s", conversionRate: "0%", churnRate: "0%" };
  const totalBiz = geoData.reduce((s, g) => s + (g.biz || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><BarChart3 className="h-6 w-6 text-emerald-400" /> Platform Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep insights into performance, user behavior, and growth.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[
          { l: "Daily Active Users", v: kpis.dau.toLocaleString(), d: "+8.3%", icon: Users },
          { l: "Session Duration", v: kpis.sessionDuration, d: "+14.2%", icon: Activity },
          { l: "Conversion Rate", v: kpis.conversionRate, d: "+0.8%", icon: Target },
          { l: "Churn Rate", v: kpis.churnRate, d: "-0.4%", icon: TrendingUp },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-white/8 p-4 md:p-5 transition-all hover:-translate-y-1" style={{ background: "oklch(0.19 0.035 257)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k.l}</p>
            <p className="mt-2 text-2xl font-bold text-white">{k.v}</p>
            <div className="mt-2 flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">{k.d}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {conversionFunnel.map((s, i) => {
              const pct = (s.value / conversionFunnel[0].value) * 100;
              return (
                <div key={s.stage}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{s.stage}</span>
                    <span className="text-xs text-slate-400">{s.value.toLocaleString()}{i > 0 && <span className="ml-2 text-emerald-400 font-semibold">{((s.value / (conversionFunnel[i-1].value || 1))*100).toFixed(1)}%</span>}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.fill }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">User Engagement (DAU vs MAU)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={userEngagement}>
              <defs>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="mau" stroke="#8b5cf6" strokeWidth={2} fill="url(#gM)" name="MAU" />
              <Area type="monotone" dataKey="dau" stroke="#3b82f6" strokeWidth={2} fill="url(#gD)" name="DAU" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Feature Usage */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Feature Usage Heatmap</h3>
          <div className="space-y-2.5">
            {featureUsage.map((f) => (
              <div key={f.feature}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-300">{f.feature}</span>
                  <span className="text-xs font-bold text-white">{f.usage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.usage}%`, background: f.usage > 80 ? "#10b981" : f.usage > 60 ? "#3b82f6" : f.usage > 40 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Revenue Forecast (AI-Powered)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
              <XAxis dataKey="m" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "#f59e0b" }} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geo Table */}
      <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
        <h3 className="text-sm font-semibold text-white mb-4">Geographic Distribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/8">{["#", "City", "Businesses", "Revenue", "Share"].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>)}</tr></thead>
            <tbody>
              {geoData.map((g, i) => (
                <tr key={g.city} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-[10px] font-bold text-blue-400">{i+1}</span></td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{g.city}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{g.biz}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{fmt(g.rev)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(g.biz/(totalBiz || 1))*100}%` }} /></div>
                      <span className="text-xs text-slate-400">{((g.biz/(totalBiz || 1))*100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
