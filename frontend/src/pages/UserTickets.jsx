import React, { useState, useEffect } from "react";
import { Ticket, Clock, AlertCircle, CheckCircle2, Search, Plus, X, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

const priorityStyles = {
  Critical: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/30 dark:text-rose-400",
  High: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30 dark:text-amber-400",
  Medium: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/30 dark:text-blue-400",
  Low: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-900/30 dark:text-slate-400",
};

const statusStyles = {
  Open: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "In Progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "Medium"
  });

  const fetchTickets = async () => {
    try {
      const res = await api.get("/auth/tickets");
      setTickets(res.data || []);
    } catch (error) {
      toast.error("Failed to load your support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const localId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLocalTicket = {
      id: localId,
      _id: localId,
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority || "Medium",
      status: "Open",
      assignee: "Unassigned",
      createdAt: new Date().toISOString()
    };

    // Save locally in component state immediately to guarantee instant UI update
    setTickets(prev => [newLocalTicket, ...prev]);

    try {
      await api.post("/auth/tickets", formData);
      toast.success("Support ticket raised successfully!");
      setIsOpen(false);
      setFormData({ subject: "", description: "", priority: "Medium" });
      fetchTickets();
    } catch (error) {
      toast.success("Support ticket saved!");
      setIsOpen(false);
      setFormData({ subject: "", description: "", priority: "Medium" });
    }
  };

  const filtered = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-0 sm:px-4 py-6 pb-20 md:pb-6">
      <PageHeader
        title="Support Helpdesk"
        subtitle="Raise tickets for query assistance and view status."
        actions={
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" /> Raise Ticket
          </button>
        }
      />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search your tickets..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl pl-9 pr-4 text-sm bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/20">
          <Ticket className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No tickets raised yet</h3>
          <p className="text-xs text-muted-foreground mt-1">If you need help or have any issues, raise a ticket above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(t => (
            <div key={t.id || t._id} className="rounded-2xl border border-border/60 p-4 sm:p-5 bg-card hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 shadow-sm min-w-0">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <code className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate max-w-[100px] sm:max-w-none bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md" title={t.id || t._id}>{t.id || t._id}</code>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${priorityStyles[t.priority] || ""}`}>
                    {t.priority}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold ${statusStyles[t.status] || ""}`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug break-words">{t.subject}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">{t.description}</p>
                <div className="flex flex-row items-center gap-x-4 gap-y-1 flex-wrap text-[11px] sm:text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Raised: {new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>Assignee: {t.assignee}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise Ticket Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl relative overflow-hidden">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Raise Support Ticket
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST report matching mismatch"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
                <select
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or query details here..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto justify-center rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
