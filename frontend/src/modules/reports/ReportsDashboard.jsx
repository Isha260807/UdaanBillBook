import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Download, FileText, TrendingUp, Receipt, PieChart as PieIcon,
  Search, ChevronDown, ChevronRight, Eye, FileSpreadsheet,
  ShoppingCart, Users, FileCheck, Package, BarChart3,
  ArrowUpDown, IndianRupee, CreditCard, Truck, Calculator,
  CalendarDays, Filter, Crown, BookOpen, Landmark, Wallet,
  ClipboardList, FileBarChart, ShieldCheck, ReceiptText,
} from "lucide-react";
import { toast } from "sonner";
import { useInvoices } from "@/contexts/InvoiceContext";
import api from "@/lib/api";

const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN");
const pieColors = ["#10b981", "#3b82f6", "#f59e0b", "#94a3b8"];

// ─── Report Categories Definition ───────────────────────────────────────
const reportCategories = [
  {
    id: "transaction",
    title: "Transaction Reports",
    icon: ReceiptText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/40",
    reports: [
      { name: "Sale Report", description: "Detailed sales transactions with party, item & tax breakdowns", icon: ShoppingCart },
      { name: "Purchase Report", description: "All purchase entries with supplier and cost details", icon: Truck },
      { name: "Day Book", description: "Complete daily transaction log across all categories", icon: BookOpen },
      { name: "Cash Flow Statement", description: "Track money inflows and outflows over time", icon: ArrowUpDown },
      { name: "Estimate / Quotation Report", description: "List all estimates and quotations with status", icon: ClipboardList },
      { name: "Delivery Challan Report", description: "Track all delivery challans and goods dispatched", icon: FileCheck },
      { name: "Credit Note Report", description: "All credit notes issued with amounts and reasons", icon: CreditCard },
      { name: "Debit Note Report", description: "All debit notes raised with details", icon: CreditCard },
    ],
  },
  {
    id: "party",
    title: "Party Reports",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
    reports: [
      { name: "Party Statement", description: "Ledger of transactions for a specific customer/supplier", icon: FileText },
      { name: "All Parties Report", description: "Summary of all parties with balances and activity", icon: Users },
      { name: "Party wise Profit & Loss", description: "Profit or loss breakdown per individual party", icon: TrendingUp },
      { name: "Receivable Report", description: "Amounts receivable from customers with aging", icon: IndianRupee },
      { name: "Payable Report", description: "Amounts payable to suppliers with due dates", icon: Wallet },
    ],
  },
  {
    id: "gst",
    title: "GST Reports",
    icon: ShieldCheck,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/40",
    reports: [
      { name: "GSTR-1 Report", description: "Outward supplies – All sales transactions for GST filing", icon: FileBarChart },
      { name: "GSTR-2 Report", description: "Inward supplies – All purchase data for return matching", icon: FileBarChart },
      { name: "GSTR-3B Summary", description: "Consolidated monthly summary of input/output tax", icon: Calculator },
      { name: "GSTR-9 Annual Return", description: "Yearly consolidated GST return data", icon: FileBarChart, premium: true },
      { name: "Sale Summary by HSN/SAC", description: "Sales grouped by HSN/SAC codes with tax breakup", icon: ClipboardList },
      { name: "Purchase Summary by HSN/SAC", description: "Purchase grouped by HSN/SAC codes with tax breakup", icon: ClipboardList },
    ],
  },
  {
    id: "stock",
    title: "Item / Stock Reports",
    icon: Package,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800/40",
    reports: [
      { name: "Stock Summary", description: "Current stock levels, value and movement overview", icon: Package },
      { name: "Item Report", description: "All items with sale/purchase history and quantities", icon: FileText },
      { name: "Item wise Profit & Loss", description: "Profit margin analysis for each product/service", icon: TrendingUp },
      { name: "Low Stock Summary", description: "Items below minimum stock threshold – reorder alerts", icon: Package },
      { name: "Stock Detail Report", description: "Detailed stock-in / stock-out history per item", icon: ArrowUpDown },
      { name: "Item Rate List", description: "Complete price list of all products/services", icon: IndianRupee },
    ],
  },
  {
    id: "business",
    title: "Business Status",
    icon: BarChart3,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/40",
    reports: [
      { name: "Profit & Loss Statement", description: "Complete revenue vs expenses breakdown over a period", icon: TrendingUp },
      { name: "Balance Sheet", description: "Assets, liabilities and equity snapshot of the business", icon: Landmark },
      { name: "Expense Report", description: "All business expenses categorized by type", icon: Wallet },
      { name: "Expense Category Report", description: "Spending breakdown across different expense categories", icon: PieIcon },
      { name: "Bank Statement", description: "Reconciled bank transaction history", icon: Landmark, premium: true },
    ],
  },
];

// ─── Individual Report Row ──────────────────────────────────────────────
function ReportRow({ report, handleAction }) {
  const Icon = report.icon;
  return (
    <div className="group flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-1.5 py-2.5 sm:px-3 sm:py-3 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm">
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-background transition-colors">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{report.name}</p>
          {report.premium && (
            <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{report.description}</p>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] rounded-lg hover:bg-primary/10 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            handleAction(report.name, "View");
          }}
          disabled={report.premium}
        >
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] rounded-lg hover:bg-red-500/10 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleAction(report.name, "PDF");
          }}
          disabled={report.premium}
        >
          <FileText className="h-3 w-3 mr-1" /> PDF
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600"
          onClick={(e) => {
            e.stopPropagation();
            handleAction(report.name, "Excel");
          }}
          disabled={report.premium}
        >
          <FileSpreadsheet className="h-3 w-3 mr-1" /> Excel
        </Button>
      </div>
      {/* Mobile action buttons */}
      <div className="flex items-center gap-1 shrink-0 sm:hidden">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            handleAction(report.name, "View");
          }}
          disabled={report.premium}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            handleAction(report.name, "PDF");
          }}
          disabled={report.premium}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Report Category Section ────────────────────────────────────────────
function ReportCategorySection({ category, isExpanded, onToggle, searchQuery, handleAction }) {
  const Icon = category.icon;

  const filteredReports = searchQuery
    ? category.reports.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : category.reports;

  if (searchQuery && filteredReports.length === 0) return null;

  return (
    <Card className={`bg-transparent md:bg-white border-0 md:border md:shadow-sm shadow-none transition-all duration-300 overflow-hidden ${category.borderColor}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 sm:gap-3 px-0 md:px-5 py-3 md:py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${category.bgColor}`}>
          <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${category.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-foreground truncate">{category.title}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full text-[9px] sm:text-[10px] font-bold mr-1 md:mr-2">
          {filteredReports.length}
        </Badge>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
      </button>

      {isExpanded && (
        <div className="px-0 md:px-3 pb-3 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
          <Separator className="mb-2 hidden md:block" />
          {filteredReports.map((report) => (
            <ReportRow key={report.name} report={report} handleAction={handleAction} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Main Reports Dashboard ─────────────────────────────────────────────
export function ReportsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({
    transaction: true,
    party: false,
    gst: false,
    stock: false,
    business: false,
  });
  const [showInsights, setShowInsights] = useState(false);
  const { invoices, refreshInvoices } = useInvoices();
  const [expenses, setExpenses] = useState([]);
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      refreshInvoices();
      
      try {
        const res = await api.get('/expenses');
        setExpenses(res.data || []);
      } catch (err) {
        console.error("Error loading expenses:", err);
      }

      try {
        const res = await api.get('/parties');
        setParties(res.data || []);
      } catch (err) {
        console.error("Error loading parties:", err);
      }

      try {
        const res = await api.get('/items');
        setItems(res.data || []);
      } catch (err) {
        console.error("Error loading items:", err);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isAllExpanded = useMemo(() => {
    return reportCategories.every((c) => expandedCategories[c.id]);
  }, [expandedCategories]);

  const expandAll = () => {
    const allExpanded = {};
    reportCategories.forEach((c) => (allExpanded[c.id] = true));
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed = {};
    reportCategories.forEach((c) => (allCollapsed[c.id] = false));
    setExpandedCategories(allCollapsed);
  };

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  // Total reports count
  const totalReports = reportCategories.reduce((acc, c) => acc + c.reports.length, 0);

  // If searching, auto expand all categories
  const effectiveExpanded = searchQuery
    ? Object.fromEntries(reportCategories.map((c) => [c.id, true]))
    : expandedCategories;

  // Real data computations
  const salesVal = useMemo(() => {
    return invoices.filter(i => i.type === "Sale").reduce((sum, i) => sum + (i.grandTotal || i.amount || 0), 0);
  }, [invoices]);

  const purchaseVal = useMemo(() => {
    return invoices.filter(i => i.type === "Purchase").reduce((sum, i) => sum + (i.grandTotal || i.amount || 0), 0);
  }, [invoices]);

  const expensesVal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const profitVal = useMemo(() => {
    return salesVal - purchaseVal - expensesVal;
  }, [salesVal, purchaseVal, expensesVal]);
  
  const gstPayableVal = useMemo(() => {
    const salesGst = invoices.filter(i => i.type === "Sale").reduce((sum, i) => sum + (i.gstAmount || 0), 0);
    const purchaseGst = invoices.filter(i => i.type === "Purchase").reduce((sum, i) => sum + (i.gstAmount || 0), 0);
    return Math.max(0, salesGst - purchaseGst);
  }, [invoices]);

  const dynamicMonthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({
        monthName: months[d.getMonth()],
        year: d.getFullYear(),
        sales: 0,
        expense: 0,
        profit: 0
      });
    }

    invoices.forEach(inv => {
      const invDate = new Date(inv.dateRaw || inv.date);
      const invMonthName = months[invDate.getMonth()];
      const invYear = invDate.getFullYear();
      const match = last6.find(l => l.monthName === invMonthName && l.year === invYear);
      if (match) {
        if (inv.type === "Sale") {
          match.sales += (inv.grandTotal || 0);
          match.profit += ((inv.grandTotal || 0) - (inv.taxableAmount || 0));
        } else if (inv.type === "Purchase") {
          match.expense += (inv.grandTotal || 0);
        }
      }
    });

    return last6.map(l => ({
      m: l.monthName,
      sales: l.sales,
      expense: l.expense,
      profit: l.sales - l.expense
    }));
  }, [invoices]);

  const dynamicGstSplit = useMemo(() => {
    let cgst = 0, sgst = 0, igst = 0;
    invoices.filter(i => i.type === "Sale").forEach(inv => {
      const amt = inv.gstAmount || 0;
      cgst += amt / 2;
      sgst += amt / 2;
    });

    return [
      { name: "CGST 9%", value: cgst },
      { name: "SGST 9%", value: sgst },
      { name: "IGST 18%", value: igst }
    ].filter(item => item.value > 0);
  }, [invoices]);

  // Helper to format values to 2 decimal places for numeric amounts
  const fmtNum = (v) => typeof v === 'number' ? v.toFixed(2) : (v ?? "—");

  // ─── Dynamic Live Report Generator ─────────────────────────────────────
  const generateReportData = (reportName) => {
    const nameLower = reportName.toLowerCase();
    let headers = [];
    let rows = [];

    if (nameLower.includes("sale report") || nameLower.includes("gstr-1")) {
      headers = ["Date", "Invoice No", "Customer", "Taxable Value (₹)", "GST Amount (₹)", "Total (₹)", "Status"];
      rows = invoices.filter(i => i.type === "Sale").map(i => [
        new Date(i.date).toLocaleDateString("en-IN"),
        i.invoiceNumber || "-",
        i.partyName || "Walk-in Customer",
        fmtNum(i.taxableAmount),
        fmtNum(i.gstAmount),
        fmtNum(i.grandTotal),
        i.status || i.paymentStatus || "Paid"
      ]);
    } 
    else if (nameLower.includes("purchase report") || nameLower.includes("gstr-2")) {
      headers = ["Date", "Purchase No", "Supplier", "Taxable Value (₹)", "GST Amount (₹)", "Total (₹)", "Status"];
      rows = invoices.filter(i => i.type === "Purchase").map(i => [
        new Date(i.date).toLocaleDateString("en-IN"),
        i.invoiceNumber || "-",
        i.partyName || "Supplier",
        fmtNum(i.taxableAmount),
        fmtNum(i.gstAmount),
        fmtNum(i.grandTotal),
        i.status || i.paymentStatus || "Paid"
      ]);
    } 
    else if (nameLower.includes("day book")) {
      headers = ["Date", "Type / Voucher No", "Party", "Taxable (₹)", "GST (₹)", "Total (₹)"];
      const allTxns = [
        ...invoices.map(i => ({ date: i.date, type: `${i.type} / ${i.invoiceNumber}`, party: i.partyName, taxable: i.taxableAmount, gst: i.gstAmount, total: i.grandTotal })),
        ...expenses.map(e => ({ date: e.date, type: `Expense / ${e.category || "General"}`, party: "N/A", taxable: e.amount, gst: 0, total: e.amount }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      rows = allTxns.map(t => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.type,
        t.party,
        fmtNum(t.taxable),
        fmtNum(t.gst),
        fmtNum(t.total)
      ]);
    } 
    else if (nameLower.includes("cash flow")) {
      headers = ["Date", "Description", "Inflow (₹)", "Outflow (₹)"];
      rows = [
        ...invoices.filter(i => i.type === "Sale").map(i => [new Date(i.date).toLocaleDateString("en-IN"), `Sale Invoice ${i.invoiceNumber}`, fmtNum(i.receivedAmount || i.grandTotal), "0.00"]),
        ...invoices.filter(i => i.type === "Purchase").map(i => [new Date(i.date).toLocaleDateString("en-IN"), `Purchase Bill ${i.invoiceNumber}`, "0.00", fmtNum(i.grandTotal)]),
        ...expenses.map(e => [new Date(e.date).toLocaleDateString("en-IN"), `Expense: ${e.title || "General"}`, "0.00", fmtNum(e.amount)])
      ];
    } 
    else if (nameLower.includes("all parties")) {
      headers = ["Party Name", "Type", "Mobile", "GSTIN", "Opening Balance (₹)"];
      rows = parties.map(p => [
        p.name,
        p.type || "Customer",
        p.phone || "N/A",
        p.gstin || "N/A",
        fmtNum(p.openingBalance || p.balance || 0)
      ]);
    } 
    else if (nameLower.includes("stock summary") || nameLower.includes("low stock")) {
      headers = ["Item Name", "HSN/SAC", "Sale Price (₹)", "Purchase Price (₹)", "Stock Quantity", "Min Threshold"];
      let stockItems = items;
      if (nameLower.includes("low stock")) {
        stockItems = items.filter(item => (item.stock || 0) <= (item.minStock || 5));
      }
      rows = stockItems.map(item => [
        item.name,
        item.hsnSac || "N/A",
        fmtNum(item.salePrice || 0),
        fmtNum(item.purchasePrice || 0),
        item.stock || 0,
        item.minStock || 5
      ]);
    }
    else if (nameLower.includes("delivery challan")) {
      headers = ["Challan Date", "Challan No", "Customer / Consignee", "Dispatch Status", "Vehicle / Transport", "Total Goods Value (₹)"];
      const challans = invoices.filter(i => i.type === "Delivery Challan" || i.documentType === "Delivery Challan" || i.challanNumber || i.isChallan);
      rows = challans.map(c => [
        new Date(c.date).toLocaleDateString("en-IN"),
        c.challanNumber || c.invoiceNumber || "DC-001",
        c.partyName || "Walk-in Consignee",
        c.status || "Dispatched",
        c.vehicleNumber || c.transportMode || "Road Freight",
        fmtNum(c.grandTotal || c.totalAmount || 0)
      ]);
    }
    else if (nameLower.includes("estimate") || nameLower.includes("quotation")) {
      headers = ["Quotation Date", "Quotation No", "Customer Name", "Status", "Taxable (₹)", "Total Amount (₹)"];
      const estimates = invoices.filter(i => i.type === "Estimate" || i.type === "Quotation" || i.documentType === "Quotation");
      rows = estimates.map(e => [
        new Date(e.date).toLocaleDateString("en-IN"),
        e.invoiceNumber || "EST-001",
        e.partyName || "Customer",
        e.status || "Active",
        fmtNum(e.taxableAmount || 0),
        fmtNum(e.grandTotal || 0)
      ]);
    }
    else if (nameLower.includes("credit note")) {
      headers = ["Note Date", "Credit Note No", "Original Invoice", "Customer Name", "Reason", "Refund Amount (₹)"];
      const creditNotes = invoices.filter(i => i.type === "Credit Note" || i.type === "Sale Return");
      rows = creditNotes.map(cn => [
        new Date(cn.date).toLocaleDateString("en-IN"),
        cn.invoiceNumber || "CN-001",
        cn.originalInvoiceNumber || "INV-001",
        cn.partyName || "Customer",
        cn.reason || cn.notes || "Goods Return",
        fmtNum(cn.grandTotal || 0)
      ]);
    }
    else if (nameLower.includes("debit note")) {
      headers = ["Note Date", "Debit Note No", "Original Purchase", "Supplier Name", "Reason", "Debit Amount (₹)"];
      const debitNotes = invoices.filter(i => i.type === "Debit Note" || i.type === "Purchase Return");
      rows = debitNotes.map(dn => [
        new Date(dn.date).toLocaleDateString("en-IN"),
        dn.invoiceNumber || "DN-001",
        dn.originalInvoiceNumber || "PUR-001",
        dn.partyName || "Supplier",
        dn.reason || dn.notes || "Purchase Return",
        fmtNum(dn.grandTotal || 0)
      ]);
    }
    else if (nameLower.includes("receivable")) {
      headers = ["Customer Name", "Mobile Phone", "GSTIN", "Aging Period", "Receivable Amount (₹)"];
      const recParties = parties.filter(p => (p.balanceType === "To Receive" || p.balanceType === "Receivable") && (p.balance || p.openingBalance || 0) > 0);
      rows = recParties.map(p => [
        p.name || "Customer",
        p.phone || "N/A",
        p.gstin || "N/A",
        "0 - 30 Days",
        fmtNum(p.balance || p.openingBalance || 0)
      ]);
    }
    else if (nameLower.includes("payable")) {
      headers = ["Supplier Name", "Mobile Phone", "GSTIN", "Payment Due Date", "Payable Amount (₹)"];
      const payParties = parties.filter(p => (p.balanceType === "To Pay" || p.balanceType === "Payable") && (p.balance || p.openingBalance || 0) > 0);
      rows = payParties.map(p => [
        p.name || "Supplier",
        p.phone || "N/A",
        p.gstin || "N/A",
        "Immediate",
        fmtNum(p.balance || p.openingBalance || 0)
      ]);
    }
    else if (nameLower.includes("expense")) {
      headers = ["Date", "Expense Category", "Title / Notes", "Payment Mode", "Amount (₹)"];
      rows = expenses.map(e => [
        e.date ? new Date(e.date).toLocaleDateString("en-IN") : "-",
        e.category || "General",
        e.title || e.notes || "-",
        e.mode || "Cash",
        fmtNum(e.amount)
      ]);
    } 
    else {
      headers = ["Date", "Voucher / Ref No", "Description", "Type", "Amount (₹)"];
      rows = invoices.map(i => [
        new Date(i.date).toLocaleDateString("en-IN"),
        i.invoiceNumber || "-",
        `${i.type} Invoice — ${i.partyName || "General"}`,
        i.type || "Invoice",
        fmtNum(i.grandTotal)
      ]);
    }
    return { headers, rows };
  };

  const handleAction = (reportName, action) => {
    toast.success(`${action} — ${reportName}`, {
      description: `Generating live report data...`,
    });

    const { headers, rows } = generateReportData(reportName);

    if (action === "View") {
      const tableHeaders = headers.map(h => `<th>${h}</th>`).join("");
      const tableRows = rows.map(r => `<tr>${r.map(val => `<td>${val}</td>`).join("")}</tr>`).join("");
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${reportName} — UdaanBillBook</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; background-color: #f8fafc; color: #1e293b; }
            h2 { color: #10b981; font-weight: 800; margin-bottom: 5px; }
            p.subtitle { color: #64748b; font-size: 13px; margin-bottom: 25px; }
            table { border-collapse: collapse; width: 100%; max-width: 1050px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
            th { background-color: #f8fafc; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
            td { font-size: 13px; color: #334155; }
            tr:last-child td { border-bottom: none; }
            tr:hover td { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>${reportName}</h2>
          <p class="subtitle">Generated dynamically from live database records on ${new Date().toLocaleString('en-IN')}</p>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows.length > 0 ? tableRows : `<tr><td colspan="${headers.length}" style="text-align: center; color: #94a3b8; padding: 40px 0;">No records found in database</td></tr>`}</tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } 
    else if (action === "Excel") {
      const csvContent = [
        `Report: ${reportName}`,
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        "",
        headers.join(","),
        ...rows.map(r => r.map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(","))
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportName.replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } 
    else if (action === "PDF") {
      try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(16, 185, 129);
        doc.text(`UdaanBillBook — ${reportName}`, 14, 18);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')} | Total Entries: ${rows.length}`, 14, 25);

        autoTable(doc, {
          startY: 30,
          head: [headers],
          body: rows.length > 0 ? rows : [["No records found", "-", "-", "-", "-", "-"]],
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8 }
        });

        const fileDate = new Date().toISOString().split("T")[0];
        doc.save(`${reportName.replace(/\s+/g, "_")}_${fileDate}.pdf`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to generate PDF");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Report aggregates...</div>;

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      <PageHeader
        title="Reports"
        subtitle={`${totalReports} reports across ${reportCategories.length} categories — Generate, view & export`}
        actions={
          <div className="flex w-full flex-nowrap items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none px-2 rounded-xl h-8 text-[11px] sm:px-4 sm:h-9 sm:text-xs"
              onClick={() => setShowInsights(!showInsights)}
            >
              <BarChart3 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              {showInsights ? "Hide" : "Show"} Insights
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] sm:px-4 sm:h-9 sm:text-xs text-white" onClick={toggleExpandAll}>
              <FileText className="mr-1 h-3.5 w-3.5" />
              {isAllExpanded ? "Collapse" : "Expand"} All
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 animate-in fade-in duration-200">
        {[
          { label: "Sales Report", value: fmt(salesVal), icon: TrendingUp, tint: "bg-primary-soft text-primary", trend: "Sales" },
          { label: "Purchase Report", value: fmt(purchaseVal), icon: ShoppingCart, tint: "bg-blue-50 text-blue-600", trend: "Purchases" },
          { label: "Profit / Loss", value: fmt(profitVal), icon: Receipt, tint: "bg-success-soft text-success", trend: "P&L" },
          { label: "GST Payable", value: fmt(gstPayableVal), icon: PieIcon, tint: "bg-accent-soft text-accent-foreground", trend: "GST" },
        ].map((r) => (
          <Card key={r.label} className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl ${r.tint}`}>
                  <r.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <Badge variant="secondary" className="rounded-full text-[9px] sm:text-[10px] px-1.5 py-0">{r.trend}</Badge>
              </div>
              <p className="mt-3.5 sm:mt-4 text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{r.label}</p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-2xl font-bold truncate">{r.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Insights (collapsible charts at top) ────────────────────── */}
      {showInsights && (
        <div className="space-y-4 animate-in slide-in-from-top-3 duration-300 bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">Quick Insights & Business Trends</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border shadow-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Profit & Revenue Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="m" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">GST Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicGstSplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={4}
                      >
                        {dynamicGstSplit.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} />
                      <Legend fontSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Search & Filter Bar ────────────────────────────────────── */}
      <Card className="bg-transparent md:bg-white border-0 md:border md:shadow-sm shadow-none rounded-xl">
        <CardContent className="py-0 md:py-3 px-0 md:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={typeof window !== "undefined" && window.innerWidth < 640 ? "Search reports..." : "Search reports... (e.g. GSTR, stock, profit)"}
                className="pl-9 h-10 rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs text-muted-foreground px-2"
                onClick={collapseAll}
              >
                Collapse All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs text-muted-foreground px-2"
                onClick={expandAll}
              >
                Expand All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Report Categories ──────────────────────────────────────── */}
      <div className="space-y-4">
        {reportCategories.map((category) => (
          <ReportCategorySection
            key={category.id}
            category={category}
            isExpanded={effectiveExpanded[category.id]}
            onToggle={() => toggleCategory(category.id)}
            searchQuery={searchQuery}
            handleAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}
