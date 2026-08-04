import React from "react";
import { Building2 } from "lucide-react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function GSTBoxedTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const {
    cols,
    colNames,
    activeColsInOrder,
    colSpanBeforeTax,
    colSpanTotalSummaryLabel
  } = getTemplateColumns(printSet);

  const getCompanyNameSizeClass = (size) => {
    switch (size) {
      case "Small": return "text-xs";
      case "Medium": return "text-sm";
      case "Large": return "text-base";
      case "Extra Large": return "text-lg";
      default: return "text-base";
    }
  };

  const getInvoiceSizeClass = (size, fallback) => {
    if (!size || size === "Medium") return fallback;
    if (size === "Small") {
      if (fallback === "text-[10px]") return "text-[8px]";
      if (fallback === "text-[11px]") return "text-[9px]";
      if (fallback === "text-[9px]") return "text-[7px]";
      if (fallback === "text-[8px]") return "text-[6px]";
      return fallback;
    }
    if (size === "Large") {
      if (fallback === "text-[10px]") return "text-[12px]";
      if (fallback === "text-[11px]") return "text-[13px]";
      if (fallback === "text-[9px]") return "text-[11px]";
      if (fallback === "text-[8px]") return "text-[10px]";
      return fallback;
    }
    if (size === "Extra Large") {
      if (fallback === "text-[10px]") return "text-[14px]";
      if (fallback === "text-[11px]") return "text-[15px]";
      if (fallback === "text-[9px]") return "text-[13px]";
      if (fallback === "text-[8px]") return "text-[12px]";
      return fallback;
    }
    return fallback;
  };

  const textSz = printSet.invoiceTextSize || "Medium";

  return (
    <div 
      className={`border border-slate-800 font-mono flex flex-col text-slate-800 ${getInvoiceSizeClass(textSz, "text-[10px]")}`}
      style={{ paddingTop: `${Number(printSet.extraSpaceTop || 0)}px` }}
    >
      <div className="border-b border-slate-800 p-3 text-center space-y-1 bg-white relative min-h-[80px] flex flex-col justify-center">
        {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
          <div className="absolute left-4 top-2 max-h-12 max-w-[120px] overflow-hidden flex items-center justify-center">
            <img 
              src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} 
              alt="Logo" 
              className="max-h-12 max-w-[120px] object-contain" 
              style={{ maxHeight: '48px', maxWidth: '120px', width: 'auto', height: 'auto' }} 
            />
          </div>
        ) : showUdaanLogo ? (
          <div className="absolute left-4 top-2 max-h-12 max-w-[120px] overflow-hidden flex items-center justify-center">
            <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="max-h-10 max-w-[100px] object-contain opacity-90 grayscale" style={{ maxHeight: '40px', maxWidth: '100px' }} />
          </div>
        ) : null}
        {printSet.printCompanyName && (
          <h2 className={`font-bold text-slate-900 tracking-wide uppercase ${getCompanyNameSizeClass(printSet.companyNameTextSize)}`}>
            {printSet.companyName || "UDAAN BUSINESS"}
          </h2>
        )}
        {printSet.printAddress && printSet.address && (
          <p className={`text-slate-700 whitespace-pre-line leading-tight ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
            {printSet.address}
          </p>
        )}
        <div className={`text-slate-600 flex flex-wrap justify-center gap-x-3 ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
          {printSet.printPhone && printSet.phone && <span>Ph.: {printSet.phone}</span>}
          {printSet.printEmail && printSet.email && <span>Email: {printSet.email}</span>}
        </div>
        <div className={`font-bold text-slate-800 flex justify-center gap-x-4 pt-1 border-t border-dashed mt-1.5 ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
          {printSet.printGstin && gstSet.gstin && <span>GSTIN : {gstSet.gstin}</span>}
          {gstSet.pan && <span>PAN No: {gstSet.pan}</span>}
        </div>
      </div>

      {/* Title */}
      <div className={`border-b border-slate-800 text-center font-bold py-1 bg-slate-50 uppercase tracking-widest ${activeColor.text} ${getInvoiceSizeClass(textSz, "text-[11px]")}`}>
        {gstSet.compositeScheme ? "BILL OF SUPPLY" : "TAX INVOICE"}
      </div>
      {gstSet.compositeScheme && (
        <div className="border-b border-slate-800 text-center text-[8px] py-0.5 bg-amber-50 font-bold text-slate-700 italic border-t border-slate-800">
          Composition taxable person, not eligible to collect tax on supplies
        </div>
      )}

      {/* Meta grid */}
      <div className="grid grid-cols-2 border-b border-slate-800 divide-x divide-slate-800">
        <div className="p-1.5 space-y-0.5">
          {gstSet.reverseCharge && (
            <div className="flex"><span className="w-16 shrink-0 truncate">Rev. Charge</span><span className="truncate">: {meta.reverseCharge}</span></div>
          )}
          <div className="flex"><span className="w-16 shrink-0">Invoice No.</span><span className="truncate">: {meta.invoiceNumber}</span></div>
          <div className="flex"><span className="w-16 shrink-0">Invoice Date</span><span className="truncate">: {meta.date}</span></div>
          <div className="flex"><span className="w-16 shrink-0">State</span><span className="truncate">: Delhi</span></div>
        </div>
        <div className="p-1.5 space-y-0.5">
          <div className="flex"><span className="w-16 shrink-0">Challan No.</span><span className="truncate">: {meta.challanNo || "-"}</span></div>
          {meta.poNumber && <div className="flex"><span className="w-16 shrink-0">P.O. No.</span><span className="truncate">: {meta.poNumber}</span></div>}
          {meta.poDate && <div className="flex"><span className="w-16 shrink-0">P.O. Date</span><span className="truncate">: {meta.poDate}</span></div>}
          <div className="flex"><span className="w-16 shrink-0">Vehicle No.</span><span className="truncate">: {meta.vehicleNo || invoice.transportDetails?.vehicleNo || "-"}</span></div>
          <div className="flex"><span className="w-16 shrink-0">Supply Date</span><span className="truncate">: {meta.dateOfSupply ? meta.dateOfSupply.split("-").reverse().join("/") : "-"}</span></div>
          {gstSet.placeOfSupply && (
            <div className="flex"><span className="w-16 shrink-0">Place</span><span className="truncate">: {meta.placeOfSupply || "Delhi"}</span></div>
          )}
          {invoice.transportDetails?.eWayBillNo && <div className="flex"><span className="w-16 shrink-0">E-Way Bill</span><span className="truncate">: {invoice.transportDetails.eWayBillNo}</span></div>}
          {invoice.transportDetails?.transporterName && <div className="flex"><span className="w-16 shrink-0">Transporter</span><span className="truncate">: {invoice.transportDetails.transporterName}</span></div>}
          {invoice.transportDetails?.grRrNo && <div className="flex"><span className="w-16 shrink-0">GR/RR No.</span><span className="truncate">: {invoice.transportDetails.grRrNo}</span></div>}
        </div>
      </div>

      {/* Parties */}
      <div className="border-b border-slate-800 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
        <div className="p-2 flex-1">
          <div className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
            Details of Receiver | Billed to:
          </div>
          <div className="grid grid-cols-1 gap-y-0.5">
            <div className="flex"><span className="w-14 shrink-0 font-semibold">Name</span><span className="truncate">: {meta.billingName || customer}</span></div>
            <div className="flex"><span className="w-14 shrink-0 font-semibold">Address</span><span className="truncate">: {meta.billedToAddress || "-"}</span></div>
            <div className="flex"><span className="w-14 shrink-0 font-semibold">GSTIN</span><span className="truncate">: {meta.billedToGstin || "-"}</span></div>
            <div className="flex"><span className="w-14 shrink-0 font-semibold">Mobile</span><span className="truncate">: {meta.billedToMobile || "-"}</span></div>
            <div className="flex"><span className="w-14 shrink-0 font-semibold">State</span><span className="truncate">: {meta.billedToState || "Delhi"}</span></div>
            {printSet.currentBalanceParty && invoice.partyBalance && (
              <div className="flex"><span className="w-14 shrink-0 font-semibold text-red-600">Balance</span><span className="truncate">: ₹{invoice.partyBalance}</span></div>
            )}
          </div>
        </div>
        {(invoice.shippingDetails?.shippingAddress || invoice.shippingDetails?.shippingName) && (
          <div className="p-2 flex-1">
            <div className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
              Details of Consignee | Shipped to:
            </div>
            <div className="grid grid-cols-1 gap-y-0.5">
              <div className="flex"><span className="w-14 shrink-0 font-semibold">Name</span><span className="truncate">: {invoice.shippingDetails.shippingName || meta.billingName || customer}</span></div>
              <div className="flex"><span className="w-14 shrink-0 font-semibold">Address</span><span className="truncate">: {invoice.shippingDetails.shippingAddress || "-"}</span></div>
              <div className="flex"><span className="w-14 shrink-0 font-semibold">GSTIN</span><span className="truncate">: {invoice.shippingDetails.shippingGstin || meta.billedToGstin || "-"}</span></div>
              <div className="flex"><span className="w-14 shrink-0 font-semibold">State</span><span className="truncate">: {invoice.shippingDetails.shippingState || meta.billedToState || "Delhi"}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="border-b border-slate-800 overflow-x-auto">
        <table className={`w-full border-collapse ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
          <thead>
            <tr className={`bg-slate-50 border-b border-slate-800 font-bold uppercase divide-x divide-slate-800 text-left ${activeColor.text}`}>
              {activeColsInOrder.map((key) => {
                const rowSpanAttr = printSet.taxDetails ? 2 : 1;
                if (key === "slNo") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-8">{colNames.slNo || "Sr."}</th>;
                if (key === "itemName") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 min-w-[80px]">{colNames.itemName || "Product Description"}</th>;
                if (key === "itemCode") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.itemCode || "Item Code"}</th>;
                if (key === "hsnSac") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.hsnSac || "HSN/SAC"}</th>;
                if (key === "batchNo") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.batchNo || "Batch No."}</th>;
                if (key === "expDate") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.expDate || "Exp. Date"}</th>;
                if (key === "mfgDate") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.mfgDate || "Mfg. Date"}</th>;
                if (key === "mrp") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-16">{colNames.mrp || "MRP"}</th>;
                if (key === "size") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-12">{colNames.size || "Size"}</th>;
                if (key === "modelNo") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.modelNo || "Model No."}</th>;
                if (key === "description") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 min-w-[80px]">{colNames.description || "Description"}</th>;
                if (key === "count") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-12">{colNames.count || "Count"}</th>;
                if (key === "colour") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-14">{colNames.colour || "Colour"}</th>;
                if (key === "material") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.material || "Material"}</th>;
                if (key === "brand") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-16">{colNames.brand || "Brand"}</th>;
                if (key === "serialNo") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-20">{colNames.serialNo || "Serial No."}</th>;
                if (key === "challanNo") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-20">{colNames.challanNo || "Challan No."}</th>;
                if (key === "quantity") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-10">{colNames.quantity || "QTY"}</th>;
                if (key === "unit") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-center w-12">{colNames.unit || "Unit"}</th>;
                if (key === "priceUnit") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-16">{colNames.priceUnit || "Rate"}</th>;
                if (key === "discount") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-16">{colNames.discount || "Discount"}</th>;
                if (key === "discountPercent") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-16">{colNames.discountPercent || "Discount %"}</th>;
                if (key === "taxablePriceUnit") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-18">{colNames.taxablePriceUnit || "Taxable Price/Unit"}</th>;
                if (key === "taxableValue") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-18">Taxable Value</th>;
                if (key === "cgst") return <th key={key} className="p-1.5 text-center w-28" colSpan="2">CGST</th>;
                if (key === "sgst") return <th key={key} className="p-1.5 text-center w-28" colSpan="2">SGST</th>;
                if (key === "amount") return <th key={key} rowSpan={rowSpanAttr} className="p-1.5 text-right w-20">{colNames.amount || "Total"}</th>;
                return null;
              })}
            </tr>
            {printSet.taxDetails && (
              <tr className="bg-slate-100 border-b border-slate-800 text-[8px] font-bold text-center divide-x divide-slate-800">
                <td className="p-1 w-10">Rate</td>
                <td className="p-1 w-18">Amount</td>
                <td className="p-1 w-10">Rate</td>
                <td className="p-1 w-18">Amount</td>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {lines.map((l, idx) => {
              const q = Number(l.qty) || 0;
              const r = Number(l.rate) || 0;
              const d = Number(l.discount) || 0;
              const g = Number(l.gst) || 0;
              const isExcl = l.taxType === "exclusive";

              const rateAfterDisc = r * (1 - d / 100);
              let taxableVal, totalTax, lineTotal;

              if (isExcl) {
                taxableVal = q * rateAfterDisc;
                totalTax = taxableVal * (g / 100);
                lineTotal = taxableVal + totalTax;
              } else {
                lineTotal = q * rateAfterDisc;
                taxableVal = lineTotal / (1 + g / 100);
                totalTax = lineTotal - taxableVal;
              }

              const cgstAmount = totalTax / 2;
              const dAmount = r * (d / 100);

              return (
                <tr key={idx} className="divide-x divide-slate-800 text-[9px] hover:bg-slate-50/20">
                  {activeColsInOrder.map((key) => {
                    if (key === "slNo") return <td key={key} className="p-2 text-center">{idx + 1}</td>;
                    if (key === "itemName") return <td key={key} className="p-2 font-medium font-sans">{l.name || "Service Item Description"}</td>;
                    if (key === "itemCode") return <td key={key} className="p-2 text-center">{l.itemCode || "-"}</td>;
                    if (key === "hsnSac") return <td key={key} className="p-2 text-center">{l.hsnSac || "-"}</td>;
                    if (key === "batchNo") return <td key={key} className="p-2 text-center">{l.batchNo || "-"}</td>;
                    if (key === "expDate") return <td key={key} className="p-2 text-center">{l.expDate || "-"}</td>;
                    if (key === "mfgDate") return <td key={key} className="p-2 text-center">{l.mfgDate || "-"}</td>;
                    if (key === "mrp") return <td key={key} className="p-2 text-right">{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                    if (key === "size") return <td key={key} className="p-2 text-center">{l.size || "-"}</td>;
                    if (key === "modelNo") return <td key={key} className="p-2 text-center">{l.modelNo || "-"}</td>;
                    if (key === "description") return <td key={key} className="p-2 text-left">{l.description || "-"}</td>;
                    if (key === "count") return <td key={key} className="p-2 text-center">{l.count || "-"}</td>;
                    if (key === "colour") return <td key={key} className="p-2 text-center">{l.colour || "-"}</td>;
                    if (key === "material") return <td key={key} className="p-2 text-center">{l.material || "-"}</td>;
                    if (key === "brand") return <td key={key} className="p-2 text-center">{l.brand || "-"}</td>;
                    if (key === "serialNo") return <td key={key} className="p-2 text-center">{l.serialNo || "-"}</td>;
                    if (key === "challanNo") return <td key={key} className="p-2 text-center">{l.challanNo || "-"}</td>;
                    if (key === "quantity") return <td key={key} className="p-2 text-center">{q}</td>;
                    if (key === "unit") return <td key={key} className="p-2 text-center">{l.unit || "Pcs"}</td>;
                    if (key === "priceUnit") return <td key={key} className="p-2 text-right">{formatAmt(r, printSet)}</td>;
                    if (key === "discount") return <td key={key} className="p-2 text-right">{formatAmt(dAmount, printSet)}</td>;
                    if (key === "discountPercent") return <td key={key} className="p-2 text-right">{d}%</td>;
                    if (key === "taxablePriceUnit") return <td key={key} className="p-2 text-right">{formatAmt(isExcl ? rateAfterDisc : (rateAfterDisc / (1 + g/100)), printSet)}</td>;
                    if (key === "taxableValue") return <td key={key} className="p-2 text-right">{formatAmt(taxableVal, printSet)}</td>;
                    if (key === "cgst") return (
                      <React.Fragment key={key}>
                        <td className="p-1 text-center">{(g / 2)}%</td>
                        <td className="p-2 text-right">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "sgst") return (
                      <React.Fragment key={key}>
                        <td className="p-1 text-center">{(g / 2)}%</td>
                        <td className="p-2 text-right">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "amount") return <td key={key} className="p-2 text-right font-bold">{formatAmt(lineTotal, printSet)}</td>;
                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-800 font-bold divide-x divide-slate-800 text-[9px]">
              <td colSpan={colSpanTotalSummaryLabel} className="p-2 text-center">Total Summary</td>
              {activeColsInOrder.slice(colSpanTotalSummaryLabel).map((key) => {
                if (key === "quantity") return <td key={key} className="p-2 text-center">{printSet.totalItemQuantity ? lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0) : "-"}</td>;
                if (key === "taxableValue") return <td key={key} className="p-2 text-right">{formatAmt(totals.taxableAmount, printSet)}</td>;
                if (key === "cgst") return (
                  <React.Fragment key={key}>
                    <td></td>
                    <td className="p-2 text-right">{formatAmt(totals.gstAmount / 2, printSet)}</td>
                  </React.Fragment>
                );
                if (key === "sgst") return (
                  <React.Fragment key={key}>
                    <td></td>
                    <td className="p-2 text-right">{formatAmt(totals.gstAmount / 2, printSet)}</td>
                  </React.Fragment>
                );
                if (key === "amount") return <td key={key} className="p-2 text-right font-extrabold text-emerald-700">{formatAmt(totals.grand, printSet)}</td>;
                
                const validKeys = ["slNo", "itemName", "itemCode", "hsnSac", "batchNo", "expDate", "mfgDate", "mrp", "size", "modelNo", "description", "count", "colour", "material", "brand", "serialNo", "challanNo", "quantity", "unit", "priceUnit", "discount", "discountPercent", "taxablePriceUnit", "taxableValue", "cgst", "sgst", "amount"];
                if (!validKeys.includes(key)) return null;

                return <td key={key}></td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Calculations & Bank */}
      <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
        <div className="p-2 space-y-2">
          {printSet.amountInWords !== "None" && (
            <div>
              <span className={`font-bold block border-b pb-0.5 mb-1 uppercase text-slate-700 ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>Amount in Words</span>
              <span className="text-slate-600 leading-tight italic break-words">{numberToWords(totals.grand)}</span>
            </div>
          )}
          <div className="border rounded-lg p-1.5 bg-slate-50/50 space-y-0.5">
            <span className={`font-bold border-b block pb-0.5 mb-1 uppercase tracking-wide ${getInvoiceSizeClass(textSz, "text-[8px]")}`}>Bank Details</span>
            <div className="flex"><span className="w-16 shrink-0">Acc No.</span><span className="truncate">: {invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</span></div>
            <div className="flex"><span className="w-16 shrink-0">Bank</span><span className="truncate">: {invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"}</span></div>
            <div className="flex"><span className="w-16 shrink-0">IFSC</span><span className="truncate">: {invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"}</span></div>
            <div className="flex"><span className="w-16 shrink-0">Branch</span><span className="truncate">: {invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</span></div>
          </div>
        </div>
        <div className="p-2 flex justify-end">
          <div className="w-full font-mono">
            <div className="py-0.5 flex justify-between"><span>Subtotal</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
            {(() => {
              const uniqueGst = [...new Set(lines.map(l => Number(l.gst) || 0))];
              const gstLabel = uniqueGst.length === 1 && uniqueGst[0] > 0 ? ` (${uniqueGst[0] / 2}%)` : '';
              return (
                <>
                  <div className="py-0.5 flex justify-between"><span>CGST{gstLabel}</span><span>{formatAmt(totals.gstAmount / 2, printSet)}</span></div>
                  <div className="py-0.5 flex justify-between"><span>SGST{gstLabel}</span><span>{formatAmt(totals.gstAmount / 2, printSet)}</span></div>
                </>
              );
            })()}
            <div className="py-0.5 flex justify-between border-t font-semibold"><span>Total GST</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
            <div className={`py-1 flex justify-between font-extrabold border-t-2 border-slate-900 pt-1 ${activeColor.text} ${getInvoiceSizeClass(textSz, "text-[11px]")}`}><span className="uppercase">Total</span><span>{formatAmt(totals.grand, printSet)}</span></div>
            {printSet.receivedAmount && (
              <div className={`py-0.5 flex justify-between text-slate-600 ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
                <span>Received</span>
                <span>{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
              </div>
            )}
            {printSet.balanceAmount && (
              <div className={`py-0.5 flex justify-between text-slate-600 font-bold border-t border-dashed mt-0.5 ${getInvoiceSizeClass(textSz, "text-[9px]")}`}>
                <span>Balance</span>
                <span>{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* T&C and Stamp */}
      {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
        <div className={`grid grid-cols-2 divide-x divide-slate-800 ${getInvoiceSizeClass(textSz, "text-[8px]")}`}>
          {renderCommonFooter(invoice, printSet, {
            titleClass: `text-slate-700 ${getInvoiceSizeClass(textSz, "text-[9px]")}`,
            textClass: "text-slate-600",
            containerClass: "p-3 space-y-2",
            signatureContainerClass: "p-3 flex flex-col justify-between items-center min-h-[95px] relative"
          })}
        </div>
      )}
    </div>
  );
}
