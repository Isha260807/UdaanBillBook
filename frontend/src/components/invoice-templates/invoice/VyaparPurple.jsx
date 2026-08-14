import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter, getTransactionTitle, isPaymentRelevantForType, getBilledToHeading, getDocTypeDetailLines, getIsInterstate } from "../templateUtils.jsx";

export function VyaparPurpleTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails, shippingDetails } = invoice;
  const isInterstate = getIsInterstate(invoice, printSet, gstSet);
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet, isInterstate);

  // Strictly use custom color for "Premium Pro" / "Vyapar Purple" if configured in templateColors, otherwise default to signature Purple (#4a3556 & #e8e1ef)
  const specificColor = printSet?.templateColors?.["Premium Pro"] || printSet?.templateColors?.["Vyapar Purple"] || (activeColor?.raw && activeColor.raw !== "#0ea5e9" && (printSet?.themeName === "Premium Pro" || printSet?.themeName === "Vyapar Purple") ? activeColor.raw : null);
  
  const primaryColor = specificColor || "#4a3556"; // Default Purple
  const lightPurple = specificColor ? `${specificColor}1f` : "#e8e1ef"; // Default Light Purple strip

  return (
    <div className="font-sans bg-white border border-slate-300 text-slate-800 text-[10px] leading-tight shadow-sm flex flex-col p-4 space-y-3">
      {/* 1. Header Banner */}
      <div 
        className="w-full py-2 px-4 text-center text-white rounded font-bold text-lg tracking-wide uppercase"
        style={{ backgroundColor: primaryColor }}
      >
        {getTransactionTitle(invoice, printSet, gstSet)}
      </div>

      {/* 2. Company Details */}
      <div className="flex justify-between items-start pt-1 text-[10px]">
        <div className="flex items-start gap-2">
          {printSet.printCompanyLogo !== false && (
            (printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
              <img
                src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl}
                alt="Logo"
                className="max-h-10 max-w-[90px] object-contain shrink-0"
              />
            ) : showUdaanLogo ? (
              <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="h-7 w-auto object-contain opacity-90 grayscale shrink-0" />
            ) : null
          )}
          <div className="space-y-0.5">
          <p className="font-bold text-slate-900 text-xs">
            {printSet.companyName || invoice.sellerDetails?.companyName || "My Company"}
          </p>
          {printSet.printAddress !== false && (
            <p className="text-slate-600">
              Address: {printSet.address || invoice.sellerDetails?.address || meta.billedToAddress || "Address Not Specified"}
            </p>
          )}
          {printSet.printEmail !== false && (
            <p className="text-slate-600">
              Email ID: {printSet.email || invoice.sellerDetails?.email || meta.email || "-"}
            </p>
          )}
          {printSet.printPhone !== false && (
            <p className="text-slate-600">
              Phone No.: {printSet.phone || invoice.sellerDetails?.phone || meta.phone || "-"}
            </p>
          )}
          {(printSet.gstin || gstSet.gstin || invoice.sellerDetails?.gstin || invoice.gstin) && (
            <p className="text-slate-700 font-semibold">
              GSTIN No.: {printSet.gstin || gstSet.gstin || invoice.sellerDetails?.gstin || invoice.gstin}
            </p>
          )}
          </div>
        </div>
        <div className="text-right space-y-0.5 font-semibold">
          <p className="text-slate-700">
            State of Supply: <span className="font-bold text-slate-900">{meta.placeOfSupply || meta.billedToState || "Delhi"}</span>
          </p>
        </div>
      </div>

      {/* 3. Bill To & Ship To Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bill To Box */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="py-1 px-2.5 font-bold text-slate-800 text-[9px] uppercase" style={{ backgroundColor: lightPurple }}>
            {getBilledToHeading(invoice.type, "Bill To")}:
          </div>
          <div className="p-2 space-y-0.5 text-[9px]">
            <p className="font-bold text-slate-900">{meta.billingName || customer}</p>
            {meta.billedToAddress && <p className="text-slate-600">Address: {meta.billedToAddress}</p>}
            {meta.billedToMobile && <p className="text-slate-600">Phone No.: {meta.billedToMobile}</p>}
            {meta.billedToGstin && <p className="text-slate-700 font-mono">GSTIN: {meta.billedToGstin}</p>}
            {printSet.currentBalanceParty && invoice.partyBalance ? (
              <p className="text-red-600 font-mono font-bold">Balance: ₹{invoice.partyBalance}</p>
            ) : null}
            {getDocTypeDetailLines(meta).map(({ label, value }) => (
              <p key={label} className="text-slate-600">{label}: {value}</p>
            ))}
          </div>
        </div>

        {/* Ship To Box */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="py-1 px-2.5 font-bold text-slate-800 text-[9px] uppercase" style={{ backgroundColor: lightPurple }}>
            Ship To:
          </div>
          <div className="p-2 space-y-0.5 text-[9px]">
            <p className="font-bold text-slate-900">{shippingDetails?.shipToName || meta.billingName || customer}</p>
            <p className="text-slate-600">Address: {shippingDetails?.shipToAddress || meta.billedToAddress || "-"}</p>
            <p className="text-slate-600">Phone No.: {shippingDetails?.phone || meta.billedToMobile || "-"}</p>
            {(shippingDetails?.shipToGSTIN || meta.billedToGstin) && (
              <p className="text-slate-700 font-mono">GSTIN: {shippingDetails?.shipToGSTIN || meta.billedToGstin}</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Invoice Metadata Banner */}
      <div className="rounded border border-slate-300 overflow-hidden" style={{ backgroundColor: lightPurple }}>
        <div className="grid grid-cols-2 p-2 gap-x-4 text-[9px] font-medium text-slate-800">
          <div className="space-y-0.5">
            <p><span className="font-bold">Invoice No.:</span> {meta.invoiceNumber}</p>
            <p><span className="font-bold">Invoice Date:</span> {meta.date}</p>
            {meta.poNumber && <p><span className="font-bold">P.O. No.:</span> {meta.poNumber}</p>}
            {meta.poDate && <p><span className="font-bold">P.O. Date:</span> {meta.poDate}</p>}
          </div>
          <div className="space-y-0.5 text-right">
            {meta.time && <p><span className="font-bold">Invoice Time:</span> {meta.time}</p>}
            {meta.dueDate && <p><span className="font-bold">Invoice Due Date:</span> {meta.dueDate}</p>}
            {gstSet.reverseCharge && <p><span className="font-bold">Reverse Charge:</span> {meta.reverseCharge}</p>}
          </div>
        </div>
      </div>

      {/* Transport & Supply Details */}
      {(meta.challanNo || meta.vehicleNo || meta.dateOfSupply || meta.placeOfSupply || invoice.transportDetails?.transporterName || invoice.transportDetails?.transporterId || invoice.transportDetails?.ewbNumber || invoice.transportDetails?.lrNumber) && (
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="py-1 px-2.5 font-bold text-slate-800 text-[9px] uppercase" style={{ backgroundColor: lightPurple }}>
            Transport & Supply Details
          </div>
          <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-[9px] font-mono text-slate-600">
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
      )}

      {/* 5. Product Table */}
      <div className="border border-slate-300 rounded overflow-hidden shadow-sm w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-[8px] font-bold text-slate-900 border-b border-slate-400 divide-x divide-slate-400" style={{ backgroundColor: lightPurple }}>
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
                    if (key === "itemName") return <td key={key} className="px-1.5 py-1.5 align-middle text-left font-semibold text-slate-900 break-words [overflow-wrap:anywhere] [word-break:break-word] text-[8.5px] leading-tight">{l.name || "Item Name"}</td>;
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
                        <td className={`${textTd} font-mono text-purple-900 font-bold`}>{g}%</td>
                        <td className={`${numTd} font-bold text-purple-950`}>{formatAmt(totalTax, printSet)}</td>
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

            {/* Total Row */}
            <tr className="font-bold text-slate-900 border-t border-slate-400" style={{ backgroundColor: lightPurple }}>
              <td colSpan={2} className="px-2 py-1.5 border-r border-slate-400 text-center uppercase text-[8.5px]">Total</td>
              <td className="px-1.5 py-1.5 border-r border-slate-400 text-center font-mono">
                {lines.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}
              </td>
              <td colSpan={4} className="border-r border-slate-400"></td>
              <td className="px-2 py-1.5 text-right font-mono font-bold">₹{formatAmt(totals.grand, printSet)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Footer Summary */}
      <div className="grid grid-cols-12 gap-3 pt-1">
        {/* Left Side: Amount In Words & Terms */}
        <div className="col-span-7 space-y-2">
          <div>
            <div className="py-1 px-2 font-bold text-slate-800 text-[8.5px] uppercase rounded-t" style={{ backgroundColor: lightPurple }}>
              Amount In Words:
            </div>
            <div className="p-1.5 border border-slate-300 border-t-0 rounded-b text-[8.5px] font-semibold text-slate-700 italic">
              {numberToWords ? numberToWords(totals.grand) : "Rupees Only"}
            </div>
          </div>

          <div>
            <div className="py-1 px-2 font-bold text-slate-800 text-[8.5px] uppercase rounded-t" style={{ backgroundColor: lightPurple }}>
              Terms & Conditions:
            </div>
            <div className="p-1.5 border border-slate-300 border-t-0 rounded-b text-[8.5px] text-slate-600 leading-normal whitespace-pre-line">
              {printSet.terms || invoice.terms || "1. Goods once sold will not be returned.\n2. Payment terms as agreed."}
            </div>
          </div>

          {(paymentDetails?.accountNumber || invoice.bankDetails?.accountNumber || printSet.accountNumber) && (
            <div className="p-1.5 border border-slate-300 rounded text-[8.5px] text-slate-700 space-y-0.5">
              <span className="font-bold uppercase tracking-wider block text-slate-800">Bank Details:</span>
              <p>A/C No: <span className="font-mono font-bold">{paymentDetails?.accountNumber || invoice.bankDetails?.accountNumber || printSet.accountNumber}</span></p>
              <p>Bank: {paymentDetails?.bankName || invoice.bankDetails?.bankName || printSet.bankName || "-"} | IFSC: <span className="font-mono">{paymentDetails?.ifsc || invoice.bankDetails?.ifsc || printSet.ifsc || "-"}</span></p>
            </div>
          )}
        </div>

        {/* Right Side: Totals & Signature */}
        <div className="col-span-5 space-y-2 text-[9px]">
          <div className="space-y-1 font-medium text-slate-700">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span className="font-mono">₹{formatAmt(totals.taxableAmount, printSet)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-mono">₹{formatAmt(totals.discountAmount, printSet)}</span>
              </div>
            )}
            {totals.gstAmount > 0 && (
              isInterstate ? (
                <div className="flex justify-between font-semibold text-purple-950">
                  <span>IGST:</span>
                  <span className="font-mono">₹{formatAmt(totals.gstAmount, printSet)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span className="font-mono">₹{formatAmt(totals.gstAmount / 2, printSet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span className="font-mono">₹{formatAmt(totals.gstAmount / 2, printSet)}</span>
                  </div>
                </>
              )
            )}
            {totals.tcsAmount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>TCS (+):</span>
                <span className="font-mono">+₹{formatAmt(totals.tcsAmount, printSet)}</span>
              </div>
            )}
            {totals.tdsAmount > 0 && (
              <div className="flex justify-between font-semibold text-blue-700">
                <span>TDS (-):</span>
                <span className="font-mono">-₹{formatAmt(totals.tdsAmount, printSet)}</span>
              </div>
            )}

            {/* Total Highlight Bar */}
            <div
              className="flex justify-between font-bold text-white p-1.5 rounded text-[10px] mt-1"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Total:</span>
              <span className="font-mono">₹{formatAmt(totals.grand, printSet)}</span>
            </div>

            {isPaymentRelevantForType(invoice.type) && printSet.receivedAmount && (
              <div className="flex justify-between">
                <span>Received:</span>
                <span className="font-mono">₹{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
              </div>
            )}
            {isPaymentRelevantForType(invoice.type) && printSet.balanceAmount && (
              <div className="flex justify-between font-bold text-red-700">
                <span>Balance Due:</span>
                <span className="font-mono">₹{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
              </div>
            )}
          </div>

          {/* Company Seal & Signature Box */}
          <div className="w-full mt-2 space-y-1">
            {(invoice.signatureUrl || printSet.signatureUrl || invoice.signatureImgUrl || printSet.signatureImgUrl) && (
              <div className="flex flex-col items-center justify-center py-0.5">
                {(invoice.signatureUrl || printSet.signatureUrl) && (
                  <img src={invoice.signatureUrl || printSet.signatureUrl} alt="Seal" className="h-8 max-h-9 object-contain" />
                )}
                {(invoice.signatureImgUrl || printSet.signatureImgUrl) && (
                  <img src={invoice.signatureImgUrl || printSet.signatureImgUrl} alt="Signature" className="h-7 max-h-8 object-contain mt-0.5" />
                )}
              </div>
            )}
            <div
              className="w-full py-1 px-2 text-center text-white font-bold rounded text-[8.5px] uppercase"
              style={{ backgroundColor: primaryColor }}
            >
              {invoice.signatureText || printSet.signatureText || "Authorised Signatory"}
            </div>
          </div>
        </div>
      </div>

      {/* 7. ACKNOWLEDGEMENT SLIP */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="text-center font-bold uppercase tracking-wider text-[9.5px] text-slate-800">
          ACKNOWLEDGEMENT
        </div>

        <div className="grid grid-cols-12 gap-3 items-end text-[9px]">
          <div className="col-span-4 space-y-1">
            <p><span className="font-bold">Company Name:</span> {printSet.companyName || "Company Name"}</p>
            <div className="py-1 px-2 font-bold text-slate-800 rounded" style={{ backgroundColor: lightPurple }}>
              Buyer's Name: <span className="font-normal">{meta.billingName || customer}</span>
            </div>
          </div>

          <div className="col-span-2 text-center pb-0.5">
            <div className="py-1 px-2 font-bold text-slate-800 rounded text-[8px]" style={{ backgroundColor: lightPurple }}>
              Receiver's Seal & Sign
              {invoice.receivedBy && (
                <span className="block font-normal normal-case text-[8px] mt-0.5">{invoice.receivedBy}</span>
              )}
            </div>
          </div>

          <div className="col-span-2 text-center pb-0.5">
            <div className="py-1 px-2 font-bold text-slate-800 rounded text-[8px]" style={{ backgroundColor: lightPurple }}>
              Delivered By
              {invoice.deliveredBy && (
                <span className="block font-normal normal-case text-[8px] mt-0.5">{invoice.deliveredBy}</span>
              )}
            </div>
          </div>

          <div className="col-span-4 space-y-0.5 text-right font-mono text-[8.5px]">
            <p><span className="font-bold font-sans">Invoice No.:</span> {meta.invoiceNumber}</p>
            <p><span className="font-bold font-sans">Invoice Date:</span> {meta.date}</p>
            <p><span className="font-bold font-sans">Invoice Amount:</span> ₹{formatAmt(totals.grand, printSet)}</p>
            {meta.dueDate && <p><span className="font-bold font-sans">Due Date:</span> {meta.dueDate}</p>}
          </div>
        </div>
      </div>

      {/* Powered by tag */}
      <div className="pt-2 flex justify-end items-center gap-1 text-[8px] text-slate-400 border-t border-slate-100">
        <span>Powered by</span>
        <span className="font-bold text-slate-700">Udaan</span>
      </div>
    </div>
  );
}
