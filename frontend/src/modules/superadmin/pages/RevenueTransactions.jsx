import React, { useState, useEffect } from "react";
import { Search, Download, Filter, TrendingUp, ArrowUpRight, CreditCard } from "lucide-react";
import { fmt } from "../data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const statusStyles = {
  Success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Refunded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Pending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-white/10 px-4 py-3 text-xs shadow-2xl"
      style={{ background: "oklch(0.22 0.04 257)" }}
    >
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{fmt(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueTransactions() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    totalRevenue: 0,
    successRate: 100,
    totalTransactions: 0,
    revenueBreakdown: [],
    transactions: []
  });

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const res = await api.get("/admin/revenue");
        setData(res.data);
      } catch (error) {
        toast.error("Failed to load revenue data");
      } finally {
        setLoading(false);
      }
    };
    fetchRevenueData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { totalRevenue, successRate, totalTransactions, revenueBreakdown, transactions } = data;
  const itemsPerPage = 8;

  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage) || 1;
  const paginatedTxns = (transactions || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    if (!transactions || !transactions.length) {
      toast.error("No transactions to export");
      return;
    }
    const headers = ["Transaction ID", "Business Name", "Plan", "Amount (INR)", "Payment Method", "Status", "Date"];
    const rows = transactions.map(t => [
      `"${t.id || ''}"`,
      `"${t.business || ''}"`,
      `"${t.plan || ''}"`,
      t.amount || 0,
      `"${t.method || ''}"`,
      `"${t.status || ''}"`,
      `"${t.date || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Revenue_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Revenue Transactions CSV exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue & Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">Track platform revenue, payments, and financial health.</p>
        </div>
        <button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5"
          onClick={handleExportCSV}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Revenue (This Month)", value: fmt(totalRevenue), delta: "+18.4%", up: true, icon: TrendingUp },
          { label: "Payment Success Rate", value: `${successRate}%`, delta: "+2.1%", up: true, icon: CreditCard },
          { label: "Total Transactions", value: totalTransactions.toString(), delta: "+12 this week", up: true, icon: ArrowUpRight },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-white/8 p-5"
            style={{ background: "oklch(0.19 0.035 257)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
            <div className="mt-2 flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">{kpi.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown Chart */}
      <div className="rounded-2xl border border-white/8 p-5" style={{ background: "oklch(0.19 0.035 257)" }}>
        <h3 className="text-sm font-semibold text-white mb-4">Revenue by Plan</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueBreakdown}>
            <defs>
              <linearGradient id="gSilver" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 6%)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="silver" stroke="#3b82f6" strokeWidth={2} fill="url(#gSilver)" name="Silver" />
            <Area type="monotone" dataKey="gold" stroke="#f59e0b" strokeWidth={2} fill="url(#gGold)" name="Gold" />
            <Area type="monotone" dataKey="enterprise" stroke="#8b5cf6" strokeWidth={2} fill="url(#gEnt)" name="Enterprise" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.19 0.035 257)" }}>
        <div className="px-5 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {["Transaction ID", "Business", "Plan", "Amount", "Method", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTxns.map((txn) => (
                <tr key={txn.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5">
                    <code className="text-xs text-slate-300 font-mono">{txn.id}</code>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-white">{txn.business}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400">{txn.plan}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-white">{fmt(txn.amount)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400">{txn.method}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[txn.status] || ""}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500">{txn.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
          <span className="text-xs text-slate-500">
            Showing {paginatedTxns.length} of {transactions.length} transactions
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold transition-all ${
                  p === currentPage
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
