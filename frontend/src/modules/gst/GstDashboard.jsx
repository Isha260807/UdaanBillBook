import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  ShieldCheck, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Info,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  ChevronRight,
  Settings,
  Building,
  CreditCard,
  Briefcase,
  Calculator
} from "lucide-react";
import { GstCalculatorDialog } from "@/components/GstCalculatorDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n) => {
  const num = Math.round((Number(n) || 0) * 100) / 100;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export function GstDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };
  
  // Data States
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGstCalculatorOpen, setIsGstCalculatorOpen] = useState(false);

  // Search & Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [salesFilter, setSalesFilter] = useState({ date: "all", customer: "all", rate: "all" });
  const [purchaseFilter, setPurchaseFilter] = useState({ date: "all", supplier: "all" });

  // Custom Editable GST Profile Settings (Persisted in DB settings where possible)
  const [gstProfile, setGstProfile] = useState({
    gstin: "",
    businessName: "",
    legalName: "",
    pan: "",
    regType: "Regular Scheme",
    state: "Delhi",
    regDate: "",
    eWayBill: false,
    eInvoice: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, partiesRes, settingsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/parties'),
        api.get('/settings')
      ]);

      setInvoices(invRes.data || []);
      setParties(partiesRes.data || []);
      setSettings(settingsRes.data || null);

      // Hydrate local GST Profile from DB settings & User profile
      const bizGstin = settingsRes.data?.businessGstin || settingsRes.data?.gstSettings?.gstin || "";
      const bizName = settingsRes.data?.businessName || "My Business";
      const bizState = settingsRes.data?.businessAddress || "Indore";
      
      setGstProfile({
        gstin: bizGstin,
        businessName: bizName,
        legalName: settingsRes.data?.legalName || bizName,
        pan: bizGstin && bizGstin.length >= 10 ? (bizGstin.length >= 12 ? bizGstin.slice(2, 12) : bizGstin) : "",
        regType: settingsRes.data?.gstSettings?.compositeScheme ? "Composition Scheme" : "Regular Scheme",
        state: bizState,
        regDate: "2024-04-01",
        eWayBill: settingsRes.data?.txnSettings?.ewayBill || false,
        eInvoice: false
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to load GST data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      // Save local values to backend settings
      await api.put('/settings', {
        businessGstin: gstProfile.gstin,
        businessName: gstProfile.businessName,
        legalName: gstProfile.legalName,
        gstSettings: {
          ...settings?.gstSettings,
          compositeScheme: gstProfile.regType === "Composition Scheme"
        },
        txnSettings: {
          ...settings?.txnSettings,
          ewayBill: gstProfile.eWayBill
        }
      });
      toast.success("GST profile settings updated successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to update profile settings");
    }
  };

  // Helper: Lookup party GSTIN by invoice reference
  const getPartyGstin = (inv) => {
    if (inv.partyGstin) return inv.partyGstin;
    if (inv.billedToGstin) return inv.billedToGstin;
    if (inv.gstin) return inv.gstin;
    const invNameLower = (inv.partyName || "").trim().toLowerCase();
    const matchingParty = parties.find(p => 
      (inv.party && p._id === inv.party) || 
      (p.name && p.name.trim().toLowerCase() === invNameLower)
    );
    return matchingParty?.gstin || "N/A";
  };

  // Helper: Calculate dynamic GST, Taxable, and Splits for an invoice
  const processInvoiceGst = (inv) => {
    let gstAmt = Number(inv.gstAmount) || 0;
    let taxableAmt = Number(inv.taxableAmount) || 0;

    if ((!gstAmt || !taxableAmt) && Array.isArray(inv.items) && inv.items.length > 0) {
      let calcTaxable = 0;
      let calcGst = 0;

      inv.items.forEach((item) => {
        const q = Number(item.qty) || 0;
        const r = Number(item.rate) || 0;
        const d = Number(item.discount) || 0;
        const g = Number(item.gst) || 0;
        const isExcl = item.taxType === "exclusive";
        const rateAfterDisc = r * (1 - d / 100);
        
        let itemTaxable = 0;
        let itemGst = 0;

        if (isExcl) {
          itemTaxable = q * rateAfterDisc;
          itemGst = itemTaxable * (g / 100);
        } else {
          // Tax Inclusive
          const totalLine = q * rateAfterDisc;
          itemTaxable = totalLine / (1 + g / 100);
          itemGst = totalLine - itemTaxable;
        }

        calcTaxable += itemTaxable;
        calcGst += itemGst;
      });

      if (!gstAmt) gstAmt = calcGst;
      if (!taxableAmt) taxableAmt = calcTaxable;
    }

    const partyGstin = getPartyGstin(inv);
    const bizGstin = gstProfile.gstin;
    const isInterState = bizGstin && partyGstin && partyGstin !== "N/A" && bizGstin.slice(0, 2) !== partyGstin.slice(0, 2);

    const splits = isInterState
      ? { cgst: 0, sgst: 0, igst: gstAmt }
      : { cgst: gstAmt / 2, sgst: gstAmt / 2, igst: 0 };

    return {
      ...inv,
      gstAmount: Math.round(gstAmt * 100) / 100,
      taxableAmount: Math.round(taxableAmt * 100) / 100,
      partyGstin,
      splits
    };
  };

  // Invoices filtered by type
  const salesInvoices = useMemo(() => {
    return invoices
      .filter(i => i.type === "Sale")
      .map(processInvoiceGst);
  }, [invoices, parties, gstProfile.gstin]);

  const purchaseInvoices = useMemo(() => {
    return invoices
      .filter(i => i.type === "Purchase")
      .map(processInvoiceGst);
  }, [invoices, parties, gstProfile.gstin]);

  // Filtering lists
  const filteredSales = useMemo(() => {
    return salesInvoices.filter(inv => {
      // Global Search
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const matches = 
          (inv.invoiceNumber || "").toLowerCase().includes(query) ||
          (inv.partyName || "").toLowerCase().includes(query) ||
          (inv.partyGstin || "").toLowerCase().includes(query) ||
          (inv.grandTotal || 0).toString().includes(query);
        if (!matches) return false;
      }

      // Date filter
      if (salesFilter.date !== "all") {
        const today = new Date();
        const diffDays = (today - new Date(inv.date)) / (1000 * 60 * 60 * 24);
        if (salesFilter.date === "today" && diffDays > 1) return false;
        if (salesFilter.date === "month" && diffDays > 30) return false;
      }

      // Customer filter
      if (salesFilter.customer !== "all" && inv.partyName !== salesFilter.customer) return false;

      return true;
    });
  }, [salesInvoices, globalSearch, salesFilter]);

  const filteredPurchases = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      // Global Search
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const matches = 
          (inv.invoiceNumber || "").toLowerCase().includes(query) ||
          (inv.partyName || "").toLowerCase().includes(query) ||
          (inv.partyGstin || "").toLowerCase().includes(query) ||
          (inv.grandTotal || 0).toString().includes(query);
        if (!matches) return false;
      }

      // Date filter
      if (purchaseFilter.date !== "all") {
        const today = new Date();
        const diffDays = (today - new Date(inv.date)) / (1000 * 60 * 60 * 24);
        if (purchaseFilter.date === "today" && diffDays > 1) return false;
        if (purchaseFilter.date === "month" && diffDays > 30) return false;
      }

      // Supplier filter
      if (purchaseFilter.supplier !== "all" && inv.partyName !== purchaseFilter.supplier) return false;

      return true;
    });
  }, [purchaseInvoices, globalSearch, purchaseFilter]);

  // Pagination states
  const [salesPage, setSalesPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setSalesPage(1);
    setPurchasePage(1);
  }, [globalSearch, salesFilter, purchaseFilter]);

  // Paginated data lists
  const salesTotalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, salesPage, pageSize]);

  const purchaseTotalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const start = (purchasePage - 1) * pageSize;
    return filteredPurchases.slice(start, start + pageSize);
  }, [filteredPurchases, purchasePage, pageSize]);

  // Compute live aggregates (Overview)
  const gstStats = useMemo(() => {
    const totalOutputGst = salesInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
    const totalInputGst = purchaseInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
    const netGstPayable = Math.max(0, totalOutputGst - totalInputGst);

    const totalCgst = salesInvoices.reduce((sum, inv) => sum + inv.splits.cgst, 0);
    const totalSgst = salesInvoices.reduce((sum, inv) => sum + inv.splits.sgst, 0);
    const totalIgst = salesInvoices.reduce((sum, inv) => sum + inv.splits.igst, 0);

    const monthlySales = salesInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const monthlyPurchase = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Count pending returns dynamically
    const pendingReturnsCount = netGstPayable > 0 ? 1 : 0;

    return {
      outputGst: totalOutputGst,
      inputGst: totalInputGst,
      netGstPayable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      monthlySales,
      monthlyPurchase,
      pendingReturns: pendingReturnsCount
    };
  }, [salesInvoices, purchaseInvoices]);

  // Smart Alerts
  const smartAlerts = useMemo(() => {
    const alerts = [];
    if (gstStats.netGstPayable > 0) {
      alerts.push({
        type: "warning",
        msg: `Pending GST Liability: ${fmt(gstStats.netGstPayable)} payable for the current period. Record a payment to clear.`
      });
    }
    if (!gstProfile.gstin || gstProfile.gstin === "N/A") {
      alerts.push({
        type: "danger",
        msg: "GSTIN Verification Required: Please configure your business GSTIN in settings."
      });
    }
    if (gstStats.inputGst > 0) {
      alerts.push({
        type: "info",
        msg: `ITC Available: ${fmt(gstStats.inputGst)} Eligible Input Tax Credit detected from purchases.`
      });
    }
    return alerts;
  }, [gstStats, gstProfile.gstin]);

  // Real PDF Export Functions
  const exportSalesGstPdf = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales records to export");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const today = new Date().toLocaleDateString('en-IN');
      
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129);
      doc.text("UdaanBillBook — Sales GST Register (Output Tax)", 14, 15);
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`GSTIN: ${gstProfile.gstin || "N/A"} | Business: ${gstProfile.businessName || "Sharma Traders"} | Date: ${today}`, 14, 22);

      const tableRows = filteredSales.map(inv => [
        inv.invoiceNumber || "",
        inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : "",
        inv.partyName || "",
        inv.partyGstin || "N/A",
        fmt(inv.taxableAmount),
        inv.splits.cgst > 0 ? fmt(inv.splits.cgst) : "—",
        inv.splits.sgst > 0 ? fmt(inv.splits.sgst) : "—",
        inv.splits.igst > 0 ? fmt(inv.splits.igst) : "—",
        fmt(inv.gstAmount),
        fmt(inv.grandTotal)
      ]);

      autoTable(doc, {
        startY: 27,
        head: [["Invoice No", "Date", "Customer", "GSTIN", "Taxable Val", "CGST (9%)", "SGST (9%)", "IGST (18%)", "Total GST", "Total Amount"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 }
      });

      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`Udaan_Sales_GST_Register_${fileDate}.pdf`);
      toast.success("Sales GST Register PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Sales GST PDF");
    }
  };

  const exportPurchaseGstPdf = () => {
    if (filteredPurchases.length === 0) {
      toast.error("No purchase records to export");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const today = new Date().toLocaleDateString('en-IN');
      
      doc.setFontSize(16);
      doc.setTextColor(239, 68, 68);
      doc.text("UdaanBillBook — Purchase GST Register (Input Tax Credit)", 14, 15);
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`GSTIN: ${gstProfile.gstin || "N/A"} | Business: ${gstProfile.businessName || "Sharma Traders"} | Date: ${today}`, 14, 22);

      const tableRows = filteredPurchases.map(inv => [
        inv.invoiceNumber || "",
        inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : "",
        inv.partyName || "",
        inv.partyGstin || "N/A",
        fmt(inv.taxableAmount),
        inv.splits.cgst > 0 ? fmt(inv.splits.cgst) : "—",
        inv.splits.sgst > 0 ? fmt(inv.splits.sgst) : "—",
        inv.splits.igst > 0 ? fmt(inv.splits.igst) : "—",
        fmt(inv.gstAmount),
        fmt(inv.grandTotal)
      ]);

      autoTable(doc, {
        startY: 27,
        head: [["Purchase No", "Date", "Supplier", "GSTIN", "Taxable Val", "CGST (Input)", "SGST (Input)", "IGST (Input)", "Input GST (ITC)", "Total Bill"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 8 }
      });

      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`Udaan_Purchase_GST_Register_${fileDate}.pdf`);
      toast.success("Purchase GST Register PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Purchase GST PDF");
    }
  };

  const exportGstrSummaryPdf = () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('en-IN');
      
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129);
      doc.text("UdaanBillBook — GST Taxation Summary Report", 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`GSTIN: ${gstProfile.gstin || "N/A"} | Business: ${gstProfile.businessName || "Sharma Traders"}`, 14, 25);
      doc.text(`Report Date: ${today}`, 14, 30);
      
      const summaryRows = [
        ["Output GST Collected (Sales)", fmt(gstStats.outputGst)],
        ["Input Tax Credit (Purchases ITC)", fmt(gstStats.inputGst)],
        ["Net GST Liability Payable to Govt", fmt(gstStats.netGstPayable)],
        ["Total Monthly Sales", fmt(gstStats.monthlySales)],
        ["Total Monthly Purchase", fmt(gstStats.monthlyPurchase)]
      ];
      
      autoTable(doc, {
        startY: 35,
        head: [["Tax Metric", "Amount (INR)"]],
        body: summaryRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] }
      });

      if (salesInvoices.length > 0) {
        const salesRows = salesInvoices.map(inv => [
          inv.invoiceNumber,
          new Date(inv.date).toLocaleDateString('en-IN'),
          inv.partyName,
          inv.partyGstin,
          fmt(inv.taxableAmount),
          fmt(inv.gstAmount),
          fmt(inv.grandTotal)
        ]);
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [["Invoice No", "Date", "Customer", "GSTIN", "Taxable", "GST", "Total"]],
          body: salesRows,
          theme: "grid",
          headStyles: { fillColor: [51, 65, 85] }
        });
      }
      
      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`Udaan_GSTR_Summary_${fileDate}.pdf`);
      toast.success("GSTR Summary PDF Report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading GST details...</div>;

  // Render Empty State if no invoices are present
  const hasNoGstData = invoices.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ERP GST & Taxation"
        subtitle="Manage business GSTIN returns, Input Tax Credit registers, and tax liabilities dynamically."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setIsGstCalculatorOpen(true)}>
              <Calculator className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> GST Calculator
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={fetchData}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync Data
            </Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={exportGstrSummaryPdf}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> GSTR Summary
            </Button>
          </div>
        }
      />

      {/* Smart Alerts list */}
      {smartAlerts.length > 0 && (
        <div className="space-y-2">
          {smartAlerts.map((alert, idx) => (
            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold leading-normal ${
              alert.type === "danger" 
                ? "bg-red-50 text-red-700 border-red-100" 
                : alert.type === "warning" 
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{alert.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input 
          type="text" 
          placeholder="Global GST Search (Search invoices, customers, suppliers, GSTINs...)"
          className="pl-10 h-11 bg-white border border-slate-200 shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side Sub-Navigation */}
        <div className="w-full lg:w-64 bg-white rounded-2xl p-3 border shadow-sm shrink-0 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-wider">GST Books</p>
          {[
            { id: "overview", label: "GST Overview", icon: PieChart },
            { id: "salesGst", label: "Sales GST Register", icon: ArrowUpRight },
            { id: "purchaseGst", label: "Purchase GST (ITC)", icon: ArrowDownRight },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => handleTabChange(nav.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                activeTab === nav.id 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <nav.icon className={`h-4 w-4 ${activeTab === nav.id ? "text-emerald-600" : "text-slate-400"}`} />
              {nav.label}
              {activeTab === nav.id && <ChevronRight className="ml-auto h-3 w-3" />}
            </button>
          ))}
        </div>

        {/* Right Side Main Content Panel */}
        <div className="flex-1 w-full min-h-[500px]">

          {/* 1. OVERVIEW DASHBOARD */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {globalSearch && (
                <Card className="border border-emerald-100 shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-800">Search Results matching "{globalSearch}"</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sales Matches */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-2">Matching Sales ({filteredSales.length})</h4>
                      {filteredSales.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No matching sales invoices.</p>
                      ) : (
                        <div className="divide-y text-xs max-h-40 overflow-y-auto">
                          {filteredSales.map(inv => (
                            <div key={inv._id} className="flex justify-between py-2 hover:bg-slate-50 px-2 rounded-lg">
                              <div>
                                <span className="font-semibold text-slate-800">{inv.invoiceNumber}</span>
                                <span className="text-slate-400 mx-2">|</span>
                                <span className="text-slate-600">{inv.partyName}</span>
                              </div>
                              <span className="font-bold text-emerald-600">{fmt(inv.grandTotal)} (GST: {fmt(inv.gstAmount)})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Purchase Matches */}
                    <div className="pt-2 border-t">
                      <h4 className="text-xs font-bold text-slate-500 mb-2">Matching Purchases ({filteredPurchases.length})</h4>
                      {filteredPurchases.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No matching purchase invoices.</p>
                      ) : (
                        <div className="divide-y text-xs max-h-40 overflow-y-auto">
                          {filteredPurchases.map(inv => (
                            <div key={inv._id} className="flex justify-between py-2 hover:bg-slate-50 px-2 rounded-lg">
                              <div>
                                <span className="font-semibold text-slate-800">{inv.invoiceNumber}</span>
                                <span className="text-slate-400 mx-2">|</span>
                                <span className="text-slate-600">{inv.partyName}</span>
                              </div>
                              <span className="font-bold text-red-600">{fmt(inv.grandTotal)} (GST: {fmt(inv.gstAmount)})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Output GST (Liability)", val: gstStats.outputGst, desc: "Collected from sales", style: "border-t-primary" },
                  { label: "Input Tax Credit (ITC)", val: gstStats.inputGst, desc: "Paid on purchases", style: "border-t-success text-success" },
                  { label: "Net GST Payable", val: gstStats.netGstPayable, desc: "Liability payable to govt", style: "border-t-accent text-accent" },
                  { label: "Pending Returns", val: gstStats.pendingReturns, desc: "Returns due this period", style: "border-t-blue-500", rawVal: true }
                ].map((k, idx) => (
                  <Card key={idx} className={`border-0 border-t-4 shadow-sm rounded-xl ${k.style}`}>
                    <CardContent className="p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
                      <p className="text-2xl font-black mt-2">
                        {k.rawVal ? k.val : fmt(k.val)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{k.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "GST Collected", val: gstStats.outputGst, color: "text-emerald-600" },
                  { label: "GST Paid", val: gstStats.inputGst, color: "text-red-500" },
                  { label: "Monthly Sales", val: gstStats.monthlySales, color: "text-slate-800" },
                  { label: "Monthly Purchase", val: gstStats.monthlyPurchase, color: "text-slate-800" }
                ].map((s, idx) => (
                  <Card key={idx} className="border shadow-sm bg-white rounded-xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-lg font-bold mt-1 ${s.color}`}>{fmt(s.val)}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty state or Chart visualizer */}
              {hasNoGstData ? (
                <Card className="border border-dashed p-12 text-center rounded-2xl bg-white">
                  <Info className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No GST Data Available</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Create your first Sale or Purchase Invoice to generate GST liability calculations and tax reports.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GST Split Progress Bars */}
                  <Card className="border shadow-sm rounded-2xl bg-white">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-emerald-600" /> CGST vs SGST vs IGST Splits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2 text-xs font-semibold">
                          <span>CGST (Central Tax)</span>
                          <span className="font-bold">{fmt(gstStats.cgst)}</span>
                        </div>
                        <Progress value={gstStats.outputGst > 0 ? (gstStats.cgst / gstStats.outputGst) * 100 : 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2 text-xs font-semibold">
                          <span>SGST (State Tax)</span>
                          <span className="font-bold">{fmt(gstStats.sgst)}</span>
                        </div>
                        <Progress value={gstStats.outputGst > 0 ? (gstStats.sgst / gstStats.outputGst) * 100 : 0} className="h-2 [&>div]:bg-success" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2 text-xs font-semibold">
                          <span>IGST (Integrated Tax)</span>
                          <span className="font-bold">{fmt(gstStats.igst)}</span>
                        </div>
                        <Progress value={gstStats.outputGst > 0 ? (gstStats.igst / gstStats.outputGst) * 100 : 0} className="h-2 [&>div]:bg-accent" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* GST profile info overview */}
                  <Card className="border shadow-sm rounded-2xl bg-white">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Active GST Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs leading-normal">
                      <div className="flex justify-between border-b pb-1.5">
                        <span>GSTIN</span>
                        <span className="font-bold text-slate-800">{gstProfile.gstin || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span>Business Legal Name</span>
                        <span className="font-medium">{gstProfile.legalName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span>Registration Type</span>
                        <span className="font-medium text-slate-600">{gstProfile.regType}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span>State of Supply</span>
                        <span className="font-medium">{gstProfile.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAN Number</span>
                        <span className="font-mono font-semibold">{gstProfile.pan || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* 2. SALES GST REGISTER */}
          {activeTab === "salesGst" && (
            <Card className="border shadow-sm bg-white rounded-2xl">
              <CardHeader className="border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base">Sales GST Register (Output Tax)</CardTitle>
                    <CardDescription>GST collected on Sales Invoices generated dynamically.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={exportSalesGstPdf}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export Register
                  </Button>
                </div>

                {/* Filter controls */}
                <div className="flex gap-2 mt-4">
                  <select 
                    value={salesFilter.date}
                    onChange={(e) => setSalesFilter({ ...salesFilter, date: e.target.value })}
                    className="h-8 rounded-lg border text-xs bg-slate-50 px-2"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="month">This Month</option>
                  </select>
                  <select 
                    value={salesFilter.customer}
                    onChange={(e) => setSalesFilter({ ...salesFilter, customer: e.target.value })}
                    className="h-8 rounded-lg border text-xs bg-slate-50 px-2"
                  >
                    <option value="all">All Customers</option>
                    {Array.from(new Set(salesInvoices.map(i => i.partyName))).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredSales.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">No sales tax records found matching active filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-3 font-semibold text-slate-600">Invoice No</th>
                          <th className="p-3 font-semibold text-slate-600">Date</th>
                          <th className="p-3 font-semibold text-slate-600">Customer</th>
                          <th className="p-3 font-semibold text-slate-600">GSTIN</th>
                          <th className="p-3 font-semibold text-slate-600">Taxable Val</th>
                          <th className="p-3 font-semibold text-slate-600">CGST</th>
                          <th className="p-3 font-semibold text-slate-600">SGST</th>
                          <th className="p-3 font-semibold text-slate-600">IGST</th>
                          <th className="p-3 font-semibold text-slate-600">Total GST</th>
                          <th className="p-3 font-semibold text-slate-600">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedSales.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-semibold">{inv.invoiceNumber}</td>
                            <td className="p-3">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 font-medium">{inv.partyName}</td>
                            <td className="p-3 font-mono text-muted-foreground">{inv.partyGstin}</td>
                            <td className="p-3 font-medium">{fmt(inv.taxableAmount)}</td>
                            <td className="p-3 text-slate-600">{inv.splits.cgst > 0 ? fmt(inv.splits.cgst) : "—"}</td>
                            <td className="p-3 text-slate-600">{inv.splits.sgst > 0 ? fmt(inv.splits.sgst) : "—"}</td>
                            <td className="p-3 text-slate-600">{inv.splits.igst > 0 ? fmt(inv.splits.igst) : "—"}</td>
                            <td className="p-3 font-bold text-emerald-600">{fmt(inv.gstAmount)}</td>
                            <td className="p-3 font-bold text-slate-800">{fmt(inv.grandTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sales Pagination Bar */}
                {filteredSales.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {(salesPage - 1) * pageSize + 1} to {Math.min(salesPage * pageSize, filteredSales.length)} of {filteredSales.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salesPage === 1}
                        onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                        className="h-8 text-xs rounded-xl"
                      >
                        Previous
                      </Button>
                      <span className="text-xs font-semibold text-slate-700 px-2">
                        Page {salesPage} of {salesTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salesPage >= salesTotalPages}
                        onClick={() => setSalesPage(p => Math.min(salesTotalPages, p + 1))}
                        className="h-8 text-xs rounded-xl"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3. PURCHASE GST (ITC) */}
          {activeTab === "purchaseGst" && (
            <Card className="border shadow-sm bg-white rounded-2xl">
              <CardHeader className="border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base">Purchase GST Register (Input Tax Credit)</CardTitle>
                    <CardDescription>Input tax credit logs computed from business purchases.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={exportPurchaseGstPdf}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export Register
                  </Button>
                </div>

                {/* Filter controls */}
                <div className="flex gap-2 mt-4">
                  <select 
                    value={purchaseFilter.date}
                    onChange={(e) => setPurchaseFilter({ ...purchaseFilter, date: e.target.value })}
                    className="h-8 rounded-lg border text-xs bg-slate-50 px-2"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="month">This Month</option>
                  </select>
                  <select 
                    value={purchaseFilter.supplier}
                    onChange={(e) => setPurchaseFilter({ ...purchaseFilter, supplier: e.target.value })}
                    className="h-8 rounded-lg border text-xs bg-slate-50 px-2"
                  >
                    <option value="all">All Suppliers</option>
                    {Array.from(new Set(purchaseInvoices.map(i => i.partyName))).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredPurchases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">No purchase tax records found matching active filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-3 font-semibold text-slate-600">Purchase No</th>
                          <th className="p-3 font-semibold text-slate-600">Date</th>
                          <th className="p-3 font-semibold text-slate-600">Supplier</th>
                          <th className="p-3 font-semibold text-slate-600">GSTIN</th>
                          <th className="p-3 font-semibold text-slate-600">Taxable Value</th>
                          <th className="p-3 font-semibold text-slate-600">CGST (Input)</th>
                          <th className="p-3 font-semibold text-slate-600">SGST (Input)</th>
                          <th className="p-3 font-semibold text-slate-600">IGST (Input)</th>
                          <th className="p-3 font-semibold text-slate-600">Input GST (ITC)</th>
                          <th className="p-3 font-semibold text-slate-600">Total Bill</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedPurchases.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-semibold">{inv.invoiceNumber}</td>
                            <td className="p-3">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 font-medium">{inv.partyName}</td>
                            <td className="p-3 font-mono text-muted-foreground">{inv.partyGstin}</td>
                            <td className="p-3 font-medium">{fmt(inv.taxableAmount)}</td>
                            <td className="p-3 text-slate-600">{inv.splits.cgst > 0 ? fmt(inv.splits.cgst) : "—"}</td>
                            <td className="p-3 text-slate-600">{inv.splits.sgst > 0 ? fmt(inv.splits.sgst) : "—"}</td>
                            <td className="p-3 text-slate-600">{inv.splits.igst > 0 ? fmt(inv.splits.igst) : "—"}</td>
                            <td className="p-3 font-bold text-emerald-600">{fmt(inv.gstAmount)}</td>
                            <td className="p-3 font-bold text-slate-800">{fmt(inv.grandTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Purchase Pagination Bar */}
                {filteredPurchases.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {(purchasePage - 1) * pageSize + 1} to {Math.min(purchasePage * pageSize, filteredPurchases.length)} of {filteredPurchases.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={purchasePage === 1}
                        onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                        className="h-8 text-xs rounded-xl"
                      >
                        Previous
                      </Button>
                      <span className="text-xs font-semibold text-slate-700 px-2">
                        Page {purchasePage} of {purchaseTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={purchasePage >= purchaseTotalPages}
                        onClick={() => setPurchasePage(p => Math.min(purchaseTotalPages, p + 1))}
                        className="h-8 text-xs rounded-xl"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. GST RETURNS */}
          {activeTab === "returns" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "gstr1", label: "GSTR-1 (Sales Statement)", description: "Outward supplies statement details.", status: salesInvoices.length > 0 ? "Pending Filing" : "No Sales Records", date: "Due on 11th of Next Month" },
                  { id: "gstr3b", label: "GSTR-3B (Monthly Summary)", description: "Consolidated summary return containing tax liability offsets.", status: gstStats.netGstPayable > 0 ? "Payment Required" : "No Tax Due", date: "Due on 20th of Next Month" },
                  { id: "gstr9", label: "GSTR-9 (Annual Return)", description: "Consolidated annual tax filing compilation.", status: "Yearly Statement", date: "Due on 31st December" },
                  { id: "gstr9c", label: "GSTR-9C (Reconciliation)", description: "Tax audit and audit reconciliations statement.", status: "Yearly Statement", date: "Due on 31st December" }
                ].map((form) => (
                  <Card key={form.id} className="border shadow-sm bg-white rounded-xl">
                    <CardContent className="p-5 flex gap-4 items-start">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#075e54]/10 text-[#075e54]">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold truncate">{form.label}</p>
                          <Badge variant="outline" className="text-[9px] capitalize">{form.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{form.description}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-2">{form.date}</p>
                        <div className="mt-4 flex gap-2">
                          <Button variant="ghost" size="sm" className="flex-1 text-xs h-8 border rounded-lg" onClick={() => toast.info(`Generating JSON for ${form.id}...`)}>Draft Return</Button>
                          <Button variant="ghost" size="sm" className="flex-1 text-xs h-8 border rounded-lg bg-slate-50" onClick={() => toast.info(`Downloading Excel Report for ${form.id}...`)}>Excel Summary</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 5. TAX REPORTS REGISTER */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "GST Tax Ledger Summary", desc: "Ledger report matching dynamic cash updates", icon: Briefcase },
                  { title: "Sales GSTR-1 Draft Register", desc: "Outward tax register matching GSTR1 formatting", icon: ArrowUpRight },
                  { title: "Purchase GSTR-2B Register", desc: "ITC reconciliation ledger matching inward invoices", icon: ArrowDownRight },
                  { title: "Tax Liability Comparison", desc: "Detailed IGST, CGST, and SGST matching ledger", icon: PieChart },
                  { title: "GST Payment History", desc: "Records of dynamic tax offset payments logged", icon: CreditCard }
                ].map((rep, idx) => (
                  <Card key={idx} className="border shadow-sm bg-white rounded-xl hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => toast.success(`Generated ${rep.title} PDF`)}>
                    <CardHeader className="pb-2">
                      <rep.icon className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-xs font-bold mt-2">{rep.title}</CardTitle>
                      <CardDescription className="text-[11px]">{rep.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 text-right">
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">Download PDF <ChevronRight className="h-3 w-3" /></span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 6. GST BUSINESS PROFILE SETTINGS */}
          {activeTab === "settings" && (
            <Card className="border shadow-sm bg-white rounded-2xl max-w-xl mx-auto">
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600" /> Configure GST Profile Settings
                </CardTitle>
                <CardDescription>Configure business tax profiles, registration type, and GSTIN variables.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">GSTIN / Tax ID</label>
                      <Input 
                        placeholder="e.g. 07AQXPD2556K2ZB"
                        value={gstProfile.gstin}
                        onChange={(e) => setGstProfile({ ...gstProfile, gstin: e.target.value.toUpperCase(), pan: e.target.value.slice(2, 12).toUpperCase() })}
                        className="rounded-xl h-10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">PAN Number</label>
                      <Input 
                        placeholder="e.g. AQXPD2556K"
                        value={gstProfile.pan}
                        onChange={(e) => setGstProfile({ ...gstProfile, pan: e.target.value.toUpperCase() })}
                        className="rounded-xl h-10 font-mono"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Business Brand Name</label>
                      <Input 
                        value={gstProfile.businessName}
                        onChange={(e) => setGstProfile({ ...gstProfile, businessName: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Business Legal Name</label>
                      <Input 
                        value={gstProfile.legalName}
                        onChange={(e) => setGstProfile({ ...gstProfile, legalName: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Registration Scheme</label>
                      <select
                        value={gstProfile.regType}
                        onChange={(e) => setGstProfile({ ...gstProfile, regType: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Regular Scheme">Regular Scheme</option>
                        <option value="Composition Scheme">Composition Scheme</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">State / Address</label>
                      <Input 
                        value={gstProfile.state}
                        onChange={(e) => setGstProfile({ ...gstProfile, state: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input 
                        type="checkbox" 
                        checked={gstProfile.eWayBill}
                        onChange={(e) => setGstProfile({ ...gstProfile, eWayBill: e.target.checked })}
                        className="accent-emerald-600 h-4 w-4"
                      />
                      Enable dynamic E-Way Bill fields on Invoices
                    </label>
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700">
                    Save GST Profile configuration
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
      <GstCalculatorDialog open={isGstCalculatorOpen} onOpenChange={setIsGstCalculatorOpen} />
    </div>
  );
}
