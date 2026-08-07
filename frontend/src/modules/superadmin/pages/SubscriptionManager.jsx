import React, { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Users, Check, Star, Edit2, Archive, X, Plus, CheckCircle2 } from "lucide-react";
import { fmt } from "../data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";

const planAccents = {
  Free: { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", glow: "bg-slate-500" },
  Silver: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", glow: "bg-blue-500" },
  Gold: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", glow: "bg-amber-500" },
  Enterprise: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", glow: "bg-purple-500" },
};

export function SubscriptionManager() {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [featureInput, setFeatureInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    featuresList: [],
    popular: false,
    platforms: "Mobile + Desktop",
    description: "",
    allowedTemplates: [],
    showUdaanLogo: true
  });

  const [availableTemplates, setAvailableTemplates] = useState([]);

  const fetchPlansAndTemplates = async () => {
    try {
      const [plansRes, templatesRes] = await Promise.all([
        api.get("/admin/subscriptions"),
        api.get("/admin/invoice-templates")
      ]);
      setSubscriptionPlans(plansRes.data);
      setAvailableTemplates(templatesRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFeatureInput("");
    setFormData({
      name: "",
      price: "",
      featuresList: [],
      popular: false,
      platforms: "Mobile + Desktop",
      description: "",
      allowedTemplates: ["GST Boxed", "Classic White"],
      allowedModules: ["dashboard", "billing", "parties", "admin", "support", "settings", "inventory", "expenses", "reports", "accounting", "gst"],
      showUdaanLogo: true
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFeatureInput("");
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      featuresList: Array.isArray(plan.features) ? [...plan.features] : (plan.features ? plan.features.split("\n").filter(Boolean) : []),
      popular: plan.popular,
      platforms: plan.platforms,
      description: plan.description || "",
      allowedTemplates: plan.allowedTemplates || [],
      allowedModules: plan.allowedModules || (plan.name === 'Free' ? ['dashboard', 'billing', 'parties', 'admin', 'support', 'settings'] : ['dashboard', 'billing', 'inventory', 'parties', 'expenses', 'accounting', 'gst', 'reports', 'admin', 'support', 'settings']),
      showUdaanLogo: plan.showUdaanLogo !== undefined ? plan.showUdaanLogo : true
    });
    setIsOpen(true);
  };

  const handleToggleModule = (modKey) => {
    setFormData(prev => {
      const current = prev.allowedModules || [];
      const exists = current.includes(modKey);
      const next = exists ? current.filter(m => m !== modKey) : [...current, modKey];
      return { ...prev, allowedModules: next };
    });
  };

  const handleAddFeatureItem = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (formData.featuresList.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Feature already added to list");
      return;
    }
    setFormData(prev => ({
      ...prev,
      featuresList: [...prev.featuresList, trimmed]
    }));
    setFeatureInput("");
  };

  const handleRemoveFeatureItem = (index) => {
    setFormData(prev => ({
      ...prev,
      featuresList: prev.featuresList.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.featuresList.length === 0) {
      toast.error("Please add at least one feature");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      features: formData.featuresList,
      popular: formData.popular,
      platforms: formData.platforms,
      description: formData.description.trim(),
      allowedTemplates: formData.allowedTemplates,
      allowedModules: formData.allowedModules,
      showUdaanLogo: formData.showUdaanLogo
    };

    try {
      if (editingPlan) {
        await api.put(`/admin/subscriptions/${editingPlan.id}`, payload);
        toast.success("Plan updated successfully");
      } else {
        await api.post("/admin/subscriptions", payload);
        toast.success("Plan created successfully");
      }
      setIsOpen(false);
      fetchPlansAndTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save plan");
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm("Are you sure you want to delete/archive this plan?")) {
      try {
        await api.delete(`/admin/subscriptions/${planId}`);
        toast.success("Plan deleted/archived successfully");
        fetchPlansAndTemplates();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete plan");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const totalMRR = subscriptionPlans.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0);
  const totalSubscribers = subscriptionPlans.reduce((sum, p) => sum + (p.activeSubscribers || 0), 0);
  const arr = totalMRR * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Manage pricing plans, track MRR, and monitor subscriber health.</p>
        </div>
        <button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5"
          onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Create Plan
        </button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Monthly Recurring Revenue (MRR)", value: fmt(totalMRR), icon: TrendingUp, color: "emerald" },
          { label: "Annual Recurring Revenue (ARR)", value: fmt(arr), icon: CreditCard, color: "blue" },
          { label: "Total Paid Subscribers", value: totalSubscribers.toLocaleString(), icon: Users, color: "purple" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-white/8 p-5 relative overflow-hidden"
            style={{ background: "oklch(0.19 0.035 257)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
            <div className={`absolute -bottom-4 -right-4 h-20 w-20 rounded-full opacity-15 blur-2xl bg-${kpi.color}-500`} />
          </div>
        ))}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {subscriptionPlans.map((plan) => {
          const accent = planAccents[plan.name] || planAccents.Free;
          return (
            <div key={plan.id} className={`relative rounded-2xl border ${plan.popular ? "border-emerald-500/40" : "border-white/8"} p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5`}
              style={{ background: "oklch(0.19 0.035 257)" }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/25">
                    <Star className="h-3 w-3" /> MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4 mt-1">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${accent.bg} ${accent.text}`}>
                    {plan.name}
                  </span>
                  <div className="flex gap-1">
                    <button className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/10 transition-colors" title="Edit"
                      onClick={() => handleOpenEdit(plan)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete"
                      onClick={() => handleDelete(plan.id)}>
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="ml-1 text-sm text-slate-500">/month</span>}
                </div>
                {plan.price > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">₹{plan.price * 12}/year when billed annually</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-white/3 border border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Subscribers</p>
                  <p className="text-sm font-bold text-white mt-0.5">{plan.activeSubscribers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">MRR</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{fmt(plan.monthlyRevenue)}</p>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1">
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${accent.text}`} />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* Templates allowed rendering removed */}
                <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Udaan Logo</p>
                  {plan.showUdaanLogo ? (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-medium">Shown</span>
                  ) : (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-medium">Hidden</span>
                  )}
                </div>
              </div>

              {/* Glow */}
              <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${accent.glow}`} />
            </div>
          );
        })}
      </div>

      {/* Create / Edit Plan Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            style={{ background: "oklch(0.19 0.035 257)" }}
          >
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Plan"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Price (₹ / month) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 299"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Platforms</label>
                  <select
                    className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={formData.platforms}
                    onChange={(e) => setFormData({ ...formData, platforms: e.target.value })}
                  >
                    <option value="Mobile Only">Mobile Only</option>
                    <option value="Mobile + Desktop">Mobile + Desktop</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the plan"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Templates Access Selection Checkboxes Removed */}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Plan Features List *</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g. Unlimited Invoices, Advanced GST Reports..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeatureItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeatureItem}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                {/* Feature Tags List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.featuresList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic border border-dashed border-white/10 rounded-xl p-3 text-center">
                      No features added yet. Type a feature above and click "+ Add" or press Enter.
                    </p>
                  ) : (
                    formData.featuresList.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white group hover:border-emerald-500/30 transition-all">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{feature}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remove Feature"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Feature Locking & Module Access Control Section */}
              <div className="border-t border-white/10 pt-3 space-y-2">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>🔒 Feature Locking & Module Access Control</span>
                  <span className="text-[10px] font-normal text-slate-400">Checked = Allowed | Unchecked = Locked</span>
                </label>
                <p className="text-[11px] text-slate-400">Select which vendor sidebar sections users on this plan are allowed to access:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { key: "dashboard", label: "Dashboard" },
                    { key: "billing", label: "Billing & Invoices" },
                    { key: "inventory", label: "Inventory Stock" },
                    { key: "parties", label: "Parties & Customers" },
                    { key: "expenses", label: "Expenses Tracker" },
                    { key: "accounting", label: "Accounting & Ledgers" },
                    { key: "gst", label: "GST & Tax Filing" },
                    { key: "reports", label: "Reports & Analytics" },
                    { key: "admin", label: "Staff Management" },
                    { key: "support", label: "Support Tickets" },
                    { key: "settings", label: "Business Settings" },
                  ].map((mod) => {
                    const isChecked = (formData.allowedModules || []).includes(mod.key);
                    return (
                      <label 
                        key={mod.key} 
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked 
                            ? "bg-emerald-500/15 border-emerald-500/40 text-white font-medium" 
                            : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.key)}
                          className="rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <span className="truncate">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popular"
                  className="rounded bg-white/5 border-white/10 text-emerald-500 focus:ring-emerald-500"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                />
                <label htmlFor="popular" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                  Mark as Most Popular plan
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showUdaanLogo"
                  className="rounded bg-white/5 border-white/10 text-emerald-500 focus:ring-emerald-500"
                  checked={formData.showUdaanLogo}
                  onChange={(e) => setFormData({ ...formData, showUdaanLogo: e.target.checked })}
                />
                <label htmlFor="showUdaanLogo" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                  Show Udaan Logo on Invoice
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
