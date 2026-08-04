import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function MinimalTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);
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
          <p className={`font-extrabold uppercase text-[11px] ${activeColor.text}`}>TAX INVOICE</p>
          <p>INV NO: {meta.invoiceNumber}</p>
          <p>DATE: {meta.date}</p>
          {meta.poNumber && <p>P.O. NO: {meta.poNumber}</p>}
          {meta.poDate && <p>P.O. DATE: {meta.poDate}</p>}
        </div>
      </div>

      {/* Customer block minimal */}
      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-start gap-4">
        <div>
          <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">Billed To:</span>
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
        </div>
      </div>

      {/* Minimal Table */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-400 text-slate-500 uppercase text-[9px] font-bold">
            {activeColsInOrder.map((key) => {
              if (key === "slNo") return <th key={key} className="py-1 w-8">{colNames.slNo || "Sr."}</th>;
              if (key === "itemName") return <th key={key} className="py-1 min-w-[80px]">{colNames.itemName || "Description"}</th>;
              if (key === "itemCode") return <th key={key} className="py-1 text-center w-16">{colNames.itemCode || "Item Code"}</th>;
              if (key === "hsnSac") return <th key={key} className="py-1 text-center w-16">{colNames.hsnSac || "HSN"}</th>;
              if (key === "batchNo") return <th key={key} className="py-1 text-center w-16">{colNames.batchNo || "Batch No."}</th>;
              if (key === "expDate") return <th key={key} className="py-1 text-center w-16">{colNames.expDate || "Exp. Date"}</th>;
              if (key === "mfgDate") return <th key={key} className="py-1 text-center w-16">{colNames.mfgDate || "Mfg. Date"}</th>;
              if (key === "mrp") return <th key={key} className="py-1 text-right w-16">{colNames.mrp || "MRP"}</th>;
              if (key === "size") return <th key={key} className="py-1 text-center w-12">{colNames.size || "Size"}</th>;
              if (key === "modelNo") return <th key={key} className="py-1 text-center w-16">{colNames.modelNo || "Model No."}</th>;
              if (key === "description") return <th key={key} className="py-1 min-w-[80px]">{colNames.description || "Desc"}</th>;
              if (key === "count") return <th key={key} className="py-1 text-center w-12">{colNames.count || "Count"}</th>;
              if (key === "colour") return <th key={key} className="py-1 text-center w-14">{colNames.colour || "Colour"}</th>;
              if (key === "material") return <th key={key} className="py-1 text-center w-16">{colNames.material || "Material"}</th>;
              if (key === "brand") return <th key={key} className="py-1 text-center w-16">{colNames.brand || "Brand"}</th>;
              if (key === "serialNo") return <th key={key} className="py-1 text-center w-20">{colNames.serialNo || "Serial No."}</th>;
              if (key === "challanNo") return <th key={key} className="py-1 text-center w-20">{colNames.challanNo || "Challan No."}</th>;
              if (key === "quantity") return <th key={key} className="py-1 text-center w-10">{colNames.quantity || "Qty"}</th>;
              if (key === "unit") return <th key={key} className="py-1 text-center w-12">{colNames.unit || "Unit"}</th>;
              if (key === "priceUnit") return <th key={key} className="py-1 text-right w-16">{colNames.priceUnit || "Rate"}</th>;
              if (key === "discount") return <th key={key} className="py-1 text-right w-16">{colNames.discount || "Discount"}</th>;
              if (key === "discountPercent") return <th key={key} className="py-1 text-right w-16">{colNames.discountPercent || "Disc. %"}</th>;
              if (key === "taxablePriceUnit") return <th key={key} className="py-1 text-right w-18">{colNames.taxablePriceUnit || "Taxable Rate"}</th>;
              if (key === "taxableValue") return <th key={key} className="py-1 text-right w-18">Taxable Amt</th>;
              if (key === "cgst") return <th key={key} className="py-1 text-center w-20" colSpan="2">CGST</th>;
              if (key === "sgst") return <th key={key} className="py-1 text-center w-20" colSpan="2">SGST</th>;
              if (key === "amount") return <th key={key} className="py-1 text-right w-20">{colNames.amount || "Total"}</th>;
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
              <tr key={idx} className="text-[10px] text-slate-700 hover:bg-slate-50/50">
                {activeColsInOrder.map((key) => {
                  if (key === "slNo") return <td key={key} className="py-1.5">{idx + 1}</td>;
                  if (key === "itemName") return <td key={key} className="py-1.5 font-bold text-slate-800">{l.name || "Product Item"}</td>;
                  if (key === "itemCode") return <td key={key} className="py-1.5 text-center">{l.itemCode || "-"}</td>;
                  if (key === "hsnSac") return <td key={key} className="py-1.5 text-center font-mono">{l.hsnSac || "-"}</td>;
                  if (key === "batchNo") return <td key={key} className="py-1.5 text-center">{l.batchNo || "-"}</td>;
                  if (key === "expDate") return <td key={key} className="py-1.5 text-center">{l.expDate || "-"}</td>;
                  if (key === "mfgDate") return <td key={key} className="py-1.5 text-center">{l.mfgDate || "-"}</td>;
                  if (key === "mrp") return <td key={key} className="py-1.5 text-right font-mono">{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                  if (key === "size") return <td key={key} className="py-1.5 text-center">{l.size || "-"}</td>;
                  if (key === "modelNo") return <td key={key} className="py-1.5 text-center">{l.modelNo || "-"}</td>;
                  if (key === "description") return <td key={key} className="py-1.5 text-left">{l.description || "-"}</td>;
                  if (key === "count") return <td key={key} className="py-1.5 text-center">{l.count || "-"}</td>;
                  if (key === "colour") return <td key={key} className="py-1.5 text-center">{l.colour || "-"}</td>;
                  if (key === "material") return <td key={key} className="py-1.5 text-center">{l.material || "-"}</td>;
                  if (key === "brand") return <td key={key} className="py-1.5 text-center">{l.brand || "-"}</td>;
                  if (key === "serialNo") return <td key={key} className="py-1.5 text-center">{l.serialNo || "-"}</td>;
                  if (key === "challanNo") return <td key={key} className="py-1.5 text-center">{l.challanNo || "-"}</td>;
                  if (key === "quantity") return <td key={key} className="py-1.5 text-center font-mono">{q}</td>;
                  if (key === "unit") return <td key={key} className="py-1.5 text-center">{l.unit || "Pcs"}</td>;
                  if (key === "priceUnit") return <td key={key} className="py-1.5 text-right font-mono">{formatAmt(r, printSet)}</td>;
                  if (key === "discount") return <td key={key} className="py-1.5 text-right font-mono">{formatAmt(dAmount, printSet)}</td>;
                  if (key === "discountPercent") return <td key={key} className="py-1.5 text-right font-mono">{d}%</td>;
                  if (key === "taxablePriceUnit") return <td key={key} className="py-1.5 text-right font-mono">{formatAmt(rateAfterDisc / (1 + g/100), printSet)}</td>;
                  if (key === "taxableValue") return <td key={key} className="py-1.5 text-right font-mono">{formatAmt(taxableVal, printSet)}</td>;
                  if (key === "cgst") return (
                    <React.Fragment key={key}>
                      <td className="py-1.5 text-center font-mono text-slate-400">{(g / 2)}%</td>
                      <td className="py-1.5 text-right font-mono">{formatAmt(cgstAmount, printSet)}</td>
                    </React.Fragment>
                  );
                  if (key === "sgst") return (
                    <React.Fragment key={key}>
                      <td className="py-1.5 text-center font-mono text-slate-400">{(g / 2)}%</td>
                      <td className="py-1.5 text-right font-mono">{formatAmt(cgstAmount, printSet)}</td>
                    </React.Fragment>
                  );
                  if (key === "amount") return <td key={key} className="py-1.5 text-right font-extrabold font-mono text-slate-900">{formatAmt(lineTotal, printSet)}</td>;
                  return null;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary compact */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t pt-2 border-slate-200">
        <div className="text-[8px] text-slate-400 space-y-1">
          <p>Bank: {invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"} | A/c: {invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</p>
          <p>IFSC: {invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"} | Branch: {invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</p>
        </div>
        <div className="text-right space-y-1 w-64 text-[10px] font-mono border-t pt-1 border-slate-100">
          <div className="flex justify-between"><span>Taxable Amount</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
          <div className="flex justify-between"><span>GST Amount</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
          <div className={`flex justify-between font-extrabold text-[11px] border-t-2 pt-1 border-slate-800 ${activeColor.text}`}>
            <span>Total Payable</span><span>{formatAmt(totals.grand, printSet)}</span>
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
