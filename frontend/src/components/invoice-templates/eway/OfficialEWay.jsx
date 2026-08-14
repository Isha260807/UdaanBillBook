import React from "react";
import Barcode from "react-barcode";
import { getIsInterstate } from "../templateUtils.jsx";

export function OfficialEWay({ invoice, printSet, gstSet, numberToWords }) {
  const { customer, lines, totals, meta, transportDetails = {}, shippingDetails = {} } = invoice;

  const sellerGstin = gstSet?.gstin || invoice.sellerDetails?.gstin || "";
  const sellerName = printSet?.companyName || invoice.sellerDetails?.companyName || "Company Name";
  const sellerState = printSet?.state || invoice.sellerDetails?.state || meta?.placeOfSupply || "";
  const sellerLogo = printSet?.logoUrl || invoice?.logoUrl || invoice?.sellerDetails?.logoUrl || "";

  const customerGstin = meta?.billedToGstin || invoice.shippingDetails?.shippingGstin || "";
  const customerName = meta?.billingName || customer || "Customer Name";
  const customerState = meta?.billedToState || meta?.placeOfSupply || "";
  const customerMobile = meta?.billedToMobile || "";

  const isInterstate = getIsInterstate(invoice, printSet, gstSet);

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  lines.forEach((l) => {
    const q = Number(l.qty) || 0;
    const r = Number(l.rate || l.price) || 0;
    const d = Number(l.discount) || 0;
    const g = Number(l.gst) || 0;
    const rateAfterDisc = r * (1 - d / 100);
    const taxable = q * rateAfterDisc;
    const taxAmt = taxable * (g / 100);

    totalTaxable += taxable;

    if (isInterstate) {
      totalIgst += taxAmt;
    } else {
      totalCgst += taxAmt / 2;
      totalSgst += taxAmt / 2;
    }
    totalCess += (taxable * (Number(l.cess) || 0)) / 100;
  });

  const totalInvAmt = totalTaxable + totalCgst + totalSgst + totalIgst + totalCess;
  const ewbNo = transportDetails.ewbNumber || meta?.invoiceNumber || "4y7534165419760810131";

  return (
    <div className="w-full bg-white p-6 font-sans text-[9px] leading-tight text-slate-900">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3">
        {/* Left: Ashoka Emblem + Government of India e-Way Bill text */}
        <div className="flex items-center gap-3 shrink-0">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
            alt="Emblem of India" 
            className="h-14 w-auto object-contain"
            style={{ height: '56px', maxHeight: '56px', width: 'auto', maxWidth: '60px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.seeklogo.com/logo-png/38/2/ashoka-stambh-logo-png_seeklogo-384144.png";
            }}
          />
          <div>
            <p className="text-[11px] text-slate-700 font-medium">Government of India</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">e-Way Bill</h1>
          </div>
        </div>
        
        {/* Middle: Company Logo */}
        <div className="flex-1 flex justify-center items-center px-4">
          {sellerLogo && (
            <img 
              src={sellerLogo} 
              alt="Company Logo" 
              className="max-h-16 max-w-[120px] object-contain border border-slate-300 rounded p-1 bg-white" 
            />
          )}
        </div>

        {/* Right: QR Code */}
        <div className="w-20 h-20 border border-slate-900 p-1 flex items-center justify-center bg-white shrink-0">
          <div className="w-full h-full bg-slate-900 grid grid-cols-5 gap-0.5 p-0.5">
            <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>
            <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div><div className="bg-white"></div>
            <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div>
            <div className="bg-white"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>
            <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-white"></div>
          </div>
        </div>
      </div>

      <hr className="border-slate-400 my-2" />

      {/* 1. E-WAY BILL Details */}
      <div className="mb-3">
        <h2 className="font-bold text-[10px] text-slate-900 mb-1.5">1. E-WAY BILL Details</h2>
        <div className="grid grid-cols-3 gap-y-1.5 gap-x-4 text-[9px]">
          <div><span className="text-slate-600">eWay Bill No:</span> <strong className="text-slate-900 font-bold">{ewbNo}</strong></div>
          <div><span className="text-slate-600">Generated Date:</span> <strong>{meta?.date || "-"}</strong></div>
          <div><span className="text-slate-600">Generated By:</span> <strong>{sellerGstin || "-"}</strong></div>
          <div><span className="text-slate-600">Valid Upto:</span> <strong>{transportDetails.validUpto || "-"}</strong></div>
          <div><span className="text-slate-600">Mode:</span> <strong>{transportDetails.modeOfTransport || "Road"}</strong></div>
          <div><span className="text-slate-600">Approx Distance:</span> <strong>{transportDetails.approxDistance ? `${transportDetails.approxDistance}km` : "-"}</strong></div>
          <div><span className="text-slate-600">Type:</span> <strong>Outward - Supply</strong></div>
          <div className="col-span-2"><span className="text-slate-600">Document Details:</span> <strong>Tax Invoice - {meta?.invoiceNumber} - {meta?.date}</strong></div>
          <div><span className="text-slate-600">Transaction type:</span> <strong>Regular</strong></div>
        </div>
      </div>

      <hr className="border-slate-400 my-2.5" />

      {/* 2. Address Details */}
      <div className="mb-3">
        <h2 className="font-bold text-[10px] text-slate-900 mb-1.5">2. Address Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* FROM Box */}
          <div className="border border-slate-400 p-2 rounded">
            <h4 className="font-bold text-slate-900 mb-1 uppercase text-[9px]">From</h4>
            <p className="font-mono text-slate-700">GSTIN : <strong>{sellerGstin || "-"}</strong></p>
            <p className="font-bold uppercase text-slate-900 mt-0.5">{sellerName}</p>
            {sellerState && <p className="text-slate-700">{sellerState}</p>}
            <div className="mt-2 text-slate-600 border-t border-dashed border-slate-300 pt-1">
              <span className="italic block text-[8px] text-slate-500">:: Dispatch From ::</span>
              <p className="text-slate-800">{shippingDetails.dispatchFromAddress || printSet?.address || invoice.sellerDetails?.address || "-"}</p>
              {shippingDetails.placeOfDispatch && (
                <p className="text-slate-600 text-[8px] mt-0.5">Place of Dispatch: <strong>{shippingDetails.placeOfDispatch}</strong></p>
              )}
            </div>
          </div>

          {/* TO Box */}
          <div className="border border-slate-400 p-2 rounded">
            <h4 className="font-bold text-slate-900 mb-1 uppercase text-[9px]">To</h4>
            <p className="font-mono text-slate-700">GSTIN : <strong>{customerGstin || "-"}</strong></p>
            <p className="font-bold uppercase text-slate-900 mt-0.5">{customerName}</p>
            {customerState && <p className="text-slate-700">{customerState}</p>}
            {customerMobile && <p className="text-slate-600 text-[8px]">Mob: {customerMobile}</p>}
            <div className="mt-2 text-slate-600 border-t border-dashed border-slate-300 pt-1">
              <span className="italic block text-[8px] text-slate-500">:: Ship To ::</span>
              <p className="text-slate-800">{shippingDetails.shipToAddress || meta?.billedToAddress || "-"}</p>
              {shippingDetails.placeOfDelivery && (
                <p className="text-slate-600 text-[8px] mt-0.5">Place of Delivery: <strong>{shippingDetails.placeOfDelivery}</strong></p>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-400 my-2.5" />

      {/* 3. Goods Details */}
      <div className="mb-3">
        <h2 className="font-bold text-[10px] text-slate-900 mb-1.5">3. Goods Details</h2>
        <table className="w-full text-left border border-slate-900 border-collapse mb-2">
          <thead>
            <tr className="border-b border-slate-900 text-[8.5px] font-bold">
              <th className="p-1.5 border-r border-slate-900 w-16">HSN Code</th>
              <th className="p-1.5 border-r border-slate-900">Product Name & Desc.</th>
              <th className="p-1.5 border-r border-slate-900 text-center w-20">Quantity</th>
              <th className="p-1.5 border-r border-slate-900 text-right w-24">Taxable Amount Rs.</th>
              <th className="p-1.5 text-right">Tax Rate (C+S+I+Cess+Cess Non.Advol)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {lines.map((l, idx) => {
              const q = Number(l.qty) || 0;
              const r = Number(l.rate || l.price) || 0;
              const d = Number(l.discount) || 0;
              const g = Number(l.gst) || 0;
              const rateAfterDisc = r * (1 - d / 100);
              const taxable = q * rateAfterDisc;

              const cgst = isInterstate ? 0 : g / 2;
              const sgst = isInterstate ? 0 : g / 2;
              const igst = isInterstate ? g : 0;
              const cess = Number(l.cess) || 0;

              const fmtRate = (val) => {
                const n = Number(val) || 0;
                return n % 1 === 0 ? String(n) : String(n);
              };

              return (
                <tr key={idx} className="text-[8.5px]">
                  <td className="p-1.5 border-r border-slate-900 font-mono">{l.hsnSac || l.hsnCode || "-"}</td>
                  <td className="p-1.5 border-r border-slate-900 font-medium">{l.name || l.item || "-"}</td>
                  <td className="p-1.5 border-r border-slate-900 text-center font-mono">{q} Kgs</td>
                  <td className="p-1.5 border-r border-slate-900 text-right font-mono">{taxable.toFixed(2)}</td>
                  <td className="p-1.5 text-right font-mono">
                    {fmtRate(cgst)}+{fmtRate(sgst)}+{fmtRate(igst)}+{fmtRate(cess)}+0
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Goods Summary Text Line */}
        <div className="space-y-1 text-[8.5px] font-mono text-slate-800 pt-1">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Tot. Tax'ble Amt <strong className="text-slate-900">₹ {totalTaxable.toFixed(2)}</strong></span>
            <span>CGST Amt <strong className="text-slate-900">₹ {totalCgst.toFixed(2)}</strong></span>
            <span>SGST Amt <strong className="text-slate-900">₹ {totalSgst.toFixed(2)}</strong></span>
            <span>IGST Amt <strong className="text-slate-900">₹ {totalIgst.toFixed(2)}</strong></span>
            <span>CESS Amt <strong className="text-slate-900">₹ {totalCess.toFixed(2)}</strong></span>
            <span>CESS Non-Advol Amt <strong className="text-slate-900">₹ 0.00</strong></span>
          </div>
          <div>
            <span>Other Amt <strong className="text-slate-900">₹ 0.00</strong></span>
            <span className="ml-6">Total Inv Amt <strong className="text-slate-900 font-bold text-[9.5px]">₹ {totalInvAmt.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      <hr className="border-slate-400 my-2.5" />

      {/* 4. Transportation Details */}
      <div className="mb-3">
        <h2 className="font-bold text-[10px] text-slate-900 mb-1.5">4. Transportation Details</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-[9px]">
          <div><span className="text-slate-600">Transporter ID & Name :</span> <strong className="text-slate-900 font-bold">{transportDetails.transporterId || transportDetails.transporterName ? `${transportDetails.transporterId || ''} & ${transportDetails.transporterName || ''}` : "-"}</strong></div>
          <div><span className="text-slate-600">Transporter Doc. No & Date :</span> <strong>{transportDetails.lrNumber || transportDetails.grRrNo ? `${transportDetails.lrNumber || transportDetails.grRrNo} & ${meta?.date || ''}` : "-"}</strong></div>
        </div>
      </div>

      <hr className="border-slate-400 my-2.5" />

      {/* 5. Vehicle Details */}
      <div className="mb-3">
        <h2 className="font-bold text-[10px] text-slate-900 mb-1.5">5. Vehicle Details</h2>
        <table className="w-full text-left border border-slate-900 border-collapse text-[8.5px]">
          <thead>
            <tr className="border-b border-slate-900 font-bold">
              <th className="p-1 border-r border-slate-900">Mode</th>
              <th className="p-1 border-r border-slate-900">Vehicle / Trans Doc No & Dt.</th>
              <th className="p-1 border-r border-slate-900">From</th>
              <th className="p-1 border-r border-slate-900">Entered Date</th>
              <th className="p-1 border-r border-slate-900">Entered By</th>
              <th className="p-1 border-r border-slate-900">CEWB No. (if any)</th>
              <th className="p-1">Multi Veh. Info (if any)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono">
              <td className="p-1 border-r border-slate-900">{transportDetails.modeOfTransport || "Road"}</td>
              <td className="p-1 border-r border-slate-900 font-bold">{meta?.vehicleNo || transportDetails.vehicleNumber || "-"}</td>
              <td className="p-1 border-r border-slate-900">{shippingDetails.placeOfDispatch || sellerState || "-"}</td>
              <td className="p-1 border-r border-slate-900">{meta?.date || "-"}</td>
              <td className="p-1 border-r border-slate-900">{sellerGstin || "-"}</td>
              <td className="p-1 border-r border-slate-900">-</td>
              <td className="p-1">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="border-slate-400 my-3" />

      {/* Bottom Barcode */}
      <div className="pt-2 flex flex-col items-center justify-center text-center">
        <Barcode 
          value={ewbNo}
          width={1.5}
          height={38}
          fontSize={11}
          displayValue={true}
        />
      </div>
    </div>
  );
}
