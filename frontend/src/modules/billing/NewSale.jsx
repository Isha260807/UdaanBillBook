import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, ReceiptText, Printer, Plus, Send, Trash2, X, ShieldCheck, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useInvoices } from "@/contexts/InvoiceContext";
import { toast } from "sonner";
import api from "@/lib/api";
import { validateUtr, validateUpi } from "@/lib/validation";
import { useMockAuth } from "@/lib/auth-store";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";
import { usePlatformSettings } from "@/lib/platform-settings";
import { TransportDetailsDrawer } from "@/components/TransportDetailsDrawer";
import { printInvoiceHtml } from "@/lib/invoice-pdf";

function TemplatePreviewMini({ previewColor, previewStyle }) {
  const base = "h-8 w-12 rounded border border-slate-300 bg-white flex flex-col p-0.5 space-y-0.5 mb-1.5 overflow-hidden";

  if (previewStyle === "boxed") {
    return (
      <div className={base}>
        <div className={`h-1.5 ${previewColor} w-full rounded-sm`} />
        <div className="h-1 bg-slate-100 w-2/3" />
        <div className="flex-1 border border-slate-200" />
      </div>
    );
  }
  if (previewStyle === "minimal") {
    return (
      <div className={`${base} justify-center`}>
        <div className={`h-0.5 ${previewColor} w-3/4`} />
        <div className="h-3 w-full space-y-0.5 mt-1">
          <div className="h-0.5 bg-slate-200 w-full" />
          <div className="h-0.5 bg-slate-200 w-full" />
        </div>
      </div>
    );
  }
  if (previewStyle === "double-border") {
    return (
      <div className={`${base} border-double border-4 border-slate-700`}>
        <div className="h-1 bg-slate-200 w-full" />
        <div className="flex-1 border-t border-slate-300" />
      </div>
    );
  }
  if (previewStyle === "center-header") {
    return (
      <div className={`${base} justify-between`}>
        <div className={`h-1 ${previewColor} w-1/3 mx-auto`} />
        <div className="h-2 border-t border-b border-slate-100 w-full" />
        <div className="h-1 bg-slate-300 w-1/4 self-end" />
      </div>
    );
  }
  // default: header-bar
  return (
    <div className={base}>
      <div className={`h-2.5 ${previewColor} w-full`} />
      <div className="h-1 bg-slate-100 w-1/2" />
      <div className="flex-1 border-t border-slate-100" />
    </div>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 350;
    canvas.height = 150;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onChange('');
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="w-full h-[150px] bg-white cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 border-t">
        <span className="text-[10px] text-slate-400 font-medium">Draw your signature here</span>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-red-500 hover:text-red-600 font-semibold"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function NewSale() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addInvoice } = useInvoices();
  const { user } = useMockAuth();
  const { settings } = usePlatformSettings();

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  const printSet = settings?.printSettings || {};
  const gstSet = settings?.gstSettings || {};
  const txnSet = settings?.txnSettings || {};

  const cols = printSet.tableColumns && Object.keys(printSet.tableColumns).length > 0 ? printSet.tableColumns : {
    slNo: true,
    itemName: true,
    hsnSac: true,
    quantity: true,
    priceUnit: true,
    amount: true
  };

  const colNames = printSet.tableColumnNames && Object.keys(printSet.tableColumnNames).length > 0 ? printSet.tableColumnNames : {
    slNo: "Sr.",
    itemName: "Product Description",
    hsnSac: "HSN/SAC",
    quantity: "QTY",
    priceUnit: "Rate",
    amount: "Total"
  };

  const order = printSet.columnOrder || [
    "slNo",
    "itemName",
    "itemCode",
    "hsnSac",
    "batchNo",
    "expDate",
    "mfgDate",
    "mrp",
    "size",
    "modelNo",
    "description",
    "count",
    "colour",
    "material",
    "brand",
    "serialNo",
    "challanNo",
    "quantity",
    "unit",
    "priceUnit",
    "discount",
    "discountPercent",
    "taxablePriceUnit",
    "taxAmount",
    "taxPercent",
    "taxableAmount",
    "cess",
    "finalRate",
    "amount"
  ];

  const getInitialState = (key, fallback) => {
    try {
      const saved = localStorage.getItem("Udaan.sale_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) {
          return parsed[key];
        }
      }
    } catch (e) {
      console.error("Failed to parse sale draft", e);
    }
    return fallback;
  };

  // Form fields
  const [customer, setCustomer] = useState(() => getInitialState("customer", ""));
  const [receivedAmount, setReceivedAmount] = useState(() => getInitialState("receivedAmount", 0));
  const [status, setStatus] = useState(() => getInitialState("status", "Unpaid"));
  const [paymentMethod, setPaymentMethod] = useState(() => getInitialState("paymentMethod", "Cash"));
  const [paymentDetails, setPaymentDetails] = useState(() => getInitialState("paymentDetails", {
    transactionId: "",
    utr: "",
    bankName: "",
    accountNumber: "",
    ifsc: ""
  }));

  const [showTransportDrawer, setShowTransportDrawer] = useState(false);
  const [transportDetails, setTransportDetails] = useState({});
  const [shippingDetails, setShippingDetails] = useState({});

  // Additional Meta Fields
  const [reverseCharge, setReverseCharge] = useState(() => getInitialState("reverseCharge", "No"));
  const [challanNo, setChallanNo] = useState(() => getInitialState("challanNo", ""));
  const [vehicleNo, setVehicleNo] = useState(() => getInitialState("vehicleNo", ""));
  const [dateOfSupply, setDateOfSupply] = useState(() => getInitialState("dateOfSupply", ""));
  const [placeOfSupply, setPlaceOfSupply] = useState(() => getInitialState("placeOfSupply", ""));
  const [billedToAddress, setBilledToAddress] = useState(() => getInitialState("billedToAddress", ""));
  const [billedToGstin, setBilledToGstin] = useState(() => getInitialState("billedToGstin", ""));
  const [billedToMobile, setBilledToMobile] = useState(() => getInitialState("billedToMobile", ""));
  const [billedToState, setBilledToState] = useState(() => getInitialState("billedToState", ""));
  const [poNumber, setPoNumber] = useState(() => getInitialState("poNumber", ""));
  const [poDate, setPoDate] = useState(() => getInitialState("poDate", ""));
  const [billingName, setBillingName] = useState(() => getInitialState("billingName", ""));
  const [paymentDate, setPaymentDate] = useState(() => getInitialState("paymentDate", new Date().toISOString().substring(0, 10)));
  const [paymentTime, setPaymentTime] = useState(() => getInitialState("paymentTime", new Date().toTimeString().substring(0, 5)));

  const [errors, setErrors] = useState({ utr: "", upi: "" });
  const [lines, setLines] = useState(() => getInitialState("lines", [
    { name: "", hsnSac: "", qty: 1, rate: 0, discount: 0, gst: 18 }
  ]));

  // Seller Details Fields (Dynamically shown based on PRINT checkboxes)
  const [sellerName, setSellerName] = useState(() => getInitialState("sellerName", ""));
  const [sellerAddress, setSellerAddress] = useState(() => getInitialState("sellerAddress", ""));
  const [sellerEmail, setSellerEmail] = useState(() => getInitialState("sellerEmail", ""));
  const [sellerPhone, setSellerPhone] = useState(() => getInitialState("sellerPhone", ""));
  const [sellerGstin, setSellerGstin] = useState(() => getInitialState("sellerGstin", ""));
  const [logoUrl, setLogoUrl] = useState(() => getInitialState("logoUrl", ""));
  const [invoiceNumber, setInvoiceNumber] = useState(() => getInitialState("invoiceNumber", ""));
  const [bankDetails, setBankDetails] = useState(() => getInitialState("bankDetails", {
    accountNumber: "",
    bankName: "",
    ifsc: "",
    branchName: ""
  }));

  // Footer & T&C Override Fields (Dynamically shown based on PRINT checkboxes)
  const [terms, setTerms] = useState(() => getInitialState("terms", ""));
  const [description, setDescription] = useState(() => getInitialState("description", ""));
  const [receivedBy, setReceivedBy] = useState(() => getInitialState("receivedBy", ""));
  const [deliveredBy, setDeliveredBy] = useState(() => getInitialState("deliveredBy", ""));
  const [acknowledgement, setAcknowledgement] = useState(() => getInitialState("acknowledgement", ""));
  const [signatureText, setSignatureText] = useState(() => getInitialState("signatureText", ""));
  const [signatureUrl, setSignatureUrl] = useState(() => getInitialState("signatureUrl", ""));
  const [signatureImgUrl, setSignatureImgUrl] = useState(() => getInitialState("signatureImgUrl", ""));
  const [sigMode, setSigMode] = useState("draw"); // 'draw' or 'upload'
  const [partyBalance, setPartyBalance] = useState(() => getInitialState("partyBalance", ""));

  const [activePane, setActivePane] = useState("form");
  const [invoiceTemplate, setInvoiceTemplate] = useState(() => {
    if (searchParams.get("ewaybill") === "true") return "Green E-Way";
    return getInitialState("invoiceTemplate", "GST Boxed");
  });
  const [themeColor, setThemeColor] = useState(() => getInitialState("themeColor", "slate"));

  // Invoice preview scaling for mobile
  const invoiceWrapperRef = useRef(null);
  const invoiceScalerRef = useRef(null);

  useEffect(() => {
    const wrapper = invoiceWrapperRef.current;
    const scaler = invoiceScalerRef.current;
    if (!wrapper || !scaler) return;

    const INVOICE_NATURAL_WIDTH = 800; // min-width of the invoice content

    const updateScale = () => {
      const containerWidth = wrapper.clientWidth;
      if (containerWidth < INVOICE_NATURAL_WIDTH && containerWidth > 0) {
        const scale = containerWidth / INVOICE_NATURAL_WIDTH;
        scaler.style.setProperty('--invoice-scale', scale);
        scaler.style.setProperty('--invoice-inner-w', `${INVOICE_NATURAL_WIDTH}px`);
        // Adjust wrapper height to match the scaled content height
        requestAnimationFrame(() => {
          const scaledHeight = scaler.scrollHeight * scale;
          wrapper.style.height = `${scaledHeight}px`;
        });
      } else {
        scaler.style.setProperty('--invoice-scale', '1');
        scaler.style.setProperty('--invoice-inner-w', '100%');
        wrapper.style.height = 'auto';
      }
    };

    const ro = new ResizeObserver(updateScale);
    ro.observe(wrapper);
    ro.observe(scaler);
    // Initial call
    updateScale();

    return () => ro.disconnect();
  }, [activePane]); // re-run when switching to preview pane

  const isEwayMode = ["E way bill", "Green E-Way", "Minimal E-Way", "Official E-Way"].includes(invoiceTemplate);

  useEffect(() => {
    if (searchParams.get("ewaybill") === "true") {
      if (!isEwayMode) setInvoiceTemplate("Green E-Way");
    } else {
      if (isEwayMode) setInvoiceTemplate(settings?.printSettings?.themeName || "GST Boxed");
    }
  }, [searchParams, settings?.printSettings?.themeName]);

  // Dynamic templates from API
  const [availableTemplates, setAvailableTemplates] = useState([]);
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/settings/invoice-templates");
        setAvailableTemplates(res.data);
      } catch (err) {
        // Fallback: if API fails, use empty array (hardcoded templates removed)
        console.error("Failed to fetch invoice templates", err);
      }
    };
    fetchTemplates();
  }, []);

  // Initialize seller details & footer from settings once settings are loaded
  useEffect(() => {
    if (settings?.printSettings) {
      if (!sellerName && settings.printSettings.companyName) setSellerName(settings.printSettings.companyName);
      if (!sellerAddress && settings.printSettings.address) setSellerAddress(settings.printSettings.address);
      if (!sellerEmail && settings.printSettings.email) setSellerEmail(settings.printSettings.email);
      if (!sellerPhone && settings.printSettings.phone) setSellerPhone(settings.printSettings.phone);
      if (!sellerGstin && (settings.printSettings.gstinOnSale || settings.gstSettings?.gstin)) {
        setSellerGstin(settings.printSettings.gstinOnSale || settings.gstSettings?.gstin);
      }
      if (!terms) {
        setTerms("1. We are responsible for the loss of signed Duty slip, check details.\n2. Interest@24% will be charged if bill not paid within 15 days.");
      }
      if (!signatureText && settings.printSettings.signatureText) {
        setSignatureText(settings.printSettings.signatureText);
      }
      if (!signatureUrl && settings.printSettings.signatureUrl) {
        setSignatureUrl(settings.printSettings.signatureUrl);
      }
      if (!signatureImgUrl && settings.printSettings.signatureImgUrl) {
        setSignatureImgUrl(settings.printSettings.signatureImgUrl);
      }
      if (!logoUrl && settings.printSettings.logoUrl) {
        setLogoUrl(settings.printSettings.logoUrl);
      }
    }
  }, [settings]);

  // Sync draft to local storage
  useEffect(() => {
    const draft = {
      customer,
      receivedAmount,
      status,
      paymentMethod,
      paymentDetails,
      lines,
      reverseCharge,
      challanNo,
      vehicleNo,
      dateOfSupply,
      placeOfSupply,
      billedToAddress,
      billedToGstin,
      billedToMobile,
      billedToState,
      invoiceTemplate,
      themeColor,
      sellerName,
      sellerAddress,
      sellerEmail,
      sellerPhone,
      sellerGstin,
      terms,
      description,
      receivedBy,
      deliveredBy,
      acknowledgement,
      signatureText,
      signatureUrl,
      signatureImgUrl,
      partyBalance,
      logoUrl
    };
    localStorage.setItem("Udaan.sale_draft", JSON.stringify(draft));
  }, [
    customer, receivedAmount, status, paymentMethod, paymentDetails, lines,
    reverseCharge, challanNo, vehicleNo, dateOfSupply, placeOfSupply,
    billedToAddress, billedToGstin, billedToMobile, billedToState, invoiceTemplate, themeColor,
    sellerName, sellerAddress, sellerEmail, sellerPhone, sellerGstin,
    terms, description, receivedBy, deliveredBy, acknowledgement, signatureText, signatureUrl, signatureImgUrl, partyBalance,
    logoUrl
  ]);

  const [showAdModal, setShowAdModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [regForm, setRegForm] = useState({ businessName: "", address: "", type: "Retail" });

  useEffect(() => {
    const saved = sessionStorage.getItem('pendingNewSale');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.customer) setCustomer(data.customer);
        if (data.receivedAmount !== undefined) setReceivedAmount(data.receivedAmount);
        if (data.lines) setLines(data.lines);
        if (data.pendingSave) {
          setPendingSave(data.pendingSave);
          const isResume = sessionStorage.getItem('resumeInvoiceFlow') === 'true';
          if (isResume) {
            sessionStorage.removeItem('resumeInvoiceFlow');
            setTimeout(() => continueFlow(null, true), 300);
          }
        }
      } catch (e) { }
      sessionStorage.removeItem('pendingNewSale');
    }
  }, []);

  const handleUtrChange = (val) => {
    setPaymentDetails({ ...paymentDetails, utr: val });
    if (val.trim() === "") {
      setErrors((prev) => ({ ...prev, utr: "" }));
    } else if (!validateUtr(val)) {
      setErrors((prev) => ({ ...prev, utr: `UTR must be 12-22 alphanumeric characters (entered ${val.trim().length})` }));
    } else {
      setErrors((prev) => ({ ...prev, utr: "" }));
    }
  };

  const handleUpiChange = (val) => {
    setPaymentDetails({ ...paymentDetails, transactionId: val });
    if (val.trim() === "") {
      setErrors((prev) => ({ ...prev, upi: "" }));
    } else if (!validateUpi(val)) {
      setErrors((prev) => ({ ...prev, upi: "Enter valid UPI ID (e.g. name@paytm) or 12-30 digit Txn ID" }));
    } else {
      setErrors((prev) => ({ ...prev, upi: "" }));
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let gstAmount = 0;
    let grand = 0;

    lines.forEach((l) => {
      const q = Number(l.qty) || 0;
      const r = Number(l.rate) || 0;
      const d = Number(l.discount) || 0;
      const g = Number(l.gst) || 0;
      const isExcl = l.taxType === "exclusive";

      const rateAfterDisc = r * (1 - d / 100);
      let taxableVal, taxVal, lineTotal;

      if (isExcl) {
        taxableVal = q * rateAfterDisc;
        taxVal = taxableVal * (g / 100);
        lineTotal = taxableVal + taxVal;
      } else {
        lineTotal = q * rateAfterDisc;
        taxableVal = lineTotal / (1 + g / 100);
        taxVal = lineTotal - taxableVal;
      }

      subtotal += (q * r);
      discountAmount += (q * r) - (q * rateAfterDisc);
      gstAmount += taxVal;
      grand += lineTotal;
    });

    const roundedGrand = Math.round(grand);
    const roundOff = roundedGrand - grand;
    const taxableAmount = grand - gstAmount;

    return { subtotal, discountAmount, taxableAmount, gstAmount, roundOff, grand: roundedGrand };
  }, [lines]);

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
    setLines([...lines, { name: "", hsnSac: "", qty: 1, rate: 0, discount: 0, gst: 18 }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const handleMobileAdd = () => {
    setLines([...lines, { name: "", hsnSac: "", qty: 1, rate: 0, discount: 0, gst: 18 }]);
    setEditingItemIndex(lines.length);
    setIsItemModalOpen(true);
  };

  const handleMobileEdit = (index) => {
    setEditingItemIndex(index);
    setIsItemModalOpen(true);
  };

  const handleSave = async (isSend = false) => {
    if (!lines.some(l => l.name.trim() !== "")) {
      toast.error("Please add at least one item.");
      return;
    }

    if (billedToMobile && billedToMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit Customer Mobile Number.");
      return;
    }

    if (sellerPhone && sellerPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit Seller Phone Number.");
      return;
    }

    if (billedToGstin && billedToGstin.length !== 15) {
      toast.error("Please enter a valid 15-character Customer GSTIN.");
      return;
    }

    if (sellerGstin && sellerGstin.length !== 15) {
      toast.error("Please enter a valid 15-character Seller GSTIN.");
      return;
    }

    // Bank Account & IFSC Validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (bankDetails.accountNumber && (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18)) {
      toast.error("Please enter a valid 9 to 18-digit Bank Account Number.");
      return;
    }
    if (bankDetails.ifsc && !ifscRegex.test(bankDetails.ifsc)) {
      toast.error("Please enter a valid 11-character IFSC code (e.g., SBIN0001234).");
      return;
    }

    if (status !== "Unpaid" && paymentMethod === "Bank Transfer") {
      if (paymentDetails.accountNumber && (paymentDetails.accountNumber.length < 9 || paymentDetails.accountNumber.length > 18)) {
        toast.error("Please enter a valid 9 to 18-digit Payment Bank Account Number.");
        return;
      }
      if (paymentDetails.ifsc && !ifscRegex.test(paymentDetails.ifsc)) {
        toast.error("Please enter a valid 11-character Payment IFSC code (e.g., SBIN0001234).");
        return;
      }
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
      invoiceNumber: invoiceNumber || ("INV-" + Math.floor(1000 + Math.random() * 9000)),
      party: null,
      partyName: customer || "Walk-in Customer",
      type: "Sale",
      date: paymentDate ? new Date(paymentDate + "T12:00:00").toISOString() : new Date().toISOString(),
      time: paymentTime,
      items: lines.filter(l => l.name.trim() !== "").map(l => ({
        name: l.name || "Item",
        hsnSac: l.hsnSac,
        qty: Number(l.qty) || 1,
        rate: Number(l.rate) || 0,
        discount: Number(l.discount) || 0,
        gst: Number(l.gst) || 0
      })),
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxableAmount: totals.taxableAmount,
      gstAmount: totals.gstAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grand,
      invoiceTemplate: invoiceTemplate || "GST Boxed",
      themeColor: themeColor || "slate",
      status: status,
      receivedAmount: receivedAmount,
      paymentMethod: status === "Unpaid" ? "Cash" : paymentMethod,
      paymentDetails: status === "Unpaid" ? {} : paymentDetails,
      transportDetails: {
        ...transportDetails,
        vehicleNumber: vehicleNo || transportDetails?.vehicleNumber || "",
        lrNumber: challanNo || transportDetails?.lrNumber || "",
        dateOfSupply: dateOfSupply || transportDetails?.dateOfSupply || ""
      },
      shippingDetails,
      challanNo: challanNo || "",
      vehicleNo: vehicleNo || "",
      dateOfSupply: dateOfSupply || "",
      reverseCharge: reverseCharge || "No",
      terms: terms || "",
      logoUrl: logoUrl || printSet?.logoUrl || "",
      signatureText: signatureText || printSet?.signatureText || "Authorized Signatory",
      signatureUrl: signatureUrl || printSet?.signatureUrl || "",
      signatureImgUrl: signatureImgUrl || printSet?.signatureImgUrl || "",
      billedToAddress: shippingDetails?.shipToAddress || billedToAddress || "",
      billedToGstin: shippingDetails?.shipToGSTIN || billedToGstin || "",
      billedToMobile: shippingDetails?.phone || billedToMobile || "",
      billedToState: shippingDetails?.state || billedToState || "Delhi",
      billingName: customer || "Walk-in Customer",
      sellerDetails: {
        companyName: sellerName || printSet?.companyName || user?.businessName || "",
        address: sellerAddress || printSet?.address || user?.businessAddress || "",
        phone: sellerPhone || printSet?.phone || user?.phone || "",
        email: sellerEmail || printSet?.email || user?.email || "",
        gstin: sellerGstin || printSet?.gstinOnSale || gstSet?.gstin || "",
        logoUrl: logoUrl || printSet?.logoUrl || "",
        signatureText: signatureText || printSet?.signatureText || "Authorized Signatory",
        signatureUrl: signatureUrl || printSet?.signatureUrl || "",
        signatureImgUrl: signatureImgUrl || printSet?.signatureImgUrl || ""
      },
      bankDetails: {
        accountHolder: bankDetails?.accountHolder || sellerName || printSet?.companyName || user?.businessName || "",
        accountNumber: bankDetails?.accountNumber || printSet?.bankAccount || paymentDetails?.accountNumber || "",
        ifsc: bankDetails?.ifsc || printSet?.bankIfsc || paymentDetails?.ifsc || "",
        bankName: bankDetails?.bankName || printSet?.bankName || paymentDetails?.bankName || "",
        branchName: bankDetails?.branchName || printSet?.bankBranch || paymentDetails?.branchName || ""
      }
    };

    const currentSave = { isSend, payload };
    setPendingSave(currentSave);

    try {
      const { data: userData } = await api.get('/auth/me');

      if (userData.showAds) {
        setShowAdModal(true);
        return; // wait for ad to finish
      }

      continueFlow(userData, false, currentSave);
    } catch (err) {
      // Fallback if auth check fails or offline
      continueFlow(user, false, currentSave);
    }
  };

  const continueFlow = async (userData = null, forceResume = false, targetSave = null) => {
    let activeUser = userData;
    if (!activeUser) {
      try {
        const res = await api.get('/auth/me');
        activeUser = res.data;
      } catch (e) {
        activeUser = user;
      }
    }

    if (activeUser?.billLimit !== undefined && activeUser?.billLimit !== -1 && activeUser?.billsGenerated >= activeUser?.billLimit) {
      setShowSubModal(true);
      return;
    }

    executeSave(targetSave);
  };

  const executeSave = async (targetSave = null) => {
    const saveObj = targetSave || pendingSave;
    if (!saveObj) return;
    const { isSend, payload } = saveObj;
    try {
      const endpoint = isSend ? "/invoices/send" : "/invoices";
      await api.post(endpoint, payload);
      addInvoice();
      localStorage.removeItem("Udaan.sale_draft");

      if (isSend) {
        const phoneStr = billedToMobile ? `91${billedToMobile}` : "";
        const msg = encodeURIComponent(
          `Hi ${payload.partyName}, your invoice ${payload.invoiceNumber} of ₹${payload.grandTotal} is generated. Thank you for doing business with us!`
        );
        const waUrl = phoneStr ? `https://wa.me/${phoneStr}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(waUrl, "_blank");
      }

      toast.success(isSend ? "Sale invoice saved & shared via WhatsApp!" : "Sale invoice created successfully!");
      const userRole = user?.role?.toLowerCase() || "user";
      const rolePrefix = (userRole === "staff" || userRole === "viewer") ? "/staff" : "/vendor";
      navigate(`${rolePrefix}/billing`);
    } catch (err) {
      if (err.response?.data?.message === 'LIMIT_REACHED') {
        setShowSubModal(true);
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to save sale invoice");
      }
    } finally {
      setPendingSave(null);
    }
  };

  const showField = (key, fallback = true) => {
    if (printSet[key] !== undefined) return printSet[key];
    return fallback;
  };

  const numberToWords = (num) => {
    if (!num) return "Zero Rupees Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatTens = (n) => {
      if (n < 20) return a[n];
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : "");
    };

    let words = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    const remaining = num;

    if (crore) words += formatTens(crore) + ' Crore ';
    if (lakh) words += formatTens(lakh) + ' Lakh ';
    if (thousand) words += formatTens(thousand) + ' Thousand ';
    if (hundred) words += formatTens(hundred) + ' Hundred ';
    if (remaining) words += formatTens(remaining);

    return (words.trim() + " Rupees Only").replace(/\s+/g, ' ');
  };



  return (
    <div className="min-h-[100vh] -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8 bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top App Bar */}
      <div className="flex h-12 md:h-14 shrink-0 items-center justify-between bg-white px-2 md:px-4 border-b">
        <div className="flex items-center gap-1 md:gap-3 overflow-hidden">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-800 hover:bg-slate-50 rounded-full transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <h1 className="text-xs md:text-sm font-bold tracking-tight text-slate-800 uppercase truncate">New Sale</h1>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActivePane(activePane === "form" ? "preview" : "form")}
            className="flex items-center gap-1 rounded-xl text-[10px] md:text-xs h-8 px-2 md:px-3 md:hidden"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{activePane === "form" ? "View Preview" : "View Form"}</span>
            <span className="sm:hidden">{activePane === "form" ? "Preview" : "Form"}</span>
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 text-slate-600 rounded-xl" onClick={() => printInvoiceHtml()} title="Print Invoice">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Split Screen Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Billing Creator Form */}
        <div className={`w-full md:w-1/2 lg:w-5/12 flex flex-col h-full bg-white md:bg-slate-50 overflow-y-auto border-r custom-scrollbar ${activePane === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-4 space-y-6 md:space-y-4 pb-24 bg-white md:bg-transparent">

            {isEwayMode ? (
              <>
                {/* 1. E-Way Bill Details */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. E-Way Bill Details</span>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">eWay Bill No</Label>
                      <Input
                        value={transportDetails.ewbNumber || ""}
                        onChange={(e) => setTransportDetails({ ...transportDetails, ewbNumber: e.target.value })}
                        placeholder="e.g. 123456789000"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Document Number</Label>
                      <Input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="e.g. INV-1001"
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Address Details */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Address Details</span>
                  <div className="space-y-3">
                    {/* From Section */}
                    <div className="border-b pb-3 space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">From (Seller / Dispatcher)</span>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Seller Name</Label>
                          <Input
                            value={sellerName}
                            onChange={(e) => setSellerName(e.target.value)}
                            placeholder="Seller Company Name"
                            className="h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Seller GSTIN</Label>
                          <Input
                            value={sellerGstin}
                            onChange={(e) => setSellerGstin(e.target.value.toUpperCase().slice(0, 15))}
                            placeholder="Seller GSTIN"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-700">Company Logo</Label>
                          <div className="flex items-center gap-3">
                            <label className="text-[12px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 cursor-pointer font-semibold transition-all">
                              Upload Logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setLogoUrl(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl("")}
                                className="text-[11px] text-red-500 hover:underline font-semibold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {logoUrl && (
                            <div className="border rounded-xl p-2 bg-slate-50 w-24 h-12 flex items-center justify-center">
                              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Dispatch From Address</Label>
                          <Input
                            value={shippingDetails.dispatchFromAddress || ""}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, dispatchFromAddress: e.target.value })}
                            placeholder="Full address of dispatch"
                            className="h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Place of Dispatch</Label>
                          <Input
                            value={shippingDetails.placeOfDispatch || ""}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, placeOfDispatch: e.target.value })}
                            placeholder="e.g. Delhi"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* To Section */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">To (Customer / Consignee)</span>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Customer Name</Label>
                          <Input
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            placeholder="Enter Customer Name"
                            className="h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Customer GSTIN</Label>
                          <Input
                            value={billedToGstin}
                            onChange={(e) => setBilledToGstin(e.target.value.toUpperCase().slice(0, 15))}
                            placeholder="Customer GSTIN"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Ship To Address</Label>
                          <Input
                            value={shippingDetails.shipToAddress || ""}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, shipToAddress: e.target.value })}
                            placeholder="Full delivery address"
                            className="h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Place of Delivery</Label>
                          <Input
                            value={shippingDetails.placeOfDelivery || ""}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, placeOfDelivery: e.target.value })}
                            placeholder="e.g. Mumbai"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Customer State</Label>
                          <Input
                            value={billedToState}
                            onChange={(e) => setBilledToState(e.target.value)}
                            placeholder="e.g. Delhi (07)"
                            className="h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Customer Mobile</Label>
                          <Input
                            value={billedToMobile}
                            onChange={(e) => setBilledToMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit number"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 & 5. Transporter & Vehicle Details */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">4 & 5. Transporter & Vehicle Details</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Transporter Name</Label>
                        <Input
                          value={transportDetails.transporterName || ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, transporterName: e.target.value })}
                          placeholder="Transporter Co. Name"
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Transporter ID (GSTIN)</Label>
                        <Input
                          value={transportDetails.transporterId || ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, transporterId: e.target.value.toUpperCase().slice(0, 15) })}
                          placeholder="Transporter GSTIN"
                          className="h-9 text-xs rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Vehicle Number</Label>
                        <Input
                          value={transportDetails.vehicleNumber || ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, vehicleNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. DL2CAZXXXX"
                          className="h-9 text-xs rounded-lg uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Approx Distance (KM)</Label>
                        <Input
                          type="number"
                          value={transportDetails.approxDistance || ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, approxDistance: Number(e.target.value) })}
                          placeholder="e.g. 250"
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Transport Mode</Label>
                        <select
                          value={transportDetails.modeOfTransport || "Road"}
                          onChange={(e) => setTransportDetails({ ...transportDetails, modeOfTransport: e.target.value })}
                          className="w-full h-9 rounded-lg border bg-white px-2 text-xs focus:outline-none"
                        >
                          <option value="Road">Road</option>
                          <option value="Rail">Rail</option>
                          <option value="Air">Air</option>
                          <option value="Ship">Ship</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Doc/LR No.</Label>
                        <Input
                          value={transportDetails.lrNumber || ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, lrNumber: e.target.value.toUpperCase() })}
                          placeholder="LR No"
                          className="h-9 text-xs rounded-lg uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Doc/LR Date</Label>
                        <Input
                          type="date"
                          value={transportDetails.lrDate ? new Date(transportDetails.lrDate).toISOString().split('T')[0] : ""}
                          onChange={(e) => setTransportDetails({ ...transportDetails, lrDate: e.target.value })}
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Seller/Company Details Block (Dynamically shown based on PRINT checkboxes) */}
                {(printSet.printCompanyName || printSet.printAddress || printSet.printEmail || printSet.printPhone || printSet.printGstin) && (
                  <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Seller Details (Your Info)</span>
                    <div className="space-y-3">
                      {printSet.printCompanyName && (
                        <div className="space-y-1">
                          <Label className="text-xs">Company Name</Label>
                          <Input
                            value={sellerName}
                            onChange={(e) => setSellerName(e.target.value)}
                            placeholder="Seller Company Name"
                            className="h-10 rounded-xl border border-slate-200 focus-visible:ring-1 focus-visible:ring-emerald-500"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">Company Logo</Label>
                        <div className="flex items-center gap-3">
                          <label className="text-[12px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 cursor-pointer font-semibold transition-all">
                            Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setLogoUrl(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl("")}
                              className="text-[11px] text-red-500 hover:underline font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {logoUrl && (
                          <div className="border rounded-xl p-2 bg-slate-50 w-24 h-12 flex items-center justify-center">
                            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                      </div>
                      {printSet.printGstin && (
                        <div className="space-y-1">
                          <Label className="text-xs">GSTIN on Sale</Label>
                          <Input
                            value={sellerGstin}
                            onChange={(e) => setSellerGstin(e.target.value.toUpperCase().slice(0, 15))}
                            maxLength={15}
                            placeholder="Seller GSTIN"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {printSet.printPhone && (
                          <div className="space-y-1">
                            <Label className="text-xs">Phone Number</Label>
                            <Input
                              value={sellerPhone}
                              onChange={(e) => setSellerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              maxLength={10}
                              placeholder="Seller Phone"
                              className="h-9 rounded-lg"
                            />
                          </div>
                        )}
                        {printSet.printEmail && (
                          <div className="space-y-1">
                            <Label className="text-xs">Email Address</Label>
                            <Input
                              value={sellerEmail}
                              onChange={(e) => setSellerEmail(e.target.value)}
                              placeholder="Seller Email"
                              className="h-9 rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      {printSet.printAddress && (
                        <div className="space-y-1">
                          <Label className="text-xs">Seller Address</Label>
                          <Input
                            value={sellerAddress}
                            onChange={(e) => setSellerAddress(e.target.value)}
                            placeholder="Seller Address"
                            className="h-9 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Details Block */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Details (On Invoice)</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Account No.</Label>
                      <Input
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) })}
                        placeholder="Account Number"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bank Name</Label>
                      <Input
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        placeholder="e.g. Axis Bank"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">IFSC Code</Label>
                      <Input
                        value={bankDetails.ifsc}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })}
                        placeholder="e.g. UTIB0003532"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Branch Name</Label>
                      <Input
                        value={bankDetails.branchName}
                        onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                        placeholder="e.g. MG Road Branch"
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Details Block */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billed To (Customer Details)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <Label className="text-xs">Invoice No. (Override)</Label>
                        <Input
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          placeholder="e.g. INV-1001"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Customer Name</Label>
                      <Input
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Enter customer / business name"
                        className="h-10 rounded-xl border border-slate-200 focus-visible:ring-1 focus-visible:ring-emerald-500"
                      />
                    </div>
                    {txnSet.billingName && (
                      <div className="space-y-1">
                        <Label className="text-xs">Billing Name</Label>
                        <Input
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          placeholder="Enter legal / billing name"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Mobile Number</Label>
                        <Input
                          value={billedToMobile}
                          onChange={(e) => setBilledToMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                          placeholder="98765..."
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">GSTIN</Label>
                        <Input
                          value={billedToGstin}
                          onChange={(e) => setBilledToGstin(e.target.value.toUpperCase().slice(0, 15))}
                          maxLength={15}
                          placeholder="07AAAA..."
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Billing Address</Label>
                        <Input
                          value={billedToAddress}
                          onChange={(e) => setBilledToAddress(e.target.value)}
                          placeholder="City, State"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">State & Code</Label>
                        <Input
                          value={billedToState}
                          onChange={(e) => setBilledToState(e.target.value)}
                          placeholder="e.g. Delhi (07)"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>
                    {printSet.currentBalanceParty && (
                      <div className="space-y-1">
                        <Label className="text-xs">Party Current Balance (₹)</Label>
                        <Input
                          type="number"
                          value={partyBalance === 0 ? "" : partyBalance}
                          onChange={(e) => setPartyBalance(e.target.value === "" ? 0 : Number(e.target.value))}
                          placeholder="e.g. 15000"
                          className="h-9 rounded-lg"
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Transport & Additional Details Block */}
                <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transport & Supply Details</span>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Challan No.</Label>
                      <Input
                        value={challanNo}
                        onChange={(e) => setChallanNo(e.target.value)}
                        placeholder="Challan reference"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vehicle Number</Label>
                      <Input
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        placeholder="DL2CAZXXXX"
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Date of Supply</Label>
                      <Input
                        type="date"
                        value={dateOfSupply}
                        onChange={(e) => setDateOfSupply(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                    </div>
                    {gstSet.placeOfSupply && (
                      <div className="space-y-1">
                        <Label className="text-xs">Place of Supply</Label>
                        <Input
                          value={placeOfSupply}
                          onChange={(e) => setPlaceOfSupply(e.target.value)}
                          placeholder="Delhi"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  {txnSet.poDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Customer P.O. No.</Label>
                        <Input
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="P.O. reference"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">P.O. Date</Label>
                        <Input
                          type="date"
                          value={poDate}
                          onChange={(e) => setPoDate(e.target.value)}
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  {gstSet.reverseCharge && (
                    <div className="flex items-center justify-between pt-1">
                      <Label className="text-xs">Reverse Charge</Label>
                      <select
                        value={reverseCharge}
                        onChange={(e) => setReverseCharge(e.target.value)}
                        className="h-8 rounded-lg border text-xs bg-white px-2 focus:outline-none"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Items List Block */}
            <div className="md:bg-white md:rounded-xl md:shadow-sm md:border md:p-4 border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">Item Details List</span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addLine} className="hidden md:flex rounded-full text-xs h-7 px-3 gap-1.5">
                    <Plus className="h-3 w-3" /> Add Item Row
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleMobileAdd} className="flex md:hidden rounded-full text-xs h-7 px-3 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200">
                    <Plus className="h-3 w-3" /> Add Item Row
                  </Button>
                </div>
              </div>

              {/* Mobile Summary List */}
              <div className="md:hidden space-y-3">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">{l.name || `Item ${i + 1}`}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {l.qty} {l.unit || 'unit'} x ₹{l.rate} {l.discount > 0 ? `(-${l.discount}%)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-[10px]" onClick={() => handleMobileEdit(i)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Inline Edit List */}
              <div className="hidden md:block space-y-3">
                {lines.map((l, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-4 relative group">
                    {/* Row 1: Core fields */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Item Name */}
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Item Name</Label>
                        <Input value={l.name} onChange={(e) => updateLine(i, 'name', e.target.value)} placeholder="Product description" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                      </div>

                      {/* HSN/SAC */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">HSN/SAC</Label>
                        <Input value={l.hsnSac} onChange={(e) => updateLine(i, 'hsnSac', e.target.value)} placeholder="996601" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                      </div>

                      {/* Quantity + Free Qty */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Quantity</Label>
                        <Input type="number" min={1} value={l.qty} onChange={(e) => updateLine(i, 'qty', Number(e.target.value) || 0)} className="h-9 bg-white text-xs text-center rounded-lg border-slate-200" />
                        {txnSet.freeQty && (
                          <div className="mt-1">
                            <Input
                              type="number" min={0} value={l.freeQty || 0}
                              onChange={(e) => updateLine(i, 'freeQty', Number(e.target.value) || 0)}
                              placeholder="Free Qty"
                              title="Free Quantity"
                              className="h-7 bg-blue-50 text-[10px] text-center rounded border-blue-200 placeholder:text-blue-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* Rate / Price */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Price/Unit</Label>
                        <Input
                          type="number"
                          min={0}
                          value={l.rate === 0 ? "" : l.rate}
                          onChange={(e) => updateLine(i, 'rate', e.target.value === "" ? 0 : Number(e.target.value))}
                          placeholder="0.00"
                          className="h-9 bg-white text-xs text-right rounded-lg border-slate-200"
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-12 sm:col-span-1 flex sm:justify-end justify-start items-end">
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Purchase Price Tag */}
                    {txnSet.displayPurchasePrice && (
                      <div className="flex items-center gap-2 mt-2.5 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-1.5 max-w-max">
                        <span className="text-[10px] text-amber-600 font-semibold shrink-0">Purchase Price ₹</span>
                        <input
                          type="number"
                          value={l.purchasePrice === 0 ? "" : (l.purchasePrice || "")}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setLines((prev) => prev.map((item, idx) => {
                              if (idx === i) {
                                return {
                                  ...item,
                                  purchasePrice: val
                                };
                              }
                              return item;
                            }));
                          }}
                          placeholder="0.00"
                          className="h-5 w-16 bg-transparent text-[11px] font-bold text-amber-800 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Row 2: Secondary fields */}
                    <div className="grid grid-cols-12 gap-3 mt-3 items-end">
                      {/* Discount */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Discount %</Label>
                        <Input type="number" min={0} max={100} value={l.discount === 0 ? "" : l.discount} onChange={(e) => updateLine(i, 'discount', e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" className="h-9 bg-white text-xs text-center rounded-lg border-slate-200" onFocus={(e) => e.target.select()} />
                      </div>

                      {/* GST Rate */}
                      {gstSet.enableGst && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">GST Rate %</Label>
                          <select
                            value={[0, 5, 12, 18, 28].includes(Number(l.gst)) ? String(l.gst) : "custom"}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateLine(i, 'gst', val === "custom" ? 5 : Number(val));
                            }}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      )}

                      {/* Tax Type (Inclusive/Exclusive) */}
                      {txnSet.taxOnRate && gstSet.enableGst && (
                        <div className="col-span-4 sm:col-span-3">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Tax Type</Label>
                          <select
                            value={l.taxType || "inclusive"}
                            onChange={(e) => updateLine(i, 'taxType', e.target.value)}
                            className="h-9 w-full text-xs rounded-lg border border-slate-200 bg-emerald-50 px-2.5 font-semibold text-emerald-700 focus:outline-none"
                          >
                            <option value="inclusive">Tax Inclusive</option>
                            <option value="exclusive">Tax Exclusive</option>
                          </select>
                        </div>
                      )}

                      {/* Cess */}
                      {gstSet.cessOnItem && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">CESS %</Label>
                          <Input type="number" min={0} value={l.cess || ""} onChange={(e) => updateLine(i, 'cess', Number(e.target.value) || 0)} placeholder="0" className="h-9 bg-white text-xs text-center rounded-lg border-slate-200" />
                        </div>
                      )}

                      {/* Additional columns from print settings */}
                      {cols.itemCode && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.itemCode || "Item Code"}</Label>
                          <Input value={l.itemCode || ""} onChange={(e) => updateLine(i, 'itemCode', e.target.value)} placeholder="Code" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.batchNo && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.batchNo || "Batch No."}</Label>
                          <Input value={l.batchNo || ""} onChange={(e) => updateLine(i, 'batchNo', e.target.value)} placeholder="Batch" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.expDate && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.expDate || "Exp. Date"}</Label>
                          <Input value={l.expDate || ""} onChange={(e) => updateLine(i, 'expDate', e.target.value)} placeholder="MM/YY" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.mfgDate && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.mfgDate || "Mfg. Date"}</Label>
                          <Input value={l.mfgDate || ""} onChange={(e) => updateLine(i, 'mfgDate', e.target.value)} placeholder="MM/YY" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.mrp && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.mrp || "MRP"}</Label>
                          <Input type="number" value={l.mrp || ""} onChange={(e) => updateLine(i, 'mrp', Number(e.target.value) || 0)} placeholder="MRP" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.size && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.size || "Size"}</Label>
                          <Input value={l.size || ""} onChange={(e) => updateLine(i, 'size', e.target.value)} placeholder="Size" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.modelNo && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.modelNo || "Model No."}</Label>
                          <Input value={l.modelNo || ""} onChange={(e) => updateLine(i, 'modelNo', e.target.value)} placeholder="Model" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.description && (
                        <div className="col-span-12 sm:col-span-4">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.description || "Description"}</Label>
                          <Input value={l.description || ""} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Item notes..." className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.count && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.count || "Count"}</Label>
                          <Input type="number" value={l.count || ""} onChange={(e) => updateLine(i, 'count', Number(e.target.value) || 0)} placeholder="Count" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.colour && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.colour || "Colour"}</Label>
                          <Input value={l.colour || ""} onChange={(e) => updateLine(i, 'colour', e.target.value)} placeholder="Colour" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.material && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.material || "Material"}</Label>
                          <Input value={l.material || ""} onChange={(e) => updateLine(i, 'material', e.target.value)} placeholder="Material" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.brand && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.brand || "Brand"}</Label>
                          <Input value={l.brand || ""} onChange={(e) => updateLine(i, 'brand', e.target.value)} placeholder="Brand" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.serialNo && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.serialNo || "Serial No."}</Label>
                          <Input value={l.serialNo || ""} onChange={(e) => updateLine(i, 'serialNo', e.target.value)} placeholder="Serial" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.challanNo && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.challanNo || "Challan No."}</Label>
                          <Input value={l.challanNo || ""} onChange={(e) => updateLine(i, 'challanNo', e.target.value)} placeholder="Challan" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                      {cols.unit && (
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">{colNames.unit || "Unit"}</Label>
                          <Input value={l.unit || ""} onChange={(e) => updateLine(i, 'unit', e.target.value)} placeholder="Pcs/Kgs" className="h-9 bg-white text-xs rounded-lg border-slate-200" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Footer / Additional Details Card */}
            {!isEwayMode && (printSet.printDescription || printSet.printTermsAndConditions || printSet.printAcknowledgement || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printSignatureText) && (
              <div className="md:bg-white md:rounded-xl md:p-4 md:shadow-sm md:border border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Footer & T&C Details</span>
                <div className="space-y-3">
                  {printSet.printDescription && (
                    <div className="space-y-1">
                      <Label className="text-xs">Invoice Note / Description</Label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description or note"
                        rows="3"
                        className="w-full text-xs p-2.5 border rounded-xl focus:outline-none bg-white border-slate-200"
                      />
                    </div>
                  )}
                  {printSet.printTermsAndConditions && (
                    <div className="space-y-1">
                      <Label className="text-xs">Terms & Conditions</Label>
                      <textarea
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        placeholder="Enter terms & conditions"
                        rows="3"
                        className="w-full text-xs p-2.5 border rounded-xl focus:outline-none bg-white border-slate-200"
                      />
                    </div>
                  )}
                  {printSet.printSignatureText && (
                    <div className="space-y-4 pt-2 border-t border-dashed">
                      <div className="space-y-1">
                        <Label className="text-xs">Signature Text</Label>
                        <Input
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="e.g. Authorized Signatory"
                          className="h-9 rounded-lg"
                        />
                      </div>

                      {/* Seal Upload */}
                      <div className="space-y-2">
                        <Label className="text-xs block font-semibold text-slate-700">Seal Image</Label>
                        <div className="flex items-center gap-3">
                          <label className="text-[12px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 cursor-pointer font-semibold transition-all">
                            Upload Seal Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setSignatureUrl(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {signatureUrl && (
                            <button
                              type="button"
                              onClick={() => setSignatureUrl("")}
                              className="text-[11px] text-red-500 hover:underline font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {signatureUrl && (
                          <div className="border rounded-xl p-2 bg-slate-50 w-32 h-16 flex items-center justify-center">
                            <img src={signatureUrl} alt="Seal" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                      </div>

                      {/* Signature Option */}
                      <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                        <Label className="text-xs block font-semibold text-slate-700">Authorized Signature</Label>
                        <div className="inline-flex w-auto gap-1 p-0.5 bg-slate-100 rounded-lg mb-2">
                          <button
                            type="button"
                            onClick={() => setSigMode("draw")}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap ${sigMode === "draw" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                          >
                            <span className="sm:hidden">Draw</span>
                            <span className="hidden sm:inline">Draw Signature</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSigMode("upload")}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap ${sigMode === "upload" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                          >
                            <span className="sm:hidden">Upload</span>
                            <span className="hidden sm:inline">Upload Signature</span>
                          </button>
                        </div>

                        {sigMode === "draw" ? (
                          <SignaturePad value={signatureImgUrl} onChange={setSignatureImgUrl} />
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <label className="text-[12px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 cursor-pointer font-semibold transition-all">
                                Upload Signature Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setSignatureImgUrl(reader.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {signatureImgUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSignatureImgUrl("")}
                                  className="text-[11px] text-red-500 hover:underline font-semibold"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            {signatureImgUrl && (
                              <div className="border rounded-xl p-2 bg-slate-50 w-32 h-16 flex items-center justify-center">
                                <img src={signatureImgUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {printSet.printAcknowledgement && (
                    <div className="space-y-1">
                      <Label className="text-xs">Acknowledgement Text</Label>
                      <Input
                        value={acknowledgement}
                        onChange={(e) => setAcknowledgement(e.target.value)}
                        placeholder="e.g. Received goods in good condition"
                        className="h-9 rounded-lg"
                      />
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Calculations & Payment Configuration */}
            {!isEwayMode && printSet.paymentMode && (
              <div className="md:bg-white md:rounded-xl md:shadow-sm md:border md:p-4 border-b border-slate-100 md:border-b-0 pb-6 md:pb-0 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payment Setup</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Status</Label>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full h-9 rounded-lg border bg-white px-2 focus:outline-none"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partially Paid</option>
                    </select>
                  </div>
                  {status !== "Unpaid" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Method</Label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full h-9 rounded-lg border bg-white px-2 focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  )}
                </div>

                {status !== "Unpaid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Date</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Time</Label>
                      <Input
                        type="time"
                        value={paymentTime}
                        onChange={(e) => setPaymentTime(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {status !== "Unpaid" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Amount Received (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={totals.grand}
                      disabled={status === "Paid"}
                      value={receivedAmount === 0 ? "" : receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="h-9 rounded-lg text-right font-bold bg-slate-50 border-slate-200 focus-visible:bg-white"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                )}

                {status !== "Unpaid" && paymentMethod === "Online" && (
                  <div className="space-y-3 pt-3 border-t border-dashed border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Online Payment Details</span>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-medium">Transaction ID / UPI</Label>
                        <Input
                          value={paymentDetails.transactionId}
                          onChange={(e) => handleUpiChange(e.target.value.slice(0, 30))}
                          maxLength={30}
                          placeholder="e.g. harsh@paytm or 123456789012"
                          className={`h-9 text-xs rounded-lg ${errors.upi ? 'border-red-400 bg-red-50/50 focus-visible:ring-red-300' : 'border-slate-200'}`}
                        />
                        {errors.upi && (
                          <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.upi}</p>
                        )}
                        <p className="text-[9px] text-slate-400">UPI ID (name@bank) or 12-30 digit Txn ID</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-medium">UTR Number</Label>
                        <Input
                          value={paymentDetails.utr}
                          onChange={(e) => handleUtrChange(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 22))}
                          maxLength={22}
                          placeholder="e.g. UTIB12345678901234"
                          className={`h-9 text-xs rounded-lg ${errors.utr ? 'border-red-400 bg-red-50/50 focus-visible:ring-red-300' : 'border-slate-200'}`}
                        />
                        {errors.utr && (
                          <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.utr}</p>
                        )}
                        <p className="text-[9px] text-slate-400">12-22 alphanumeric characters</p>
                      </div>
                    </div>
                  </div>
                )}

                {status !== "Unpaid" && paymentMethod === "Bank Transfer" && (
                  <div className="space-y-3 pt-3 border-t border-dashed">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500">Bank Name</Label>
                        <Input
                          value={paymentDetails.bankName}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500">Account No.</Label>
                        <Input
                          value={paymentDetails.accountNumber}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500">IFSC Code</Label>
                        <Input
                          value={paymentDetails.ifsc}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Print Preview styled as selected Vyapar Theme */}
        <div className={`w-full md:w-1/2 lg:w-7/12 flex flex-col h-full bg-slate-200 overflow-y-auto p-2 sm:p-4 custom-scrollbar ${activePane === 'form' ? 'hidden md:flex' : 'flex'}`}>

          {/* Visual Invoice/E-Way Template Selector */}
          <div className="mb-2 sm:mb-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-sm shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider hidden md:block">
              {isEwayMode ? "Select E-Way Design" : "Select Invoice Design"}
            </h3>

            {/* Desktop Template Selector */}
            <div className="hidden md:flex flex-wrap gap-2.5">
              {(isEwayMode ? [
                { id: "Green E-Way", name: "Green E-Way" },
                { id: "Official E-Way", name: "Official E-Way" },
                { id: "Minimal E-Way", name: "Minimal E-Way" }
              ] : [
                { id: "GST Boxed", name: "Standard (Boxed)" },
                { id: "Classic White", name: "Classic" },
                { id: "Modern Blue", name: "Modern" },
                { id: "Minimalist", name: "Minimal" },
                { id: "Professional", name: "Professional" }
              ]).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setInvoiceTemplate(tpl.id)}
                  className={`h-8 px-4 rounded-xl text-[11px] font-bold transition-all border ${invoiceTemplate === tpl.id
                      ? "bg-slate-800 text-white border-slate-800 shadow-md scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            {/* Mobile Template Selector Dropdown */}
            <div className="md:hidden flex items-center justify-between w-full">
              <span className="text-[10px] font-medium text-slate-700 uppercase tracking-wider">Design:</span>
              <select
                value={invoiceTemplate}
                onChange={(e) => setInvoiceTemplate(e.target.value)}
                className="h-7 sm:h-8 px-2 w-36 text-[10px] font-medium bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {isEwayMode ? (
                  <>
                    <option value="Green E-Way">Green E-Way</option>
                    <option value="Official E-Way">Official E-Way</option>
                    <option value="Minimal E-Way">Minimal E-Way</option>
                  </>
                ) : (
                  <>
                    <option value="GST Boxed">Standard (Boxed)</option>
                    <option value="Classic White">Classic</option>
                    <option value="Modern Blue">Modern</option>
                    <option value="Minimalist">Minimal</option>
                    <option value="Professional">Professional</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Responsive invoice preview: scales down on mobile to fit screen */}
          <div ref={invoiceWrapperRef} className="invoice-preview-wrapper w-full mx-auto" style={{ maxWidth: '210mm' }}>
            <div ref={invoiceScalerRef} className="invoice-preview-scaler">
              <div className="bg-white shadow-xl rounded-xl border border-slate-300 w-full p-3 sm:p-6 text-[11px] text-slate-800 leading-normal relative overflow-hidden" style={{ minWidth: '800px' }}>
                <InvoiceTemplateRenderer
                  invoice={{
                    customer,
                    receivedAmount,
                    status,
                    paymentMethod,
                    paymentDetails,
                    lines,
                    totals,
                    reverseCharge,
                    challanNo,
                    vehicleNo,
                    dateOfSupply,
                    placeOfSupply,
                    billedToAddress,
                    billedToGstin,
                    billedToMobile,
                    billedToState,
                    bankDetails,
                    invoiceNumber: invoiceNumber || "INV-" + (settings?.lastInvoiceNo || "1001"),
                    date: paymentDate ? new Date(paymentDate + "T12:00:00").toISOString() : new Date().toISOString(),
                    time: paymentTime,
                    terms,
                    description,
                    receivedBy,
                    deliveredBy,
                    acknowledgement,
                    partyBalance,
                    billingName,
                    poNumber,
                    poDate,
                    transportDetails,
                    shippingDetails
                  }}
                  printSettings={{
                    ...printSet,
                    companyName: sellerName,
                    address: sellerAddress,
                    email: sellerEmail,
                    phone: sellerPhone,
                    signatureText: signatureText,
                    signatureUrl: signatureUrl,
                    signatureImgUrl: signatureImgUrl,
                    logoUrl: logoUrl
                  }}
                  gstSettings={{
                    ...gstSet,
                    gstin: sellerGstin
                  }}
                  templateName={invoiceTemplate}
                  templateData={availableTemplates.find(t => t.name === invoiceTemplate)}
                  themeColor={themeColor}
                  numberToWords={numberToWords}
                  documentType={isEwayMode ? "EWAY" : "INVOICE"}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Transport Drawer */}
      <TransportDetailsDrawer
        isOpen={showTransportDrawer}
        onClose={() => setShowTransportDrawer(false)}
        onSave={() => {
          setShowTransportDrawer(false);
          // Update the pendingSave payload before executing
          if (pendingSave) {
            pendingSave.payload.transportDetails = transportDetails;
            pendingSave.payload.shippingDetails = shippingDetails;
          }
          executeSave();
        }}
        transportDetails={transportDetails}
        setTransportDetails={setTransportDetails}
        shippingDetails={shippingDetails}
        setShippingDetails={setShippingDetails}
      />

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Advertisement</span>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Upgrade Your Business Today!</h3>
              <div className="h-32 w-full bg-emerald-100 rounded-xl mb-4 flex items-center justify-center text-emerald-800/50">
                [ Sponsored Content ]
              </div>
              <p className="text-sm text-slate-600">Get 50% off on premium subscriptions this month.</p>
            </div>
            <div className="p-4 flex justify-end">
              <Button onClick={() => { setShowAdModal(false); continueFlow(); }} className="bg-emerald-600 hover:bg-emerald-700">
                Skip Ad & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Complete Profile</h3>
                  <p className="text-xs text-slate-500">Required before your first bill</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business Name</label>
                  <Input value={regForm.businessName} onChange={e => setRegForm({ ...regForm, businessName: e.target.value })} placeholder="e.g. Udaan Store" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Business Type</label>
                  <Input value={regForm.type} onChange={e => setRegForm({ ...regForm, type: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Address</label>
                  <Input value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowRegisterModal(false); setPendingSave(null); }}>Cancel</Button>
              <Button onClick={() => {
                // Mock save profile
                setShowRegisterModal(false);
                setShowSubModal(true); // show sub modal next
              }} className="bg-blue-600 hover:bg-blue-700">Save Details</Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Choose a Plan</h3>
              <p className="text-sm text-slate-500 mb-6">Select a subscription plan to continue generating bills.</p>

              <div className="space-y-3">
                <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => { setShowSubModal(false); executeSave(); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-emerald-800">Free Trial</span>
                    <span className="font-bold text-emerald-600">₹0/mo</span>
                  </div>
                  <p className="text-xs text-emerald-600 text-left">Generate up to 10 bills free</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { navigate('/pricing'); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Pro Plan</span>
                    <span className="font-bold text-blue-600">₹499/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 text-left">Unlimited bills + Priority support</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <Button variant="ghost" onClick={() => { setShowSubModal(false); setPendingSave(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Item Details Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-md w-[95vw] bg-white p-5 max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-slate-800">Item Details</DialogTitle>
          </DialogHeader>

          {editingItemIndex !== null && lines[editingItemIndex] && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Item Name</Label>
                <Input value={lines[editingItemIndex].name} onChange={(e) => updateLine(editingItemIndex, 'name', e.target.value)} placeholder="Product description" className="h-11 bg-slate-50 border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quantity</Label>
                  <Input type="number" min={1} value={lines[editingItemIndex].qty} onChange={(e) => updateLine(editingItemIndex, 'qty', Number(e.target.value) || 0)} className="h-11 bg-slate-50 border-slate-200 text-center" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Price/Unit (₹)</Label>
                  <Input type="number" min={0} value={lines[editingItemIndex].rate === 0 ? "" : lines[editingItemIndex].rate} onChange={(e) => updateLine(editingItemIndex, 'rate', e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0.00" className="h-11 bg-slate-50 border-slate-200 text-right font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Discount %</Label>
                  <Input type="number" min={0} max={100} value={lines[editingItemIndex].discount} onChange={(e) => updateLine(editingItemIndex, 'discount', Number(e.target.value) || 0)} className="h-11 bg-slate-50 border-slate-200 text-center" />
                </div>
                {gstSet.enableGst && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">GST Rate %</Label>
                    <select
                      value={[0, 5, 12, 18, 28].includes(Number(lines[editingItemIndex].gst)) ? String(lines[editingItemIndex].gst) : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateLine(editingItemIndex, 'gst', val === "custom" ? 5 : Number(val));
                      }}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">HSN/SAC</Label>
                  <Input value={lines[editingItemIndex].hsnSac} onChange={(e) => updateLine(editingItemIndex, 'hsnSac', e.target.value)} placeholder="996601" className="h-11 bg-slate-50 border-slate-200" />
                </div>
                {txnSet.taxOnRate && gstSet.enableGst && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tax Type</Label>
                    <select
                      value={lines[editingItemIndex].taxType || "inclusive"}
                      onChange={(e) => updateLine(editingItemIndex, 'taxType', e.target.value)}
                      className="h-11 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 focus:outline-none"
                    >
                      <option value="inclusive">Tax Inclusive</option>
                      <option value="exclusive">Tax Exclusive</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button type="button" className="w-full h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md" onClick={() => setIsItemModalOpen(false)}>
              Save & Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Bottom Action bar */}
      <div className="sticky bottom-0 shrink-0 bg-white border-t p-1.5 md:p-4 flex flex-col md:flex-row gap-1.5 md:gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:justify-center items-center z-10">
        <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-full border border-slate-200 self-stretch md:self-auto shrink-0 mb-0.5 md:mb-0 overflow-x-auto custom-scrollbar">
          <button
            className={`flex-1 md:w-28 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${!isEwayMode ? 'bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setInvoiceTemplate(settings?.printSettings?.themeName || "GST Boxed")}
          >
            Invoice
          </button>

          <button
            className={`flex-1 md:w-28 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${isEwayMode ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => {
              if (!isEwayMode) setInvoiceTemplate("Green E-Way");
            }}
          >
            E-Way Bill
          </button>
        </div>

        <div className="flex flex-row w-full md:w-auto gap-1.5 md:gap-2">
          <Button variant="outline" className="flex-1 rounded-full h-8 md:h-10 text-xs md:text-sm font-medium border-slate-300 md:max-w-xs px-2 whitespace-nowrap uppercase tracking-wide" onClick={() => handleSave(false)}>
            SAVE {isEwayMode ? "E-WAY" : "INVOICE"}
          </Button>
          <Button className="flex-[1.5] md:flex-[2] rounded-full h-8 md:h-10 text-xs md:text-sm font-medium bg-emerald-500 hover:bg-emerald-600 md:max-w-xs px-2 whitespace-nowrap uppercase tracking-wide" onClick={() => handleSave(true)}>
            <Send className="mr-1 h-3 w-3 md:mr-1.5 md:h-3.5 md:w-3.5" />
            SAVE & SEND
          </Button>
        </div>
      </div>
    </div>
  );
}
