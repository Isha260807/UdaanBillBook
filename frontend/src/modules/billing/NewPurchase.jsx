import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, ReceiptText, Bell, Plus, Send, Trash2, Upload, Paperclip, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useInvoices } from "@/contexts/InvoiceContext";
import { toast } from "sonner";
import api from "@/lib/api";
import { validateUtr, validateUpi } from "@/lib/validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMockAuth } from "@/lib/auth-store";

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addInvoice } = useInvoices();
  const { user } = useMockAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  const getInitialState = (key, fallback) => {
    try {
      const saved = localStorage.getItem("Udaan.purchase_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch (e) {
      console.error("Failed to parse purchase draft", e);
    }
    return fallback;
  };

  // 1. Supplier & Invoice Info
  const [supplier, setSupplier] = useState(() => getInitialState("supplier", ""));
  const [gstin, setGstin] = useState(() => getInitialState("gstin", ""));
  const [phone, setPhone] = useState(() => getInitialState("phone", ""));
  const [purchaseNo, setPurchaseNo] = useState(() => getInitialState("purchaseNo", "PUR-" + Math.floor(10000 + Math.random() * 90000)));
  const [invoiceNo, setInvoiceNo] = useState(() => getInitialState("invoiceNo", ""));
  const [purchaseDate, setPurchaseDate] = useState(() => getInitialState("purchaseDate", todayStr));
  const [invoiceDate, setInvoiceDate] = useState(() => getInitialState("invoiceDate", todayStr));

  // 2. Items
  const [lines, setLines] = useState(() => getInitialState("lines", [
    { name: "", hsnSac: "", unit: "Pcs", qty: 1, rate: 0, discount: 0, gst: 18 }
  ]));

  // 3. Additional Charges
  const [freight, setFreight] = useState(() => getInitialState("freight", 0));
  const [packing, setPacking] = useState(() => getInitialState("packing", 0));
  const [otherCharges, setOtherCharges] = useState(() => getInitialState("otherCharges", 0));

  // 4. Payment
  const [status, setStatus] = useState(() => getInitialState("status", "Unpaid"));
  const [receivedAmount, setReceivedAmount] = useState(() => getInitialState("receivedAmount", 0));
  const [paymentMethod, setPaymentMethod] = useState(() => getInitialState("paymentMethod", "Cash"));
  const [paymentDetails, setPaymentDetails] = useState(() => getInitialState("paymentDetails", {
    transactionId: "", utr: "", bankName: "", accountNumber: "", ifsc: ""
  }));
  const [errors, setErrors] = useState({ utr: "", upi: "" });

  // 5. Notes & Remark
  const [purchaseNote, setPurchaseNote] = useState(() => getInitialState("purchaseNote", ""));
  const [remark, setRemark] = useState(() => getInitialState("remark", ""));

  // 6. Attachment
  const [attachment, setAttachment] = useState(() => getInitialState("attachment", null));

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState([
    { name: "harsh", phone: "9876543210", gstin: "07AAAAA0000A1Z5" },
    { name: "Green Mart", phone: "9876543211", gstin: "07BBBBB1111B1Z6" },
    { name: "Anil Sweets", phone: "9876543212", gstin: "07CCCCC2222C1Z7" },
    { name: "Patel Stores", phone: "9876543213", gstin: "07DDDDD3333D1Z8" },
  ]);

  useEffect(() => {
    api.get('/parties').then((res) => {
      if (res.data && res.data.length > 0) {
        setSuppliersList(res.data);
      }
    }).catch(() => {});
  }, []);

  // Persist draft to localStorage
  useEffect(() => {
    const draft = {
      supplier, gstin, phone, purchaseNo, invoiceNo, purchaseDate, invoiceDate,
      lines, freight, packing, otherCharges,
      status, receivedAmount, paymentMethod, paymentDetails,
      purchaseNote, remark, attachment
    };
    localStorage.setItem("Udaan.purchase_draft", JSON.stringify(draft));
  }, [
    supplier, gstin, phone, purchaseNo, invoiceNo, purchaseDate, invoiceDate,
    lines, freight, packing, otherCharges,
    status, receivedAmount, paymentMethod, paymentDetails,
    purchaseNote, remark, attachment
  ]);

  const handleUtrChange = (val) => {
    setPaymentDetails({ ...paymentDetails, utr: val });
    if (val.trim() === "" || !validateUtr(val)) {
      setErrors((prev) => ({ ...prev, utr: "Please enter a valid UTR Number." }));
    } else {
      setErrors((prev) => ({ ...prev, utr: "" }));
    }
  };

  const handleUpiChange = (val) => {
    setPaymentDetails({ ...paymentDetails, transactionId: val });
    if (val.trim() === "" || !validateUpi(val)) {
      setErrors((prev) => ({ ...prev, upi: "Please enter a valid UPI ID." }));
    } else {
      setErrors((prev) => ({ ...prev, upi: "" }));
    }
  };

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let gstAmount = 0;
    let itemsTotal = 0;

    lines.forEach((l) => {
      const q = Number(l.qty) || 0;
      const r = Number(l.rate) || 0;
      const d = Number(l.discount) || 0;
      const g = Number(l.gst) || 0;

      const rateAfterDisc = r * (1 - d / 100);
      const lineTotal = q * rateAfterDisc;
      const taxableVal = lineTotal / (1 + g / 100);
      const taxVal = lineTotal - taxableVal;

      subtotal += (q * r);
      discountAmount += (q * r) - (q * rateAfterDisc);
      gstAmount += taxVal;
      itemsTotal += lineTotal;
    });

    const addCharges = (Number(freight) || 0) + (Number(packing) || 0) + (Number(otherCharges) || 0);
    const grandBeforeRound = itemsTotal + addCharges;
    const roundedGrand = Math.round(grandBeforeRound);
    const roundOff = roundedGrand - grandBeforeRound;
    const taxableAmount = itemsTotal - gstAmount;
    const balance = Math.max(0, roundedGrand - (Number(receivedAmount) || 0));

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      charges: addCharges,
      roundOff,
      grand: roundedGrand,
      balance
    };
  }, [lines, freight, packing, otherCharges, receivedAmount]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === "Paid") {
      setReceivedAmount(totals.grand);
    } else if (newStatus === "Unpaid") {
      setReceivedAmount(0);
    }
  };

  useEffect(() => {
    if (status === "Paid") {
      setReceivedAmount(totals.grand);
    }
  }, [totals.grand, status]);

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => {
    setLines([...lines, { name: "", hsnSac: "", unit: "Pcs", qty: 1, rate: 0, discount: 0, gst: 18 }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          data: reader.result
        });
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (isSend = false) => {
    if (!lines.some(l => l.name.trim() !== "")) {
      toast.error("Please add at least one item.");
      return;
    }

    if (status !== "Unpaid" && paymentMethod === "Online") {
      const isUtrValid = validateUtr(paymentDetails.utr);
      const isUpiValid = validateUpi(paymentDetails.transactionId);

      let newErrors = { utr: "", upi: "" };
      if (!isUtrValid) {
        newErrors.utr = "Please enter a valid UTR Number.";
        toast.error("Please enter a valid UTR Number.");
      }
      if (!isUpiValid) {
        newErrors.upi = "Please enter a valid UPI ID.";
        toast.error("Please enter a valid UPI ID.");
      }

      if (!isUtrValid || !isUpiValid) {
        setErrors(newErrors);
        return;
      }
    }

    const payload = {
      invoiceNumber: purchaseNo || ("PUR-" + Math.floor(1000 + Math.random() * 9000)),
      supplierInvoiceNo: invoiceNo,
      party: null,
      partyName: supplier || "Walk-in Supplier",
      gstin: gstin,
      phone: phone,
      type: "Purchase",
      date: purchaseDate || new Date().toISOString(),
      invoiceDate: invoiceDate,
      items: lines.filter(l => l.name.trim() !== "").map(l => ({
        name: l.name || "Item",
        hsnSac: l.hsnSac,
        unit: l.unit || "Pcs",
        qty: Number(l.qty) || 1,
        rate: Number(l.rate) || 0,
        discount: Number(l.discount) || 0,
        gst: Number(l.gst) || 0
      })),
      additionalCharges: {
        freight: Number(freight) || 0,
        packing: Number(packing) || 0,
        other: Number(otherCharges) || 0,
        total: totals.charges
      },
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxableAmount: totals.taxableAmount,
      gstAmount: totals.gstAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grand,
      status: status,
      receivedAmount: receivedAmount,
      balanceAmount: totals.balance,
      paymentMethod: status === "Unpaid" ? "Cash" : paymentMethod,
      paymentDetails: status === "Unpaid" ? {} : paymentDetails,
      purchaseNote: purchaseNote,
      remark: remark,
      attachment: attachment
    };

    try {
      const endpoint = isSend ? "/invoices/send" : "/invoices";
      await api.post(endpoint, payload);
      addInvoice();
      localStorage.removeItem("Udaan.purchase_draft");
      toast.success(isSend ? "Purchase record saved & sent successfully!" : "Purchase record created successfully!");
      const userRole = user?.role?.toLowerCase() || "user";
      const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";
      navigate(`${rolePrefix}/billing`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save purchase record");
    }
  };

  return (
    <div className="min-h-[100vh] -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8 bg-slate-50 pb-24 font-sans text-slate-900 relative">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-emerald-800 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">New Purchase</h1>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ReceiptText className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4 max-w-4xl mx-auto">
        {/* 1. Supplier & Purchase Details Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Supplier Details</span>
            <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700">
              Change Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="sm:col-span-2 md:col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Supplier Name</label>
              <Input 
                value={supplier} 
                onChange={(e) => setSupplier(e.target.value)} 
                placeholder="Enter supplier name..."
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm font-medium" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">GSTIN</label>
              <Input 
                value={gstin} 
                onChange={(e) => setGstin(e.target.value.toUpperCase())} 
                placeholder="07AAAAA0000A1Z5"
                maxLength={15}
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Phone Number</label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Mobile number"
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Purchase No</label>
              <Input 
                value={purchaseNo} 
                onChange={(e) => setPurchaseNo(e.target.value)} 
                placeholder="PUR-10001"
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm font-medium" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Supplier Invoice No</label>
              <Input 
                value={invoiceNo} 
                onChange={(e) => setInvoiceNo(e.target.value)} 
                placeholder="INV-2026-01"
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Purchase Date</label>
              <Input 
                type="date"
                value={purchaseDate} 
                onChange={(e) => setPurchaseDate(e.target.value)} 
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm" 
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Invoice Date</label>
              <Input 
                type="date"
                value={invoiceDate} 
                onChange={(e) => setInvoiceDate(e.target.value)} 
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-slate-800 text-xs sm:text-sm" 
              />
            </div>
          </div>
        </div>

        {/* 2. Items Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Items List</span>
            <Button type="button" size="sm" variant="outline" onClick={addLine} className="rounded-full text-xs h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Plus className="mr-1 h-3 w-3" /> Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((l, i) => {
              const q = Number(l.qty) || 0;
              const r = Number(l.rate) || 0;
              const d = Number(l.discount) || 0;
              const lineTotal = (q * r * (1 - d / 100)).toFixed(2);

              return (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4 relative">
                  <div className="grid grid-cols-12 gap-2.5 sm:gap-3">
                    <div className="col-span-12 md:col-span-3">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Product Name</label>
                      <Input value={l.name} onChange={(e) => updateLine(i, 'name', e.target.value)} placeholder="Item description" className="h-9 bg-white" />
                    </div>
                    
                    <div className="col-span-6 md:col-span-2">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">HSN/SAC</label>
                      <Input value={l.hsnSac} onChange={(e) => updateLine(i, 'hsnSac', e.target.value)} placeholder="000000" className="h-9 bg-white" />
                    </div>

                    <div className="col-span-6 md:col-span-1">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Unit</label>
                      <select 
                        value={l.unit || "Pcs"} 
                        onChange={(e) => updateLine(i, 'unit', e.target.value)} 
                        className="h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus-visible:outline-none"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Kg">Kg</option>
                        <option value="Ltr">Ltr</option>
                        <option value="Mtr">Mtr</option>
                        <option value="Pack">Pack</option>
                        <option value="Set">Set</option>
                      </select>
                    </div>

                    <div className="col-span-3 md:col-span-1">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Qty</label>
                      <Input type="number" min={1} value={l.qty} onChange={(e) => updateLine(i, 'qty', e.target.value)} className="h-9 bg-white text-center" />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Rate (Inc)</label>
                      <Input type="number" min={0} value={l.rate} onChange={(e) => updateLine(i, 'rate', e.target.value)} className="h-9 bg-white" />
                    </div>

                    <div className="col-span-3 md:col-span-1">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Disc %</label>
                      <Input type="number" min={0} max={100} value={l.discount} onChange={(e) => updateLine(i, 'discount', e.target.value)} className="h-9 bg-white text-center" />
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">GST %</label>
                      <select 
                        value={[0, 5, 12, 18, 28].includes(Number(l.gst)) ? String(l.gst) : "custom"} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") updateLine(i, 'gst', 3);
                          else updateLine(i, 'gst', Number(val));
                        }} 
                        className="h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus-visible:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div className="col-span-6 md:col-span-1 flex flex-col justify-center">
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">Amount</label>
                      <span className="text-xs font-semibold text-slate-800 pt-1">₹{lineTotal}</span>
                    </div>

                    <div className="col-span-6 md:col-span-1 flex items-end justify-end pb-1">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Additional Charges Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase block border-b pb-2">Additional Charges</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Freight / Shipping (₹)</label>
              <Input 
                type="number" 
                min={0} 
                value={freight} 
                onChange={(e) => setFreight(Number(e.target.value) || 0)} 
                placeholder="0.00" 
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Packing Charges (₹)</label>
              <Input 
                type="number" 
                min={0} 
                value={packing} 
                onChange={(e) => setPacking(Number(e.target.value) || 0)} 
                placeholder="0.00" 
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Other Charges (₹)</label>
              <Input 
                type="number" 
                min={0} 
                value={otherCharges} 
                onChange={(e) => setOtherCharges(Number(e.target.value) || 0)} 
                placeholder="0.00" 
                className="h-9 rounded-xl border border-slate-200 px-3 bg-white text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 4. Summary & Payment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase block border-b pb-2 mb-3">Summary & Payment</span>
          <div className="space-y-2.5 mb-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-800">{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500">Discount</span>
              <span className="font-semibold text-red-600">-{totals.discountAmount.toFixed(2)}</span>
            </div>
            {totals.charges > 0 && (
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Additional Charges</span>
                <span className="font-semibold text-slate-800">+{totals.charges.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500">Taxable Amount</span>
              <span className="font-semibold text-slate-800">{totals.taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500">GST</span>
              <span className="font-semibold text-slate-800">{totals.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500">Round Off</span>
              <span className="font-semibold text-slate-500">{totals.roundOff.toFixed(2)}</span>
            </div>

            <Separator className="my-2" />

            {/* Payment Status */}
            <div className="flex justify-between items-center text-[13px] pt-1">
              <span className="text-slate-600 font-semibold">Payment Status</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-40 h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs sm:text-sm font-medium shadow-sm focus-visible:outline-none"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partially Paid</option>
              </select>
            </div>

            {/* Paid Amount */}
            {status !== "Unpaid" && (
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-600 font-medium">Paid Amount (₹)</span>
                <Input
                  type="number"
                  min={0}
                  max={totals.grand}
                  disabled={status === "Paid"}
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                  className="w-40 h-9 text-right font-semibold rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            )}

            {/* Balance Amount Display */}
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-600 font-medium">Balance Due</span>
              <span className={`font-bold ${totals.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmt(totals.balance)}
              </span>
            </div>

            {/* Payment Method */}
            {status !== "Unpaid" && (
              <div className="flex justify-between items-center text-[13px] pt-1">
                <span className="text-slate-600 font-medium">Payment Method</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-40 h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs sm:text-sm font-medium shadow-sm focus-visible:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online / UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Netbanking">Netbanking</option>
                </select>
              </div>
            )}

            {/* Online Payment Details */}
            {status !== "Unpaid" && paymentMethod === "Online" && (
              <div className="space-y-3 pt-3 border-t border-dashed mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">UPI ID / Transaction ID</label>
                    <Input 
                      value={paymentDetails.transactionId} 
                      onChange={(e) => handleUpiChange(e.target.value)} 
                      placeholder="e.g. name@okhdfcbank" 
                      maxLength={45}
                      className={`h-9 rounded-xl text-xs sm:text-sm ${errors.upi ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.upi && <span className="text-[10px] text-red-500 mt-1 block">{errors.upi}</span>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">UTR Number</label>
                    <Input 
                      value={paymentDetails.utr} 
                      onChange={(e) => handleUtrChange(e.target.value)} 
                      placeholder="e.g. 123456789012" 
                      maxLength={22}
                      className={`h-9 rounded-xl text-xs sm:text-sm ${errors.utr ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.utr && <span className="text-[10px] text-red-500 mt-1 block">{errors.utr}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer / Cheque / Netbanking Details */}
            {status !== "Unpaid" && (paymentMethod === "Bank Transfer" || paymentMethod === "Cheque" || paymentMethod === "Netbanking") && (
              <div className="space-y-3 pt-3 border-t border-dashed mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Bank Name</label>
                    <Input 
                      value={paymentDetails.bankName} 
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })} 
                      placeholder="HDFC / SBI" 
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Ref / Account / Cheque No</label>
                    <Input 
                      value={paymentDetails.accountNumber} 
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })} 
                      placeholder="e.g. 987654321012" 
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">IFSC Code</label>
                    <Input 
                      value={paymentDetails.ifsc} 
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, ifsc: e.target.value })} 
                      placeholder="HDFC0001234" 
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="mb-4" />
          
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-slate-900">Grand Total</span>
            <span className="text-2xl font-bold text-emerald-600">{fmt(totals.grand)}</span>
          </div>
        </div>

        {/* 5. Notes & Remark Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase block border-b pb-2">Notes & Remarks</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Purchase Note</label>
              <textarea 
                value={purchaseNote} 
                onChange={(e) => setPurchaseNote(e.target.value)} 
                placeholder="Enter notes or terms for this purchase..." 
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Internal Remark</label>
              <textarea 
                value={remark} 
                onChange={(e) => setRemark(e.target.value)} 
                placeholder="Enter internal remark or memo..." 
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 6. Attachment Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase block border-b pb-2">Invoice Attachment</span>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Upload Supplier Bill / Receipt Photo</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Upload Invoice File</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              {attachment && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px] font-medium">{attachment.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setAttachment(null)}
                    className="text-red-500 hover:text-red-700 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:justify-center z-20">
        <Button variant="outline" className="flex-1 rounded-full h-12 text-[14px] font-semibold border-slate-300 md:max-w-xs" onClick={() => handleSave(false)}>
          SAVE
        </Button>
        <Button className="flex-[2] rounded-full h-12 text-[14px] font-semibold bg-emerald-500 hover:bg-emerald-600 md:max-w-xs" onClick={() => handleSave(true)}>
          <Send className="mr-2 h-4 w-4" />
          SAVE & SEND
        </Button>
      </div>

      {/* 8. Supplier Selection Dialog */}
      <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
            {suppliersList.map((sup, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSupplier(sup.name);
                  if (sup.gstin) setGstin(sup.gstin);
                  if (sup.phone || sup.mobile) setPhone(sup.phone || sup.mobile);
                  setIsSupplierModalOpen(false);
                  toast.success(`Supplier selected: ${sup.name}`);
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{sup.name}</p>
                  {(sup.mobile || sup.phone) && <p className="text-xs text-slate-500">{sup.mobile || sup.phone}</p>}
                </div>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">Select</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
