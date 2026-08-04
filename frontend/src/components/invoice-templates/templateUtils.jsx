import React from "react";

export function getTemplateColumns(printSet) {
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
    itemCode: "Item Code",
    hsnSac: "HSN/SAC",
    batchNo: "Batch No.",
    expDate: "Exp. Date",
    mfgDate: "Mfg. Date",
    mrp: "MRP",
    size: "Size",
    modelNo: "Model No.",
    description: "Description",
    count: "Count",
    colour: "Colour",
    material: "Material",
    brand: "Brand",
    serialNo: "Serial No.",
    challanNo: "Challan No.",
    quantity: "QTY",
    unit: "Unit",
    priceUnit: "Rate",
    discount: "Discount",
    discountPercent: "Discount %",
    taxablePriceUnit: "Taxable Price",
    amount: "Total"
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
        activeColsInOrder.push("cgst");
        activeColsInOrder.push("sgst");
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

export function formatAmt(val, printSet) {
  const num = Number(val) || 0;
  return printSet?.amountWithDecimal ? num.toFixed(2) : Math.round(num).toString();
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
        {printSet.printAcknowledgement && invoice.acknowledgement && (
          <div className={`italic mt-1 border-t border-dashed pt-1 ${textClass}`}>
            <span>Acknowledgement: {invoice.acknowledgement}</span>
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
        {printSet.printSignatureText && (
          <div className="text-center w-full relative flex flex-col items-center">
            <span className={`font-bold uppercase block ${titleClass}`}>
              For, {printSet.companyName || "KESHAV TRAVELS"}
            </span>
            <div className="flex flex-col items-center justify-center my-1 min-h-[40px]">
              {printSet.signatureUrl && (
                <img src={printSet.signatureUrl} alt="Seal" className="h-10 max-h-12 object-contain" />
              )}
              {printSet.signatureImgUrl && (
                <img src={printSet.signatureImgUrl} alt="Signature" className="h-8 max-h-10 object-contain mt-1" />
              )}
              {!printSet.signatureUrl && !printSet.signatureImgUrl && (
                <div className="h-8" />
              )}
            </div>
            <span className={`block pt-1 border-t w-32 mx-auto text-center ${textClass}`}>
              {printSet.signatureText || "Authorised Signatory"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
