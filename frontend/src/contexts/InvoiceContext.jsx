import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useMockAuth } from "@/lib/auth-store";

const InvoiceContext = createContext();

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const { hydrated, isAuthenticated } = useMockAuth();

  const fetchInvoices = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      // Normalize invoices from backend while preserving full invoice data
      const normalized = (res.data || []).map(inv => ({
        ...inv,
        id: inv.invoiceNumber || (inv._id ? `INV-${inv._id.substring(18).toUpperCase()}` : ''),
        invoiceNumber: inv.invoiceNumber || (inv._id ? `INV-${inv._id.substring(18).toUpperCase()}` : ''),
        party: inv.partyName || (inv.party && inv.party.name) || inv.billingName || "Walk-in Customer",
        partyName: inv.partyName || (inv.party && inv.party.name) || inv.billingName || "Walk-in Customer",
        date: new Date(inv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
        dateRaw: inv.date,
        amount: inv.grandTotal || 0,
        grandTotal: inv.grandTotal || 0,
        taxableAmount: inv.taxableAmount || 0,
        gstAmount: inv.gstAmount || 0,
        status: inv.status || "Unpaid",
        type: inv.type || "Sale",
        paymentMethod: inv.paymentMethod || "Cash"
      }));
      setInvoices(normalized);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      fetchInvoices();
    } else if (hydrated && !isAuthenticated) {
      setInvoices([]);
    }
  }, [hydrated, isAuthenticated]);

  const refreshInvoices = () => {
    fetchInvoices();
  };

  const addInvoice = (invoiceData) => {
    if (invoiceData) {
      return api.post('/invoices', invoiceData).then(() => refreshInvoices());
    }
    refreshInvoices();
  };

  return (
    <InvoiceContext.Provider value={{ invoices, loading, refreshInvoices, addInvoice, fetchInvoices }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  return useContext(InvoiceContext);
}
