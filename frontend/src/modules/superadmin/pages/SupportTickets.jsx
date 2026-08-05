import React, { useState, useEffect } from "react";
import { Ticket, Clock, MessageSquare, AlertCircle, CheckCircle2, User, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const priorityStyles = {
  Critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  High: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const statusStyles = {
  Open: "bg-amber-500/15 text-amber-400", 
  "In Progress": "bg-blue-500/15 text-blue-400", 
  Resolved: "bg-emerald-500/15 text-emerald-400",
};

export function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await api.get("/admin/tickets");
      setTickets(res.data);
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await api.put(`/admin/tickets/${ticketId}`, updates);
      toast.success("Ticket updated successfully");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const filtered = tickets.filter(t => {
    const matchesFilter = filter === "All" || t.status === filter;
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.business.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const open = tickets.filter(t => t.status === "Open").length;
  const inProg = tickets.filter(t => t.status === "In Progress").length;
  const resolved = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><Ticket className="h-6 w-6 text-emerald-400" /> Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and resolve customer support requests.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Total Tickets", v: tickets.length, icon: Ticket, color: "text-blue-400" },
          { l: "Open", v: open, icon: AlertCircle, color: "text-amber-400" },
          { l: "In Progress", v: inProg, icon: Clock, color: "text-blue-400" },
          { l: "Resolved", v: resolved, icon: CheckCircle2, color: "text-emerald-400" },
        ].map(k => (
          <div key={k.l} className="rounded-2xl border border-white/8 p-4" style={{ background: "oklch(0.19 0.035 257)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k.l}</p>
            <p className={`mt-2 text-2xl font-bold ${k.color}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl pl-9 pr-4 text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
        </div>
        <div className="flex gap-2">
          {["All", "Open", "In Progress", "Resolved"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${filter === s ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className="rounded-2xl border border-white/8 p-4 hover:border-emerald-500/20 transition-all" style={{ background: "oklch(0.19 0.035 257)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-[10px] text-slate-500 font-mono">{t.id}</code>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityStyles[t.priority] || ""}`}>{t.priority}</span>
                  <select 
                    value={t.status}
                    onChange={(e) => handleUpdateTicket(t.id, { status: e.target.value })}
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#181d2a] border border-white/10 text-white focus:outline-none cursor-pointer`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <p className="text-sm font-semibold text-white truncate">{t.subject}</p>
                {t.description && <p className="text-xs text-slate-400 mt-1">{t.description}</p>}
                <p className="text-[11px] text-slate-500 mt-1">{t.business} · {t.created}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 self-start">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <select 
                    value={t.assignee}
                    onChange={(e) => handleUpdateTicket(t.id, { assignee: e.target.value })}
                    className="bg-[#181d2a] border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Support Team">Support Team</option>
                    <option value="Tax Team">Tax Team</option>
                    <option value="Dev Team">Dev Team</option>
                    <option value="Billing Team">Billing Team</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
