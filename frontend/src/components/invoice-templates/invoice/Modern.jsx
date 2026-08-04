import React from "react";
import { getTemplateColumns, formatAmt, renderCommonFooter } from "../templateUtils.jsx";

export function ModernTemplate({ invoice, printSet, gstSet, activeColor, numberToWords, showUdaanLogo }) {
  const { customer, lines, totals, meta, paymentDetails } = invoice;
  const { cols, colNames, activeColsInOrder } = getTemplateColumns(printSet);
  return (
    <div className="font-sans bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-200 text-slate-800 text-[11px] leading-normal shadow-sm flex flex-col">
      {/* Colored Header Block */}
      <div className={`p-6 text-white ${activeColor.bgClass} flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden`}>
        <div className="space-y-1 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3 z-10">
          {(printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl) ? (
            <img src={printSet.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl} alt="Logo" className="max-h-12 max-w-[120px] object-contain bg-white/20 p-1 rounded-md" style={{ maxHeight: '48px', maxWidth: '120px', width: 'auto', height: 'auto' }} />
          ) : showUdaanLogo ? (
            <img src="/udaan-logo-removebg-preview.png" alt="Udaan Logo" className="h-10 w-auto object-contain opacity-90 grayscale bg-white/20 p-1 rounded-md" />
          ) : null}
          <div>
            {printSet.printCompanyName && (
              <h1 className="text-xl font-black uppercase tracking-wider">
                {printSet.companyName || "KESHAV TRAVELS"}
              </h1>
            )}
            {printSet.printAddress && (
              <p className="text-[10px] opacity-90 whitespace-pre-line leading-tight">
                {printSet.address || "S-99/134 first floor moti lal nehru camp JNU, New Delhi"}
              </p>
            )}
          </div>
        </div>
        <div className="text-center sm:text-right space-y-1 font-mono text-[10px]">
          <p className="text-xs font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full inline-block">TAX INVOICE</p>
          {printSet.printGstin && <p className="opacity-90 mt-1">GSTIN: {gstSet.gstin || "07AQXPD2556K2ZB"}</p>}
          {printSet.printPhone && <p className="opacity-90">Ph.: {printSet.phone || "+919718403525"}</p>}
        </div>
      </div>

      {/* Rounded content container */}
      <div className="p-6 space-y-6 flex-1">
        
        {/* Customer and Invoice details row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
            <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${activeColor.text}`}>Customer Details</h4>
            <p className="font-bold text-slate-900 text-xs">{meta.billingName || customer}</p>
            {meta.billingName && <p className="text-slate-500 text-[10px] mb-1 font-semibold">M/s: {customer}</p>}
            {meta.billedToAddress && <p className="text-slate-500 text-[10px]">{meta.billedToAddress}</p>}
            {meta.billedToState && <p className="text-slate-500 text-[10px]">State: {meta.billedToState}</p>}
            {meta.billedToMobile && <p className="text-slate-500 text-[10px]">Phone: {meta.billedToMobile}</p>}
            {meta.billedToGstin && <p className="text-slate-600 font-mono text-[9px] mt-1">GSTIN: {meta.billedToGstin}</p>}
            {printSet.currentBalanceParty && invoice.partyBalance && (
              <p className="text-red-600 font-mono font-bold text-[10px] mt-1">Balance: ₹{invoice.partyBalance}</p>
            )}

            {(invoice.shippingDetails?.shippingAddress || invoice.shippingDetails?.shippingName) && (
              <div className="mt-3 pt-3 border-t border-dashed">
                <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${activeColor.text}`}>Shipping Details</h4>
                <p className="font-bold text-slate-900 text-[11px] mt-1">{invoice.shippingDetails.shippingName || meta.billingName || customer}</p>
                {invoice.shippingDetails.shippingAddress && <p className="text-slate-500 text-[10px]">{invoice.shippingDetails.shippingAddress}</p>}
                {invoice.shippingDetails.shippingGstin && <p className="text-slate-600 font-mono text-[9px]">GSTIN: {invoice.shippingDetails.shippingGstin}</p>}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm grid grid-cols-2 gap-2 text-[10px] font-mono items-center self-start">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Invoice No</p>
              <p className="font-bold text-slate-800">{meta.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Invoice Date</p>
              <p className="font-bold text-slate-800">{meta.date}</p>
            </div>
            {meta.poNumber && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">P.O. No</p>
                <p className="font-bold text-slate-800">{meta.poNumber}</p>
              </div>
            )}
            {meta.poDate && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">P.O. Date</p>
                <p className="font-bold text-slate-800">{meta.poDate}</p>
              </div>
            )}
            {meta.challanNo && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Challan No</p>
                <p className="font-bold text-slate-800">{meta.challanNo}</p>
              </div>
            )}
            {meta.dateOfSupply && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Date of Supply</p>
                <p className="font-bold text-slate-800">{meta.dateOfSupply.split("-").reverse().join("/")}</p>
              </div>
            )}
            {(meta.vehicleNo || invoice.transportDetails?.vehicleNo) && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Vehicle No</p>
                <p className="font-bold text-slate-800">{meta.vehicleNo || invoice.transportDetails?.vehicleNo}</p>
              </div>
            )}
            {meta.placeOfSupply && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Place of Supply</p>
                <p className="font-bold text-slate-800">{meta.placeOfSupply}</p>
              </div>
            )}
            {invoice.transportDetails?.eWayBillNo && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">E-Way Bill No</p>
                <p className="font-bold text-slate-800">{invoice.transportDetails.eWayBillNo}</p>
              </div>
            )}
            {invoice.transportDetails?.transporterName && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Transporter</p>
                <p className="font-bold text-slate-800">{invoice.transportDetails.transporterName}</p>
              </div>
            )}
            {invoice.transportDetails?.grRrNo && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">GR/RR No</p>
                <p className="font-bold text-slate-800">{invoice.transportDetails.grRrNo}</p>
              </div>
            )}
            {gstSet.reverseCharge && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Reverse Charge</p>
                <p className="font-bold text-slate-800">{meta.reverseCharge}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic rounded table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto"><table className="w-full text-left text-[9px]">
            <thead className={`${activeColor.bgClass} text-white text-[9px] uppercase font-bold`}>
              <tr className="divide-x divide-white/10">
                {activeColsInOrder.map((key) => {
                  if (key === "slNo") return <th key={key} className="p-2 text-center w-8">{colNames.slNo || "Sr."}</th>;
                  if (key === "itemName") return <th key={key} className="p-2 min-w-[80px]">{colNames.itemName || "Description"}</th>;
                  if (key === "itemCode") return <th key={key} className="p-2 text-center w-16">{colNames.itemCode || "Item Code"}</th>;
                  if (key === "hsnSac") return <th key={key} className="p-2 text-center w-20">{colNames.hsnSac || "HSN/SAC"}</th>;
                  if (key === "batchNo") return <th key={key} className="p-2 text-center w-16">{colNames.batchNo || "Batch No."}</th>;
                  if (key === "expDate") return <th key={key} className="p-2 text-center w-16">{colNames.expDate || "Exp. Date"}</th>;
                  if (key === "mfgDate") return <th key={key} className="p-2 text-center w-16">{colNames.mfgDate || "Mfg. Date"}</th>;
                  if (key === "mrp") return <th key={key} className="p-2 text-right w-16">{colNames.mrp || "MRP"}</th>;
                  if (key === "size") return <th key={key} className="p-2 text-center w-12">{colNames.size || "Size"}</th>;
                  if (key === "modelNo") return <th key={key} className="p-2 text-center w-16">{colNames.modelNo || "Model No."}</th>;
                  if (key === "description") return <th key={key} className="p-2 min-w-[80px]">{colNames.description || "Desc"}</th>;
                  if (key === "count") return <th key={key} className="p-2 text-center w-12">{colNames.count || "Count"}</th>;
                  if (key === "colour") return <th key={key} className="p-2 text-center w-14">{colNames.colour || "Colour"}</th>;
                  if (key === "material") return <th key={key} className="p-2 text-center w-16">{colNames.material || "Material"}</th>;
                  if (key === "brand") return <th key={key} className="p-2 text-center w-16">{colNames.brand || "Brand"}</th>;
                  if (key === "serialNo") return <th key={key} className="p-2 text-center w-20">{colNames.serialNo || "Serial No."}</th>;
                  if (key === "challanNo") return <th key={key} className="p-2 text-center w-20">{colNames.challanNo || "Challan No."}</th>;
                  if (key === "quantity") return <th key={key} className="p-2 text-center w-12">{colNames.quantity || "Qty"}</th>;
                  if (key === "unit") return <th key={key} className="p-2 text-center w-12">{colNames.unit || "Unit"}</th>;
                  if (key === "priceUnit") return <th key={key} className="p-2 text-right w-20">{colNames.priceUnit || "Rate"}</th>;
                  if (key === "discount") return <th key={key} className="p-2 text-right w-16">{colNames.discount || "Discount"}</th>;
                  if (key === "discountPercent") return <th key={key} className="p-2 text-right w-16">{colNames.discountPercent || "Disc. %"}</th>;
                  if (key === "taxablePriceUnit") return <th key={key} className="p-2 text-right w-20">{colNames.taxablePriceUnit || "Taxable"}</th>;
                  if (key === "taxableValue") return <th key={key} className="p-2 text-right w-24">Taxable Amt</th>;
                  if (key === "cgst") return <th key={key} className="p-2 text-center w-24" colSpan="2">CGST</th>;
                  if (key === "sgst") return <th key={key} className="p-2 text-center w-24" colSpan="2">SGST</th>;
                  if (key === "amount") return <th key={key} className="p-2 text-right w-24">{colNames.amount || "Total"}</th>;
                  return null;
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] text-slate-700">
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
                  <tr key={idx} className="hover:bg-slate-50/50">
                    {activeColsInOrder.map((key) => {
                      if (key === "slNo") return <td key={key} className="p-1.5 text-center">{idx + 1}</td>;
                      if (key === "itemName") return <td key={key} className="p-1.5 font-bold text-slate-900">{l.name || "Product Name"}</td>;
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
          </table></div>
        </div>

        {/* Totals & Bank details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm space-y-2">
              <h5 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest">Bank Remittance details</h5>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-600 font-mono">
                <span className="font-medium">Bank Name</span><span className="text-slate-800 font-bold">{invoice.bankDetails?.bankName || paymentDetails?.bankName || "Axis Bank"}</span>
                <span className="font-medium">Account No.</span><span className="text-slate-800 font-bold">{invoice.bankDetails?.accountNumber || paymentDetails?.accountNumber || "921020024898267"}</span>
                <span className="font-medium">IFSC Code</span><span className="text-slate-800 font-bold">{invoice.bankDetails?.ifsc || paymentDetails?.ifsc || "UTIB0003532"}</span>
                <span className="font-medium">Branch</span><span className="text-slate-800 font-bold">{invoice.bankDetails?.branchName || paymentDetails?.branchName || "-"}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              <span className="font-bold uppercase text-[8px] block not-italic text-slate-400 mb-0.5">Amount in words</span>
              {numberToWords(totals.grand)}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="w-full text-[10px] font-mono divide-y divide-slate-100">
              {totals.subtotal > 0 && totals.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Subtotal</span><span>{formatAmt(totals.subtotal, printSet)}</span>
                </div>
              )}
              {totals.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 text-green-600">
                  <span>(-) Discount</span><span>-{formatAmt(totals.discountAmount, printSet)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Taxable Amount</span><span className="font-semibold">{formatAmt(totals.taxableAmount, printSet)}</span>
              </div>
              {totals.gstAmount > 0 && (
                <>
                  <div className="flex justify-between py-1.5 text-slate-500">
                    <span>CGST</span><span>{formatAmt(totals.gstAmount / 2, printSet)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-500">
                    <span>SGST</span><span>{formatAmt(totals.gstAmount / 2, printSet)}</span>
                  </div>
                </>
              )}
              {totals.roundOff !== 0 && (
                <div className="flex justify-between py-1.5 text-slate-400 italic">
                  <span>Round Off</span><span>{totals.roundOff > 0 ? '+' : ''}{formatAmt(Math.abs(totals.roundOff), printSet)}</span>
                </div>
              )}
              <div className={`flex justify-between font-extrabold text-[13px] py-2 ${activeColor.text}`}>
                <span>Total Amount Due</span><span>&#8377; {formatAmt(totals.grand, printSet)}</span>
              </div>
              {printSet.receivedAmount && (
                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Received Amount</span>
                  <span>{formatAmt(Number(invoice.receivedAmount || 0), printSet)}</span>
                </div>
              )}
              {printSet.balanceAmount && (
                <div className="flex justify-between font-bold py-1.5">
                  <span>Balance Due</span>
                  <span className="text-red-600">{formatAmt(Math.max(0, totals.grand - Number(invoice.receivedAmount || 0)), printSet)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Footer Block */}
        {(printSet.printTermsAndConditions || printSet.printSignatureText || printSet.printDescription || printSet.printReceivedByDetails || printSet.printDeliveredByDetails || printSet.printAcknowledgement) && (
          <div className="bg-white border rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
            {renderCommonFooter(invoice, printSet, {
              titleClass: "text-[10px] text-slate-400 font-extrabold",
              textClass: "text-slate-600 text-[10px]",
              containerClass: "space-y-4",
              signatureContainerClass: "space-y-4 flex flex-col justify-between items-end text-right"
            })}
          </div>
        )}

      </div>
    </div>
  );
}
