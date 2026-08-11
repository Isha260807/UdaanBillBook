import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter, getTransactionTitle } from "../templateUtils.jsx";

export function VyaparPurpleTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails, shippingDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);

  // Strictly use custom color for "Vyapar Purple" if configured in templateColors, otherwise default to signature Purple (#4a3556 & #e8e1ef)
  const specificColor = printSet?.templateColors?.["Vyapar Purple"] || (activeColor?.raw && activeColor.raw !== "#0ea5e9" && printSet?.themeName === "Vyapar Purple" ? activeColor.raw : null);
  
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
            Bill To:
          </div>
          <div className="p-2 space-y-0.5 text-[9px]">
            <p className="font-bold text-slate-900">{meta.billingName || customer}</p>
            {meta.billedToAddress && <p className="text-slate-600">Address: {meta.billedToAddress}</p>}
            {meta.billedToMobile && <p className="text-slate-600">Phone No.: {meta.billedToMobile}</p>}
            {meta.billedToGstin && <p className="text-slate-700 font-mono">GSTIN: {meta.billedToGstin}</p>}
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
          </div>
          <div className="space-y-0.5 text-right">
            <p><span className="font-bold">Invoice Time:</span> {meta.time || "11:30 AM"}</p>
            <p><span className="font-bold">Invoice Due Date:</span> {meta.dueDate || meta.date}</p>
          </div>
        </div>
      </div>

      {/* 5. Product Table */}
      <div className="border border-slate-300 rounded overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-[8.5px] font-bold text-slate-900 border-b border-slate-400" style={{ backgroundColor: lightPurple }}>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[6%] text-center">Sl. No.</th>
              <th className="px-2 py-1.5 border-r border-slate-400 w-[34%]">Item Name</th>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[8%] text-center">QTY</th>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[12%] text-right">Price / Unit</th>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[9%] text-right">Discount</th>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[9%] text-center">GST Rate</th>
              <th className="px-1.5 py-1.5 border-r border-slate-400 w-[10%] text-right">GST Amount</th>
              <th className="px-2 py-1.5 w-[12%] text-right">Final Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[9px]">
            {lines.map((l, idx) => {
              const q = Number(l.qty) || 0;
              const r = Number(l.rate) || 0;
              const d = Number(l.discount) || 0;
              const g = Number(l.gst) || 0;
              const rateAfterDisc = r * (1 - d / 100);
              const lineTotal = q * rateAfterDisc;
              const taxableVal = lineTotal / (1 + g / 100);
              const gstAmount = lineTotal - taxableVal;

              return (
                <tr key={idx} className="text-slate-700">
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                  <td className="px-2 py-1.5 border-r border-slate-200 font-semibold text-slate-900">{l.name || "Item Name"}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-center font-mono">{q}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-right font-mono">₹{formatAmt(r, printSet)}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-right font-mono">{d > 0 ? `${d}%` : "-"}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-center font-mono">{g}%</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 text-right font-mono">₹{formatAmt(gstAmount, printSet)}</td>
                  <td className="px-2 py-1.5 text-right font-bold font-mono text-slate-900">₹{formatAmt(lineTotal, printSet)}</td>
                </tr>
              );
            })}

            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-slate-400 italic">No items added</td>
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
            <div className="flex justify-between">
              <span>CGST:</span>
              <span className="font-mono">₹{formatAmt(totals.gstAmount / 2, printSet)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST:</span>
              <span className="font-mono">₹{formatAmt(totals.gstAmount / 2, printSet)}</span>
            </div>

            {/* Total Highlight Bar */}
            <div 
              className="flex justify-between font-bold text-white p-1.5 rounded text-[10px] mt-1"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Total:</span>
              <span className="font-mono">₹{formatAmt(totals.grand, printSet)}</span>
            </div>
          </div>

          {/* Company Seal & Signature Box */}
          <div 
            className="w-full py-1 px-2 text-center text-white font-bold rounded text-[8.5px] uppercase mt-2"
            style={{ backgroundColor: primaryColor }}
          >
            {printSet.signatureText || invoice.signatureText || "Company Seal & Signature"}
          </div>
        </div>
      </div>

      {/* 7. ACKNOWLEDGEMENT SLIP */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <div className="text-center font-bold uppercase tracking-wider text-[9.5px] text-slate-800">
          ACKNOWLEDGEMENT
        </div>

        <div className="grid grid-cols-12 gap-3 items-end text-[9px]">
          <div className="col-span-5 space-y-1">
            <p><span className="font-bold">Company Name:</span> {printSet.companyName || "Company Name"}</p>
            <div className="py-1 px-2 font-bold text-slate-800 rounded" style={{ backgroundColor: lightPurple }}>
              Buyer's Name: <span className="font-normal">{meta.billingName || customer}</span>
            </div>
          </div>

          <div className="col-span-3 text-center pb-0.5">
            <div className="py-1 px-2 font-bold text-slate-800 rounded text-[8px]" style={{ backgroundColor: lightPurple }}>
              Receivers Seal & Sign
            </div>
          </div>

          <div className="col-span-4 space-y-0.5 text-right font-mono text-[8.5px]">
            <p><span className="font-bold font-sans">Invoice No.:</span> {meta.invoiceNumber}</p>
            <p><span className="font-bold font-sans">Invoice Date:</span> {meta.date}</p>
            <p><span className="font-bold font-sans">Invoice Amount:</span> ₹{formatAmt(totals.grand, printSet)}</p>
            <p><span className="font-bold font-sans">Due Date:</span> {meta.dueDate || meta.date}</p>
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
