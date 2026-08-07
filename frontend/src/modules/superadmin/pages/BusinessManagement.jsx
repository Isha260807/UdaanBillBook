import React, { useState, useEffect } from "react";
import {
  Search, Filter, MoreHorizontal, Building2, Eye, Ban, CheckCircle2,
  Play, Trash2, ExternalLink, Download, LayoutGrid, List, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt } from "../data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Trial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const planStyles = {
  Free: "bg-slate-500/15 text-slate-400",
  Silver: "bg-blue-500/15 text-blue-400",
  Gold: "bg-amber-500/15 text-amber-400",
  Enterprise: "bg-purple-500/15 text-purple-400",
  None: "bg-slate-500/15 text-slate-400 border border-slate-500/25",
};

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [selectedBiz, setSelectedBiz] = useState(null);

  const fetchBusinesses = async () => {
    try {
      const response = await api.get("/admin/businesses");
      const mapped = response.data.map(b => ({
        ...b,
        status: b.status === "Banned" ? "Suspended" : b.status
      }));
      setBusinesses(mapped);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleToggleStatus = async (biz) => {
    const newStatus = biz.status === "Active" || !biz.status ? "Suspended" : "Active";
    const apiStatus = newStatus === "Suspended" ? "Banned" : "Active";
    try {
      await api.put(`/admin/users/${biz.id}/status`, { status: apiStatus });
      toast.success(`${biz.name} status updated to ${newStatus}`);
      setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, status: newStatus } : b));
      if (selectedBiz && selectedBiz.id === biz.id) {
        setSelectedBiz(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };



  const handleDeleteBusiness = async (biz) => {
    if (window.confirm(`Are you sure you want to delete ${biz.name}? This will permanently remove the business user account.`)) {
      try {
        await api.delete(`/admin/users/${biz.id}`);
        toast.success(`${biz.name} has been deleted successfully.`);
        setBusinesses(prev => prev.filter(b => b.id !== biz.id));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete business");
      }
    }
  };

  const filtered = businesses.filter((b) => {
    const matchesSearch =
      (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.owner || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!businesses.length) {
      toast.error("No businesses to export");
      return;
    }
    const headers = ["Business Name", "Owner Name", "Phone", "Email", "Plan", "Revenue (INR)", "Status", "City"];
    const rows = filtered.map(b => [
      `"${b.name || ''}"`,
      `"${b.owner || ''}"`,
      `"${b.phone || ''}"`,
      `"${b.email || ''}"`,
      `"${b.plan || ''}"`,
      b.revenue || 0,
      `"${b.status || ''}"`,
      `"${b.city || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registered_Businesses_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Business list CSV exported successfully!");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Management</h1>
          <p className="text-sm text-slate-500 mt-1">{businesses.length} businesses registered on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            className={`rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 ${viewMode === "table" ? "bg-white/10 text-white" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className={`rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 ${viewMode === "grid" ? "bg-white/10 text-white" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="sm" className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text" placeholder="Search by name, owner, or city..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl pl-9 pr-4 text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Suspended", "Trial"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.19 0.035 257)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Business", "Plan", "Revenue", "Users", "Status", "Last Active", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((biz) => (
                  <tr key={biz.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 cursor-pointer group/name hover:opacity-95" onClick={() => setSelectedBiz(biz)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-xs font-bold text-blue-400">
                          {(biz.name || "B").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover/name:text-emerald-400 group-hover/name:underline transition-all">{biz.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{biz.owner} · {biz.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${planStyles[biz.plan] || ""}`}>
                        {biz.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white">{fmt(biz.revenue)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-300">{biz.users}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[biz.status] || ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${biz.status === "Active" ? "bg-emerald-400" : biz.status === "Suspended" ? "bg-rose-400" : "bg-amber-400"}`} />
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500">{biz.lastActive}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/10 transition-colors" title="View Details" onClick={() => setSelectedBiz(biz)}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {biz.status === "Active" ? (
                          <button className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Suspend"
                            onClick={() => handleToggleStatus(biz)}>
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button className="rounded-lg p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Activate"
                            onClick={() => handleToggleStatus(biz)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button className="rounded-lg p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors" title="Delete Business"
                          onClick={() => handleDeleteBusiness(biz)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
            <span className="text-xs text-slate-500">Showing {filtered.length} of {businesses.length} businesses</span>
            <div className="flex gap-1">
              {[1].map((p) => (
                <button key={p} className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${p === 1 ? "bg-emerald-500/15 text-emerald-400" : "text-slate-500 hover:bg-white/5"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((biz) => (
            <div key={biz.id} className="rounded-2xl border border-white/8 p-5 hover:border-emerald-500/30 transition-all group"
              style={{ background: "oklch(0.19 0.035 257)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-400">
                    {(biz.name || "B").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{biz.name}</p>
                    <p className="text-[11px] text-slate-500">{biz.owner}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[biz.status] || ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${biz.status === "Active" ? "bg-emerald-400" : biz.status === "Suspended" ? "bg-rose-400" : "bg-amber-400"}`} />
                  {biz.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Revenue</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmt(biz.revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Users</p>
                  <p className="text-sm font-bold text-white mt-0.5">{biz.users}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Plan</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${planStyles[biz.plan] || ""}`}>{biz.plan}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">City</p>
                  <p className="text-xs text-slate-300 mt-0.5">{biz.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-white/8">
                <button className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" onClick={() => setSelectedBiz(biz)}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business Details Modal */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: "oklch(0.19 0.035 257)" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" /> Business Details
              </h3>
              <button 
                onClick={() => setSelectedBiz(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-lg font-bold text-blue-400">
                  {(selectedBiz.name || "B").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedBiz.name}</h4>
                  <p className="text-xs text-slate-400">{selectedBiz.owner}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Name</p>
                  <p className="text-white font-medium">{selectedBiz.name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Owner / Contact</p>
                  <p className="text-white font-medium">{selectedBiz.owner}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Phone</p>
                  <p className="text-white font-medium">{selectedBiz.phone}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-white font-medium">{selectedBiz.email || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Plan</p>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${planStyles[selectedBiz.plan] || ""}`}>
                      {selectedBiz.plan}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Revenue Generated</p>
                  <p className="text-emerald-400 font-bold">{fmt(selectedBiz.revenue)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Type</p>
                  <p className="text-white font-medium">{selectedBiz.type || "Retail Shop"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">City / Address</p>
                  <p className="text-white font-medium">{selectedBiz.city || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Last Active</p>
                  <p className="text-white font-medium">{selectedBiz.lastActive || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[selectedBiz.status] || ""}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedBiz.status === "Active" ? "bg-emerald-400" : selectedBiz.status === "Suspended" ? "bg-rose-400" : "bg-amber-400"}`} />
                      {selectedBiz.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedBiz(null)}
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
