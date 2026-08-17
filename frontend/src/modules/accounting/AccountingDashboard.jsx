import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Calculator, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Building2, 
  History,
  FileText,
  Download,
  Plus,
  ArrowRightLeft,
  Calendar,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  TrendingUp,
  Receipt,
  UserCheck,
  TrendingDown,
  Printer,
  ChevronRight,
  Eye,
  Trash2,
  Edit2,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import api from "@/lib/api";
import { useMockAuth } from "@/lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Format currency
const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN");

export function AccountingDashboard() {
  const { user } = useMockAuth();
  const userName = user?.name || "Demo Admin";
  
  // Navigation tabs synced with URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
  
  // States for dynamic data fetching
  const [accountingData, setAccountingData] = useState(null);
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState({
    dateRange: "all",
    mode: "all",
    type: "all",
    party: "all"
  });

  // Modal / Dialog States
  const [contraForm, setContraForm] = useState({ from: "Cash", to: "HDFC", amount: "", description: "" });
  const [journalForm, setJournalForm] = useState({ debitAcc: "Cash", creditAcc: "HDFC", amount: "", narration: "" });
  const [receiptForm, setReceiptForm] = useState({ partyId: "", partyName: "", amount: "", mode: "Cash", ref: "", notes: "" });
  const [paymentForm, setPaymentForm] = useState({ partyId: "", partyName: "", amount: "", mode: "Cash", ref: "", notes: "", category: "Supplier" });

  // Custom Modal States for Opening Balance and Add Bank
  const [isOpBalModalOpen, setIsOpBalModalOpen] = useState(false);
  const [opBalInput, setOpBalInput] = useState("");
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankBal, setNewBankBal] = useState("");

  const [localLogs, setLocalLogs] = useState([]);
  const [bankBalances, setBankBalances] = useState({
    HDFC: 0,
    SBI: 0,
    ICICI: 0,
    Axis: 0,
    Wallet: 0
  });

  const [openingBalance, setOpeningBalance] = useState(0);

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, partiesRes, invRes] = await Promise.all([
        api.get('/reports/accounting'),
        api.get('/parties'),
        api.get('/invoices')
      ]);
      setAccountingData(accRes.data);
      setParties(partiesRes.data || []);
      setInvoices(invRes.data || []);

      if (accRes.data?.openingBalance !== undefined) {
        setOpeningBalance(accRes.data.openingBalance);
      }

      if (accRes.data?.banks || accRes.data?.customBanks) {
        setBankBalances(prev => {
          const defaultBanks = { HDFC: 0, SBI: 0, ICICI: 0, Axis: 0, Wallet: 0 };
          if (accRes.data.customBanks) {
            accRes.data.customBanks.forEach(bName => {
              defaultBanks[bName] = 0;
            });
          }
          if (accRes.data.banks) {
            Object.keys(accRes.data.banks).forEach(bName => {
              defaultBanks[bName] = accRes.data.banks[bName];
            });
          }
          return defaultBanks;
        });
      }

      if (accRes.data?.journals) {
        const dbJournals = accRes.data.journals.map(j => ({
          id: j.id,
          date: j.date,
          voucher: j.voucher,
          type: "Journal",
          party: "Adjustment entry",
          description: j.narration || `Debit: ${j.debitAcc} / Credit: ${j.creditAcc}`,
          debit: j.amount,
          credit: j.amount,
          mode: "Journal",
          createdBy: "System"
        }));
        setLocalLogs(dbJournals);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Safe date helper to prevent RangeError with invalid dates
  const parseDate = (val) => {
    if (!val) return new Date();
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDate = (val) => {
    try {
      const d = parseDate(val);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return "General";
    }
  };

  const formatTime = (val) => {
    try {
      const d = parseDate(val);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  // Compute stats and merge DB and Local Logs
  const combinedEntries = useMemo(() => {
    if (!accountingData) return [];
    
    // DB entries
    const dbEntries = accountingData.entries.map((e, idx) => {
      const parsedDate = parseDate(e.date);
      return {
        id: `db-${idx}`,
        date: formatDate(e.date),
        dateRaw: parsedDate,
        voucher: `VCH-DB-${idx + 1001}`,
        type: e.type === "IN" ? "Receipt" : "Payment",
        party: e.party || "General",
        description: e.desc || "Invoice / Payment record",
        debit: e.type === "IN" ? e.amount : 0,
        credit: e.type === "OUT" ? e.amount : 0,
        mode: e.mode || "Cash",
        createdBy: "System",
        status: "Cleared",
        createdTime: formatTime(e.date)
      };
    });

    // Local manual entries (filtered to avoid duplicate entries synced with DB)
    const localEntries = localLogs
      .filter((l) => {
        const amt = l.debit || l.credit || 0;
        return !dbEntries.some(
          (db) => db.party === l.party && (db.debit === amt || db.credit === amt) && db.mode === l.mode
        );
      })
      .map((l) => {
        const parsedDate = parseDate(l.date);
        return {
          id: l.id,
          date: formatDate(l.date),
          dateRaw: parsedDate,
          voucher: l.voucher,
          type: l.type,
          party: l.party || "General",
          description: l.description || "",
          debit: l.debit || 0,
          credit: l.credit || 0,
          mode: l.mode || "Cash",
          createdBy: l.createdBy || userName,
          status: "Cleared",
          createdTime: formatTime(l.date)
        };
      });

    // Sort by date descending
    const all = [...dbEntries, ...localEntries].sort((a, b) => b.dateRaw - a.dateRaw);

    // Compute running balance
    let currentBal = openingBalance;
    const sortedChronological = [...all].reverse();
    const finalWithRunning = sortedChronological.map((item) => {
      currentBal += (item.debit - item.credit);
      return { ...item, runningBalance: currentBal };
    });

    return finalWithRunning.reverse();
  }, [accountingData, localLogs, openingBalance, userName]);

  // Filters application
  const filteredEntries = useMemo(() => {
    return combinedEntries.filter((e) => {
      // Global Search
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        const match = 
          e.party.toLowerCase().includes(query) ||
          e.voucher.toLowerCase().includes(query) ||
          (e.description || "").toLowerCase().includes(query) ||
          e.debit.toString().includes(query) ||
          e.credit.toString().includes(query) ||
          e.mode.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Date Range Filter
      if (ledgerFilter.dateRange !== "all") {
        const today = new Date();
        const diffDays = (today - e.dateRaw) / (1000 * 60 * 60 * 24);
        if (ledgerFilter.dateRange === "today" && diffDays > 1) return false;
        if (ledgerFilter.dateRange === "yesterday" && (diffDays < 1 || diffDays > 2)) return false;
        if (ledgerFilter.dateRange === "week" && diffDays > 7) return false;
        if (ledgerFilter.dateRange === "month" && diffDays > 30) return false;
      }

      // Mode Filter
      if (ledgerFilter.mode !== "all") {
        if (e.mode.toLowerCase() !== ledgerFilter.mode.toLowerCase()) return false;
      }

      // Type Filter
      if (ledgerFilter.type !== "all") {
        const t = e.type.toLowerCase();
        if (ledgerFilter.type === "sales" && t !== "receipt" && !e.description.toLowerCase().includes("sale")) return false;
        if (ledgerFilter.type === "purchase" && t !== "payment" && !e.description.toLowerCase().includes("purchase")) return false;
        if (ledgerFilter.type === "receipt" && t !== "receipt") return false;
        if (ledgerFilter.type === "payment" && t !== "payment") return false;
      }

      // Party Filter
      if (ledgerFilter.party !== "all") {
        if (e.party.toLowerCase() !== ledgerFilter.party.toLowerCase()) return false;
      }

      return true;
    });
  }, [combinedEntries, globalSearch, ledgerFilter]);

  // Stats Calculations
  const stats = useMemo(() => {
    if (!accountingData) return {
      cashInHand: 0,
      bankBalance: 0,
      receivables: 0,
      payables: 0,
      todayCollection: 0,
      todayExpense: 0,
      monthlySales: 0,
      monthlyPurchase: 0,
      monthlyProfit: 0
    };

    const cashInHand = accountingData.cashInHand;
    const bankBalance = accountingData.bankBalance + Object.values(bankBalances).reduce((a, b) => a + b, 0);
    const receivables = accountingData.receivables;
    const payables = accountingData.payables;

    // Filter today's transactions
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const todayCollection = combinedEntries
      .filter(e => e.date && e.date.includes(todayStr) && e.debit > 0)
      .reduce((sum, e) => sum + e.debit, 0);

    const todayExpense = combinedEntries
      .filter(e => e.date && e.date.includes(todayStr) && e.credit > 0)
      .reduce((sum, e) => sum + e.credit, 0);

    const monthlySales = accountingData.pnl?.totalRevenue || 0;
    const monthlyPurchase = accountingData.pnl?.cogs || 0;
    const monthlyProfit = accountingData.pnl?.netProfit || 0;

    return {
      cashInHand,
      bankBalance,
      receivables,
      payables,
      todayCollection,
      todayExpense,
      monthlySales,
      monthlyPurchase,
      monthlyProfit
    };
  }, [accountingData, combinedEntries, bankBalances]);

  // Actions
  const handleReceipt = async (e) => {
    e.preventDefault();
    if (!receiptForm.partyId || !receiptForm.amount) {
      toast.error("Please select a party and enter an amount");
      return;
    }
    try {
      const selectedParty = parties.find(p => p._id === receiptForm.partyId);
      const amt = Number(receiptForm.amount);

      await api.post('/payments', {
        party: receiptForm.partyId,
        partyName: selectedParty?.name,
        type: 'Payment In',
        amount: amt,
        paymentMode: receiptForm.mode,
        date: new Date(),
        referenceNumber: receiptForm.ref || `REF-REC-${Date.now().toString().slice(-4)}`,
        description: receiptForm.notes || "Received payment in accounting portal"
      });

      toast.success(`Receipt of ${fmt(amt)} recorded successfully!`);
      setReceiptForm({ partyId: "", partyName: "", amount: "", mode: "Cash", ref: "", notes: "" });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record receipt";
      toast.error(msg);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount) {
      toast.error("Please enter a payment amount");
      return;
    }
    try {
      const selectedParty = parties.find(p => p._id === paymentForm.partyId);
      const amt = Number(paymentForm.amount);

      await api.post('/payments', {
        party: paymentForm.partyId || undefined,
        partyName: selectedParty?.name || paymentForm.partyName || "General",
        type: 'Payment Out',
        amount: amt,
        paymentMode: paymentForm.mode,
        date: new Date(),
        referenceNumber: paymentForm.ref || `REF-PAY-${Date.now().toString().slice(-4)}`,
        description: paymentForm.notes || `${paymentForm.category} payment`
      });

      toast.success(`Payment of ${fmt(amt)} recorded successfully!`);
      setPaymentForm({ partyId: "", partyName: "", amount: "", mode: "Cash", ref: "", notes: "", category: "Supplier" });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record payment";
      toast.error(msg);
    }
  };

  const handleContra = async (e) => {
    e.preventDefault();
    const amt = Number(contraForm.amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }
    if (contraForm.from === contraForm.to) {
      toast.error("Source and destination accounts must be different");
      return;
    }

    try {
      await api.post('/payments', {
        type: 'Payment Out',
        amount: amt,
        paymentMode: contraForm.from,
        date: new Date(),
        referenceNumber: `CON-OUT-${Date.now().toString().slice(-4)}`,
        description: contraForm.description || `Contra Transfer: Moved funds to ${contraForm.to}`
      });

      await api.post('/payments', {
        type: 'Payment In',
        amount: amt,
        paymentMode: contraForm.to,
        date: new Date(),
        referenceNumber: `CON-IN-${Date.now().toString().slice(-4)}`,
        description: contraForm.description || `Contra Transfer: Received funds from ${contraForm.from}`
      });

      toast.success(`Successfully transferred ${fmt(amt)} from ${contraForm.from} to ${contraForm.to}!`);
      setContraForm({ from: "Cash", to: "HDFC", amount: "", description: "" });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit contra transfer";
      toast.error(msg);
    }
  };

  const handleJournal = async (e) => {
    e.preventDefault();
    const amt = Number(journalForm.amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid adjustment amount");
      return;
    }
    if (journalForm.debitAcc === journalForm.creditAcc) {
      toast.error("Debit and Credit accounts must be different");
      return;
    }

    try {
      await api.post('/reports/accounting/journals', {
        debitAcc: journalForm.debitAcc,
        creditAcc: journalForm.creditAcc,
        amount: amt,
        narration: journalForm.narration
      });
      toast.success(`Journal Voucher of ${fmt(amt)} recorded successfully!`);
      setJournalForm({ debitAcc: "Cash", creditAcc: "HDFC", amount: "", narration: "" });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record journal voucher";
      toast.error(msg);
    }
  };

  const handleOpeningBalance = () => {
    setOpBalInput(openingBalance || 0);
    setIsOpBalModalOpen(true);
  };

  const handleSaveOpBal = async (e) => {
    e?.preventDefault();
    const val = Number(opBalInput) || 0;
    try {
      await api.post('/reports/accounting/opening-balance', { amount: val });
      setOpeningBalance(val);
      toast.success(`Opening balance updated to ${fmt(val)}!`);
      setIsOpBalModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save opening balance";
      toast.error(msg);
    }
  };

  const deleteLocalLog = (id) => {
    if (confirm("Are you sure you want to delete this manual transaction entry?")) {
      setLocalLogs(localLogs.filter(l => l.id !== id));
      toast.success("Transaction deleted");
    }
  };

  const handleAddBank = () => {
    setNewBankName("");
    setNewBankBal("");
    setIsBankModalOpen(true);
  };

  const handleSaveNewBank = async (e) => {
    e?.preventDefault();
    const cleanName = newBankName.trim();
    if (!cleanName) {
      toast.error("Please enter bank name");
      return;
    }

    const bal = Number(newBankBal) || 0;
    try {
      await api.post('/reports/accounting/banks', { name: cleanName, balance: bal });
      toast.success(`${cleanName} added in DB with starting balance of ${fmt(bal)}`);
      setIsBankModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to add bank account in DB");
    }
  };

  const handleDeleteBank = async (bankName) => {
    if (confirm(`Are you sure you want to delete ${bankName} account?`)) {
      try {
        await api.delete(`/reports/accounting/banks/${encodeURIComponent(bankName)}`);
        toast.success(`${bankName} deleted from DB`);
        fetchData();
      } catch (err) {
        toast.error("Failed to delete bank account from DB");
      }
    }
  };

  const handleGenerateReport = (repTitle) => {
    try {
      const doc = new jsPDF();
      const fileDate = new Date().toISOString().split("T")[0];

      if (repTitle === "Trial Balance") {
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129);
        doc.text("UdaanBillBook — Trial Balance Statement", 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(70);
        doc.text(`As of Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 26);

        let totalDr = 0;
        let totalCr = 0;
        const rows = [];

        const cashBal = stats?.cashInHand || 0;
        if (cashBal >= 0) { totalDr += cashBal; rows.push(["1", "Cash In Hand Account", `Rs. ${cashBal.toLocaleString('en-IN')}`, "-"]); }
        else { totalCr += Math.abs(cashBal); rows.push(["1", "Cash In Hand Account", "-", `Rs. ${Math.abs(cashBal).toLocaleString('en-IN')}`]); }

        Object.keys(bankBalances).forEach((bName, i) => {
          const bal = bankBalances[bName] || 0;
          if (bal >= 0) { totalDr += bal; rows.push([`${i + 2}`, `${bName} Bank Account`, `Rs. ${bal.toLocaleString('en-IN')}`, "-"]); }
          else { totalCr += Math.abs(bal); rows.push([`${i + 2}`, `${bName} Bank Account`, "-", `Rs. ${Math.abs(bal).toLocaleString('en-IN')}`]); }
        });

        const rec = stats?.receivables || 0;
        const pay = stats?.payables || 0;
        if (rec > 0) { totalDr += rec; rows.push([`${rows.length + 1}`, "Accounts Receivable (Debtors)", `Rs. ${rec.toLocaleString('en-IN')}`, "-"]); }
        if (pay > 0) { totalCr += pay; rows.push([`${rows.length + 1}`, "Accounts Payable (Creditors)", "-", `Rs. ${pay.toLocaleString('en-IN')}`]); }

        rows.push(["TOTAL", "Reconciled Total Ledger Balance", `Rs. ${totalDr.toLocaleString('en-IN')}`, `Rs. ${totalCr.toLocaleString('en-IN')}`]);

        autoTable(doc, {
          startY: 32,
          head: [["#", "Account Head / Ledger Particulars", "Debit (Dr)", "Credit (Cr)"]],
          body: rows,
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 9 }
        });

        doc.save(`Trial_Balance_${fileDate}.pdf`);
        toast.success("Trial Balance PDF generated successfully!");
      }
      else if (repTitle === "Day Book Ledger") {
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129);
        doc.text("UdaanBillBook — Day Book Ledger Report", 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(70);
        doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')} | Total Entries: ${combinedEntries.length}`, 14, 26);

        const rows = combinedEntries.map((e, idx) => [
          idx + 1,
          e.date,
          e.voucher || "-",
          e.party || "General",
          e.type || "-",
          e.mode || "Cash",
          e.debit ? `Rs. ${e.debit.toLocaleString('en-IN')}` : "-",
          e.credit ? `Rs. ${e.credit.toLocaleString('en-IN')}` : "-"
        ]);

        autoTable(doc, {
          startY: 32,
          head: [["#", "Date", "Voucher No", "Party", "Type", "Mode", "Debit (Dr)", "Credit (Cr)"]],
          body: rows.length > 0 ? rows : [["-", "-", "-", "No transactions today", "-", "-", "-", "-"]],
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8 }
        });

        doc.save(`Day_Book_Ledger_${fileDate}.pdf`);
        toast.success("Day Book Ledger PDF generated successfully!");
      }
      else if (repTitle === "Outstanding Receivables") {
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129);
        doc.text("UdaanBillBook — Outstanding Receivables Report", 14, 18);

        // 1. Party-wise Receivables
        const debtorParties = parties.filter(p => {
          const bType = (p.balanceType || '').toLowerCase();
          const amt = Number(p.balance) || Number(p.openingBalance) || 0;
          return (bType.includes('receive') || bType.includes('customer') || p.type?.toLowerCase().includes('customer')) && amt > 0;
        });

        // 2. Unpaid Invoice Receivables
        const unpaidInvoices = invoices.filter(i => 
          (i.type === 'Sale' || i.type === 'Invoice') && 
          i.paymentStatus !== 'Paid' && 
          (Number(i.balanceAmount) > 0 || (i.paymentStatus === 'Unpaid' && Number(i.grandTotal) > 0))
        );

        const totalDebtors = debtorParties.length + unpaidInvoices.length;
        doc.setFontSize(10);
        doc.setTextColor(70);
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')} | Total Pending Customers/Bills: ${totalDebtors}`, 14, 26);

        const rows = [];

        debtorParties.forEach((p, idx) => {
          rows.push([
            idx + 1,
            p.name,
            p.phone || "-",
            "Party Ledger",
            `Rs. ${(Number(p.balance) || 0).toLocaleString('en-IN')}`,
            "Pending Receivable"
          ]);
        });

        unpaidInvoices.forEach((i, idx) => {
          const partyName = i.partyName || i.party?.name || "General Customer";
          const pendingAmt = Number(i.balanceAmount) || Number(i.grandTotal) || 0;
          rows.push([
            debtorParties.length + idx + 1,
            partyName,
            i.invoiceNumber || `INV-${1000 + idx}`,
            "Unpaid Bill",
            `Rs. ${pendingAmt.toLocaleString('en-IN')}`,
            i.paymentStatus || "Unpaid"
          ]);
        });

        autoTable(doc, {
          startY: 32,
          head: [["#", "Customer / Party Name", "Ref / Phone", "Type", "Pending Amount (Rs.)", "Aging / Status"]],
          body: rows.length > 0 ? rows : [["1", "No pending receivables found in DB", "-", "-", "Rs. 0", "Clear"]],
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8 }
        });

        doc.save(`Outstanding_Receivables_${fileDate}.pdf`);
        toast.success("Outstanding Receivables PDF generated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to generate ${repTitle} report`);
    }
  };

  const handleExportLedger = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129);
      doc.text(`UdaanBillBook — General Ledger Statement`, 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(70);
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')} | Total Entries: ${filteredEntries.length}`, 14, 26);

      const rows = filteredEntries.map((e, idx) => [
        idx + 1,
        e.date,
        e.voucher || "-",
        e.party || "General",
        e.type || "-",
        e.mode || "Cash",
        e.debit ? `Rs. ${e.debit.toLocaleString('en-IN')}` : "-",
        e.credit ? `Rs. ${e.credit.toLocaleString('en-IN')}` : "-"
      ]);

      autoTable(doc, {
        startY: 32,
        head: [["#", "Date", "Voucher No", "Party", "Type", "Mode", "Debit (Rs.)", "Credit (Rs.)"]],
        body: rows.length > 0 ? rows : [["-", "-", "-", "No records found", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 }
      });

      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`General_Ledger_${fileDate}.pdf`);
      toast.success("General Ledger PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Ledger PDF");
    }
  };

  if (loading || !accountingData) return <div className="p-8 text-center text-muted-foreground">Loading ERP Accounting data...</div>;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="ERP Accounting & Khata"
        subtitle="Vyapar-grade multi-book accounting, ledgers, statements and financial reports."
        actions={
          <div className="flex w-full flex-nowrap items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none px-2 rounded-xl border-slate-200 h-8 text-[11px] sm:px-4 sm:h-9 sm:text-sm" onClick={handleOpeningBalance} title="Click to update Ledger Opening Balance">
              <Calculator className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" /> Op. Bal: {fmt(openingBalance)}
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] sm:px-4 sm:h-9 sm:text-sm" onClick={() => setActiveTab("receipts")}>
              <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Receipt In
            </Button>
          </div>
        }
      />

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input 
          type="text" 
          placeholder={typeof window !== "undefined" && window.innerWidth < 640 ? "Search invoices, vouchers, parties..." : "Global Accounting Search (Search invoices, voucher numbers, parties, descriptions, amounts...)"}
          className="pl-10 h-11 bg-white border border-slate-200 shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side Sub-Navigation */}
        <div className="w-full lg:w-64 bg-transparent lg:bg-white rounded-2xl p-0 lg:p-3 border-0 lg:border shadow-none lg:shadow-sm shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-1 lg:space-y-1 [&::-webkit-scrollbar]:hidden">
          <p className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-wider">Accounting Books</p>
          {[
            { id: "overview", label: "Overview Dashboard", icon: Wallet },
            { id: "ledger", label: "General Ledger", icon: BookOpen },
            { id: "cashbook", label: "Cash Book", icon: Briefcase },
            { id: "banks", label: "Bank Accounts", icon: Building2 },
            { id: "receipts", label: "Receipt Entry", icon: ArrowUpCircle },
            { id: "payments", label: "Payment Entry", icon: ArrowDownCircle },
            { id: "journal", label: "Journal Entries", icon: FileText },
            { id: "contra", label: "Contra Entry", icon: ArrowRightLeft },
            { id: "reports", label: "Day Book & Reports", icon: Receipt },
            { id: "financials", label: "Financial Statements", icon: TrendingUp },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`w-max lg:w-full shrink-0 flex items-center gap-2 lg:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-left text-[11px] sm:text-xs font-semibold transition-all ${
                activeTab === nav.id 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border lg:border-transparent border-slate-200"
              }`}
            >
              <nav.icon className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${activeTab === nav.id ? "text-emerald-600" : "text-slate-400"}`} />
              {nav.label}
              {activeTab === nav.id && <ChevronRight className="hidden lg:block ml-auto h-3 w-3" />}
            </button>
          ))}
        </div>

        {/* Right Side Main Content Panel */}
        <div className="flex-1 w-full bg-slate-50/50 min-h-[500px]">

          {/* 1. OVERVIEW DASHBOARD */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Cash In Hand", val: stats.cashInHand, style: "bg-emerald-600 text-white" },
                  { label: "Bank Balance", val: stats.bankBalance, style: "bg-amber-500 text-white" },
                  { label: "Total Receivables", val: stats.receivables, style: "bg-white text-emerald-700 border" },
                  { label: "Total Payables", val: stats.payables, style: "bg-white text-red-600 border" },
                  { label: "Today's Collection", val: stats.todayCollection, style: "bg-blue-600 text-white" }
                ].map((k, idx) => (
                  <Card key={idx} className={`border-0 shadow-sm rounded-xl overflow-hidden ${k.style}`}>
                    <CardContent className="p-2.5 sm:p-3 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-semibold opacity-85 uppercase tracking-wider truncate">{k.label}</p>
                      <p className="text-base sm:text-lg font-black mt-1 sm:mt-1.5 truncate">{fmt(k.val)}</p>
                      <p className="text-[8px] sm:text-[9px] opacity-75 mt-0.5 sm:mt-1 truncate">▲ +2.4% vs yesterday</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Today's Expense", val: stats.todayExpense, color: "text-red-500" },
                  { label: "Monthly Sales", val: stats.monthlySales, color: "text-slate-800" },
                  { label: "Monthly Purchase", val: stats.monthlyPurchase, color: "text-slate-800" },
                  { label: "Monthly Profit", val: stats.monthlyProfit, color: "text-emerald-600" }
                ].map((s, idx) => (
                  <Card key={idx} className="border-0 shadow-sm bg-white rounded-xl">
                    <CardContent className="p-2 sm:p-4 flex items-center justify-between min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                        <p className={`text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 truncate ${s.color}`}>{fmt(s.val)}</p>
                      </div>
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-slate-50 flex shrink-0 items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions Panel */}
              <Card className="border shadow-sm bg-white rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">ERP Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-3">
                  {[
                    { label: "Cash In", tab: "receipts" },
                    { label: "Cash Out", tab: "payments" },
                    { label: "Receipt", tab: "receipts" },
                    { label: "Payment", tab: "payments" },
                    { label: "Journal Entry", tab: "journal" },
                    { label: "Bank Transfer", tab: "contra" },
                    { label: "Opening Bal", action: handleOpeningBalance },
                    { label: "Reports", tab: "reports" }
                  ].map((a, idx) => (
                    <button
                      key={idx}
                      onClick={() => a.action ? a.action() : setActiveTab(a.tab)}
                      className="flex flex-col items-center justify-center p-1 py-2 sm:p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 transition-colors group cursor-pointer min-w-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Plus className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold mt-1.5 sm:mt-2 text-center leading-tight break-words px-0.5 w-full">{a.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Cash Flow visual chart representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-sm rounded-2xl bg-white">
                  <CardHeader>
                    <CardTitle className="text-sm">Inflow vs Outflow</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Total Cash Inflow (Receipts)</span>
                        <span className="text-emerald-600 font-bold">{fmt(stats.todayCollection + stats.monthlySales)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Total Outflow (Expenses + Payments)</span>
                        <span className="text-red-500 font-bold">{fmt(stats.todayExpense + stats.monthlyPurchase)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm rounded-2xl bg-white">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Accounts Balances</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span>Cash In Hand</span>
                      <span className="font-bold">{fmt(stats.cashInHand)}</span>
                    </div>
                    {Object.entries(bankBalances).map(([bName, bBal]) => (
                      <div key={bName} className="flex justify-between border-b pb-1 text-muted-foreground">
                        <span>{bName} Bank</span>
                        <span className="font-semibold text-slate-800">{fmt(bBal)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 2. GENERAL LEDGER */}
          {activeTab === "ledger" && (
            <Card className="bg-transparent md:bg-white border-0 md:border md:shadow-sm shadow-none rounded-2xl">
              <CardHeader className="border-b-0 md:border-b p-0 md:p-6 pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base">General Ledger Accounts</CardTitle>
                    <CardDescription>Consolidated journal, payments, invoice receipts history.</CardDescription>
                  </div>
                  <Button variant="outline" className="h-8 rounded-lg text-xs" onClick={handleExportLedger}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export Ledger
                  </Button>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-1 sm:pt-2">
                  <select 
                    value={ledgerFilter.dateRange} 
                    onChange={(e) => setLedgerFilter({...ledgerFilter, dateRange: e.target.value})}
                    className="h-8 rounded-lg border text-[10.5px] sm:text-xs bg-slate-50 px-1.5 sm:px-2 focus:outline-none w-full"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <select 
                    value={ledgerFilter.mode} 
                    onChange={(e) => setLedgerFilter({...ledgerFilter, mode: e.target.value})}
                    className="h-8 rounded-lg border text-[10.5px] sm:text-xs bg-slate-50 px-1.5 sm:px-2 focus:outline-none w-full"
                  >
                    <option value="all">All Modes</option>
                    <option value="Cash">Cash Only</option>
                    <option value="Online">Online / UPI Only</option>
                    <option value="Bank Transfer">Bank Transfer Only</option>
                  </select>
                  <select 
                    value={ledgerFilter.type} 
                    onChange={(e) => setLedgerFilter({...ledgerFilter, type: e.target.value})}
                    className="h-8 rounded-lg border text-[10.5px] sm:text-xs bg-slate-50 px-1.5 sm:px-2 focus:outline-none w-full"
                  >
                    <option value="all">All Transactions</option>
                    <option value="receipt">Receipts In</option>
                    <option value="payment">Payments Out</option>
                    <option value="sales">Sales Ledger</option>
                    <option value="purchase">Purchase Ledger</option>
                  </select>
                  <select 
                    value={ledgerFilter.party} 
                    onChange={(e) => setLedgerFilter({...ledgerFilter, party: e.target.value})}
                    className="h-8 rounded-lg border text-[10.5px] sm:text-xs bg-slate-50 px-1.5 sm:px-2 focus:outline-none w-full"
                  >
                    <option value="all">All Parties</option>
                    {Array.from(new Set(combinedEntries.map(e => e.party))).map(pName => (
                      <option key={pName} value={pName}>{pName}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="p-3 font-semibold text-slate-600">Date</th>
                        <th className="p-3 font-semibold text-slate-600">Voucher No</th>
                        <th className="p-3 font-semibold text-slate-600">Type</th>
                        <th className="p-3 font-semibold text-slate-600">Party Name</th>
                        <th className="p-3 font-semibold text-slate-600 font-emerald-600">Debit (IN)</th>
                        <th className="p-3 font-semibold text-slate-600 text-red-600">Credit (OUT)</th>
                        <th className="p-3 font-semibold text-slate-600">Running Bal</th>
                        <th className="p-3 font-semibold text-slate-600">Mode</th>
                        <th className="p-3 font-semibold text-slate-600">Created By</th>
                        <th className="p-3 font-semibold text-slate-600 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEntries.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">{item.date} <span className="text-[10px] text-muted-foreground block">{item.createdTime}</span></td>
                          <td className="p-3 font-mono font-semibold">{item.voucher}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={item.debit > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                              {item.type}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{item.party}</td>
                          <td className="p-3 text-emerald-600 font-bold">{item.debit > 0 ? fmt(item.debit) : "—"}</td>
                          <td className="p-3 text-red-600 font-bold">{item.credit > 0 ? fmt(item.credit) : "—"}</td>
                          <td className="p-3 font-bold text-slate-800">{fmt(item.runningBalance)}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="rounded-full text-[10px]">
                              {item.mode}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.createdBy}</td>
                          <td className="p-3 text-right pr-4">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-800" title="Print statement" onClick={() => window.print()}>
                                <Printer className="h-3 w-3" />
                              </Button>
                              {item.id.startsWith("local-") && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => deleteLocalLog(item.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">No ledger entries found matching filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. CASH BOOK */}
          {activeTab === "cashbook" && (
            <div className="space-y-6">
              {/* Cash Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border shadow-sm rounded-xl bg-white col-span-2 md:col-span-1">
                  <CardContent className="p-3 sm:p-4 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Opening Cash Balance</p>
                    <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1 text-slate-800 truncate">{fmt(openingBalance)}</p>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm rounded-xl bg-white">
                  <CardContent className="p-3 sm:p-4 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Deposits (IN)</p>
                    <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1 text-emerald-600 truncate">
                      {fmt(combinedEntries.filter(e => e.mode === "Cash").reduce((sum, e) => sum + e.debit, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm rounded-xl bg-white">
                  <CardContent className="p-3 sm:p-4 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Withdrawals (OUT)</p>
                    <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1 text-red-500 truncate">
                      {fmt(combinedEntries.filter(e => e.mode === "Cash").reduce((sum, e) => sum + e.credit, 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Book Table */}
              <Card className="border shadow-sm bg-white rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Cash Ledger Book</CardTitle>
                  <CardDescription>Filtered transactions recorded in physical Cash Mode.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 w-[55px] sm:w-auto text-[10px] sm:text-xs">Date</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 w-[65px] sm:w-auto text-[10px] sm:text-xs">Voucher No</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 w-[50px] sm:w-auto text-[10px] sm:text-xs">Party</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 w-[65px] sm:w-auto text-[10px] sm:text-xs">Description</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 text-emerald-600 w-[75px] sm:w-auto text-[10px] sm:text-xs">Cash In (Dr)</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 text-red-600 w-[75px] sm:w-auto text-[10px] sm:text-xs">Cash Out (Cr)</th>
                          <th className="p-1.5 py-2.5 sm:p-3 font-semibold text-slate-600 w-[70px] sm:w-auto text-[10px] sm:text-xs">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {combinedEntries.filter(e => e.mode === "Cash").map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-1.5 py-2.5 sm:p-3 max-w-[55px] sm:max-w-none truncate">{item.date}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 font-mono font-semibold max-w-[65px] sm:max-w-none truncate">{item.voucher}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 font-medium max-w-[50px] sm:max-w-none truncate">{item.party}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 text-muted-foreground max-w-[65px] sm:max-w-none truncate">{item.description}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 text-emerald-600 font-bold w-[75px] sm:w-auto whitespace-nowrap">{item.debit > 0 ? fmt(item.debit) : "—"}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 text-red-600 font-bold w-[75px] sm:w-auto whitespace-nowrap">{item.credit > 0 ? fmt(item.credit) : "—"}</td>
                            <td className="p-1.5 py-2.5 sm:p-3 font-bold text-slate-800 w-[70px] sm:w-auto whitespace-nowrap">{fmt(item.runningBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 4. BANK ACCOUNTS */}
          {activeTab === "banks" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(bankBalances).map(([bName, bBal]) => (
                  <Card key={bName} className="border border-slate-100 shadow-sm border-l-4 border-l-emerald-600 bg-white rounded-xl relative">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="rounded-full text-[9px]">Active</Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:text-red-750 hover:bg-red-50 rounded-full" 
                            onClick={() => handleDeleteBank(bName)}
                            title="Delete Bank Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-bold">{bName} Bank Account</p>
                      <p className="text-2xl font-black text-slate-800 mt-2">{fmt(bBal)}</p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8 rounded-lg" onClick={() => handleDownloadBankStatement(bName, bBal)}>Statement</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-[11px] h-8 rounded-lg" 
                          onClick={() => {
                            setContraForm({ from: bName, to: "Cash", amount: "", description: "" });
                            setActiveTab("contra");
                          }}
                        >
                          Contra Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button 
                  variant="outline" 
                  className="h-full border-dashed border-2 rounded-xl flex flex-col gap-2 min-h-[160px] bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200"
                  onClick={handleAddBank}
                >
                  <Plus className="h-6 w-6 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-600">Add Bank Account</span>
                </Button>
              </div>
            </div>
          )}

          {/* 5. RECEIPTS ENTRY */}
          {activeTab === "receipts" && (
            <Card className="border shadow-sm bg-white rounded-2xl max-w-xl mx-auto">
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-emerald-600" /> Receipt Entry Voucher (Payment In)
                </CardTitle>
                <CardDescription>Log sales collections or manual capital additions.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleReceipt} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Customer / Party Name</label>
                    <select
                      value={receiptForm.partyId}
                      onChange={(e) => setReceiptForm({ ...receiptForm, partyId: e.target.value })}
                      className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                    >
                      <option value="">Select Party</option>
                      {parties.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (₹)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 5000"
                        value={receiptForm.amount}
                        onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Payment Mode</label>
                      <select
                        value={receiptForm.mode}
                        onChange={(e) => setReceiptForm({ ...receiptForm, mode: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Cash">Cash</option>
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Reference / Voucher No</label>
                      <Input 
                        placeholder="e.g. REC-102"
                        value={receiptForm.ref}
                        onChange={(e) => setReceiptForm({ ...receiptForm, ref: e.target.value })}
                        className="rounded-xl h-10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes / Description</label>
                      <Input 
                        placeholder="Narration"
                        value={receiptForm.notes}
                        onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700">
                    Record Receipt Voucher
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 6. PAYMENTS ENTRY */}
          {activeTab === "payments" && (
            <Card className="border shadow-sm bg-white rounded-2xl max-w-xl mx-auto">
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-red-600" /> Payment Entry Voucher (Payment Out)
                </CardTitle>
                <CardDescription>Log vendor supplier payments, salaries or business expenses.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Supplier / Party (Optional)</label>
                      <select
                        value={paymentForm.partyId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, partyId: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="">Choose Supplier</option>
                        {parties.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">General Party Name</label>
                      <Input 
                        placeholder="e.g. Office rent"
                        value={paymentForm.partyName}
                        onChange={(e) => setPaymentForm({ ...paymentForm, partyName: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Category</label>
                      <select
                        value={paymentForm.category}
                        onChange={(e) => setPaymentForm({ ...paymentForm, category: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Supplier">Supplier Pay</option>
                        <option value="Expense">Expense</option>
                        <option value="Purchase">Purchase Pay</option>
                        <option value="Salary">Salary</option>
                        <option value="Loan">Loan Repay</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (₹)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 1500"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Payment Mode</label>
                      <select
                        value={paymentForm.mode}
                        onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Cash">Cash</option>
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Reference / Voucher No</label>
                      <Input 
                        placeholder="e.g. PAY-404"
                        value={paymentForm.ref}
                        onChange={(e) => setPaymentForm({ ...paymentForm, ref: e.target.value })}
                        className="rounded-xl h-10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes / Description</label>
                      <Input 
                        placeholder="Narration"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-10 bg-red-600 hover:bg-red-700">
                    Record Payment Voucher
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 7. JOURNAL ENTRIES */}
          {activeTab === "journal" && (
            <Card className="border shadow-sm bg-white rounded-2xl max-w-xl mx-auto">
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" /> Journal Entry Adjustment
                </CardTitle>
                <CardDescription>Adjust bookkeeping entry (Debit vs Credit accounts).</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleJournal} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Debit Account (Dr)</label>
                      <select
                        value={journalForm.debitAcc}
                        onChange={(e) => setJournalForm({ ...journalForm, debitAcc: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Cash">Cash In Hand</option>
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName} Bank</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Credit Account (Cr)</label>
                      <select
                        value={journalForm.creditAcc}
                        onChange={(e) => setJournalForm({ ...journalForm, creditAcc: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName} Bank</option>
                        ))}
                        <option value="Cash">Cash In Hand</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="Amount to adjust"
                      value={journalForm.amount}
                      onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Narration / Description</label>
                    <Input 
                      placeholder="Adjustment reason"
                      value={journalForm.narration}
                      onChange={(e) => setJournalForm({ ...journalForm, narration: e.target.value })}
                      className="rounded-xl h-10"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-10 bg-indigo-600 hover:bg-indigo-700">
                    Record Journal Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 8. CONTRA ENTRY */}
          {activeTab === "contra" && (
            <Card className="border shadow-sm bg-white rounded-2xl max-w-xl mx-auto">
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-teal-600" /> Contra Entry Voucher (Internal Transfer)
                </CardTitle>
                <CardDescription>Transfer cash to bank, bank to cash, or bank to bank.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleContra} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">From Account</label>
                      <select
                        value={contraForm.from}
                        onChange={(e) => setContraForm({ ...contraForm, from: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        <option value="Cash">Cash In Hand</option>
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">To Account</label>
                      <select
                        value={contraForm.to}
                        onChange={(e) => setContraForm({ ...contraForm, to: e.target.value })}
                        className="w-full h-10 border rounded-xl px-3 bg-white text-sm"
                      >
                        {Object.keys(bankBalances).map(bName => (
                          <option key={bName} value={bName}>{bName}</option>
                        ))}
                        <option value="Cash">Cash In Hand</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Transfer Amount (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 10000"
                      value={contraForm.amount}
                      onChange={(e) => setContraForm({ ...contraForm, amount: e.target.value })}
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Narration / Description</label>
                    <Input 
                      placeholder="e.g. Bank cash deposit"
                      value={contraForm.description}
                      onChange={(e) => setContraForm({ ...contraForm, description: e.target.value })}
                      className="rounded-xl h-10"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-xl h-10 bg-teal-600 hover:bg-teal-700">
                    Submit Contra Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 9. DAY BOOK & REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Trial Balance", desc: "Debits and Credits reconciliation statement", icon: Calculator },
                  { title: "Day Book Ledger", desc: "List of all transaction vouchers posted today", icon: FileText },
                  { title: "Outstanding Receivables", desc: "Detailed customer aging bill-by-bill analysis", icon: History }
                ].map((rep, idx) => (
                  <Card key={idx} className="border shadow-sm bg-white rounded-xl hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => handleGenerateReport(rep.title)}>
                    <CardHeader className="pb-2">
                      <rep.icon className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-xs font-bold mt-2">{rep.title}</CardTitle>
                      <CardDescription className="text-[11px]">{rep.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 text-right">
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">Generate <ChevronRight className="h-3 w-3" /></span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Day Book Table View */}
              <Card className="border shadow-sm bg-white rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Day Book Journal</CardTitle>
                  <CardDescription>All billing ledger vouchers recorded.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-3 font-semibold">Voucher</th>
                          <th className="p-3 font-semibold">Party</th>
                          <th className="p-3 font-semibold">Narrative</th>
                          <th className="p-3 font-semibold">Debit (Dr)</th>
                          <th className="p-3 font-semibold">Credit (Cr)</th>
                          <th className="p-3 font-semibold">Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {combinedEntries.slice(0, 10).map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-semibold">{e.voucher}</td>
                            <td className="p-3 font-medium">{e.party}</td>
                            <td className="p-3 text-muted-foreground">{e.description}</td>
                            <td className="p-3 text-emerald-600 font-bold">{e.debit > 0 ? fmt(e.debit) : "—"}</td>
                            <td className="p-3 text-red-600 font-bold">{e.credit > 0 ? fmt(e.credit) : "—"}</td>
                            <td className="p-3">{e.mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 10. FINANCIAL STATEMENTS */}
          {activeTab === "financials" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profit & Loss Statement */}
              <Card className="border shadow-sm bg-white rounded-2xl">
                <CardHeader className="border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" /> Profit & Loss Statement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex justify-between border-b pb-2 text-xs font-semibold">
                    <span>Operating Revenue (Sales)</span>
                    <span className="text-emerald-600 font-bold">{fmt(stats.monthlySales)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 text-xs font-semibold">
                    <span>Cost of Goods Sold (Purchases)</span>
                    <span className="text-red-500 font-bold">{fmt(stats.monthlyPurchase)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 text-xs font-semibold">
                    <span>Operating Expenses</span>
                    <span className="text-red-500 font-bold">{fmt(stats.todayExpense)}</span>
                  </div>
                  <div className="flex justify-between pt-4 text-sm font-bold">
                    <span>Net Profit / Loss</span>
                    <span className="text-lg text-emerald-600 font-black">{fmt(stats.monthlyProfit - stats.todayExpense)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Sheet Preview */}
              <Card className="border shadow-sm bg-white rounded-2xl">
                <CardHeader className="border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-500" /> Balance Sheet Assets & Equity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="flex justify-between border-b pb-2 font-semibold">
                    <span>Current Assets (Cash + Bank + Receivables)</span>
                    <span className="font-bold">{fmt(stats.cashInHand + stats.bankBalance + stats.receivables)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 font-semibold text-red-500">
                    <span>Current Liabilities (Payables)</span>
                    <span className="font-bold">{fmt(stats.payables)}</span>
                  </div>
                  <div className="flex justify-between pt-4 text-sm font-bold text-emerald-700">
                    <span>Net Business Capital Equity</span>
                    <span className="text-lg font-black">{fmt((stats.cashInHand + stats.bankBalance + stats.receivables) - stats.payables)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* 1. Opening Balance Dialog Modal */}
      <Dialog open={isOpBalModalOpen} onOpenChange={setIsOpBalModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Update Opening Balance</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set the starting ledger opening balance for your business account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOpBal} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="op-bal-val" className="text-xs font-semibold text-slate-700">Opening Balance (₹)</label>
              <Input
                id="op-bal-val"
                type="number"
                value={opBalInput === 0 ? "" : opBalInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, "");
                  setOpBalInput(raw);
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="h-10 rounded-xl text-base font-bold"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpBalModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold px-5">
                Save Opening Balance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Bank Account Dialog Modal */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add New Bank Account</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a new bank account or wallet to track balances and transactions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewBank} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="bank-name-input" className="text-xs font-semibold text-slate-700">Bank / Wallet Name</label>
              <Input
                id="bank-name-input"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. Axis Bank, PNB, Paytm Wallet"
                className="h-10 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bank-bal-input" className="text-xs font-semibold text-slate-700">Starting Balance (₹)</label>
              <Input
                id="bank-bal-input"
                type="number"
                value={newBankBal === 0 ? "" : newBankBal}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, "");
                  setNewBankBal(raw);
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="h-10 rounded-xl text-sm font-bold"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsBankModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold px-5">
                Add Bank Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
