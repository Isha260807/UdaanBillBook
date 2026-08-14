import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter, getTransactionTitle, isPaymentRelevantForType, getBilledToHeading, getDocTypeDetailLines, getIsInterstate } from "../templateUtils.jsx";

export function CorporateTemplate({ invoice, printSet, gstSet, activeColor, numberToWords }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const isInterstate = getIsInterstate(invoice, printSet, gstSet);
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet, isInterstate);
  return (
    <div className="font-sans bg-white border border-slate-300 text-slate-800 text-[10px] leading-relaxed shadow-sm p-6 space-y-6">
      
      {/* Branding top block */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 pb-4 border-slate-100 gap-4">
        <div>
          {printSet.printCompanyName && (
            <h1 className={`text-lg font-black tracking-tight ${activeColor.text}`}>
              {printSet.companyName || "KESHAV TRAVELS"}
            </h1>
          )}
          {printSet.printAddress && (
            <p className="text-[9px] text-slate-500 max-w-sm whitespace-pre-line leading-tight">
              {printSet.address || "S-99/134 first floor moti lal nehru camp JNU, New Delhi"}
            </p>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right space-y-1 font-mono text-[9px] min-w-[200px]">
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${activeColor.text}`}>{getTransactionTitle(invoice, printSet, gstSet)}</h3>
          <p>Invoice # : <span className="font-bold">{meta.invoiceNumber}</span></p>
          <p>Date : {meta.date}</p>
          {meta.poNumber && <p>P.O. No : {meta.poNumber}</p>}
          {meta.poDate && <p>P.O. Date : {meta.poDate}</p>}
          {gstSet.gstin && <p>GSTIN : {gstSet.gstin}</p>}
        </div>
      </div>

      {/* Customer details block */}
      <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/30">
        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{getBilledToHeading(invoice.type, "Billed & Shipped To")}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-xs">{meta.billingName || customer}</p>
            {meta.billingName && <p className="text-slate-600 text-[10px] font-semibold">M/s: {customer}</p>}
            {meta.billedToAddress && <p className="text-slate-500">{meta.billedToAddress}</p>}
            {meta.billedToState && <p className="text-slate-500">State: {meta.billedToState}</p>}
            {meta.billedToMobile && <p className="text-slate-500">Phone: {meta.billedToMobile}</p>}
            {printSet.currentBalanceParty && invoice.partyBalance && (
              <p className="text-red-600 font-mono font-bold text-[10px] mt-1">Balance: ₹{invoice.partyBalance}</p>
            )}
          </div>
          <div className="space-y-1 font-mono text-[9px]">
            {meta.billedToGstin && <p><span className="text-slate-400">GSTIN:</span> {meta.billedToGstin}</p>}
            {meta.challanNo && <p><span className="text-slate-400">Challan No:</span> {meta.challanNo}</p>}
            {meta.dateOfSupply && <p><span className="text-slate-400">Date of Supply:</span> {meta.dateOfSupply}</p>}
            {meta.vehicleNo && <p><span className="text-slate-400">Vehicle No:</span> {meta.vehicleNo}</p>}
            {meta.placeOfSupply && <p><span className="text-slate-400">Place of Supply:</span> {meta.placeOfSupply}</p>}
            {gstSet.reverseCharge && <p><span className="text-slate-400">Reverse Charge:</span> {meta.reverseCharge}</p>}
            {getDocTypeDetailLines(meta).map(({ label, value }) => (
              <p key={label}><span className="text-slate-400">{label}:</span> {value}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Product table */}
      {/* Product table */}
      <div className="w-full rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-[8px] font-bold text-slate-600 uppercase bg-slate-100 border-b-2 border-slate-300">
              {activeColsInOrder.map((key) => {
                const thClasses = "px-1 py-1.5 align-middle text-center border-r border-slate-200 uppercase font-bold break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8px] leading-tight";
                if (key === "slNo") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.slNo || "Sr."}</th>;
                if (key === "itemName") return <th key={key} className={`${thClasses} text-left w-[20%]`}>{colNames.itemName || "Product Name"}</th>;
                if (key === "itemCode") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.itemCode || "Code"}</th>;
                if (key === "hsnSac") return <th key={key} className={`${thClasses} w-[7%]`}>{colNames.hsnSac || "HSN"}</th>;
                if (key === "batchNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.batchNo || "Batch"}</th>;
                if (key === "expDate") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.expDate || "Exp"}</th>;
                if (key === "mfgDate") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.mfgDate || "Mfg"}</th>;
                if (key === "mrp") return <th key={key} className={`${thClasses} text-right w-[6%]`}>{colNames.mrp || "MRP"}</th>;
                if (key === "size") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.size || "Size"}</th>;
                if (key === "modelNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.modelNo || "Model"}</th>;
                if (key === "description") return <th key={key} className={`${thClasses} text-left w-[12%]`}>{colNames.description || "Desc"}</th>;
                if (key === "count") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.count || "Cnt"}</th>;
                if (key === "colour") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.colour || "Clr"}</th>;
                if (key === "material") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.material || "Mat"}</th>;
                if (key === "brand") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.brand || "Brand"}</th>;
                if (key === "serialNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.serialNo || "Serial"}</th>;
                if (key === "challanNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.challanNo || "Challan"}</th>;
                if (key === "quantity") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.quantity || "Qty"}</th>;
                if (key === "unit") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.unit || "Unit"}</th>;
                if (key === "priceUnit") return <th key={key} className={`${thClasses} text-right w-[7%]`}>{colNames.priceUnit || "Rate"}</th>;
                if (key === "discount") return <th key={key} className={`${thClasses} text-right w-[6%]`}>{colNames.discount || "Disc"}</th>;
                if (key === "discountPercent") return <th key={key} className={`${thClasses} text-right w-[5%]`}>{colNames.discountPercent || "Disc%"}</th>;
                if (key === "taxablePriceUnit") return <th key={key} className={`${thClasses} text-right w-[7%]`}>{colNames.taxablePriceUnit || "TaxRate"}</th>;                if (key === "taxableValue") return <th key={key} className={`${thClasses} text-right w-[8%]`}>Tax Amt</th>;
                if (key === "igst") return (
                  <React.Fragment key={key}>
                    <th className={`${thClasses} w-[4%]`}>IGST%</th>
                    <th className={`${thClasses} text-right w-[6%]`}>IGST</th>
                  </React.Fragment>
                );
                if (key === "cgst") return (
                  <React.Fragment key={key}>
                    <th className={`${thClasses} w-[4%]`}>CGST%</th>
                    <th className={`${thClasses} text-right w-[6%]`}>CGST</th>
                  </React.Fragment>
                );
                if (key === "sgst") return (
                  <React.Fragment key={key}>
                    <th className={`${thClasses} w-[4%]`}>SGST%</th>
                    <th className={`${thClasses} text-right w-[6%]`}>SGST</th>
                  </React.Fragment>
                );
                if (key === "amount") return <th key={key} className="px-1 py-1.5 align-middle text-right uppercase font-bold break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8px] leading-tight w-[8%]">{colNames.amount || "Amount"}</th>;
                return null;
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l, idx) => {
              const q = Number(l.qty) || 0;
              const r = Number(l.rate) || 0;
              const d = Number(l.discount) || 0;
              const g = Number(l.gst) || 0;
              const rateAfterDisc = r * (1 - d / 100);
              const lineTotal = q * rateAfterDisc;
              const taxableVal = lineTotal / (1 + g / 100);
              const totalTax = lineTotal - taxableVal;
              const cgstAmount = totalTax / 2;
              const dAmount = r * (d / 100);

              const numTd = "px-1 py-1.5 align-middle text-right font-mono border-r border-slate-100 break-all [overflow-wrap:anywhere] [word-break:break-all] text-[8.5px] leading-tight";
              const textTd = "px-1 py-1.5 align-middle text-center border-r border-slate-100 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight";

              return (
                <tr key={idx} className={`text-[8.5px] text-slate-700 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                  {activeColsInOrder.map((key) => {
                    if (key === "slNo") return <td key={key} className={`${textTd} text-slate-500`}>{idx + 1}</td>;
                    if (key === "itemName") return <td key={key} className="px-1.5 py-1.5 align-middle text-left font-semibold text-slate-900 border-r border-slate-100 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.name || "Product Description"}</td>;
                    if (key === "itemCode") return <td key={key} className={textTd}>{l.itemCode || "-"}</td>;
                    if (key === "hsnSac") return <td key={key} className={`${textTd} font-mono`}>{l.hsnSac || "-"}</td>;
                    if (key === "batchNo") return <td key={key} className={textTd}>{l.batchNo || "-"}</td>;
                    if (key === "expDate") return <td key={key} className={textTd}>{l.expDate || "-"}</td>;
                    if (key === "mfgDate") return <td key={key} className={textTd}>{l.mfgDate || "-"}</td>;
                    if (key === "mrp") return <td key={key} className={numTd}>{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                    if (key === "size") return <td key={key} className={textTd}>{l.size || "-"}</td>;
                    if (key === "modelNo") return <td key={key} className={textTd}>{l.modelNo || "-"}</td>;
                    if (key === "description") return <td key={key} className="px-1 py-1.5 align-middle text-left border-r border-slate-100 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.description || "-"}</td>;
                    if (key === "count") return <td key={key} className={textTd}>{l.count || "-"}</td>;
                    if (key === "colour") return <td key={key} className={textTd}>{l.colour || "-"}</td>;
                    if (key === "material") return <td key={key} className={textTd}>{l.material || "-"}</td>;
                    if (key === "brand") return <td key={key} className={textTd}>{l.brand || "-"}</td>;
                    if (key === "serialNo") return <td key={key} className={textTd}>{l.serialNo || "-"}</td>;
                    if (key === "challanNo") return <td key={key} className={textTd}>{l.challanNo || "-"}</td>;
                    if (key === "quantity") return <td key={key} className={`${textTd} font-mono`}>{q}</td>;
                    if (key === "unit") return <td key={key} className={textTd}>{l.unit || "Pcs"}</td>;
                    if (key === "priceUnit") return <td key={key} className={numTd}>{formatAmt(r, printSet)}</td>;
                    if (key === "discount") return <td key={key} className={numTd}>{formatAmt(dAmount, printSet)}</td>;
                    if (key === "discountPercent") return <td key={key} className={numTd}>{d}%</td>;
                    if (key === "taxablePriceUnit") return <td key={key} className={numTd}>{formatAmt(rateAfterDisc / (1 + g/100), printSet)}</td>;
                    if (key === "taxableValue") return <td key={key} className={numTd}>{formatAmt(taxableVal, printSet)}</td>;
                    if (key === "igst") return (
                      <React.Fragment key={key}>
                        <td className={`${textTd} font-mono text-slate-800 font-bold`}>{g}%</td>
                        <td className={`${numTd} font-bold text-slate-900`}>{formatAmt(totalTax, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "cgst") return (
                      <React.Fragment key={key}>
                        <td className={`${textTd} font-mono text-slate-400`}>{(g / 2)}%</td>
                        <td className={numTd}>{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "sgst") return (
                      <React.Fragment key={key}>
                        <td className={`${textTd} font-mono text-slate-500`}>{(g / 2)}%</td>
                        <td className={numTd}>{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "amount") return <td key={key} className="px-1 py-1.5 align-middle text-right font-bold font-mono text-slate-900 break-all [overflow-wrap:anywhere] [word-break:break-all] text-[8.5px] leading-tight">{formatAmt(lineTotal, printSet)}</td>;
                    return null;
                  })}
                </tr>
              );
            })}
            {/* Empty state */}
            {lines.length === 0 && (
              <tr>
                <td colSpan="20" className="px-4 py-6 text-center text-slate-400 text-[10px] italic">No items added</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Corporate Summary Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        <div className="space-y-4 flex-1">
          <div className="text-[9px] text-slate-500 space-y-1">
            <h5 className="font-bold text-slate-700 uppercase">Remittance Details:</h5>
            <p>Please transfer the amount to Axis Bank Account no. {paymentDetails.accountNumber || "921020024898267"}, IFSC: {paymentDetails.ifsc || "UTIB0003532"}</p>
          </div>
          <div className="text-[9px] text-slate-500 italic">
            <span className="font-bold uppercase not-italic text-slate-700">In Words:</span> {numberToWords(totals.grand)}
          </div>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 font-mono text-[9px] w-64 space-y-1.5 shrink-0">
          <div className="flex justify-between"><span>Taxable Subtotal</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
          <div className="flex justify-between"><span>Tax Amount: GST</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
          {totals.tcsAmount > 0 && (
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>TCS (+)</span><span>+{formatAmt(totals.tcsAmount, printSet)}</span>
            </div>
          )}
          {totals.tdsAmount > 0 && (
            <div className="flex justify-between font-semibold text-blue-700">
              <span>TDS (-)</span><span>-{formatAmt(totals.tdsAmount, printSet)}</span>
            </div>
          )}
          <div className={`flex justify-between font-extrabold text-[11px] border-t pt-1.5 ${activeColor.text}`}>
            <span>Total Outstanding</span><span>{formatAmt(totals.grand, printSet)}</span>
          </div>
          {isPaymentRelevantForType(invoice.type) && printSet.receivedAmount && (
            <div className="flex justify-between text-slate-500">
              <span>Received</span>
              <span>{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
            </div>
          )}
          {isPaymentRelevantForType(invoice.type) && printSet.balanceAmount && (
            <div className="flex justify-between font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
              <span>Balance</span>
              <span>{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Footer Block */}
      {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
        <div className="grid grid-cols-2 gap-6 mt-4 border-t border-slate-200 pt-4">
          {renderCommonFooter(invoice, printSet, {
            titleClass: "text-[10px] text-slate-400 font-extrabold",
            textClass: "text-slate-600 text-[10px]",
            containerClass: "space-y-4",
            signatureContainerClass: "space-y-4 flex flex-col justify-between items-end text-right"
          })}
        </div>
      )}
    </div>
  );
}
