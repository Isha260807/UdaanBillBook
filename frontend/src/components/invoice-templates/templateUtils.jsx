export function getTransactionTitle(invoice, printSet = {}, gstSet = {}) {
  const names = printSet.transactionNames || {};
  const typeLower = (invoice?.type || "").toLowerCase();

  if (typeLower === "estimate" || typeLower === "quotation") {
    return (names.estimate || "ESTIMATE").toUpperCase();
  }
  if (typeLower === "purchase") {
    return (names.purchase || "PURCHASE INVOICE").toUpperCase();
  }
  if (typeLower === "sale return" || typeLower === "credit note") {
    return (names.saleReturn || "CREDIT NOTE").toUpperCase();
  }
  if (typeLower === "purchase return" || typeLower === "debit note") {
    return (names.purchaseReturn || "DEBIT NOTE").toUpperCase();
  }
  if (typeLower === "delivery challan") {
    return (names.deliveryChallan || "DELIVERY CHALLAN").toUpperCase();
  }
  if (typeLower === "proforma invoice") {
    return (names.proformaInvoice || "PROFORMA INVOICE").toUpperCase();
  }
  if (typeLower === "purchase order") {
    return (names.purchaseOrder || "PURCHASE ORDER").toUpperCase();
  }
  if (typeLower === "export invoice") {
    return (names.exportInvoice || "EXPORT INVOICE").toUpperCase();
  }

  // Default Sale
  if (names.sale) return names.sale.toUpperCase();
  if (gstSet.compositeScheme) return "BILL OF SUPPLY";
  return "TAX INVOICE";
}

// Universal Inter-State (IGST) vs Intra-State (CGST + SGST) detection
export function getIsInterstate(invoice = {}, printSet = {}, gstSet = {}) {
  const sellerGstin = invoice?.sellerDetails?.gstin || invoice?.meta?.sellerGstin || printSet.gstinOnSale || printSet.gstin || gstSet.gstin || "";
  const customerGstin = invoice?.meta?.billedToGstin || invoice?.billedToGstin || invoice?.customer?.gstin || invoice?.shippingDetails?.shippingGstin || "";
  
  const sellerStateCode = sellerGstin.trim().slice(0, 2);
  const customerStateCode = customerGstin.trim().slice(0, 2);

  const sellerAddress = (invoice?.sellerDetails?.address || invoice?.sellerDetails?.state || printSet.address || printSet.state || "").toLowerCase();
  const placeOfSupply = (invoice?.meta?.placeOfSupply || invoice?.placeOfSupply || invoice?.meta?.billedToState || invoice?.shippingDetails?.placeOfDelivery || invoice?.shippingDetails?.shipToAddress || "").toLowerCase();

  // If 2-digit numeric state codes are in both GSTINs
  if (sellerStateCode.length === 2 && customerStateCode.length === 2 && /^\d+$/.test(sellerStateCode) && /^\d+$/.test(customerStateCode)) {
    return sellerStateCode !== customerStateCode;
  }

  // If seller state code is known (e.g. "24") and placeOfSupply state code is in text e.g. "Delhi (07)"
  const stateCodeMatchInSupply = placeOfSupply.match(/\b(\d{2})\b/);
  if (sellerStateCode.length === 2 && /^\d+$/.test(sellerStateCode) && stateCodeMatchInSupply) {
    return sellerStateCode !== stateCodeMatchInSupply[1];
  }

  // If placeOfSupply state string is specified and seller address is specified
  if (sellerAddress && placeOfSupply && sellerAddress.length > 2 && placeOfSupply.length > 2) {
    return !sellerAddress.includes(placeOfSupply) && !placeOfSupply.includes(sellerAddress);
  }

  // Fallback: If customer state is explicitly provided and different from seller state
  if (placeOfSupply && (sellerStateCode || sellerAddress)) {
    const knownStateNames = ["delhi", "gujarat", "maharashtra", "karnataka", "punjab", "haryana", "rajasthan", "uttar pradesh", "west bengal", "tamil nadu", "kerala", "andhra pradesh", "telangana", "madhya pradesh", "bihar", "odisha", "assam", "jharkhand", "chhattisgarh", "uttarakhand", "himachal pradesh", "jammu & kashmir", "goa"];
    const matchedSellerState = knownStateNames.find(s => sellerAddress.includes(s));
    const matchedCustomerState = knownStateNames.find(s => placeOfSupply.includes(s));
    if (matchedSellerState && matchedCustomerState) {
      return matchedSellerState !== matchedCustomerState;
    }
  }

  return false;
}

// Doc types that don't involve money collection at time of issue — payment/balance
// sections should stay hidden on the printed document regardless of print-settings toggles.
export function isPaymentRelevantForType(type) {
  const t = (type || "").toLowerCase();
  return t !== "quotation" && t !== "estimate" && t !== "delivery challan";
}

// Purchase Order documents refer to a vendor/supplier, not a customer — swap the
// "Billed To" style heading while letting each template keep its own default wording.
export function getBilledToHeading(type, defaultLabel = "Billed To") {
  return (type || "").toLowerCase() === "purchase order" ? "Vendor / Supplier Details" : defaultLabel;
}

// Ordered { label, value } pairs of doc-type-specific details for the active invoice.type,
// skipping empty values. Centralizes the per-type field mapping so templates don't duplicate it.
export function getDocTypeDetailLines(meta = {}) {
  const type = (meta.type || "").toLowerCase();
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : "";
  const out = [];

  if (type === "quotation" || type === "estimate") {
    if (meta.validUntilDate) out.push({ label: "Valid Until", value: fmt(meta.validUntilDate) });
  } else if (type === "credit note" || type === "debit note") {
    if (meta.originalInvoiceNo) out.push({ label: "Original Invoice No", value: meta.originalInvoiceNo });
    if (meta.originalInvoiceDate) out.push({ label: "Original Invoice Date", value: fmt(meta.originalInvoiceDate) });
    if (meta.noteReason) out.push({ label: "Reason", value: meta.noteReason });
  } else if (type === "export invoice") {
    if (meta.shippingBillNo) out.push({ label: "Shipping Bill No", value: meta.shippingBillNo });
    if (meta.shippingBillDate) out.push({ label: "Shipping Bill Date", value: fmt(meta.shippingBillDate) });
    if (meta.portCode) out.push({ label: "Port Code", value: meta.portCode });
    if (meta.exportCurrency) out.push({ label: "Currency", value: meta.exportCurrency });
  } else if (type === "purchase order") {
    if (meta.expectedDeliveryDate) out.push({ label: "Expected Delivery", value: fmt(meta.expectedDeliveryDate) });
  } else if (type === "delivery challan") {
    if (meta.challanDate) out.push({ label: "Challan Date", value: fmt(meta.challanDate) });
  }

  return out;
}

export function getTemplateColumns(printSet, isInterstate = false) {
  const cols = printSet.tableColumns && Object.keys(printSet.tableColumns).length > 0 ? printSet.tableColumns : {
    slNo: true,
    itemName: true,
    hsnSac: true,
    quantity: true,
    priceUnit: true,
    discount: true,
    amount: true
  };
  
  const colNames = printSet.tableColumnNames && Object.keys(printSet.tableColumnNames).length > 0 ? printSet.tableColumnNames : {
    slNo: "#",
    itemName: "ITEM NAME",
    itemCode: "ITEM CODE",
    hsnSac: "HSN/SAC",
    batchNo: "BATCH NO.",
    expDate: "EXP. DATE",
    mfgDate: "MFG. DATE",
    mrp: "MRP",
    size: "SIZE",
    modelNo: "MODEL NO.",
    description: "DESCRIPTION",
    count: "COUNT",
    colour: "COLOUR",
    material: "MATERIAL",
    brand: "BRAND",
    serialNo: "SERIAL NO.",
    challanNo: "CHALLAN NO.",
    quantity: "QUANTITY",
    unit: "UNIT",
    priceUnit: "PRICE/UNIT",
    discount: "DISCOUNT",
    discountPercent: "DISCOUNT %",
    taxablePriceUnit: "TAXABLE PRICE",
    amount: "AMOUNT"
  };

  const order = printSet.columnOrder || [
    "slNo", "itemName", "itemCode", "hsnSac", "batchNo", "expDate", "mfgDate", "mrp", "size", "modelNo",
    "description", "count", "colour", "material", "brand", "serialNo", "challanNo", "quantity", "unit",
    "priceUnit", "discount", "discountPercent", "taxablePriceUnit", "taxAmount", "taxPercent", "taxableAmount",
    "cess", "finalRate", "amount"
  ];

  const activeColsInOrder = [];
  order.forEach((key) => {
    if (cols[key]) {
      if (key === "amount" && printSet.taxDetails) {
        activeColsInOrder.push("taxableValue");
        if (isInterstate) {
          activeColsInOrder.push("igst");
        } else {
          activeColsInOrder.push("cgst");
          activeColsInOrder.push("sgst");
        }
      }
      activeColsInOrder.push(key);
    }
  });

  let colSpanBeforeTax = activeColsInOrder.indexOf("cgst");
  if (colSpanBeforeTax === -1) colSpanBeforeTax = activeColsInOrder.indexOf("igst");
  if (colSpanBeforeTax === -1) colSpanBeforeTax = activeColsInOrder.indexOf("taxableValue") + 1;
  if (colSpanBeforeTax === 0) colSpanBeforeTax = activeColsInOrder.length - (printSet.taxDetails ? 5 : 1);

  let colSpanTotalSummaryLabel = activeColsInOrder.indexOf("quantity");
  if (colSpanTotalSummaryLabel === -1) {
    colSpanTotalSummaryLabel = activeColsInOrder.indexOf("taxableValue");
  }
  if (colSpanTotalSummaryLabel === -1) {
    colSpanTotalSummaryLabel = activeColsInOrder.indexOf("amount");
  }
  if (colSpanTotalSummaryLabel === -1 || colSpanTotalSummaryLabel === 0) {
    colSpanTotalSummaryLabel = 1;
  }

  return {
    cols,
    colNames,
    activeColsInOrder,
    colSpanBeforeTax,
    colSpanTotalSummaryLabel
  };
}

export function formatAmt(val, printSet = {}) {
  const num = Number(val) || 0;
  const useDecimals = printSet.amountWithDecimal !== false;
  const useGrouping = printSet.printAmountWithGrouping !== false;

  if (useGrouping) {
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: useDecimals ? 2 : 0,
      maximumFractionDigits: useDecimals ? 2 : 0
    });
  }
  return useDecimals ? num.toFixed(2) : Math.round(num).toString();
}

export function renderCommonFooter(invoice, printSet, themeClasses = {}) {
  const { titleClass = "", textClass = "", containerClass = "p-3 space-y-2", signatureContainerClass = "p-3 flex flex-col justify-between items-center min-h-[95px] relative" } = themeClasses;

  return (
    <>
      <div className={containerClass}>
        {printSet.printDescription && invoice.description && (
          <div className="mb-2">
            <span className={`font-bold uppercase block ${titleClass}`}>Description / Notes</span>
            <p className={`whitespace-pre-line ${textClass}`}>{invoice.description}</p>
          </div>
        )}
        {printSet.printTermsAndConditions && (
          <div className="mb-2">
            <span className={`font-bold uppercase block ${titleClass}`}>Terms & Conditions</span>
            <p className={`whitespace-pre-line ${textClass}`}>{invoice.terms || "1. We are responsible for the loss of signed Duty slip, check details.\n2. Interest@24% will be charged if bill not paid within 15 days."}</p>
          </div>
        )}
        {printSet.printAcknowledgement && (
          <div className={`italic mt-1 border-t border-dashed pt-1 ${textClass}`}>
            <span>Acknowledgement: {invoice.acknowledgement || "Received goods in good condition"}</span>
          </div>
        )}
        {(printSet.printReceivedByDetails || printSet.printDeliveredByDetails) && (
          <div className="flex gap-4 pt-2 border-t border-dashed mt-2">
            {printSet.printReceivedByDetails && (
              <div className={`flex-1 border border-dashed p-1.5 rounded text-center ${textClass}`}>
                <span className="block font-semibold">Received By</span>
                {invoice.receivedBy ? (
                  <span className="block text-[9px] font-bold text-slate-700 mt-1.5">{invoice.receivedBy}</span>
                ) : (
                  <span className="block text-[8px] text-slate-400 mt-3">Signature / Stamp</span>
                )}
              </div>
            )}
            {printSet.printDeliveredByDetails && (
              <div className={`flex-1 border border-dashed p-1.5 rounded text-center ${textClass}`}>
                <span className="block font-semibold">Delivered By</span>
                {invoice.deliveredBy ? (
                  <span className="block text-[9px] font-bold text-slate-700 mt-1.5">{invoice.deliveredBy}</span>
                ) : (
                  <span className="block text-[8px] text-slate-400 mt-3">Signature / Stamp</span>
                )}
              </div>
            )}
          </div>
        )}
        {printSet.printQrCode && printSet.qrCodeUrl && (
          <div className="mt-3 flex items-start gap-3">
            <div className="border border-slate-300 p-1 bg-white shrink-0 shadow-sm">
              <img src={printSet.qrCodeUrl} alt="QR Code" className="w-16 h-16 object-contain" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <span className={`font-bold uppercase ${titleClass}`}>Scan to Pay</span>
              <span className={`italic mt-0.5 ${textClass}`}>UPI / E-Way / Verify</span>
            </div>
          </div>
        )}
      </div>
      <div className={signatureContainerClass}>
        <div className={`italic text-center w-full space-y-1 mb-2 ${textClass}`}>
          <span>Certified that the particulars given above are true and correct</span>
        </div>
        {(printSet.printSignatureText !== false || invoice.signatureUrl || invoice.signatureImgUrl || printSet.signatureUrl || printSet.signatureImgUrl) && (
          <div className="text-center w-full relative flex flex-col items-center">
            <span className={`font-bold uppercase block ${titleClass}`}>
              For, {printSet.companyName || invoice.sellerDetails?.companyName || "UDAAN BILLBOOK"}
            </span>
            <div className="flex flex-col items-center justify-center my-1 min-h-[40px]">
              {(invoice.signatureUrl || printSet.signatureUrl) && (
                <img src={invoice.signatureUrl || printSet.signatureUrl} alt="Seal" className="h-10 max-h-12 object-contain" />
              )}
              {(invoice.signatureImgUrl || printSet.signatureImgUrl) && (
                <img src={invoice.signatureImgUrl || printSet.signatureImgUrl} alt="Signature" className="h-8 max-h-10 object-contain mt-1" />
              )}
              {!(invoice.signatureUrl || printSet.signatureUrl) && !(invoice.signatureImgUrl || printSet.signatureImgUrl) && (
                <div className="h-8" />
              )}
            </div>
            <span className={`block pt-1 border-t w-32 mx-auto text-center ${textClass}`}>
              {invoice.signatureText || printSet.signatureText || "Authorised Signatory"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
