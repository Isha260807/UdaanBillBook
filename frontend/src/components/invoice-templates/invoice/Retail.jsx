import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function RetailTemplate({ invoice, printSet, gstSet, activeColor, numberToWords }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);
  return (
    <div className="font-mono bg-white border border-slate-300 text-slate-800 text-[10px] p-4 shadow-sm flex flex-col space-y-4 max-w-md mx-auto">
      {/* Retail Banner Header */}
      <div className="text-center border-b-2 border-dashed pb-3 space-y-1">
        {printSet.printCompanyName && (
          <h2 className="text-sm font-black uppercase tracking-wider">{printSet.companyName || "KESHAV TRAVELS"}</h2>
        )}
        <p className="text-[9px] text-slate-500 whitespace-pre-line leading-tight">
          {printSet.address || "S-99/134 first floor moti lal nehru camp JNU, New Delhi"}
        </p>
        <p className="text-[9px] font-bold">GSTIN: {gstSet.gstin || "07AQXPD2556K2ZB"}</p>
        <div className={`text-[10px] font-extrabold uppercase pt-1.5 ${activeColor.text}`}>RETAIL CASH MEMO</div>
      </div>

      {/* Mini Customer & Meta Card */}
      <div className="text-[9px] space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
        <p><span className="font-bold">INVOICE:</span> {meta.invoiceNumber} | <span className="font-bold">DATE:</span> {meta.date}</p>
        {meta.poNumber && <p><span className="font-bold">P.O. NO:</span> {meta.poNumber}</p>}
        {meta.poDate && <p><span className="font-bold">P.O. DATE:</span> {meta.poDate}</p>}
        <p><span className="font-bold">CUSTOMER:</span> {meta.billingName || customer}</p>
        {meta.billingName && <p><span className="font-bold">M/S:</span> {customer}</p>}
        {meta.billedToMobile && <p><span className="font-bold">MOBILE:</span> {meta.billedToMobile}</p>}
        {meta.billedToState && <p><span className="font-bold">STATE:</span> {meta.billedToState}</p>}
        {meta.billedToGstin && <p><span className="font-bold">GSTIN:</span> {meta.billedToGstin}</p>}
        {meta.challanNo && <p><span className="font-bold">CHALLAN:</span> {meta.challanNo}</p>}
        {meta.vehicleNo && <p><span className="font-bold">VEHICLE:</span> {meta.vehicleNo}</p>}
        {meta.dateOfSupply && <p><span className="font-bold">SUPPLY DATE:</span> {meta.dateOfSupply}</p>}
        {printSet.currentBalanceParty && invoice.partyBalance && (
          <p className="text-red-600 font-bold mt-1 pt-1 border-t border-slate-200">BALANCE: ₹{invoice.partyBalance}</p>
        )}
      </div>

      {/* Retail Table without complex HSN/GST divisions */}
      <div className="w-full rounded border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[8px] font-bold text-slate-600 uppercase bg-slate-100 border-b-2 border-slate-300">
              {activeColsInOrder.map((key) => {
                if (key === "slNo") return <th key={key} className="px-1.5 py-2 border-r border-slate-200 w-8">{colNames.slNo || "Sr. No."}</th>;
                if (key === "itemName") return <th key={key} className="px-1.5 py-2 border-r border-slate-200 min-w-[100px]">{colNames.itemName || "Product Name"}</th>;
                if (key === "itemCode") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.itemCode || "Code"}</th>;
                if (key === "hsnSac") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.hsnSac || "HSN/SAC"}</th>;
                if (key === "batchNo") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.batchNo || "Batch"}</th>;
                if (key === "expDate") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.expDate || "Exp"}</th>;
                if (key === "mfgDate") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.mfgDate || "Mfg"}</th>;
                if (key === "mrp") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-12">{colNames.mrp || "MRP"}</th>;
                if (key === "size") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-10">{colNames.size || "Size"}</th>;
                if (key === "modelNo") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.modelNo || "Model"}</th>;
                if (key === "description") return <th key={key} className="px-1.5 py-2 border-r border-slate-200 min-w-[80px]">{colNames.description || "Desc"}</th>;
                if (key === "count") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-10">{colNames.count || "Count"}</th>;
                if (key === "colour") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-10">{colNames.colour || "Colour"}</th>;
                if (key === "material") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.material || "Mat"}</th>;
                if (key === "brand") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-12">{colNames.brand || "Brand"}</th>;
                if (key === "serialNo") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-14">{colNames.serialNo || "Serial No."}</th>;
                if (key === "challanNo") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-16">{colNames.challanNo || "Challan No."}</th>;
                if (key === "quantity") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-10">{colNames.quantity || "Qty"}</th>;
                if (key === "unit") return <th key={key} className="px-1.5 py-2 text-center border-r border-slate-200 w-10">{colNames.unit || "Unit"}</th>;
                if (key === "priceUnit") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-14">{colNames.priceUnit || "Price/Unit"}</th>;
                if (key === "discount") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-12">{colNames.discount || "Discount"}</th>;
                if (key === "discountPercent") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-10">{colNames.discountPercent || "Disc%"}</th>;
                if (key === "taxablePriceUnit") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-14">{colNames.taxablePriceUnit || "Tax Rate"}</th>;
                if (key === "taxableValue") return <th key={key} className="px-1.5 py-2 text-right border-r border-slate-200 w-14">Tax Amt</th>;
                if (key === "cgst") return (
                  <React.Fragment key={key}>
                    <th className="px-1.5 py-2 text-center border-r border-slate-200 w-10">CGST%</th>
                    <th className="px-1.5 py-2 text-right border-r border-slate-200 w-12">CGST</th>
                  </React.Fragment>
                );
                if (key === "sgst") return (
                  <React.Fragment key={key}>
                    <th className="px-1.5 py-2 text-center border-r border-slate-200 w-10">SGST%</th>
                    <th className="px-1.5 py-2 text-right border-r border-slate-200 w-12">SGST</th>
                  </React.Fragment>
                );
                if (key === "amount") return <th key={key} className="px-1.5 py-2 text-right whitespace-nowrap w-14">{colNames.amount || "Amount"}</th>;
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

              return (
                <tr key={idx} className={`text-[9px] text-slate-700 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/20 transition-colors`}>
                  {activeColsInOrder.map((key) => {
                    if (key === "slNo") return <td key={key} className="px-1.5 py-1.5 border-r border-slate-100 text-slate-500">{idx + 1}</td>;
                    if (key === "itemName") return <td key={key} className="px-1.5 py-1.5 font-bold text-slate-800 border-r border-slate-100">{l.name || "Retail Item"}</td>;
                    if (key === "itemCode") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.itemCode || "-"}</td>;
                    if (key === "hsnSac") return <td key={key} className="px-1.5 py-1.5 text-center font-mono border-r border-slate-100">{l.hsnSac || "-"}</td>;
                    if (key === "batchNo") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.batchNo || "-"}</td>;
                    if (key === "expDate") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.expDate || "-"}</td>;
                    if (key === "mfgDate") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.mfgDate || "-"}</td>;
                    if (key === "mrp") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                    if (key === "size") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.size || "-"}</td>;
                    if (key === "modelNo") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.modelNo || "-"}</td>;
                    if (key === "description") return <td key={key} className="px-1.5 py-1.5 text-left border-r border-slate-100">{l.description || "-"}</td>;
                    if (key === "count") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.count || "-"}</td>;
                    if (key === "colour") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.colour || "-"}</td>;
                    if (key === "material") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.material || "-"}</td>;
                    if (key === "brand") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.brand || "-"}</td>;
                    if (key === "serialNo") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.serialNo || "-"}</td>;
                    if (key === "challanNo") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.challanNo || "-"}</td>;
                    if (key === "quantity") return <td key={key} className="px-1.5 py-1.5 text-center font-mono border-r border-slate-100">{q}</td>;
                    if (key === "unit") return <td key={key} className="px-1.5 py-1.5 text-center border-r border-slate-100">{l.unit || "Pcs"}</td>;
                    if (key === "priceUnit") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(r, printSet)}</td>;
                    if (key === "discount") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(dAmount, printSet)}</td>;
                    if (key === "discountPercent") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{d}%</td>;
                    if (key === "taxablePriceUnit") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(rateAfterDisc / (1 + g/100), printSet)}</td>;
                    if (key === "taxableValue") return <td key={key} className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(taxableVal, printSet)}</td>;
                    if (key === "cgst") return (
                      <React.Fragment key={key}>
                        <td className="px-1.5 py-1.5 text-center font-mono text-slate-400 border-r border-slate-100">{(g / 2)}%</td>
                        <td className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "sgst") return (
                      <React.Fragment key={key}>
                        <td className="px-1.5 py-1.5 text-center font-mono text-slate-400 border-r border-slate-100">{(g / 2)}%</td>
                        <td className="px-1.5 py-1.5 text-right font-mono border-r border-slate-100">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "amount") return <td key={key} className="px-1.5 py-1.5 text-right font-bold font-mono text-slate-900">{formatAmt(lineTotal, printSet)}</td>;
                    return null;
                  })}
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan="20" className="px-3 py-4 text-center text-slate-400 text-[9px] italic">No items added</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Calculations Summary */}
      <div className="space-y-1 border-b border-dashed pb-3 text-[10px] font-mono">
        <div className="flex justify-between"><span>Subtotal (Exc. Tax)</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
        <div className="flex justify-between"><span>GST Tax Charges</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
        <div className={`flex justify-between font-extrabold text-[12px] pt-1.5 ${activeColor.text}`}>
          <span>NET PAYABLE</span><span>{formatAmt(totals.grand, printSet)}</span>
        </div>
        {printSet.receivedAmount && (
          <div className="flex justify-between text-slate-500">
            <span>Received</span>
            <span>{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
          </div>
        )}
        {printSet.balanceAmount && (
          <div className="flex justify-between font-bold text-slate-800 border-t border-dashed pt-0.5 mt-0.5">
            <span>Balance</span>
            <span>{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
          </div>
        )}
      </div>

      {/* Dynamic Footer Block */}
      {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
        <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
          {renderCommonFooter(invoice, printSet, {
            titleClass: "text-[9px] text-slate-400 font-bold text-center w-full",
            textClass: "text-slate-600 text-[9px] text-center w-full",
            containerClass: "space-y-2 text-center",
            signatureContainerClass: "space-y-3 flex flex-col items-center justify-center mt-3 text-center w-full"
          })}
        </div>
      )}

      {/* Retail Footer Declarations */}
      <div className="text-center text-[8px] text-slate-400 space-y-1 mt-4">
        <p className="italic">Thank you for business with us!</p>
        <p className="font-bold">Goods once sold cannot be returned.</p>
      </div>
    </div>
  );
}
