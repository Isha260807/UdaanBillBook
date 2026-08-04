import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function ProfessionalTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);
  return (
    <div className="font-sans bg-white p-6 border-t-8 border-b-8 border-l border-r border-slate-200 text-slate-800 text-[10px] leading-relaxed shadow-sm flex flex-col space-y-6"
      style={{ borderTopColor: activeColor.raw || "#1e293b", borderBottomColor: activeColor.raw || "#1e293b" }}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
            <img src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} alt="Logo" className="max-h-12 max-w-[120px] object-contain mb-2" style={{ maxHeight: '48px', maxWidth: '120px', width: 'auto', height: 'auto' }} />
          ) : showUdaanLogo ? (
            <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="h-8 w-auto object-contain opacity-90 grayscale mb-2" />
          ) : null}
          {printSet.printCompanyName && (
            <h1 className={`text-base font-extrabold uppercase ${activeColor.text}`}>
              {printSet.companyName || "KESHAV TRAVELS"}
            </h1>
          )}
          {printSet.printAddress && (
            <p className="text-[9px] text-slate-500 max-w-sm whitespace-pre-line leading-tight">
              {printSet.address || "S-99/134 first floor moti lal nehru camp JNU, New Delhi"}
            </p>
          )}
        </div>
        <div className="text-right space-y-1">
          <span className={`text-[11px] font-black tracking-widest uppercase bg-slate-50 border px-3 py-1 rounded inline-block ${activeColor.text}`}>
            TAX INVOICE
          </span>
          <p className="font-mono text-[9px]">Invoice Number: <span className="font-bold">{meta.invoiceNumber}</span></p>
          <p className="font-mono text-[9px]">Invoice Date: {meta.date}</p>
          {meta.poNumber && <p className="font-mono text-[9px]">P.O. No: {meta.poNumber}</p>}
          {meta.poDate && <p className="font-mono text-[9px]">P.O. Date: {meta.poDate}</p>}
        </div>
      </div>

      {/* Customer Info Card Container */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider">Client Description</span>
          <p className="font-bold text-slate-900 text-[11px]">{meta.billingName || customer}</p>
          {meta.billingName && <p className="text-slate-600 text-[10px] font-semibold">M/s: {customer}</p>}
          {meta.billedToAddress && <p className="text-slate-500 leading-tight">{meta.billedToAddress}</p>}
          {meta.billedToState && <p className="text-slate-500">State: {meta.billedToState}</p>}
          {meta.billedToMobile && <p className="text-slate-500">Mob: {meta.billedToMobile}</p>}
          {printSet.currentBalanceParty && invoice.partyBalance && (
            <p className="text-red-600 font-mono font-bold text-[10px] mt-1">Balance: ₹{invoice.partyBalance}</p>
          )}

          {(invoice.shippingDetails?.shippingAddress || invoice.shippingDetails?.shippingName) && (
            <div className="mt-3 pt-3 border-t border-dashed">
              <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider">Shipping Details</span>
              <p className="font-bold text-slate-900 text-[11px] mt-1">{invoice.shippingDetails.shippingName || meta.billingName || customer}</p>
              {invoice.shippingDetails.shippingAddress && <p className="text-slate-500 text-[10px]">{invoice.shippingDetails.shippingAddress}</p>}
              {invoice.shippingDetails.shippingGstin && <p className="text-slate-600 font-mono text-[9px]">GSTIN: {invoice.shippingDetails.shippingGstin}</p>}
            </div>
          )}
        </div>
        <div className="space-y-1 font-mono text-[9px] sm:text-right">
          <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider sm:text-right">Transport / Supply Details</span>
          {meta.challanNo && <p><span className="text-slate-400">Challan No:</span> {meta.challanNo}</p>}
          {meta.dateOfSupply && <p><span className="text-slate-400">Date of Supply:</span> {meta.dateOfSupply.split("-").reverse().join("/")}</p>}
          {(meta.vehicleNo || invoice.transportDetails?.vehicleNo) && <p><span className="text-slate-400">Vehicle:</span> {meta.vehicleNo || invoice.transportDetails?.vehicleNo}</p>}
          {meta.placeOfSupply && <p><span className="text-slate-400">Place of Supply:</span> {meta.placeOfSupply}</p>}
          {invoice.transportDetails?.eWayBillNo && <p><span className="text-slate-400">E-Way Bill:</span> {invoice.transportDetails.eWayBillNo}</p>}
          {invoice.transportDetails?.transporterName && <p><span className="text-slate-400">Transporter:</span> {invoice.transportDetails.transporterName}</p>}
          {invoice.transportDetails?.grRrNo && <p><span className="text-slate-400">GR/RR No:</span> {invoice.transportDetails.grRrNo}</p>}
          {meta.billedToGstin && <p><span className="text-slate-400">GSTIN:</span> {meta.billedToGstin}</p>}
          {gstSet.reverseCharge && <p><span className="text-slate-400">Reverse Charge:</span> {meta.reverseCharge}</p>}
        </div>
      </div>

      {/* Professional Grid Table */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className={`text-[9px] font-bold uppercase divide-x divide-white/10 ${activeColor.bgClass} text-white`}>
              {activeColsInOrder.map((key) => {
                if (key === "slNo") return <th key={key} className="p-1.5 text-center w-6">{colNames.slNo || "Sr."}</th>;
                if (key === "itemName") return <th key={key} className="p-2.5 min-w-[80px]">{colNames.itemName || "Description"}</th>;
                if (key === "itemCode") return <th key={key} className="p-1.5 text-center w-12">{colNames.itemCode || "Item Code"}</th>;
                if (key === "hsnSac") return <th key={key} className="p-1.5 text-center w-14">{colNames.hsnSac || "HSN/SAC"}</th>;
                if (key === "batchNo") return <th key={key} className="p-1.5 text-center w-12">{colNames.batchNo || "Batch No."}</th>;
                if (key === "expDate") return <th key={key} className="p-1.5 text-center w-12">{colNames.expDate || "Exp. Date"}</th>;
                if (key === "mfgDate") return <th key={key} className="p-1.5 text-center w-12">{colNames.mfgDate || "Mfg. Date"}</th>;
                if (key === "mrp") return <th key={key} className="p-1.5 text-right w-12">{colNames.mrp || "MRP"}</th>;
                if (key === "size") return <th key={key} className="p-1.5 text-center w-10">{colNames.size || "Size"}</th>;
                if (key === "modelNo") return <th key={key} className="p-1.5 text-center w-12">{colNames.modelNo || "Model No."}</th>;
                if (key === "description") return <th key={key} className="p-2.5 min-w-[80px]">{colNames.description || "Desc"}</th>;
                if (key === "count") return <th key={key} className="p-1.5 text-center w-10">{colNames.count || "Count"}</th>;
                if (key === "colour") return <th key={key} className="p-1.5 text-center w-10">{colNames.colour || "Colour"}</th>;
                if (key === "material") return <th key={key} className="p-1.5 text-center w-12">{colNames.material || "Material"}</th>;
                if (key === "brand") return <th key={key} className="p-1.5 text-center w-12">{colNames.brand || "Brand"}</th>;
                if (key === "serialNo") return <th key={key} className="p-1.5 text-center w-14">{colNames.serialNo || "Serial No."}</th>;
                if (key === "challanNo") return <th key={key} className="p-1.5 text-center w-14">{colNames.challanNo || "Challan No."}</th>;
                if (key === "quantity") return <th key={key} className="p-1.5 text-center w-10">{colNames.quantity || "Qty"}</th>;
                if (key === "unit") return <th key={key} className="p-1.5 text-center w-10">{colNames.unit || "Unit"}</th>;
                if (key === "priceUnit") return <th key={key} className="p-1.5 text-right w-14">{colNames.priceUnit || "Rate"}</th>;
                if (key === "discount") return <th key={key} className="p-1.5 text-right w-12">{colNames.discount || "Discount"}</th>;
                if (key === "discountPercent") return <th key={key} className="p-1.5 text-right w-12">{colNames.discountPercent || "Disc. %"}</th>;
                if (key === "taxablePriceUnit") return <th key={key} className="p-1.5 text-right w-14">{colNames.taxablePriceUnit || "Taxable"}</th>;
                if (key === "taxableValue") return <th key={key} className="p-1.5 text-right w-16">Taxable Amt</th>;
                if (key === "cgst") return <th key={key} className="p-1.5 text-center w-16" colSpan="2">CGST</th>;
                if (key === "sgst") return <th key={key} className="p-1.5 text-center w-16" colSpan="2">SGST</th>;
                if (key === "amount") return <th key={key} className="p-1.5 text-right w-16">{colNames.amount || "Total"}</th>;
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
                <tr key={idx} className="divide-x divide-slate-100 text-[10px] text-slate-700">
                  {activeColsInOrder.map((key) => {
                    if (key === "slNo") return <td key={key} className="p-1.5 text-center">{idx + 1}</td>;
                    if (key === "itemName") return <td key={key} className="p-1.5 font-bold text-slate-900">{l.name || "Product/Service"}</td>;
                    if (key === "itemCode") return <td key={key} className="p-1.5 text-center">{l.itemCode || "-"}</td>;
                    if (key === "hsnSac") return <td key={key} className="p-1.5 text-center font-mono">{l.hsnSac || "-"}</td>;
                    if (key === "batchNo") return <td key={key} className="p-1.5 text-center">{l.batchNo || "-"}</td>;
                    if (key === "expDate") return <td key={key} className="p-1.5 text-center">{l.expDate || "-"}</td>;
                    if (key === "mfgDate") return <td key={key} className="p-1.5 text-center">{l.mfgDate || "-"}</td>;
                    if (key === "mrp") return <td key={key} className="p-1.5 text-right font-mono">{l.mrp ? formatAmt(l.mrp, printSet) : "-"}</td>;
                    if (key === "size") return <td key={key} className="p-1.5 text-center">{l.size || "-"}</td>;
                    if (key === "modelNo") return <td key={key} className="p-1.5 text-center">{l.modelNo || "-"}</td>;
                    if (key === "description") return <td key={key} className="p-2.5 text-left">{l.description || "-"}</td>;
                    if (key === "count") return <td key={key} className="p-1.5 text-center">{l.count || "-"}</td>;
                    if (key === "colour") return <td key={key} className="p-1.5 text-center">{l.colour || "-"}</td>;
                    if (key === "material") return <td key={key} className="p-1.5 text-center">{l.material || "-"}</td>;
                    if (key === "brand") return <td key={key} className="p-1.5 text-center">{l.brand || "-"}</td>;
                    if (key === "serialNo") return <td key={key} className="p-1.5 text-center">{l.serialNo || "-"}</td>;
                    if (key === "challanNo") return <td key={key} className="p-1.5 text-center">{l.challanNo || "-"}</td>;
                    if (key === "quantity") return <td key={key} className="p-1.5 text-center font-mono">{q}</td>;
                    if (key === "unit") return <td key={key} className="p-1.5 text-center">{l.unit || "Pcs"}</td>;
                    if (key === "priceUnit") return <td key={key} className="p-1.5 text-right font-mono">{formatAmt(r, printSet)}</td>;
                    if (key === "discount") return <td key={key} className="p-1.5 text-right font-mono">{formatAmt(dAmount, printSet)}</td>;
                    if (key === "discountPercent") return <td key={key} className="p-1.5 text-right font-mono">{d}%</td>;
                    if (key === "taxablePriceUnit") return <td key={key} className="p-1.5 text-right font-mono">{formatAmt(rateAfterDisc / (1 + g/100), printSet)}</td>;
                    if (key === "taxableValue") return <td key={key} className="p-1.5 text-right font-mono">{formatAmt(taxableVal, printSet)}</td>;
                    if (key === "cgst") return (
                      <React.Fragment key={key}>
                        <td className="p-1.5 text-center font-mono text-slate-400">{(g / 2)}%</td>
                        <td className="p-1.5 text-right font-mono">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "sgst") return (
                      <React.Fragment key={key}>
                        <td className="p-1.5 text-center font-mono text-slate-400">{(g / 2)}%</td>
                        <td className="p-1.5 text-right font-mono">{formatAmt(cgstAmount, printSet)}</td>
                      </React.Fragment>
                    );
                    if (key === "amount") return <td key={key} className="p-1.5 text-right font-extrabold font-mono text-slate-900">{formatAmt(lineTotal, printSet)}</td>;
                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Double Signatory Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-6 pt-4 border-t border-slate-100">
        <div className="flex-1 space-y-2">
          <div className="bg-slate-50 border rounded-lg p-3 text-[9px] space-y-1 font-mono">
            <span className="font-bold text-[8px] uppercase tracking-wider block text-slate-400 mb-1">Bank Remittance details</span>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between"><span>Bank Name</span><span className="font-bold text-slate-800">{invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"}</span></div>
              <div className="flex justify-between"><span>Account No.</span><span className="font-bold text-slate-800">{invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</span></div>
              <div className="flex justify-between"><span>IFSC Code</span><span className="font-bold text-slate-800">{invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"}</span></div>
              <div className="flex justify-between"><span>Branch</span><span className="font-bold text-slate-800">{invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</span></div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="bg-slate-50 border rounded-lg p-3 text-[9px] space-y-1 font-mono">
            <span className="font-bold text-[8px] uppercase tracking-wider block text-slate-400 mb-1">Billing Summary</span>
            <div className="flex justify-between"><span>Taxable amount</span><span>{formatAmt(totals.taxableAmount, printSet)}</span></div>
            <div className="flex justify-between"><span>GST Taxes</span><span>{formatAmt(totals.gstAmount, printSet)}</span></div>
            <div className={`flex justify-between font-extrabold text-[10px] border-t pt-1 ${activeColor.text}`}>
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
          <p className="text-[9px] text-slate-500 italic">{numberToWords(totals.grand)}</p>
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
