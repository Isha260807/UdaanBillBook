import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter, getTransactionTitle, isPaymentRelevantForType, getBilledToHeading, getDocTypeDetailLines, getIsInterstate } from "../templateUtils.jsx";

export function MinimalTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const isInterstate = getIsInterstate(invoice, printSet, gstSet);
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet, isInterstate);
  return (
    <div className="font-mono bg-white text-slate-800 text-[10px] leading-tight space-y-4 p-2">
      {/* Top compact line info */}
      <div className="flex justify-between border-b pb-2 border-slate-200">
        <div>
          {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
            <img src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} alt="Logo" className="max-h-12 max-w-[120px] object-contain mb-1" style={{ maxHeight: '48px', maxWidth: '120px', width: 'auto', height: 'auto' }} />
          ) : showUdaanLogo ? (
            <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="h-6 w-auto object-contain opacity-90 grayscale mb-1" />
          ) : null}
          {printSet.printCompanyName && (
            <h1 className="text-xs font-bold text-slate-900 uppercase">
              {printSet.companyName || "KESHAV TRAVELS"}
            </h1>
          )}
          <span className="text-[9px] text-slate-500">GSTIN: {gstSet.gstin || "07AQXPD2556K2ZB"}</span>
        </div>
        <div className="text-right">
          <p className="font-extrabold uppercase text-[11px]" style={{ color: activeColor?.raw || '#1e293b' }}>{getTransactionTitle(invoice, printSet, gstSet)}</p>
          <p>INV NO: {meta.invoiceNumber}</p>
          <p>DATE: {meta.date}</p>
          {meta.poNumber && <p>P.O. NO: {meta.poNumber}</p>}
          {meta.poDate && <p>P.O. DATE: {meta.poDate}</p>}
        </div>
      </div>

      {/* Customer block minimal */}
      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-start gap-4">
        <div>
          <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">{getBilledToHeading(invoice.type, "Billed To")}:</span>
          <p className="font-bold text-slate-900">{meta.billingName || customer}</p>
          {meta.billingName && <p className="text-[9px] font-semibold text-slate-600">M/s: {customer}</p>}
          {meta.billedToAddress && <p className="text-[9px] text-slate-500">{meta.billedToAddress}</p>}
          {meta.billedToState && <p className="text-[9px] text-slate-500">State: {meta.billedToState}</p>}
          {meta.billedToMobile && <p className="text-[9px] text-slate-500">Mob: {meta.billedToMobile}</p>}
          {meta.billedToGstin && <p className="text-[9px] font-mono text-slate-600 mt-0.5">GSTIN: {meta.billedToGstin}</p>}
          {printSet.currentBalanceParty && invoice.partyBalance && (
            <p className="text-red-600 font-mono font-bold text-[9px] mt-0.5">Bal: ₹{invoice.partyBalance}</p>
          )}
        </div>
        {(invoice.shippingDetails?.shippingAddress || invoice.shippingDetails?.shippingName) && (
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">Shipped To:</span>
            <p className="font-bold text-slate-900">{invoice.shippingDetails.shippingName || meta.billingName || customer}</p>
            {invoice.shippingDetails.shippingAddress && <p className="text-[9px] text-slate-500">{invoice.shippingDetails.shippingAddress}</p>}
            {invoice.shippingDetails.shippingGstin && <p className="text-[9px] font-mono text-slate-600 mt-0.5">GSTIN: {invoice.shippingDetails.shippingGstin}</p>}
          </div>
        )}
        <div className="text-right">
          <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">Other Info:</span>
          {meta.challanNo && <p className="font-bold text-slate-900">Challan: {meta.challanNo}</p>}
          {(meta.vehicleNo || invoice.transportDetails?.vehicleNo) && <p className="font-bold text-slate-900">Vehicle: {meta.vehicleNo || invoice.transportDetails?.vehicleNo}</p>}
          {meta.dateOfSupply && <p className="font-bold text-slate-900">Supply Date: {meta.dateOfSupply.split("-").reverse().join("/")}</p>}
          {meta.placeOfSupply && <p className="text-[9px] text-slate-500">Place: {meta.placeOfSupply}</p>}
          {invoice.transportDetails?.eWayBillNo && <p className="text-[9px] text-slate-500">E-Way Bill: {invoice.transportDetails.eWayBillNo}</p>}
          {invoice.transportDetails?.transporterName && <p className="text-[9px] text-slate-500">Transporter: {invoice.transportDetails.transporterName}</p>}
          {invoice.transportDetails?.grRrNo && <p className="text-[9px] text-slate-500">GR/RR No: {invoice.transportDetails.grRrNo}</p>}
          {gstSet.reverseCharge && <p className="text-[9px] text-slate-500">Rev. Charge: {meta.reverseCharge}</p>}
          {getDocTypeDetailLines(meta).map(({ label, value }) => (
            <p key={label} className="text-[9px] text-slate-500">{label}: {value}</p>
          ))}
        </div>
      </div>

      {/* Minimal Table */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
          <tr className="border-b-2 border-slate-300 text-slate-800 uppercase text-[8px] font-bold bg-slate-100">
            {activeColsInOrder.map((key) => {
              const thClasses = "p-1 align-middle text-center uppercase font-bold break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8px] leading-tight";
              if (key === "slNo") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.slNo || "Sr."}</th>;
              if (key === "itemName") return <th key={key} className={`${thClasses} text-left w-[15%]`}>{colNames.itemName || "Description"}</th>;
              if (key === "itemCode") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.itemCode || "Item Code"}</th>;
              if (key === "hsnSac") return <th key={key} className={`${thClasses} w-[10%]`}>{colNames.hsnSac || "HSN"}</th>;
              if (key === "batchNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.batchNo || "Batch"}</th>;
              if (key === "expDate") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.expDate || "Exp"}</th>;
              if (key === "mfgDate") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.mfgDate || "Mfg"}</th>;
              if (key === "mrp") return <th key={key} className={`${thClasses} text-right w-[6%]`}>{colNames.mrp || "MRP"}</th>;
              if (key === "size") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.size || "Size"}</th>;
              if (key === "modelNo") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.modelNo || "Model"}</th>;
              if (key === "description") return <th key={key} className={`${thClasses} text-left w-[12%]`}>{colNames.description || "Desc"}</th>;
              if (key === "count") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.count || "Count"}</th>;
              if (key === "colour") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.colour || "Colour"}</th>;
              if (key === "material") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.material || "Material"}</th>;
              if (key === "brand") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.brand || "Brand"}</th>;
              if (key === "serialNo") return <th key={key} className={`${thClasses} w-[7%]`}>{colNames.serialNo || "Serial"}</th>;
              if (key === "challanNo") return <th key={key} className={`${thClasses} w-[8%]`}>{colNames.challanNo || "Challan"}</th>;
              if (key === "quantity") return <th key={key} className={`${thClasses} w-[5%]`}>{colNames.quantity || "Qty"}</th>;
              if (key === "unit") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.unit || "Unit"}</th>;
              if (key === "priceUnit") return <th key={key} className={`${thClasses} text-right w-[8%]`}>{colNames.priceUnit || "Rate"}</th>;
              if (key === "discount") return <th key={key} className={`${thClasses} text-right w-[6%]`}>{colNames.discount || "Discount"}</th>;
              if (key === "discountPercent") return <th key={key} className={`${thClasses} text-right w-[5%]`}>{colNames.discountPercent || "Disc%"}</th>;
              if (key === "taxablePriceUnit") return <th key={key} className={`${thClasses} text-right w-[8%]`}>{colNames.taxablePriceUnit || "Taxable Rate"}</th>;
              if (key === "taxableValue") return <th key={key} className={`${thClasses} text-right w-[9%]`}>Taxable Amt</th>;
              if (key === "igst") return (
                <React.Fragment key={key}>
                  <th className={`${thClasses} w-[4%]`}>IGST%</th>
                  <th className={`${thClasses} text-right w-[6%]`}>IGST Amt</th>
                </React.Fragment>
              );
              if (key === "cgst") return (
                <React.Fragment key={key}>
                  <th className={`${thClasses} w-[4%]`}>CGST%</th>
                  <th className={`${thClasses} text-right w-[6%]`}>CGST Amt</th>
                </React.Fragment>
              );
              if (key === "sgst") return (
                <React.Fragment key={key}>
                  <th className={`${thClasses} w-[4%]`}>SGST%</th>
                  <th className={`${thClasses} text-right w-[6%]`}>SGST Amt</th>
                </React.Fragment>
              );
              if (key === "amount") return <th key={key} className={`${thClasses} text-right w-[9%]`}>{colNames.amount || "Total"}</th>;
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

            const numTd = "px-1 py-1.5 align-middle text-right font-mono break-all [overflow-wrap:anywhere] [word-break:break-all] text-[8.5px] leading-tight";
            const textTd = "px-1 py-1.5 align-middle text-center break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight";

            return (
              <tr key={idx} className="text-[8.5px] text-slate-700 hover:bg-slate-50/50">
                {activeColsInOrder.map((key) => {
                  if (key === "slNo") return <td key={key} className={textTd}>{idx + 1}</td>;
                  if (key === "itemName") return <td key={key} className="px-1.5 py-1.5 align-middle text-left font-bold text-slate-800 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.name || "Product Item"}</td>;
                  if (key === "itemCode") return <td key={key} className={textTd}>{l.itemCode || "-"}</td>;
                  if (key === "hsnSac") return <td key={key} className={`${textTd} font-mono`}>{l.hsnSac || "-"}</td>;
                  if (key === "batchNo") return <td key={key} className={textTd}>{l.batchNo || "-"}</td>;
                  if (key === "expDate") return <td key={key} className={textTd}>{l.expDate || "-"}</td>;
                  if (key === "mfgDate") return <td key={key} className={textTd}>{l.mfgDate || "-"}</td>;
                  if (key === "mrp") return <td key={key} className={numTd}>{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                  if (key === "size") return <td key={key} className={textTd}>{l.size || "-"}</td>;
                  if (key === "modelNo") return <td key={key} className={textTd}>{l.modelNo || "-"}</td>;
                  if (key === "description") return <td key={key} className="px-1 py-1.5 align-middle text-left break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.description || "-"}</td>;
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
                      <td className={`${textTd} font-mono text-slate-400`}>{(g / 2)}%</td>
                      <td className={numTd}>{formatAmt(cgstAmount, printSet)}</td>
                    </React.Fragment>
                  );
                  if (key === "amount") return <td key={key} className={`${numTd} font-extrabold text-slate-900`}>{formatAmt(lineTotal, printSet)}</td>;
                  return null;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Summary compact */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t pt-2 border-slate-200">
        <div className="text-[8px] text-slate-400 space-y-1">
          <p>Bank: {invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"} | A/c: {invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</p>
          <p>IFSC: {invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"} | Branch: {invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</p>
        </div>
        <div className="text-right space-y-1 w-64 text-[10px] font-mono border-t pt-1 border-slate-100">
          <div className="flex justify-between"><span>Taxable Amount</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
          <div className="flex justify-between"><span>{isInterstate ? "IGST Amount" : "GST Amount"}</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
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
          <div className={`flex justify-between font-extrabold text-[11px] border-t-2 pt-1 border-slate-800 ${activeColor.text}`}>
            <span>Total Payable</span><span>{formatAmt(totals.grand, printSet)}</span>
          </div>
          {isPaymentRelevantForType(invoice.type) && printSet.receivedAmount && (
            <div className="flex justify-between text-slate-500">
              <span>Received</span>
              <span>{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
            </div>
          )}
          {isPaymentRelevantForType(invoice.type) && printSet.balanceAmount && (
            <div className="flex justify-between font-bold text-slate-800 border-t border-dashed pt-0.5 mt-0.5">
              <span>Balance</span>
              <span>{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Footer Block */}
      {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-200 pt-4">
          {renderCommonFooter(invoice, printSet, {
            titleClass: "text-[9px] text-slate-400 font-bold",
            textClass: "text-slate-600 text-[9px]",
            containerClass: "space-y-3",
            signatureContainerClass: "space-y-3 flex flex-col justify-between items-end text-right"
          })}
        </div>
      )}
    </div>
  );
}
