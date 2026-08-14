import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter, getTransactionTitle, isPaymentRelevantForType, getBilledToHeading, getDocTypeDetailLines, getIsInterstate } from "../templateUtils.jsx";

export function VyaparRedTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const isInterstate = getIsInterstate(invoice, printSet, gstSet);
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet, isInterstate);

  // Strictly use custom color for "Standard Plus" / "Vyapar Red" if configured in templateColors, otherwise default to signature Red/Maroon (#8d2b2b)
  const specificColor = printSet?.templateColors?.["Standard Plus"] || printSet?.templateColors?.["Vyapar Red"] || (activeColor?.raw && activeColor.raw !== "#0ea5e9" && (printSet?.themeName === "Standard Plus" || printSet?.themeName === "Vyapar Red") ? activeColor.raw : null);
  const headerColor = specificColor || "#8d2b2b"; // Default Red/Maroon

  return (
    <div className="font-sans bg-white border border-slate-300 text-slate-800 text-[10px] leading-snug shadow-sm flex flex-col min-h-[600px] justify-between">
      <div>
        {/* Top Maroon Header Banner */}
        <div 
          className="p-5 text-white flex flex-col sm:flex-row justify-between items-start gap-4"
          style={{ backgroundColor: headerColor }}
        >
          <div className="flex items-center gap-3">
            {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) && (
              <img 
                src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} 
                alt="Logo" 
                className="max-h-12 max-w-[120px] object-contain bg-white/20 p-1 rounded" 
              />
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">{getTransactionTitle(invoice, printSet, gstSet)}</h1>
            </div>
          </div>

          <div className="text-right text-[10px] space-y-1 opacity-95">
            <p className="font-semibold">
              Business Name: <span className="font-bold">{printSet.companyName || invoice.sellerDetails?.companyName || "My Company"}</span>
            </p>
            {printSet.printAddress !== false && (
              <p>Business Address: {printSet.address || invoice.sellerDetails?.address || meta.billedToAddress || "Address Not Specified"}</p>
            )}
            {printSet.printPhone !== false && (
              <p>Contact Number: {printSet.phone || invoice.sellerDetails?.phone || meta.phone || "-"}</p>
            )}
            {(printSet.gstin || gstSet.gstin || invoice.sellerDetails?.gstin || invoice.gstin) && (
              <p>GSTIN: {printSet.gstin || gstSet.gstin || invoice.sellerDetails?.gstin || invoice.gstin}</p>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Info */}
        <div className="p-5 grid grid-cols-2 gap-4 border-b border-slate-200 text-[10px]">
          <div className="space-y-1">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">{getBilledToHeading(invoice.type, "BILL TO")}:</p>
            <p className="font-bold text-slate-900 text-sm">{meta.billingName || customer}</p>
            {meta.billingName && <p className="text-slate-600 font-semibold">M/s: {customer}</p>}
            {meta.billedToAddress && <p className="text-slate-600">Address: {meta.billedToAddress}</p>}
            {meta.billedToState && <p className="text-slate-600">State: {meta.billedToState}</p>}
            {meta.billedToMobile && <p className="text-slate-600">Contact Number: {meta.billedToMobile}</p>}
            {meta.billedToGstin && <p className="text-slate-600 font-mono">GSTIN: {meta.billedToGstin}</p>}
            {printSet.currentBalanceParty && invoice.partyBalance ? (
              <p className="text-red-600 font-mono font-bold">Balance: ₹{invoice.partyBalance}</p>
            ) : null}

            {(invoice.shippingDetails?.shipToAddress) && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-0.5">Shipped To:</p>
                <p className="font-bold text-slate-900">{meta.billingName || customer}</p>
                <p className="text-slate-600">{invoice.shippingDetails.shipToAddress}</p>
              </div>
            )}
          </div>

          <div className="text-right space-y-1 font-mono">
            <p>
              <span className="font-bold text-slate-700">INVOICE #:</span> {meta.invoiceNumber}
            </p>
            <p>
              <span className="font-bold text-slate-700">DATE:</span> {meta.date}
            </p>
            {meta.dueDate && (
              <p>
                <span className="font-bold text-slate-700">INVOICE DUE DATE:</span> {meta.dueDate}
              </p>
            )}
            {meta.poNumber && <p><span className="font-bold text-slate-700">P.O. #:</span> {meta.poNumber}</p>}
            {meta.poDate && <p><span className="font-bold text-slate-700">P.O. DATE:</span> {meta.poDate}</p>}
            {gstSet.reverseCharge && <p><span className="font-bold text-slate-700">REVERSE CHARGE:</span> {meta.reverseCharge}</p>}
            {getDocTypeDetailLines(meta).map(({ label, value }) => (
              <p key={label}><span className="font-bold text-slate-700">{label}:</span> {value}</p>
            ))}
          </div>
        </div>

        {/* Transport & Supply Details */}
        {(meta.challanNo || meta.vehicleNo || meta.dateOfSupply || meta.placeOfSupply || invoice.transportDetails?.transporterName || invoice.transportDetails?.transporterId || invoice.transportDetails?.ewbNumber || invoice.transportDetails?.lrNumber) && (
          <div className="px-5 pb-4 -mt-1">
            <div className="border border-slate-200 rounded p-3 bg-slate-50/60">
              <h5 className="font-bold text-slate-500 text-[9px] uppercase tracking-wider mb-1.5">Transport & Supply Details</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[9px] font-mono text-slate-600">
                {meta.challanNo && <p><span className="text-slate-400">Challan No:</span> {meta.challanNo}</p>}
                {meta.vehicleNo && <p><span className="text-slate-400">Vehicle No:</span> {meta.vehicleNo}</p>}
                {meta.dateOfSupply && <p><span className="text-slate-400">Date of Supply:</span> {meta.dateOfSupply}</p>}
                {meta.placeOfSupply && <p><span className="text-slate-400">Place of Supply:</span> {meta.placeOfSupply}</p>}
                {invoice.transportDetails?.transporterName && <p><span className="text-slate-400">Transporter:</span> {invoice.transportDetails.transporterName}</p>}
                {invoice.transportDetails?.transporterId && <p><span className="text-slate-400">Transporter GSTIN:</span> {invoice.transportDetails.transporterId}</p>}
                {invoice.transportDetails?.ewbNumber && <p><span className="text-slate-400">E-Way Bill:</span> {invoice.transportDetails.ewbNumber}</p>}
                {invoice.transportDetails?.lrNumber && <p><span className="text-slate-400">LR/GR No:</span> {invoice.transportDetails.lrNumber}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Product Items Table */}
        <div className="p-4 w-full">
          <div className="border border-slate-300 rounded overflow-hidden shadow-sm w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-300 text-[8px] font-bold text-slate-800 uppercase bg-slate-100 divide-x divide-slate-300">
                  {activeColsInOrder.map((key) => {
                    const thClasses = "p-1 align-middle text-center uppercase font-bold break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8px] leading-tight";
                    if (key === "slNo") return <th key={key} className={`${thClasses} w-[4%]`}>{colNames.slNo || "Sr."}</th>;
                    if (key === "itemName") return <th key={key} className={`${thClasses} text-left w-[15%]`}>{colNames.itemName || "Description"}</th>;
                    if (key === "itemCode") return <th key={key} className={`${thClasses} w-[6%]`}>{colNames.itemCode || "Item Code"}</th>;
                    if (key === "hsnSac") return <th key={key} className={`${thClasses} w-[10%]`}>{colNames.hsnSac || "HSN/SAC"}</th>;
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
                    if (key === "taxablePriceUnit") return <th key={key} className={`${thClasses} text-right w-[8%]`}>{colNames.taxablePriceUnit || "Taxable"}</th>;
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
              <tbody className="divide-y divide-slate-200 text-[8.5px]">
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
                    <tr key={idx} className="text-[8.5px] text-slate-700 divide-x divide-slate-200 hover:bg-slate-50/50">
                      {activeColsInOrder.map((key) => {
                        if (key === "slNo") return <td key={key} className={textTd}>{idx + 1}</td>;
                        if (key === "itemName") return <td key={key} className="px-1.5 py-1.5 align-middle text-left font-semibold text-slate-900 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.name || "Item Description"}</td>;
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
                            <td className={`${textTd} font-mono text-red-900 font-bold`}>{g}%</td>
                            <td className={`${numTd} font-bold text-red-950`}>{formatAmt(totalTax, printSet)}</td>
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
                        if (key === "amount") return <td key={key} className={`${numTd} font-bold text-slate-900`}>{formatAmt(lineTotal, printSet)}</td>;
                        return null;
                      })}
                    </tr>
                  );
                })}

                {lines.length === 0 && (
                  <tr>
                    <td colSpan={20} className="py-4 text-center text-slate-400 italic">No items added</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Blocks (Terms & Conditions + Total) */}
      <div className="p-5 pt-0">
        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Left Block: Terms & Conditions */}
          <div className="col-span-7 bg-[#fbf3f3] p-4 rounded border border-[#f0d8d8] flex flex-col justify-between space-y-2">
            <div>
              <h5 className="font-bold text-slate-800 text-[10px] uppercase mb-1">Terms & Conditions:</h5>
              <p className="text-[9px] text-slate-600 whitespace-pre-line leading-relaxed">
                {printSet.terms || "1. Goods once sold will not be taken back.\n2. Interest @24% p.a. will be charged if payment is not made within due date."}
              </p>
            </div>
            {paymentDetails?.accountNumber && (
              <div className="text-[9px] text-slate-600 border-t border-[#f0d8d8] pt-2 mt-2">
                <span className="font-bold text-slate-700">Bank Details:</span> A/C: {paymentDetails.accountNumber}, IFSC: {paymentDetails.ifsc || "-"}, Bank: {paymentDetails.bankName || "-"}
              </div>
            )}
            <div className="text-[9px] text-slate-600 italic">
              <span className="font-bold not-italic text-slate-700">In Words:</span> {numberToWords ? numberToWords(totals.grand) : ""}
            </div>
          </div>

          {/* Right Block: Total Banner */}
          <div 
            className="col-span-5 text-white p-4 rounded flex flex-col justify-between"
            style={{ backgroundColor: headerColor }}
          >
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span>TOTAL</span>
              {totals.gstAmount > 0 && <span className="text-[9px] font-normal opacity-80">(Incl. GST ₹{formatAmt(totals.gstAmount, printSet)})</span>}
            </div>
            {(totals.tcsAmount > 0 || totals.tdsAmount > 0) && (
              <div className="mt-1 pt-1 border-t border-white/20 text-[9px] space-y-0.5 opacity-90">
                {totals.tcsAmount > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>TCS (+)</span>
                    <span>+₹{formatAmt(totals.tcsAmount, printSet)}</span>
                  </div>
                )}
                {totals.tdsAmount > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>TDS (-)</span>
                    <span>-₹{formatAmt(totals.tdsAmount, printSet)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="text-right mt-4">
              <span className="text-2xl font-black font-mono">₹{formatAmt(totals.grand, printSet)}</span>
            </div>
            {isPaymentRelevantForType(invoice.type) && (printSet.receivedAmount || printSet.balanceAmount) && (
              <div className="mt-2 pt-2 border-t border-white/30 space-y-0.5 text-[9px]">
                {printSet.receivedAmount && (
                  <div className="flex justify-between opacity-90">
                    <span>Received</span>
                    <span className="font-mono">₹{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
                  </div>
                )}
                {printSet.balanceAmount && (
                  <div className="flex justify-between font-bold">
                    <span>Balance Due</span>
                    <span className="font-mono">₹{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Common signatures / footer */}
        {(printSet.printSignatureText || printSet.printReceivedByDetails || printSet.printAcknowledgement) && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            {renderCommonFooter(invoice, printSet, {
              titleClass: "text-[9px] text-slate-400 font-bold",
              textClass: "text-slate-600 text-[9px]",
              containerClass: "space-y-2",
              signatureContainerClass: "flex justify-between items-end"
            })}
          </div>
        )}

        {/* Bottom Tagline */}
        <div className="mt-4 flex justify-between items-center text-[8px] text-slate-400 border-t border-slate-100 pt-2">
          <span>Thank you for your business!</span>
          <div className="flex items-center gap-1 font-semibold">
            <span>Powered by</span>
            <span className="text-slate-700 font-bold">Udaan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
