import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, QrCode, CreditCard, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function PublicPaymentPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/public/${id}`);
        setInvoice(res.data);
        if (res.data?.status === "Paid") setPaid(true);
      } catch (err) {
        console.error("Failed to fetch public invoice", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchInvoice();
  }, [id]);

  const handleSimulatePayment = () => {
    setPaid(true);
    toast.success("Payment Successful! Receipt updated.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Loading Payment Details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-6 border-0 shadow-lg rounded-2xl">
          <CardContent className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-slate-800">Invalid Payment Link</h2>
            <p className="text-sm text-slate-500">The invoice details for this payment link could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const grandTotal = Number(invoice.grandTotal || invoice.grand || invoice.amount || 0);
  const received = Number(invoice.receivedAmount || 0);
  const dueAmount = Math.max(0, grandTotal - received);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-4">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 text-center space-y-2">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-lg font-bold">Udaan BillBook Payment Gateway</CardTitle>
            <p className="text-xs text-indigo-200">Invoice #{invoice.invoiceNumber || invoice.id}</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {paid ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Payment Completed</h3>
                  <p className="text-xs text-slate-500">Thank you! Your payment has been received.</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-sm px-4 py-1 rounded-full">
                  Status: Paid
                </Badge>
                <div className="pt-2">
                  <Button asChild variant="outline" className="rounded-xl w-full">
                    <Link to={`/invoice/${invoice._id || invoice.invoiceNumber || id}`}>View Updated Invoice</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Billing Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Billed To:</span>
                    <span className="font-semibold text-slate-800">{invoice.partyName || invoice.customer || "Walk-in Customer"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Amount:</span>
                    <span className="font-semibold text-slate-800">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900 text-base">
                    <span>Amount Due:</span>
                    <span className="text-indigo-600">₹{dueAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* QR Code / UPI Mock */}
                <div className="text-center space-y-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-900">Scan QR Code to Pay via GPay / PhonePe / Paytm</p>
                  <div className="h-40 w-40 bg-white border-2 border-indigo-200 rounded-xl mx-auto flex items-center justify-center p-2 shadow-inner">
                    <QrCode className="h-32 w-32 text-indigo-900" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">UPI ID: udaanbillbook@upi</p>
                </div>

                {/* Action Buttons */}
                <Button 
                  onClick={handleSimulatePayment} 
                  className="w-full h-12 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                  Pay ₹{dueAmount.toFixed(2)} Now
                </Button>

                <div className="text-center pt-2">
                  <Link to={`/invoice/${invoice._id || invoice.invoiceNumber || id}`} className="text-xs text-indigo-600 hover:underline">
                    Back to Invoice View
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
