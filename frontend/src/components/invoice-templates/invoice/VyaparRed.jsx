import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function VyaparRedTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);

  // By default use original template's signature Red/Maroon color (#8d2b2b)
  const vendorColor = printSet?.themeColor || printSet?.activeColor || activeColor?.hex || activeColor?.raw;
  const isExplicitCustom = Boolean(vendorColor && vendorColor !== "#0ea5e9");

  const headerColor = isExplicitCustom ? vendorColor : "#8d2b2b"; // Default Red/Maroon

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
              <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
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
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">BILL TO:</p>
            <p className="font-bold text-slate-900 text-sm">{meta.billingName || customer}</p>
            {meta.billingName && <p className="text-slate-600 font-semibold">M/s: {customer}</p>}
            {meta.billedToAddress && <p className="text-slate-600">Address: {meta.billedToAddress}</p>}
            {meta.billedToState && <p className="text-slate-600">State: {meta.billedToState}</p>}
            {meta.billedToMobile && <p className="text-slate-600">Contact Number: {meta.billedToMobile}</p>}
            {meta.billedToGstin && <p className="text-slate-600 font-mono">GSTIN: {meta.billedToGstin}</p>}
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
          </div>
        </div>

        {/* Product Items Table */}
        <div className="p-5">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[9px] font-bold text-slate-800 uppercase">
                {activeColsInOrder.map((key) => {
                  if (key === "slNo") return <th key={key} className="py-2 w-[5%]">ITEMS</th>;
                  if (key === "itemName") return <th key={key} className="py-2 w-[35%]">DESCRIPTION</th>;
                  if (key === "hsnSac") return <th key={key} className="py-2 text-center w-[10%]">HSN</th>;
                  if (key === "quantity") return <th key={key} className="py-2 text-center w-[10%]">QUANTITY</th>;
                  if (key === "unit") return <th key={key} className="py-2 text-center w-[8%]">UNIT</th>;
                  if (key === "priceUnit") return <th key={key} className="py-2 text-right w-[12%]">PRICE</th>;
                  if (key === "discount") return <th key={key} className="py-2 text-right w-[8%]">DISC</th>;
                  if (key === "discountPercent") return <th key={key} className="py-2 text-right w-[8%]">DISC%</th>;
                  if (key === "taxableValue") return <th key={key} className="py-2 text-right w-[12%]">TAXABLE</th>;
                  if (key === "cgst") return <th key={key} className="py-2 text-center w-[10%]">TAX %</th>;
                  if (key === "sgst") return null;
                  if (key === "amount") return <th key={key} className="py-2 text-right w-[15%]">AMOUNT</th>;
                  return null;
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lines.map((l, idx) => {
                const q = Number(l.qty) || 0;
                const r = Number(l.rate) || 0;
                const d = Number(l.discount) || 0;
                const g = Number(l.gst) || 0;
                const rateAfterDisc = r * (1 - d / 100);
                const lineTotal = q * rateAfterDisc;
                const taxableVal = lineTotal / (1 + g / 100);
                const dAmount = r * (d / 100);

                return (
                  <tr key={idx} className="text-[10px] text-slate-700">
                    {activeColsInOrder.map((key) => {
                      if (key === "slNo") return <td key={key} className="py-3 text-slate-500 font-medium">{idx + 1}</td>;
                      if (key === "itemName") return <td key={key} className="py-3 font-semibold text-slate-900">{l.name || "Item Description"}</td>;
                      if (key === "hsnSac") return <td key={key} className="py-3 text-center font-mono">{l.hsnSac || "-"}</td>;
                      if (key === "quantity") return <td key={key} className="py-3 text-center font-mono">{q}</td>;
                      if (key === "unit") return <td key={key} className="py-3 text-center">{l.unit || "Pcs"}</td>;
                      if (key === "priceUnit") return <td key={key} className="py-3 text-right font-mono">₹{formatAmt(r, printSet)}</td>;
                      if (key === "discount") return <td key={key} className="py-3 text-right font-mono">₹{formatAmt(dAmount, printSet)}</td>;
                      if (key === "discountPercent") return <td key={key} className="py-3 text-right font-mono">{d}%</td>;
                      if (key === "taxableValue") return <td key={key} className="py-3 text-right font-mono">₹{formatAmt(taxableVal, printSet)}</td>;
                      if (key === "cgst") return <td key={key} className="py-3 text-center font-mono">{g}%</td>;
                      if (key === "sgst") return null;
                      if (key === "amount") return <td key={key} className="py-3 text-right font-bold font-mono text-slate-900">₹{formatAmt(lineTotal, printSet)}</td>;
                      return null;
                    })}
                  </tr>
                );
              })}

              {lines.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">No items added</td>
                </tr>
              )}
            </tbody>
          </table>
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
            <div className="text-right mt-4">
              <span className="text-2xl font-black font-mono">₹{formatAmt(totals.grand, printSet)}</span>
            </div>
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
