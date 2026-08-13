import React from "react";
import { useMockAuth } from "@/lib/auth-store";
import { TEMPLATES } from "./registry";

export function normalizeInvoice(inv) {
  if (!inv) return null;
  const isPurchase = (inv.type || "").toLowerCase() === "purchase";
  const rawLines = inv.lines || inv.items || [];
  const lines = rawLines.filter((l) => l.name && l.name.trim() !== "").map(l => ({
    ...l,
    unit: l.unit || "Pcs"
  }));
  const customer = inv.partyName || inv.supplier || inv.customer || (isPurchase ? "Walk-in Supplier" : "Walk-in Customer");
  const origTotals = inv.totals || {
    subtotal: inv.subtotal || 0,
    discountAmount: inv.discountAmount || 0,
    taxableAmount: inv.taxableAmount || 0,
    gstAmount: inv.gstAmount || 0,
    roundOff: inv.roundOff || 0,
    grand: inv.grandTotal || inv.grand || 0
  };

  const isRcm = String(inv.reverseCharge || "").toLowerCase() === "yes";

  const totals = isRcm ? {
    ...origTotals,
    grand: Math.round(origTotals.taxableAmount + (Number(inv.additionalCharges?.total) || 0))
  } : origTotals;

  const meta = {
    isPurchase,
    type: inv.type || "Sale",
    supplierInvoiceNo: inv.supplierInvoiceNo || "",
    reverseCharge: inv.reverseCharge || "No",
    challanNo: inv.challanNo || inv.transportDetails?.challanNo || inv.transportDetails?.lrNumber || "",
    vehicleNo: inv.vehicleNo || inv.transportDetails?.vehicleNo || inv.transportDetails?.vehicleNumber || "",
    dateOfSupply: inv.dateOfSupply || inv.transportDetails?.dateOfSupply || (inv.transportDetails?.lrDate ? String(inv.transportDetails.lrDate).split('T')[0] : ""),
    placeOfSupply: inv.placeOfSupply || inv.shippingDetails?.placeOfDelivery || "Delhi",
    billedToAddress: inv.billedToAddress || inv.shippingDetails?.shipToAddress || inv.party?.address || inv.partyAddress || "",
    billedToGstin: inv.gstin || inv.billedToGstin || inv.shippingDetails?.shipToGSTIN || inv.party?.gstin || "",
    billedToMobile: inv.phone || inv.billedToMobile || inv.shippingDetails?.phone || inv.party?.phone || "",
    billedToEmail: inv.email || inv.billedToEmail || inv.party?.email || "",
    billedToState: inv.billedToState || inv.shippingDetails?.state || inv.party?.state || "Delhi",
    billingName: inv.partyName || inv.supplier || inv.billingName || inv.shippingDetails?.shipToName || inv.party?.name || "",
    poNumber: inv.poNumber || "",
    poDate: inv.poDate || "",
    validUntilDate: inv.validUntilDate || "",
    originalInvoiceNo: inv.originalInvoiceNo || "",
    originalInvoiceDate: inv.originalInvoiceDate || "",
    noteReason: inv.noteReason || "",
    shippingBillNo: inv.shippingBillNo || "",
    shippingBillDate: inv.shippingBillDate || "",
    portCode: inv.portCode || "",
    exportCurrency: inv.exportCurrency || "",
    expectedDeliveryDate: inv.expectedDeliveryDate || "",
    challanDate: inv.challanDate || "",
    time: inv.time || "",
    invoiceNumber: inv.invoiceNumber || (isPurchase ? "PUR-XXXX" : "INV-XXXX"),
    date: inv.date 
      ? `${new Date(inv.date).toLocaleDateString('en-IN')}${inv.time ? ' ' + inv.time : ''}` 
      : `${new Date().toLocaleDateString('en-IN')}${inv.time ? ' ' + inv.time : ''}`,
    invoiceDate: inv.invoiceDate ? `${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}` : ""
  };

  const calcBalance = totals.grand - (Number(inv.receivedAmount) || 0);

  return { 
    isPurchase,
    type: inv.type || "Sale",
    supplierInvoiceNo: inv.supplierInvoiceNo || "",
    additionalCharges: inv.additionalCharges || null,
    purchaseNote: inv.purchaseNote || "",
    remark: inv.remark || "",
    receivedAmount: inv.receivedAmount || 0,
    balanceAmount: calcBalance,
    customer, 
    lines, 
    totals, 
    meta, 
    status: inv.status || "Unpaid", 
    paymentMethod: inv.paymentMethod || "Cash", 
    paymentDetails: inv.paymentDetails || {},
    bankDetails: inv.bankDetails || {},
    transportDetails: inv.transportDetails || {},
    shippingDetails: inv.shippingDetails || {},
    description: inv.description || "",
    terms: inv.terms || "",
    receivedBy: inv.receivedBy || "",
    deliveredBy: inv.deliveredBy || "",
    acknowledgement: inv.acknowledgement || "",
    partyBalance: inv.partyBalance || "",
    restaurantDetails: inv.restaurantDetails || null,
    hotelDetails: inv.hotelDetails || null,
    retailDetails: inv.retailDetails || null
  };
}

export function InvoiceTemplateRenderer({ invoice, templateName, printSettings, gstSettings, documentType = "INVOICE" }) {
  const { user } = useMockAuth();
  
  if (!invoice) return <div className="p-8 text-center text-slate-400">No invoice data available</div>;
  
  const normalizedInvoice = normalizeInvoice(invoice);

  const isCompanyNameEnabled = printSettings?.printCompanyName !== false;
  const isAddressEnabled = printSettings?.printAddress !== false;
  const isPhoneEnabled = printSettings?.printPhone !== false;
  const isEmailEnabled = printSettings?.printEmail !== false;
  const isLogoEnabled = printSettings?.printCompanyLogo !== false;
  const isGstinEnabled = printSettings?.printGstin !== false;

  const effectivePrintSet = {
    taxDetails: printSettings?.taxDetails !== false,
    ...printSettings,
    printCompanyName: isCompanyNameEnabled,
    printCompanyLogo: isLogoEnabled,
    printAddress: isAddressEnabled,
    printPhone: isPhoneEnabled,
    printEmail: isEmailEnabled,
    printGstin: isGstinEnabled,
    companyName: isCompanyNameEnabled ? (invoice.sellerDetails?.companyName || printSettings?.companyName || user?.businessName || "") : "",
    address: isAddressEnabled ? (invoice.sellerDetails?.address || printSettings?.address || user?.businessAddress || "") : "",
    phone: isPhoneEnabled ? (invoice.sellerDetails?.phone || printSettings?.phone || user?.phone || "") : "",
    email: isEmailEnabled ? (invoice.sellerDetails?.email || printSettings?.email || user?.email || "") : "",
    logoUrl: isLogoEnabled ? (invoice.logoUrl || invoice.sellerDetails?.logoUrl || printSettings?.logoUrl || "") : "",
    signatureText: invoice.signatureText || invoice.sellerDetails?.signatureText || printSettings?.signatureText || "Authorized Signatory",
    signatureUrl: invoice.signatureUrl || invoice.sellerDetails?.signatureUrl || printSettings?.signatureUrl || "",
    signatureImgUrl: invoice.signatureImgUrl || invoice.sellerDetails?.signatureImgUrl || printSettings?.signatureImgUrl || "",
  };

  const effectiveGstSet = {
    ...gstSettings,
    gstin: isGstinEnabled ? (invoice.sellerDetails?.gstin || gstSettings?.gstin || (typeof printSettings?.gstinOnSale === "string" ? printSettings.gstinOnSale : "") || "") : ""
  };

  const colors = [
    { id: "slate", raw: "#334155", class: "text-slate-800", bgClass: "bg-slate-800" },
    { id: "emerald", raw: "#059669", class: "text-emerald-700", bgClass: "bg-emerald-700" },
    { id: "blue", raw: "#2563eb", class: "text-blue-700", bgClass: "bg-blue-700" },
    { id: "indigo", raw: "#4f46e5", class: "text-indigo-700", bgClass: "bg-indigo-700" },
    { id: "violet", raw: "#7c3aed", class: "text-violet-700", bgClass: "bg-violet-700" },
    { id: "rose", raw: "#e11d48", class: "text-rose-700", bgClass: "bg-rose-700" }
  ];

  const resolvedTemplateName = templateName || invoice?.invoiceTemplate || invoice?.templateName || "GST Boxed";
  const templateSpecificColor = effectivePrintSet?.templateColors?.[resolvedTemplateName];
  const rawColor = templateSpecificColor || (effectivePrintSet?.themeName === resolvedTemplateName ? (effectivePrintSet?.themeColor || effectivePrintSet?.activeColor) : null);
  
  const hexValue = (typeof rawColor === 'object' && rawColor?.raw) 
    ? rawColor.raw 
    : (rawColor && typeof rawColor === 'string' && rawColor.startsWith('#') ? rawColor : null);
    
  const matched = hexValue 
    ? colors.find(c => c && c.raw && (c.id === rawColor || c.raw.toLowerCase() === hexValue.toLowerCase())) 
    : null;

  const activeColor = matched || {
    id: hexValue ? "custom" : "default",
    raw: hexValue || "",
    text: "",
    bgClass: "",
    style: hexValue ? { color: hexValue } : {},
    bgStyle: hexValue ? { backgroundColor: hexValue } : {}
  };

  const aToWords = (amount) => {
    if (!amount || isNaN(amount) || amount === 0) return "Zero";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (num) => {
      if ((num = num.toString()).length > 9) return 'overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return ''; 
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str;
    };
    return convert(Math.floor(amount)) + "Rupees Only";
  };

  const getDocTypeTemplates = () => {
    return TEMPLATES[documentType] || TEMPLATES.INVOICE;
  };

  const allTemplates = { ...TEMPLATES.INVOICE, ...TEMPLATES.EWAY, ...(TEMPLATES[documentType] || {}) };
  const templateConfig = allTemplates[resolvedTemplateName] || TEMPLATES.INVOICE[resolvedTemplateName] || TEMPLATES.INVOICE["GST Boxed"] || Object.values(allTemplates)[0];
  
  if (!templateConfig || !templateConfig.component) {
    return <div className="p-4 text-red-500">Template not found: {resolvedTemplateName}</div>;
  }

  const TemplateComponent = templateConfig.component;

  const showUdaanLogo = user?.subscription?.showUdaanLogo ?? true;

  return (
    <div className="bg-white relative" id="invoice-print-area">
      <TemplateComponent 
        invoice={normalizedInvoice} 
        printSet={effectivePrintSet} 
        gstSet={effectiveGstSet}
        activeColor={activeColor}
        numberToWords={aToWords}
        showUdaanLogo={showUdaanLogo}
      />
    </div>
  );
}
