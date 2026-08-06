import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePlatformSettings } from "@/lib/platform-settings";
import { platformSettings } from "@/lib/platform-settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { Crown, Play, Plus, Edit2, Trash2, Smartphone, Monitor } from "lucide-react";
import { PrintSettingsTab } from "@/components/PrintSettingsTab";
import { useMockAuth, mockAuth } from "@/lib/auth-store";
import api from "@/lib/api";

export default function Settings() {
  const { settings, hydrated } = usePlatformSettings();
  const { currentPlan } = useSubscription();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { id: "GENERAL", label: "GENERAL", slug: "general" },
    { id: "PRINT", label: "PRINT", badge: "pro", slug: "print" },
    { id: "TAXES_GST", label: "TAXES & GST", slug: "taxes" },
    { id: "MESSAGE", label: "TRANSACTION MESSAGE", slug: "message" },
    { id: "PARTY", label: "PARTY", slug: "party" },
    { id: "ITEM", label: "ITEM", slug: "item" }
  ];

  const initialSlug = searchParams.get("tab") || "general";
  const initialTabObj = tabs.find(t => t.slug === initialSlug.toLowerCase() || t.id.toLowerCase() === initialSlug.toLowerCase());
  const [activeTab, setActiveTab] = useState(initialTabObj ? initialTabObj.id : "GENERAL");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const match = tabs.find(t => t.slug === tabParam.toLowerCase() || t.id.toLowerCase() === tabParam.toLowerCase());
      if (match) {
        setActiveTab(match.id);
      }
    }
  }, [searchParams]);

  const { user } = useMockAuth();
  const [bizName, setBizName] = useState("");
  const [bizGstin, setBizGstin] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  React.useEffect(() => {
    if (user) {
      setBizName(user.businessName || user.business || "");
      setBizGstin(user.gstin || "");
      setBizPhone(user.phone || "");
      setBizAddress(user.businessAddress || user.address || "");
    }
  }, [user]);

  // Dialog States for Tax Rates
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [newRateName, setNewRateName] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [editingRateId, setEditingRateId] = useState(null);

  // Dialog States for Tax Groups
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCgst, setNewGroupCgst] = useState("");
  const [newGroupSgst, setNewGroupSgst] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);

  // Custom Field State
  const [customFieldOpen, setCustomFieldOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading settings...</p>
      </div>
    );
  }

  const { gstSettings, txnSettings, generalSettings, messageSettings, itemSettings, partySettings } = settings;

  // Generic Update Handler
  const updateSettings = (section, updates) => {
    platformSettings.update({
      [section]: {
        ...settings[section],
        ...updates
      }
    });
    toast.success("Settings updated");
  };

  // Tax Rate Operations
  const handleSaveRate = () => {
    if (!newRateName.trim()) return toast.error("Enter rate name");
    const val = Number(newRateValue);
    if (isNaN(val)) return toast.error("Enter valid tax percentage");

    let updatedRates = [...gstSettings.taxRates];
    if (editingRateId) {
      updatedRates = updatedRates.map((r) =>
        r.id === editingRateId ? { ...r, name: newRateName.trim(), value: val } : r
      );
    } else {
      updatedRates.push({
        id: "rate_" + Date.now(),
        name: newRateName.trim(),
        value: val
      });
    }

    updateSettings("gstSettings", { taxRates: updatedRates });
    setRateModalOpen(false);
    setNewRateName("");
    setNewRateValue("");
    setEditingRateId(null);
  };

  const handleDeleteRate = (id) => {
    const updatedRates = gstSettings.taxRates.filter((r) => r.id !== id);
    updateSettings("gstSettings", { taxRates: updatedRates });
  };

  // Tax Group Operations
  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return toast.error("Enter group name");
    const cgst = Number(newGroupCgst);
    const sgst = Number(newGroupSgst);
    if (isNaN(cgst) || isNaN(sgst)) return toast.error("Enter valid percentages");

    let updatedGroups = [...gstSettings.taxGroups];
    if (editingGroupId) {
      updatedGroups = updatedGroups.map((g) =>
        g.id === editingGroupId ? { ...g, name: newGroupName.trim(), cgst, sgst } : g
      );
    } else {
      updatedGroups.push({
        id: "group_" + Date.now(),
        name: newGroupName.trim(),
        cgst,
        sgst
      });
    }

    updateSettings("gstSettings", { taxGroups: updatedGroups });
    setGroupModalOpen(false);
    setNewGroupName("");
    setNewGroupCgst("");
    setNewGroupSgst("");
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id) => {
    const updatedGroups = gstSettings.taxGroups.filter((g) => g.id !== id);
    updateSettings("gstSettings", { taxGroups: updatedGroups });
  };

  // Custom Field Operations
  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return toast.error("Enter field name");
    const updated = [...itemSettings.customFields, { name: newFieldName.trim(), active: true }];
    updateSettings("itemSettings", { customFields: updated });
    setNewFieldName("");
    setCustomFieldOpen(false);
  };

  const handleToggleCustomField = (index) => {
    const updated = itemSettings.customFields.map((cf, i) =>
      i === index ? { ...cf, active: !cf.active } : cf
    );
    updateSettings("itemSettings", { customFields: updated });
  };

  const handleDeleteCustomField = (index) => {
    const updated = itemSettings.customFields.filter((_, i) => i !== index);
    updateSettings("itemSettings", { customFields: updated });
  };

  // Toggle/Checkbox Component Builder
  const renderControl = (section, key, label, disabled = false) => {
    const checked = settings[section][key];
    const onChange = (val) => {
      updateSettings(section, { [key]: val });
    };

    return (
      <div className="flex items-center justify-between py-1.5 hover:bg-muted/10 px-2 rounded-lg transition-colors">
        <Label className={`text-sm font-medium cursor-pointer ${disabled ? "opacity-40" : ""}`}>
          {label}
        </Label>
        {isMobile ? (
          <Switch checked={!!checked} onCheckedChange={onChange} disabled={disabled} />
        ) : (
          <Checkbox checked={!!checked} onCheckedChange={(c) => onChange(!!c)} disabled={disabled} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Settings"
        subtitle="Manage business parameters, tax structures, templates and options"
        actions={
          <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground font-semibold">
            {isMobile ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
            Mode: {isMobile ? "Mobile Toggles" : "Desktop Checkboxes"}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Settings Sidebar */}
        <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-1 p-2 bg-card">
          <div className="flex flex-col space-y-1">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.badge === "vip" && currentPlan !== PLANS.GOLD && currentPlan !== PLANS.ENTERPRISE) {
                      toast.info(`${t.label} is available in Gold/Enterprise plans.`);
                      return;
                    }
                    if (t.badge === "pro" && currentPlan === PLANS.FREE) {
                      toast.info(`${t.label} is available in premium plans.`);
                      return;
                    }
                    setActiveTab(t.id);
                    setSearchParams({ tab: t.slug });
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3 text-left text-xs font-medium md:font-bold rounded-xl transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "text-foreground hover:bg-muted/50"
                  } ${(t.badge === "vip" && currentPlan !== PLANS.GOLD && currentPlan !== PLANS.ENTERPRISE) || (t.badge === "pro" && currentPlan === PLANS.FREE) ? "opacity-60" : ""}`}
                >
                  <span>{t.label}</span>
                  {t.badge === "vip" && <Crown className={`h-3.5 w-3.5 ${(currentPlan === PLANS.GOLD || currentPlan === PLANS.ENTERPRISE) ? "text-primary fill-primary" : "text-amber-500 fill-amber-500"}`} />}
                  {t.badge === "pro" && <Crown className={`h-3.5 w-3.5 ${currentPlan !== PLANS.FREE ? "text-primary fill-primary" : "text-blue-500 fill-blue-500"}`} />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Settings Configuration Form */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "GENERAL" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Business Profile Settings</CardTitle>
                  <CardDescription>Setup main business identity information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await api.put("/auth/profile", {
                          businessName: bizName,
                          phone: bizPhone,
                          gstin: bizGstin,
                          businessAddress: bizAddress
                        });
                        mockAuth.updateUser({
                          ...res.data,
                          business: res.data.businessName,
                          address: res.data.businessAddress
                        });
                        toast.success("Business profile saved successfully");
                      } catch (err) {
                        mockAuth.updateUser({
                          business: bizName,
                          businessName: bizName,
                          phone: bizPhone,
                          gstin: bizGstin,
                          address: bizAddress,
                          businessAddress: bizAddress
                        });
                        toast.success("Business profile saved successfully");
                      }
                    }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Business Name</Label>
                      <Input value={bizName} onChange={(e) => setBizName(e.target.value)} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>GSTIN</Label>
                      <Input value={bizGstin} onChange={(e) => setBizGstin(e.target.value)} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Address</Label>
                      <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} className="h-10 rounded-xl" />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" className="rounded-xl">Save Profile Details</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "TRANSACTION" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">Transaction Header & Layout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {renderControl("txnSettings", "billNo", "Invoice/Bill Numbering")}
                    {renderControl("txnSettings", "addTime", "Add Time on Transactions")}
                    {renderControl("txnSettings", "cashSaleDefault", "Cash Sale by Default")}
                    {renderControl("txnSettings", "billingName", "Billing Name of Parties")}
                    {renderControl("txnSettings", "poDetails", "Customers P.O. Details on Transactions")}
                    <Separator className="my-2" />
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billing Form Detail Mode</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="billingType"
                          checked={txnSettings.billingType === "Lite"}
                          onChange={() => updateSettings("txnSettings", { billingType: "Lite" })}
                          className="accent-primary"
                        />
                        Lite Sale (Simple Form)
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="billingType"
                          checked={txnSettings.billingType === "Full"}
                          onChange={() => updateSettings("txnSettings", { billingType: "Full" })}
                          className="accent-primary"
                        />
                        Full Sale (All Columns)
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">Items Table Columns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {renderControl("txnSettings", "taxOnRate", "Inclusive/Exclusive Tax on Rate (Price/Unit)")}
                    {renderControl("txnSettings", "displayPurchasePrice", "Display Purchase Price of Items")}
                    {renderControl("txnSettings", "showLast5Sale", "Show Last 5 Sale Price of Items")}
                    {renderControl("txnSettings", "showLast5Purchase", "Show Last 5 Purchase Price of Items")}
                    {renderControl("txnSettings", "freeQty", "Free Item Quantity Column")}
                    {renderControl("txnSettings", "count", "Count Column in Items Table")}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Taxes, Discount & Totals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {renderControl("txnSettings", "txnWiseTax", "Transaction wise Tax")}
                    {renderControl("txnSettings", "txnWiseDiscount", "Transaction wise Discount")}
                  </div>
                  <div className="space-y-2">
                    {renderControl("txnSettings", "roundOff", "Round Off Grand Total")}
                    {txnSettings.roundOff && (
                      <div className="flex items-center gap-3 pt-1">
                        <Label className="text-xs">Rounding to Nearest:</Label>
                        <Select
                          value={String(txnSettings.roundNearest)}
                          onValueChange={(v) => updateSettings("txnSettings", { roundNearest: Number(v) })}
                        >
                          <SelectTrigger className="w-24 h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 (Whole ₹)</SelectItem>
                            <SelectItem value="5">5 Rupees</SelectItem>
                            <SelectItem value="10">10 Rupees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Transaction Prefixes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Sale Invoice Prefix</Label>
                    <Input
                      value={txnSettings.prefixes.sale}
                      onChange={(e) =>
                        updateSettings("txnSettings", {
                          prefixes: { ...txnSettings.prefixes, sale: e.target.value }
                        })
                      }
                      placeholder="e.g. INV-"
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Credit Note Prefix</Label>
                    <Input
                      value={txnSettings.prefixes.creditNote}
                      onChange={(e) =>
                        updateSettings("txnSettings", {
                          prefixes: { ...txnSettings.prefixes, creditNote: e.target.value }
                        })
                      }
                      placeholder="e.g. CR-"
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estimate Prefix</Label>
                    <Input
                      value={txnSettings.prefixes.estimate}
                      onChange={(e) =>
                        updateSettings("txnSettings", {
                          prefixes: { ...txnSettings.prefixes, estimate: e.target.value }
                        })
                      }
                      placeholder="e.g. EST-"
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">More Transaction Features</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderControl("txnSettings", "ewayBill", "E-way bill number")}
                  {renderControl("txnSettings", "quickEntry", "Quick Entry Bar")}
                  {renderControl("txnSettings", "noPreview", "Do not Show Invoice Preview on Save")}
                  {renderControl("txnSettings", "passcodeEdit", "Enable Passcode for Transaction Edit/Delete")}
                  {renderControl("txnSettings", "discountDuringPayment", "Discount During Payments Input")}
                  {renderControl("txnSettings", "linkPayments", "Link Payments to Invoices")}
                  {renderControl("txnSettings", "dueDates", "Due Dates and Payment Terms")}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "PRINT" && (
            <PrintSettingsTab settings={settings} updateSettings={updateSettings} isMobile={isMobile} />
          )}

          {activeTab === "TAXES_GST" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GST Core Checklist */}
                <Card className="border-0 shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">GST Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {renderControl("gstSettings", "enableGst", "Enable GST Taxes")}
                    {renderControl("gstSettings", "enableHsn", "Enable HSN/SAC Codes")}
                    {renderControl("gstSettings", "cessOnItem", "Additional Cess on Items")}
                    {renderControl("gstSettings", "reverseCharge", "Reverse Charge Option")}
                    {renderControl("gstSettings", "placeOfSupply", "Place of Supply Field")}
                    {renderControl("gstSettings", "compositeScheme", "Composite Scheme Scheme")}
                    <div className="flex items-center justify-between py-1.5 px-2 opacity-50">
                      <Label className="text-sm font-medium">Enable TCS Taxes</Label>
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 opacity-50">
                      <Label className="text-sm font-medium">Enable TDS Deductions</Label>
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Rates Management List */}
                <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">Tax Rates</CardTitle>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        setEditingRateId(null);
                        setNewRateName("");
                        setNewRateValue("");
                        setRateModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[320px] overflow-y-auto divide-y">
                    {gstSettings.taxRates.map((rate) => (
                      <div key={rate.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10 text-xs">
                        <span className="font-medium text-foreground">{rate.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{rate.value}%</span>
                          <button
                            onClick={() => {
                              setEditingRateId(rate.id);
                              setNewRateName(rate.name);
                              setNewRateValue(String(rate.value));
                              setRateModalOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRate(rate.id)}
                            className="text-destructive hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Tax Group Panel */}
                <Card className="border-0 shadow-[var(--shadow-card)] lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">Tax Groups</CardTitle>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        setEditingGroupId(null);
                        setNewGroupName("");
                        setNewGroupCgst("");
                        setNewGroupSgst("");
                        setGroupModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[320px] overflow-y-auto divide-y">
                    {gstSettings.taxGroups.map((group) => (
                      <div key={group.id} className="px-4 py-2.5 hover:bg-muted/10 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">{group.name}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setEditingGroupId(group.id);
                                setNewGroupName(group.name);
                                setNewGroupCgst(String(group.cgst));
                                setNewGroupSgst(String(group.sgst));
                                setGroupModalOpen(true);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteGroup(group.id)} className="text-destructive hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-3">
                          <span>CGST: {group.cgst}%</span>
                          <span>SGST: {group.sgst}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "MESSAGE" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-6">
                  {/* Select Channel */}
                  <Card className="border-0 shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">Message Channel</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant={messageSettings.type === "Udaan" ? "default" : "outline"}
                        onClick={() => updateSettings("messageSettings", { type: "Udaan" })}
                        className="rounded-xl flex-1 h-11 text-xs"
                      >
                        Send via Udaan SMS API
                      </Button>
                      <Button
                        variant={messageSettings.type === "WhatsApp" ? "default" : "outline"}
                        onClick={() => updateSettings("messageSettings", { type: "WhatsApp" })}
                        className="rounded-xl flex-1 h-11 text-xs"
                      >
                        Send via Personal WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Message Toggles */}
                  <Card className="border-0 shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">Recipient & Content settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {renderControl("messageSettings", "sendToParty", "Send Message to Party")}
                        {renderControl("messageSettings", "showBalance", "Show Party Balance in Message")}
                        {renderControl("messageSettings", "showWebLink", "Web Invoice Link in Message")}
                      </div>
                      <div className="space-y-2">
                        {renderControl("messageSettings", "showPaymentLink", "Include Payment Link in Message")}
                        <div className="flex items-center justify-between py-1.5 px-2 opacity-50">
                          <Label className="text-sm font-medium">Send Message Copy to Self</Label>
                          <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </div>
                        <div className="flex items-center justify-between py-1.5 px-2 opacity-50">
                          <Label className="text-sm font-medium">Send Transaction Update Alerts</Label>
                          <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Triggers */}
                  <Card className="border-0 shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">Send Automatic Message for:</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.keys(messageSettings.triggers).map((triggerKey) => {
                        const checked = messageSettings.triggers[triggerKey];
                        const triggerLabel = triggerKey.charAt(0).toUpperCase() + triggerKey.slice(1).replace(/([A-Z])/g, " $1");
                        const onCheck = (v) => {
                          const updatedTriggers = { ...messageSettings.triggers, [triggerKey]: v };
                          updateSettings("messageSettings", { triggers: updatedTriggers });
                        };
                        return (
                          <label key={triggerKey} className="flex items-center gap-2 py-1 cursor-pointer text-xs font-semibold">
                            {isMobile ? (
                              <Switch
                                size="sm"
                                checked={!!checked}
                                onCheckedChange={(val) => onCheck(!!val)}
                              />
                            ) : (
                              <Checkbox
                                checked={!!checked}
                                onCheckedChange={(c) => onCheck(!!c)}
                              />
                            )}
                            {triggerLabel}
                          </label>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Edit Template */}
                  <Card className="border-0 shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">Edit Template Body</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={messageSettings.bodyText}
                        onChange={(e) => updateSettings("messageSettings", { bodyText: e.target.value })}
                        className="min-h-[120px] rounded-xl text-sm"
                        placeholder="Add message body text here..."
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Live Message Preview Card (WhatsApp themed) */}
                <div className="xl:col-span-1 space-y-4 sticky top-6">
                  <Card className="border-0 bg-gradient-to-b from-[#efeae2] to-[#d6ccc2] shadow-[var(--shadow-card)] overflow-hidden rounded-2xl">
                    <CardHeader className="bg-[#075e54] text-white py-3 px-4 flex flex-row items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">U</div>
                      <div>
                        <p className="text-xs font-bold leading-tight">Udaan BillBook Notification</p>
                        <p className="text-[10px] text-emerald-200 leading-tight">Active Auto-Message</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="bg-[#dcf8c6] border border-[#c1e8aa] rounded-xl p-3 shadow-sm text-xs leading-normal text-slate-800 space-y-1 relative">
                        <p className="whitespace-pre-line font-medium">{messageSettings.bodyText}</p>
                        <p className="border-t border-[#c1e8aa] pt-1.5 mt-1.5 font-semibold text-emerald-900">
                          Invoice Amount: ₹792.00
                        </p>
                        <p className="text-slate-600">Received: ₹300.00</p>
                        <p className="text-slate-600">Balance: ₹492.00</p>
                        {messageSettings.showBalance && (
                          <p className="text-slate-600 font-semibold">Total Balance: ₹800.00</p>
                        )}
                        {messageSettings.showPaymentLink && (
                          <p className="text-emerald-700 font-medium">Payment Link: https://udaanbillbook.co/pay/inv_85</p>
                        )}
                        {messageSettings.showWebLink && (
                          <p className="text-blue-600 underline cursor-pointer mt-1 break-all">
                            https://udaanbillbook.co/invoice/inv_85
                          </p>
                        )}
                        <span className="text-[9px] text-slate-400 absolute right-2 bottom-1">11:38 AM ✔</span>
                      </div>
                      <div className="bg-[#fff] border rounded-xl p-3 text-center text-xs text-muted-foreground shadow-sm">
                        Automatic {messageSettings.type === "WhatsApp" ? "WhatsApp message" : "SMS message"} will trigger instantly upon saving sale.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "PARTY" && (
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Party Fields Settings</CardTitle>
                <CardDescription>Determine what properties are managed inside Customer/Supplier profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderControl("partySettings", "partyType", "Enable Party Type (Customer vs Supplier)")}
                {renderControl("partySettings", "phone", "Enable Mobile Phone Numbers")}
                {renderControl("partySettings", "openingBalance", "Enable Opening Balance Input")}
                {renderControl("partySettings", "gstin", "Show Party GSTIN Number Field")}
                {renderControl("partySettings", "email", "Show Party Email Address Field")}
                {renderControl("partySettings", "address", "Show Party Billing Address Area")}
              </CardContent>
            </Card>
          )}

          {activeTab === "ITEM" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">Item Core Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {renderControl("itemSettings", "enableItem", "Enable Item Module")}
                    {renderControl("itemSettings", "barcodeScan", "Enable Barcode Scanning Fields")}
                    {itemSettings.barcodeScan && (
                      <div className="pl-6 py-1.5 flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                          <input 
                            type="radio" 
                            name="barcodeScanType" 
                            checked={itemSettings.barcodeScanType === "usb"} 
                            onChange={() => updateSettings("itemSettings", { barcodeScanType: "usb" })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          USB Scanner
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                          <input 
                            type="radio" 
                            name="barcodeScanType" 
                            checked={itemSettings.barcodeScanType === "camera" || !itemSettings.barcodeScanType} 
                            onChange={() => updateSettings("itemSettings", { barcodeScanType: "camera" })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          Phone camera
                        </label>
                      </div>
                    )}
                    {renderControl("itemSettings", "directBarcodeScan", "Direct Barcode Scanning Mode")}
                    {renderControl("itemSettings", "stockMaintenance", "Maintain Stock Quantities")}
                    {renderControl("itemSettings", "showLowStockDialog", "Warn on Low Stock Dialogs")}
                    {renderControl("itemSettings", "itemsUnit", "Item Measuring Units")}
                    {renderControl("itemSettings", "itemCategory", "Item Category Tagging")}
                    {renderControl("itemSettings", "description", "Enable Product Descriptions")}
                    {renderControl("itemSettings", "itemWiseTax", "Item wise Tax Settings")}
                    {renderControl("itemSettings", "itemWiseDiscount", "Item wise Discount Rates")}
                    {renderControl("itemSettings", "updateSalePrice", "Update Sale Price from transactions")}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-base">Additional Item Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {renderControl("itemSettings", "mrp", "Show Item MRP field")}
                    {renderControl("itemSettings", "calculateSalePriceFromMrp", "Calculate Sale Price from MRP & Discount")}
                    {renderControl("itemSettings", "useMrpForBatch", "Use MRP for Batch Tracking")}
                    {renderControl("itemSettings", "calculateTaxOnMrp", "Calculate Tax based on MRP value")}
                    <Separator className="my-2" />
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Tracking & Size Options</Label>
                    {renderControl("itemSettings", "serialNo", "Serial No./ IMEI No. tracking")}
                    {renderControl("itemSettings", "batchNo", "Batch Number tracking")}
                    {renderControl("itemSettings", "expDate", "Enable Batch Expiry Dates")}
                    {renderControl("itemSettings", "mfgDate", "Enable Batch Manufacturing Dates")}
                    {renderControl("itemSettings", "modelNo", "Model Number tracking")}
                    {renderControl("itemSettings", "size", "Size / Dimension tracking")}
                  </CardContent>
                </Card>
              </div>

              {/* Item Custom Fields */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Item Custom Fields</CardTitle>
                    <CardDescription>Configure dynamic attributes to capture on inventory (e.g. Color, Brand)</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewFieldName("");
                      setCustomFieldOpen(true);
                    }}
                    className="rounded-xl"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Field
                  </Button>
                </CardHeader>
                <CardContent>
                  {itemSettings.customFields.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">No custom fields added yet. Add field to dynamically request it on Product dialog.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {itemSettings.customFields.map((cf, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                          <div>
                            <p className="text-sm font-semibold">{cf.name}</p>
                            <p className="text-[10px] text-muted-foreground">Active in form</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={cf.active} onCheckedChange={() => handleToggleCustomField(idx)} />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCustomField(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Tax Rate Modal */}
      <Dialog open={rateModalOpen} onOpenChange={setRateModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingRateId ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rate Display Name</Label>
              <Input
                value={newRateName}
                onChange={(e) => setNewRateName(e.target.value)}
                placeholder="e.g. IGST@18%"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tax Percentage (%)</Label>
              <Input
                type="number"
                value={newRateValue}
                onChange={(e) => setNewRateValue(e.target.value)}
                placeholder="e.g. 18"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRate} className="rounded-xl">Save Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tax Group Modal */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroupId ? "Edit Tax Group" : "Add Tax Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. GST@18%"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CGST (%)</Label>
                <Input
                  type="number"
                  value={newGroupCgst}
                  onChange={(e) => setNewGroupCgst(e.target.value)}
                  placeholder="e.g. 9"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>SGST (%)</Label>
                <Input
                  type="number"
                  value={newGroupSgst}
                  onChange={(e) => setNewGroupSgst(e.target.value)}
                  placeholder="e.g. 9"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGroupModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} className="rounded-xl">Save Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Field Modal */}
      <Dialog open={customFieldOpen} onOpenChange={setCustomFieldOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Custom Field Name</Label>
              <Input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g. Color or Brand"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomFieldOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomField} className="rounded-xl">Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
