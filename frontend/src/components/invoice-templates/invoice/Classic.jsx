import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function ClassicTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);
  return (
    <div className="font-serif bg-white p-4 border border-slate-200 text-slate-800 text-[10px] leading-snug shadow-sm">
      {/* Title */}
      <div className={`text-center font-bold tracking-widest text-sm mb-2 border-b pb-1 ${activeColor.text}`}>
        TAX INVOICE
      </div>

      {/* Header Centered */}
      <div className="text-center space-y-0.5 mb-3 relative">
        {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
          <div className="flex justify-center mb-1 max-h-10 max-w-[100px] overflow-hidden mx-auto">
            <img src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} alt="Logo" className="max-h-10 max-w-[100px] object-contain" style={{ maxHeight: '40px', maxWidth: '100px', width: 'auto', height: 'auto' }} />
          </div>
        ) : showUdaanLogo ? (
          <div className="absolute left-0 top-0">
            <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="h-8 w-auto object-contain opacity-90 grayscale" />
          </div>
        ) : null}
        {printSet.printCompanyName && (
          <h1 className="text-base font-extrabold text-slate-900 uppercase">
            {printSet.companyName || "KESHAV TRAVELS"}
          </h1>
        )}
        {printSet.printAddress && (
          <p className="text-[9px] text-slate-500 whitespace-pre-line">
            {printSet.address || "S-99/134 first floor moti lal nehru camp JNU, New Delhi"}
          </p>
        )}
        <div className="text-[9px] text-slate-500 flex justify-center gap-3">
          {printSet.printPhone && <span>Phone: {printSet.phone || "+919718403525"}</span>}
          {printSet.printEmail && <span>Email: {printSet.email || "dpakk1989@gmail.com"}</span>}
        </div>
        {printSet.printGstin && (
          <p className="text-[9px] font-mono font-semibold text-slate-700 bg-slate-50 inline-block px-2 py-0.5 rounded border">
            GSTIN: {gstSet.gstin || "07AQXPD2556K2ZB"}
          </p>
        )}
      </div>

      {/* Customer Info Card & Metadata Side-by-side */}
      <div className="grid grid-cols-2 gap-4 border-t border-b py-2 mb-3 border-slate-200 font-sans">
        <div>
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</h4>
          <p className="font-bold text-slate-900 text-xs mb-0.5">{meta.billingName || customer}</p>
          {meta.billingName && <p className="text-slate-500 text-[9px]">M/s: {customer}</p>}
          {meta.billedToAddress && <p className="text-slate-500 text-[9px]">{meta.billedToAddress}</p>}
          {meta.billedToState && <p className="text-slate-500 text-[9px]">State: {meta.billedToState}</p>}
          {meta.billedToMobile && <p className="text-slate-500 text-[9px]">Mobile: {meta.billedToMobile}</p>}
          {meta.billedToGstin && <p className="text-slate-600 font-mono text-[9px] mt-0.5">GSTIN: {meta.billedToGstin}</p>}
          {printSet.currentBalanceParty && invoice.partyBalance && (
            <p className="text-red-600 font-mono font-bold text-[9px] mt-0.5">Balance: ₹{invoice.partyBalance}</p>
          )}

          {(invoice.shippingDetails?.shippingAddress || invoice.shippingDetails?.shippingName) && (
            <div className="mt-2">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shipped To</h4>
              <p className="font-bold text-slate-900 text-[10px]">{invoice.shippingDetails.shippingName || meta.billingName || customer}</p>
              {invoice.shippingDetails.shippingAddress && <p className="text-slate-500 text-[9px]">{invoice.shippingDetails.shippingAddress}</p>}
              {invoice.shippingDetails.shippingGstin && <p className="text-slate-600 font-mono text-[9px]">GSTIN: {invoice.shippingDetails.shippingGstin}</p>}
            </div>
          )}
        </div>
        <div className="text-right space-y-0.5 text-[9px] font-mono">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice & Transport Info</h4>
          <p><span className="text-slate-400">Invoice No:</span> <span className="font-bold text-slate-800">{meta.invoiceNumber}</span></p>
          <p><span className="text-slate-400">Date:</span> {meta.date}</p>
          {meta.poNumber && <p><span className="text-slate-400">P.O. No:</span> {meta.poNumber}</p>}
          {meta.poDate && <p><span className="text-slate-400">P.O. Date:</span> {meta.poDate}</p>}
          {meta.challanNo && <p><span className="text-slate-400">Challan No:</span> {meta.challanNo}</p>}
          <p><span className="text-slate-400">Vehicle No:</span> {meta.vehicleNo || invoice.transportDetails?.vehicleNo || "-"}</p>
          {meta.dateOfSupply && <p><span className="text-slate-400">Date of Supply:</span> {meta.dateOfSupply.split("-").reverse().join("/")}</p>}
          {meta.placeOfSupply && <p><span className="text-slate-400">Place of Supply:</span> {meta.placeOfSupply}</p>}
          {invoice.transportDetails?.eWayBillNo && <p><span className="text-slate-400">E-Way Bill:</span> {invoice.transportDetails.eWayBillNo}</p>}
          {invoice.transportDetails?.transporterName && <p><span className="text-slate-400">Transporter:</span> {invoice.transportDetails.transporterName}</p>}
          {invoice.transportDetails?.grRrNo && <p><span className="text-slate-400">GR/RR No:</span> {invoice.transportDetails.grRrNo}</p>}
          {gstSet.reverseCharge && <p><span className="text-slate-400">Reverse Charge:</span> {meta.reverseCharge}</p>}
        </div>
      </div>

      {/* Lines Table */}
      <table className="w-full text-left font-sans mb-3">
        <thead>
          <tr className={`border-b-2 border-slate-300 text-[8px] font-bold uppercase text-slate-600`}>
            {activeColsInOrder.map((key) => {
              if (key === "slNo") return <th key={key} className="py-1 w-6">{colNames.slNo || "Sr."}</th>;
              if (key === "itemName") return <th key={key} className="py-1 min-w-[70px]">{colNames.itemName || "Item / Description"}</th>;
              if (key === "itemCode") return <th key={key} className="py-1 text-center w-14">{colNames.itemCode || "Item Code"}</th>;
              if (key === "hsnSac") return <th key={key} className="py-1 text-center w-14">{colNames.hsnSac || "HSN"}</th>;
              if (key === "batchNo") return <th key={key} className="py-1 text-center w-14">{colNames.batchNo || "Batch No."}</th>;
              if (key === "expDate") return <th key={key} className="py-1 text-center w-14">{colNames.expDate || "Exp. Date"}</th>;
              if (key === "mfgDate") return <th key={key} className="py-1 text-center w-14">{colNames.mfgDate || "Mfg. Date"}</th>;
              if (key === "mrp") return <th key={key} className="py-1 text-right w-14">{colNames.mrp || "MRP"}</th>;
              if (key === "size") return <th key={key} className="py-1 text-center w-10">{colNames.size || "Size"}</th>;
              if (key === "modelNo") return <th key={key} className="py-1 text-center w-14">{colNames.modelNo || "Model No."}</th>;
              if (key === "description") return <th key={key} className="py-1 min-w-[70px]">{colNames.description || "Description"}</th>;
              if (key === "count") return <th key={key} className="py-1 text-center w-10">{colNames.count || "Count"}</th>;
              if (key === "colour") return <th key={key} className="py-1 text-center w-12">{colNames.colour || "Colour"}</th>;
              if (key === "material") return <th key={key} className="py-1 text-center w-14">{colNames.material || "Material"}</th>;
              if (key === "brand") return <th key={key} className="py-1 text-center w-14">{colNames.brand || "Brand"}</th>;
              if (key === "serialNo") return <th key={key} className="py-1 text-center w-16">{colNames.serialNo || "Serial No."}</th>;
              if (key === "challanNo") return <th key={key} className="py-1 text-center w-16">{colNames.challanNo || "Challan No."}</th>;
              if (key === "quantity") return <th key={key} className="py-1 text-center w-8">{colNames.quantity || "Qty"}</th>;
              if (key === "unit") return <th key={key} className="py-1 text-center w-10">{colNames.unit || "Unit"}</th>;
              if (key === "priceUnit") return <th key={key} className="py-1 text-right w-14">{colNames.priceUnit || "Rate"}</th>;
              if (key === "discount") return <th key={key} className="py-1 text-right w-14">{colNames.discount || "Discount"}</th>;
              if (key === "discountPercent") return <th key={key} className="py-1 text-right w-14">{colNames.discountPercent || "Disc. %"}</th>;
              if (key === "taxablePriceUnit") return <th key={key} className="py-1 text-right w-16">{colNames.taxablePriceUnit || "Taxable Rate"}</th>;
              if (key === "taxableValue") return <th key={key} className="py-1 text-right w-16">Taxable Amt</th>;
              if (key === "cgst") return <th key={key} className="py-1 text-center w-24" colSpan="2">CGST</th>;
              if (key === "sgst") return <th key={key} className="py-1 text-center w-24" colSpan="2">SGST</th>;
              if (key === "amount") return <th key={key} className="py-1 text-right w-16">{colNames.amount || "Total"}</th>;
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
              <tr key={idx} className="text-[9px] text-slate-700 hover:bg-slate-50/50">
                {activeColsInOrder.map((key) => {
                  if (key === "slNo") return <td key={key} className="py-1.5">{idx + 1}</td>;
                  if (key === "itemName") return <td key={key} className="py-1.5 font-medium text-slate-900">{l.name || "Product Item"}</td>;
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
                  if (key === "amount") return <td key={key} className="py-1.5 text-right font-bold font-mono text-slate-900">{formatAmt(lineTotal, printSet)}</td>;
                  return null;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Calculations & Bank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-2 border-slate-200">
        <div className="space-y-2">
          <div className="border rounded-lg p-2 bg-slate-50 space-y-1 font-sans text-[9px]">
            <span className="font-bold text-[8px] text-slate-500 uppercase tracking-wider block">Remittance Info</span>
            <div className="grid grid-cols-2 gap-0.5 text-slate-600">
              <span>Bank Name:</span><span className="font-semibold text-slate-900">{invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"}</span>
              <span>Account Number:</span><span className="font-semibold text-slate-900">{invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</span>
              <span>IFSC Code:</span><span className="font-semibold text-slate-900">{invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"}</span>
              <span>Branch Name:</span><span className="font-semibold text-slate-900">{invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-600 italic">
            <span className="font-bold block not-italic uppercase text-[8px] text-slate-400 mb-0.5">In Words</span>
            {numberToWords(totals.grand)}
          </div>
        </div>

        <div className="flex justify-end font-sans text-[9px]">
          <div className="w-56 space-y-1">
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Gross Total</span>
              <span className="font-mono">{formatAmt(totals.taxableAmount, printSet)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">CGST Amount</span>
              <span className="font-mono">{formatAmt(totals.gstAmount / 2, printSet)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">SGST Amount</span>
              <span className="font-mono">{formatAmt(totals.gstAmount / 2, printSet)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 font-bold text-slate-900">
              <span>Net Payable (Inc Tax)</span>
              <span className={`font-mono ${activeColor.text}`}>{formatAmt(totals.grand, printSet)}</span>
            </div>
            {printSet.receivedAmount && (
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Received Amount</span>
                <span className="font-mono">{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
              </div>
            )}
            {printSet.balanceAmount && (
              <div className="flex justify-between py-0.5 font-bold text-slate-900">
                <span>Balance Amount</span>
                <span className="font-mono">{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* T&C and Stamp */}
      {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
        <div className="grid grid-cols-2 gap-4 mt-3 border-t border-slate-200 pt-2">
          {renderCommonFooter(invoice, printSet, {
            titleClass: "text-slate-500 text-[9px]",
            textClass: "text-slate-700 text-[9px]",
            containerClass: "space-y-1",
            signatureContainerClass: "space-y-1 flex flex-col justify-between items-end text-right"
          })}
        </div>
      )}
    </div>
  );
}
