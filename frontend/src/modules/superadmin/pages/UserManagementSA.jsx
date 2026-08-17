import React, { useState, useEffect } from "react";
import { Search, Users, Ban, CheckCircle2, Eye, Mail, Phone, Monitor, Clock, Shield, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Banned: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold",
  Rejected: "bg-slate-500/20 text-slate-400 border-slate-500/30"
};

const formatLastLogin = (lastLogin, createdAt) => {
  const dateVal = lastLogin || createdAt;
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function UserManagementSA() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveVendor = async (id) => {
    try {
      await api.put(`/admin/vendors/${id}/approve`);
      toast.success("Vendor approved successfully!");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve vendor");
    }
  };

  const handleRejectVendor = async (id) => {
    try {
      await api.put(`/admin/vendors/${id}/reject`);
      toast.success("Vendor registration rejected");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject vendor");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Active" || !user.status ? "Banned" : "Active";
    try {
      await api.put(`/admin/users/${user._id}/status`, { status: newStatus });
      toast.success(`${user.name} status updated to ${newStatus}`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleUpdateBilling = async () => {
    try {
      const res = await api.put(`/admin/users/${selectedUser._id}/billing-settings`, {
        billLimit: selectedUser.billLimit
      });
      toast.success(`Bill limit updated for ${selectedUser.name}`);
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? res.data : u));
      setSelectedUser(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bill limit");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success(`${user.name} deleted successfully`);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const filtered = users.filter(u => {
    const nameMatch = (u.name || "").toLowerCase().includes(search.toLowerCase());
    const emailMatch = (u.email || "").toLowerCase().includes(search.toLowerCase());
    const bizMatch = (u.businessName || u.business || "").toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch || bizMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil((filtered?.length || 0) / itemsPerPage) || 1;
  const paginatedUsers = (filtered || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><Users className="h-6 w-6 text-emerald-400" /> User Management</h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} users across all businesses</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Total Users", v: users.length, icon: Users, c: "blue" },
          { l: "Active Now", v: users.filter(u => u.status !== "Banned").length, icon: CheckCircle2, c: "emerald" },
          { l: "Banned", v: users.filter(u => u.status === "Banned").length, icon: Ban, c: "rose" },
          { l: "Admins", v: users.filter(u => u.role === "admin" || u.role === "Admin").length, icon: Shield, c: "purple" },
        ].map(k => (
          <div key={k.l} className="rounded-2xl border border-white/8 p-4" style={{ background: "oklch(0.19 0.035 257)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k.l}</p>
            <p className="mt-2 text-2xl font-bold text-white">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" placeholder="Search users by name, email, business..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full h-10 rounded-xl pl-9 pr-4 text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.19 0.035 257)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {["User", "Business", "Plan", "Role", "Status", "Last Login", "Device", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(u => (
                <tr key={u._id || u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 cursor-pointer group/name hover:opacity-90" onClick={() => setSelectedUser(u)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-xs font-bold text-blue-400">
                        {(u.name || "U").split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover/name:text-emerald-400 group-hover/name:underline transition-all">{u.name}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{(!u.email || u.email.includes("@udaan.com")) ? u.phone : u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-300 cursor-pointer" onClick={() => setSelectedUser(u)}>{u.businessName || u.business || "N/A"}</td>
                  <td className="px-4 py-3.5">
                    {u.role === "admin" || u.role === "staff" ? (
                      <span className="text-slate-500">-</span>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        u.subscription?.plan === "Enterprise" ? "bg-purple-500/15 text-purple-400" :
                        u.subscription?.plan === "Gold" ? "bg-amber-500/15 text-amber-400" :
                        u.subscription?.plan === "Silver" ? "bg-blue-500/15 text-blue-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        {u.subscription?.plan || "Free"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-semibold capitalize ${u.role === "admin" || u.role === "Admin" ? "text-purple-400" : "text-slate-400"}`}>{u.role || "vendor"}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[u.status || "Active"] || ""}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status !== "Banned" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {u.status || "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{formatLastLogin(u.lastLogin, u.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Monitor className="h-3 w-3" />{u.device || "Chrome / Windows"}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="View Profile Details" onClick={() => setSelectedUser(u)}>
                        <Eye className="h-4 w-4" />
                      </button>
                        {u.status !== "Banned" ? (
                            <button className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Ban" onClick={() => handleToggleStatus(u)}><Ban className="h-3.5 w-3.5" /></button>
                          ) : (
                            <button className="rounded-lg p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Unban" onClick={() => handleToggleStatus(u)}><CheckCircle2 className="h-3.5 w-3.5" /></button>
                          )}
                          <button className="rounded-lg p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors" title="Delete" onClick={() => handleDeleteUser(u)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
          <span className="text-xs text-slate-500">
            Showing {paginatedUsers.length} of {filtered.length} users
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: "oklch(0.19 0.035 257)" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" /> User Details
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-lg font-bold text-blue-400">
                  {selectedUser.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedUser.name}</h4>
                  <p className="text-xs text-slate-400 capitalize">{selectedUser.role || "Vendor"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
                  <p className="text-white font-medium">{selectedUser.phone}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                  <p className="text-white font-medium">{(!selectedUser.email || selectedUser.email.includes("@udaan.com")) ? "Not Provided" : selectedUser.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Name</p>
                  <p className="text-white font-medium">{selectedUser.businessName || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Type</p>
                  <p className="text-white font-medium">{selectedUser.businessType || "N/A"}</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Address</p>
                  <p className="text-white font-medium">{selectedUser.businessAddress || "N/A"}</p>
                </div>

                 <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Plan</p>
                  <div>
                    {selectedUser.role === "admin" || selectedUser.role === "staff" ? (
                      <span className="text-slate-400 font-medium">-</span>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        selectedUser.subscription?.plan === "Enterprise" ? "bg-purple-500/15 text-purple-400" :
                        selectedUser.subscription?.plan === "Gold" ? "bg-amber-500/15 text-amber-400" :
                        selectedUser.subscription?.plan === "Silver" ? "bg-blue-500/15 text-blue-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        {selectedUser.subscription?.plan || "Free"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Account Status</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[selectedUser.status || "Active"] || ""}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedUser.status !== "Banned" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {selectedUser.status || "Active"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registered On</p>
                  <p className="text-white font-medium">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Billing Settings */}
              <div className="mt-6 pt-6 border-t border-white/8 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Billing Limit Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bill Limit (-1 for unlimited)</label>
                    <input 
                      type="number" 
                      value={selectedUser.billLimit ?? -1} 
                      onChange={(e) => setSelectedUser({ ...selectedUser, billLimit: Number(e.target.value) })}
                      className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bills Generated</p>
                    <p className="text-emerald-400 font-bold text-xl">{selectedUser.billsGenerated || 0}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleUpdateBilling}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Save Billing Limit
                  </button>
                </div>
              </div>

              {/* KYC Documents */}
              <div className="mt-6 pt-6 border-t border-white/8 space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">KYC Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PAN Card */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">PAN Card</p>
                    {selectedUser.panCardUrl ? (
                      <a href={selectedUser.panCardUrl} target="_blank" rel="noopener noreferrer" className="block group">
                        <img
                          src={selectedUser.panCardUrl}
                          alt="PAN Card"
                          className="w-full h-36 object-cover rounded-xl border border-white/10 group-hover:border-emerald-500/50 transition-all"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 text-center">Click to view full image</p>
                      </a>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 bg-white/3">
                        <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-[11px] text-slate-600 font-medium">Not Uploaded</p>
                      </div>
                    )}
                  </div>
                  {/* Aadhaar Card */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aadhaar Card</p>
                    {selectedUser.aadhaarCardUrl ? (
                      <a href={selectedUser.aadhaarCardUrl} target="_blank" rel="noopener noreferrer" className="block group">
                        <img
                          src={selectedUser.aadhaarCardUrl}
                          alt="Aadhaar Card"
                          className="w-full h-36 object-cover rounded-xl border border-white/10 group-hover:border-emerald-500/50 transition-all"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 text-center">Click to view full image</p>
                      </a>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 bg-white/3">
                        <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-[11px] text-slate-600 font-medium">Not Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end shrink-0 bg-slate-900/40">
              <button 
                onClick={() => setSelectedUser(null)}
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
