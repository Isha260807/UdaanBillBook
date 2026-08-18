import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";
import { downloadInvoicePdf, printInvoiceHtml } from "@/lib/invoice-pdf";
import api from "@/lib/api";

export default function PublicInvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/public/${id}`);
        setInvoice(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Invoice not found or expired.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-6 border-0 shadow-lg rounded-2xl">
          <CardContent className="space-y-4 pt-4">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto font-bold text-xl">!</div>
            <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
            <p className="text-sm text-slate-500">{error || "The requested invoice could not be located."}</p>
            <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              UB
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Invoice #{invoice.invoiceNumber || invoice.id}</h1>
              <p className="text-xs text-slate-500">Verified Udaan BillBook Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 text-xs"
              onClick={() => printInvoiceHtml()}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => downloadInvoicePdf(invoice)}
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button
              size="sm"
              variant="default"
              className="rounded-xl gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => window.location.href = `/pay/${invoice._id || invoice.invoiceNumber || id}`}
            >
              <CreditCard className="h-4 w-4" /> Pay Now
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-8 overflow-x-auto">
          <InvoiceTemplateRenderer invoice={invoice} templateName={invoice.invoiceTemplate || "GST Boxed"} />
        </div>
      </div>
    </div>
  );
}
