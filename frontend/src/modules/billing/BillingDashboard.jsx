import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, FileDown, Share2, Filter, ReceiptText, Eye, Trash2, X
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMockAuth } from "@/lib/auth-store";
import { downloadInvoicePdf, printInvoiceHtml } from "@/lib/invoice-pdf";
import { openWhatsAppShare } from "@/lib/whatsapp-helper";
import { useInvoices } from "@/contexts/InvoiceContext";
import api from "@/lib/api";
import { validateUtr, validateUpi } from "@/lib/validation";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

const statusStyles = {
  Paid: "bg-success-soft text-success border-success/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Partial: "bg-accent-soft text-accent-foreground border-accent/20",
};

export function BillingDashboard() {
  const { invoices, refreshInvoices } = useInvoices();
  const { user } = useMockAuth();
  const isViewer = user?.role === "Viewer";
  
  const userRole = user?.role?.toLowerCase() || "user";
  const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";

  useEffect(() => {
    refreshInvoices();
  }, []);

  const stats = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let partial = 0;

    invoices.forEach((inv) => {
      const amt = Number(inv.amount) || 0;
      if (inv.status === "Paid") paid += amt;
      else if (inv.status === "Unpaid") unpaid += amt;
      else if (inv.status === "Partial") partial += amt;
    });

    return {
      total: invoices.length,
      paid,
      unpaid,
      partial,
      collectedThisMonth: paid,
    };
  }, [invoices]);

  const [tab, setTab] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();

  const typeFilter = searchParams.get("type") || "all";
  const setTypeFilter = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val && val !== "all") {
        next.set("type", val);
      } else {
        next.delete("type");
      }
      return next;
    });
  };

  const search = searchParams.get("q") || "";
  const setSearch = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set("q", val);
      else next.delete("q");
      return next;
    });
  };

  const filtered = invoices.filter((i) => {
    const matchesTab = tab === "all" || i.status.toLowerCase() === tab;
    const matchesType = typeFilter === "all" || (i.type || "Sale").toLowerCase() === typeFilter;
    const matchesSearch = 
      (i.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.partyName || i.party || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesType && matchesSearch;
  });

  // --- Status Update Modal State ---
  const [statusModal, setStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("Paid");
  const [modalPaymentMethod, setModalPaymentMethod] = useState("Cash");
  const [modalReceivedAmount, setModalReceivedAmount] = useState(0);
  const [modalPaymentDetails, setModalPaymentDetails] = useState({
    transactionId: "", utr: "", bankName: "", accountNumber: "", ifsc: ""
  });
  const [modalErrors, setModalErrors] = useState({ utr: "", upi: "" });

  const openStatusModal = (inv, selectedStatus) => {
    if (selectedStatus === "Unpaid") {
      directStatusUpdate(inv, "Unpaid", undefined, 0, {});
      return;
    }
    setStatusTarget(inv);
    setNewStatus(selectedStatus);
    setModalPaymentMethod(inv.paymentMethod || "Cash");
    setModalReceivedAmount(selectedStatus === "Paid" ? (inv.grandTotal || inv.amount) : Math.round((inv.grandTotal || inv.amount) / 2));
    setModalPaymentDetails({ transactionId: "", utr: "", bankName: "", accountNumber: "", ifsc: "" });
    setModalErrors({ utr: "", upi: "" });
    setStatusModal(true);
  };

  const directStatusUpdate = async (inv, status, paymentMethod, receivedAmount, paymentDetails) => {
    try {
      await api.patch(`/invoices/${inv._id}/status`, {
        status, receivedAmount, paymentMethod, paymentDetails
      });
      refreshInvoices();
      toast.success(`${inv.invoiceNumber || inv.id} → ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleModalSubmit = () => {
    if (modalPaymentMethod === "Online") {
      let hasError = false;
      let errs = { utr: "", upi: "" };
      if (!validateUtr(modalPaymentDetails.utr)) {
        errs.utr = "Please enter a valid UTR Number.";
        hasError = true;
      }
      if (!validateUpi(modalPaymentDetails.transactionId)) {
        errs.upi = "Please enter a valid UPI ID.";
        hasError = true;
      }
      if (hasError) {
        setModalErrors(errs);
        return;
      }
    }
    directStatusUpdate(statusTarget, newStatus, modalPaymentMethod, modalReceivedAmount, modalPaymentDetails);
    setStatusModal(false);
  };

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPreviewInv, setSelectedPreviewInv] = useState(null);

  const downloadOne = async (inv) => {
    let targetInv = inv;
    if (inv?._id) {
      try {
        const res = await api.get(`/invoices/${inv._id}`);
        if (res.data) {
          targetInv = { ...inv, ...res.data };
        }
      } catch (e) {
        console.warn("API GET invoice details warning:", e);
      }
    }
    setSelectedPreviewInv(targetInv);
    setPreviewModalOpen(true);
    setTimeout(() => {
      printInvoiceHtml();
    }, 250);
  };

  const shareWA = (inv) => {
    openWhatsAppShare(inv, inv.partyPhone || inv.phone || inv.billedToMobile || "");
  };

  const previewOne = async (inv) => {
    let targetInv = inv;
    if (inv?._id) {
      try {
        const res = await api.get(`/invoices/${inv._id}`);
        if (res.data) {
          targetInv = { ...inv, ...res.data };
        }
      } catch (e) {
        console.warn("API GET invoice details warning:", e);
      }
    }
    setSelectedPreviewInv(targetInv);
    setPreviewModalOpen(true);
  };

  const deleteOne = async (inv) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber || inv.id}?`)) return;
    try {
      await api.delete(`/invoices/${inv._id}`);
      refreshInvoices();
      toast.success(`Invoice ${inv.invoiceNumber || inv.id} deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete invoice");
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();

      // Header Title
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Udaan BillBook - Billing & Invoices Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated on: ${dateStr}`, 14, 28);

      // Summary Table
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Billing Summary", 14, 36);

      const summaryRows = [
        ["Total Invoices", `${stats.total} Invoices`],
        ["Paid Amount", `Rs. ${stats.paid.toLocaleString("en-IN")}`],
        ["Unpaid Amount", `Rs. ${stats.unpaid.toLocaleString("en-IN")}`],
      ];

      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: summaryRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      let startY = (doc).lastAutoTable?.finalY ? (doc).lastAutoTable.finalY + 12 : 75;

      // Invoices List Table
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Invoices List", 14, startY);

      const tableRows = filtered.map((inv) => [
        inv.invoiceNumber || inv.id || "-",
        inv.type || "Sale",
        inv.partyName || inv.party || "Walk-in Customer",
        inv.date || "-",
        `Rs. ${Number(inv.grandTotal || inv.amount || 0).toLocaleString("en-IN")}`,
        inv.status || "Unpaid",
        inv.paymentMethod || "Cash"
      ]);

      autoTable(doc, {
        startY: startY + 4,
        head: [["Invoice No", "Type", "Party / Supplier", "Date", "Amount", "Status", "Payment Mode"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      const today = new Date().toISOString().split("T")[0];
      doc.save(`Udaan_Billing_Report_${today}.pdf`);
      toast.success("Billing & Invoices PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="hidden sm:inline">Billing & Invoices</span>}
        actions={
          <div className="flex w-full flex-nowrap items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none px-2 rounded-xl h-8 text-[11px] sm:px-4 sm:h-9 sm:text-sm" onClick={handleExportPdf}>
              <FileDown className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Export
            </Button>
            {!isViewer && (
              <>
                <Button asChild size="sm" className="flex-1 sm:flex-none px-2 rounded-xl bg-red-500 hover:bg-red-600 h-8 text-[11px] sm:px-4 sm:h-9 sm:text-sm">
                  <Link to={`${rolePrefix}/sale/new`}>
                    <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Sale
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1 sm:flex-none px-2 rounded-xl bg-blue-600 hover:bg-blue-700 h-8 text-[11px] sm:px-4 sm:h-9 sm:text-sm">
                  <Link to={`${rolePrefix}/purchase/new`}>
                    <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Purchase
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Invoices", value: stats.total.toString(), tint: "bg-primary-soft text-primary" },
          { label: "Paid", value: fmt(stats.paid), tint: "bg-success-soft text-success" },
          { label: "Unpaid", value: fmt(stats.unpaid), tint: "bg-destructive/10 text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 min-w-0">
              <div className={`flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${s.tint}`}>
                <ReceiptText className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Invoice List without outer Card wrapper */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab} className="hidden sm:block">
            <TabsList className="rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="paid" className="rounded-lg">Paid</TabsTrigger>
              <TabsTrigger value="unpaid" className="rounded-lg">Unpaid</TabsTrigger>
              <TabsTrigger value="partial" className="rounded-lg">Partial</TabsTrigger>
            </TabsList>
          </Tabs>
            <div className="flex w-full gap-2 sm:w-auto items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex h-10 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs sm:text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring items-center gap-1.5 cursor-pointer">
                    {typeFilter === "all" ? "All Types" : typeFilter === "sale" ? "Sales Only" : "Purchases Only"}
                    <span className="text-[10px] text-slate-500">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 rounded-2xl shadow-lg border border-slate-100 p-1.5 bg-white">
                  <DropdownMenuItem 
                    onClick={() => setTypeFilter("all")} 
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${typeFilter === "all" ? "bg-slate-50 text-emerald-700 font-bold" : "text-slate-700"}`}
                  >
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTypeFilter("sale")} 
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${typeFilter === "sale" ? "bg-slate-50 text-emerald-700 font-bold" : "text-slate-700"}`}
                  >
                    Sales Only
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTypeFilter("purchase")} 
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${typeFilter === "purchase" ? "bg-slate-50 text-emerald-700 font-bold" : "text-slate-700"}`}
                  >
                    Purchases Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search invoice…" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-full pl-9 sm:w-64" 
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl sm:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-slate-100 p-1.5">
                  <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</div>
                  <DropdownMenuItem onClick={() => setTab("all")} className={`cursor-pointer rounded-lg ${tab === "all" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>All Statuses</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTab("paid")} className={`cursor-pointer rounded-lg ${tab === "paid" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>Paid</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTab("unpaid")} className={`cursor-pointer rounded-lg ${tab === "unpaid" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>Unpaid</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTab("partial")} className={`cursor-pointer rounded-lg ${tab === "partial" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>Partial</DropdownMenuItem>
                  
                  <div className="h-px bg-slate-100 my-1.5 mx-1" />
                  <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type</div>
                  <DropdownMenuItem onClick={() => setTypeFilter("all")} className={`cursor-pointer rounded-lg ${typeFilter === "all" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("sale")} className={`cursor-pointer rounded-lg ${typeFilter === "sale" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>Sales Only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("purchase")} className={`cursor-pointer rounded-lg ${typeFilter === "purchase" ? "bg-slate-50 font-bold text-emerald-700" : ""}`}>Purchases Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv._id || inv.id} className="border-b last:border-0">
                    <TableCell className="font-semibold">{inv.invoiceNumber || inv.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={inv.type === 'Sale' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>
                        {inv.type || 'Sale'}
                      </Badge>
                    </TableCell>
                    <TableCell>{inv.partyName || inv.party}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : ""}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(inv.grandTotal || inv.amount)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="cursor-pointer focus:outline-none">
                            <Badge variant="outline" className={`rounded-full ${statusStyles[inv.status]} hover:opacity-80 transition-opacity`}>
                              {inv.status} ▾
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36 rounded-xl">
                          {['Paid', 'Unpaid', 'Partial'].map((s) => (
                            <DropdownMenuItem 
                              key={s} 
                              onClick={() => openStatusModal(inv, s)} 
                              className={`cursor-pointer text-xs font-medium ${inv.status === s ? 'bg-slate-100 font-bold' : ''}`}
                            >
                              <Badge variant="outline" className={`rounded-full mr-2 ${statusStyles[s]}`}>
                                {s}
                              </Badge>
                              {inv.status === s && '✓'}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {inv.status === "Unpaid" ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="outline" className="rounded-full bg-slate-100 border-slate-200 text-[10px] text-slate-800 font-semibold px-2 py-0.5">
                          {inv.paymentMethod || "Cash"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100" 
                          onClick={() => previewOne(inv)}
                          title="Preview PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100" 
                          onClick={() => downloadOne(inv)}
                          title="Download PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50" 
                          onClick={() => shareWA(inv)}
                          title="Share WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50" 
                          onClick={() => deleteOne(inv)}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>


      {/* ====== Status Update Modal ====== */}
      <Dialog open={statusModal} onOpenChange={setStatusModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Update Status → <Badge variant="outline" className={`rounded-full ml-1 ${statusStyles[newStatus]}`}>{newStatus}</Badge>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {statusTarget?.invoiceNumber} · {statusTarget?.partyName || statusTarget?.party} · {fmt(statusTarget?.grandTotal || statusTarget?.amount || 0)}
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Received Amount (only for Partial) */}
            {newStatus === "Partial" && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Received Amount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  max={statusTarget?.grandTotal || statusTarget?.amount || 0}
                  value={modalReceivedAmount}
                  onChange={(e) => setModalReceivedAmount(Number(e.target.value) || 0)}
                  className="h-9 rounded-xl"
                />
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Payment Method</label>
              <select
                value={modalPaymentMethod}
                onChange={(e) => setModalPaymentMethod(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Online Fields */}
            {modalPaymentMethod === "Online" && (
              <div className="space-y-3 pt-2 border-t border-dashed">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">UPI ID</label>
                    <Input
                      value={modalPaymentDetails.transactionId}
                      onChange={(e) => {
                        setModalPaymentDetails({ ...modalPaymentDetails, transactionId: e.target.value });
                        if (validateUpi(e.target.value)) setModalErrors(p => ({ ...p, upi: "" }));
                      }}
                      placeholder="e.g. name@okhdfcbank"
                      maxLength={45}
                      className={`h-9 rounded-xl text-xs ${modalErrors.upi ? 'border-red-500' : ''}`}
                    />
                    {modalErrors.upi && <span className="text-[10px] text-red-500 mt-1 block">{modalErrors.upi}</span>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">UTR Number</label>
                    <Input
                      value={modalPaymentDetails.utr}
                      onChange={(e) => {
                        setModalPaymentDetails({ ...modalPaymentDetails, utr: e.target.value });
                        if (validateUtr(e.target.value)) setModalErrors(p => ({ ...p, utr: "" }));
                      }}
                      placeholder="e.g. 123456789012"
                      maxLength={22}
                      className={`h-9 rounded-xl text-xs ${modalErrors.utr ? 'border-red-500' : ''}`}
                    />
                    {modalErrors.utr && <span className="text-[10px] text-red-500 mt-1 block">{modalErrors.utr}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Fields */}
            {modalPaymentMethod === "Bank Transfer" && (
              <div className="space-y-3 pt-2 border-t border-dashed">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Bank Name</label>
                    <Input
                      value={modalPaymentDetails.bankName}
                      onChange={(e) => setModalPaymentDetails({ ...modalPaymentDetails, bankName: e.target.value })}
                      placeholder="HDFC / SBI"
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Account No.</label>
                    <Input
                      value={modalPaymentDetails.accountNumber}
                      onChange={(e) => setModalPaymentDetails({ ...modalPaymentDetails, accountNumber: e.target.value })}
                      placeholder="987654321012"
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">IFSC Code</label>
                    <Input
                      value={modalPaymentDetails.ifsc}
                      onChange={(e) => setModalPaymentDetails({ ...modalPaymentDetails, ifsc: e.target.value })}
                      placeholder="HDFC0001234"
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setStatusModal(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600" onClick={handleModalSubmit}>
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== Invoice Template Preview Modal ====== */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
            <div>
              <DialogTitle className="text-lg font-bold">
                Invoice Preview — {selectedPreviewInv?.invoiceNumber}
              </DialogTitle>
              <DialogDescription className="sr-only">Invoice details preview and PDF export</DialogDescription>
            </div>
            {selectedPreviewInv && (
              <Button 
                size="sm" 
                onClick={() => printInvoiceHtml()} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium px-4 mr-6"
              >
                <FileDown className="mr-1.5 h-4 w-4" /> Print / Save PDF
              </Button>
            )}
          </DialogHeader>
          <div className="pt-4 flex justify-center bg-slate-100 p-4 rounded-xl overflow-x-auto">
            {selectedPreviewInv && (
              <div id="invoice-print-area" className="w-full max-w-3xl bg-white p-4 rounded-xl shadow-sm">
                <InvoiceTemplateRenderer 
                  invoice={selectedPreviewInv} 
                  templateName={selectedPreviewInv.invoiceTemplate || selectedPreviewInv.templateName || "GST Boxed"} 
                  printSettings={{
                    printCompanyName: true,
                    companyName: selectedPreviewInv.sellerDetails?.companyName || user?.businessName,
                    printAddress: true,
                    address: selectedPreviewInv.sellerDetails?.address || user?.businessAddress,
                    printPhone: true,
                    phone: selectedPreviewInv.sellerDetails?.phone || user?.phone,
                    printEmail: true,
                    email: selectedPreviewInv.sellerDetails?.email || user?.email,
                    printGstin: true,
                    logoUrl: selectedPreviewInv.sellerDetails?.logoUrl || "",
                    currentBalanceParty: true,
                    printTermsAndConditions: true,
                    amountInWords: "Rupees",
                    ...selectedPreviewInv.printSettings
                  }}
                  gstSettings={{
                    gstin: selectedPreviewInv.sellerDetails?.gstin || ""
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Offscreen Container for Instant 100% Exact PDF Download */}
      {selectedPreviewInv && !previewModalOpen && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, width: "800px", background: "#ffffff", zIndex: -9999 }} aria-hidden="true">
          <div id="invoice-print-area" className="w-full bg-white p-4">
            <InvoiceTemplateRenderer 
              invoice={selectedPreviewInv} 
              templateName={selectedPreviewInv.invoiceTemplate || selectedPreviewInv.templateName || "GST Boxed"} 
              printSettings={{
                printCompanyName: true,
                companyName: selectedPreviewInv.sellerDetails?.companyName || user?.businessName,
                printAddress: true,
                address: selectedPreviewInv.sellerDetails?.address || user?.businessAddress,
                printPhone: true,
                phone: selectedPreviewInv.sellerDetails?.phone || user?.phone,
                printEmail: true,
                email: selectedPreviewInv.sellerDetails?.email || user?.email,
                printGstin: true,
                logoUrl: selectedPreviewInv.sellerDetails?.logoUrl || "",
                currentBalanceParty: true,
                printTermsAndConditions: true,
                amountInWords: "Rupees",
                ...selectedPreviewInv.printSettings
              }}
              gstSettings={{
                gstin: selectedPreviewInv.sellerDetails?.gstin || ""
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
