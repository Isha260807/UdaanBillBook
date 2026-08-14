import React from "react";
import { getTransactionTitle, getIsInterstate } from "../templateUtils.jsx";

export function ThermalReceiptTemplate({ invoice, printSet, gstSet }) {
  const { customer, lines, totals, meta, paymentDetails, restaurantDetails, hotelDetails, retailDetails } = invoice;
  const isInterstate = getIsInterstate(invoice, printSet, gstSet);

  const businessName = printSet?.companyName || meta?.sellerName || "";
  const sellerAddress = printSet?.address || meta?.sellerAddress || "";
  const sellerPhone = printSet?.phone || meta?.sellerPhone || "";
  const sellerGstin = printSet?.gstin || meta?.sellerGstin || gstSet?.gstin || "";
  const sellerFssai = printSet?.sellerFssai || meta?.sellerFssai || "";

  const invNo = meta?.invoiceNumber || "GST-3525-26";
  const invDate = meta?.date ? meta.date.split(' ')[0] : "23-Jul-2025";
  const docType = getTransactionTitle(invoice, printSet, gstSet);

  const upiId = paymentDetails?.upiId || printSet?.upiId || "";
  const qrData = upiId ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${totals.grand}&cu=INR` : "";
  const qrCodeUrl = printSet?.qrCodeUrl || (qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}` : "");

  // Standardized 2-decimal currency formatter
  const formatCur = (val) => {
    const n = Number(val) || 0;
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white text-black font-sans text-[11px] leading-tight p-3 mx-auto border border-gray-300 shadow-sm" style={{ width: '100%', maxWidth: '330px' }}>
      {/* Seller Header */}
      <div className="text-center space-y-0.5 mb-1.5">
        <h1 className="font-bold text-sm text-gray-900 tracking-tight">{businessName}</h1>
        {sellerAddress && <div className="text-[10px] text-gray-700 leading-snug">{sellerAddress}</div>}
        {sellerPhone && <div className="text-[10px] text-gray-700">Phone : {sellerPhone}</div>}
        {sellerGstin && <div className="text-[10px] font-semibold text-gray-800">GSTIN : {sellerGstin}</div>}
        {sellerFssai && <div className="text-[10px] text-gray-700">FSSAI : {sellerFssai}</div>}
      </div>

      {/* Title */}
      <div className="text-center font-bold text-xs uppercase tracking-wider my-1 text-gray-900">
        {docType}
      </div>

      {/* Invoice Meta */}
      <div className="flex justify-between text-[10px] font-semibold text-gray-800 mb-1">
        <span>INVOICE #: {invNo}</span>
        <span>DATE: {invDate}</span>
      </div>

      {/* Billed To Section */}
      <div className="my-1 text-[10px] space-y-0.5">
        <div className="text-center font-bold text-gray-700 select-none">
          ============== BILLED TO ==============
        </div>
        <div>Name : <span className="font-semibold text-gray-900">{customer || "Walk-in Customer"}</span></div>
        {meta?.billedToMobile && <div>Phone : {meta.billedToMobile}</div>}
        {(hotelDetails?.guestEmail || meta?.billedToEmail) && <div>Email : {hotelDetails?.guestEmail || meta.billedToEmail}</div>}
        {(hotelDetails?.guestAddress || meta?.billedToAddress) && <div>Address : {hotelDetails?.guestAddress || meta.billedToAddress}</div>}
        {(hotelDetails?.guestGstin || meta?.billedToGstin) && <div>GSTIN : {hotelDetails?.guestGstin || meta.billedToGstin}</div>}
        {hotelDetails?.guestCompany && <div>Company : <span className="font-semibold">{hotelDetails.guestCompany}</span></div>}

        {/* Restaurant Specific Meta */}
        {restaurantDetails && (restaurantDetails.orderType || restaurantDetails.tableNumber || restaurantDetails.kotNumber) && (
          <div className="pt-0.5 mt-0.5 border-t border-dashed border-gray-300 space-y-0.5 text-gray-700">
            {restaurantDetails.orderType && <div>Order Type : <span className="font-semibold">{restaurantDetails.orderType}</span></div>}
            {restaurantDetails.tableNumber && <div>Table No : <span className="font-semibold">{restaurantDetails.tableNumber}</span></div>}
            {restaurantDetails.kotNumber && <div>KOT No : {restaurantDetails.kotNumber}</div>}
          </div>
        )}

        {/* Hotel Specific Meta */}
        {hotelDetails && (hotelDetails.bookingId || hotelDetails.roomNumber || hotelDetails.checkInDate) && (
          <div className="pt-0.5 mt-0.5 border-t border-dashed border-gray-300 space-y-0.5 text-gray-700">
            {hotelDetails.bookingId && <div>Booking ID : <span className="font-semibold">{hotelDetails.bookingId}</span></div>}
            {hotelDetails.roomNumber && <div>Room No : <span className="font-semibold">{hotelDetails.roomNumber}</span></div>}
            {hotelDetails.roomType && <div>Room Type : <span className="font-semibold">{hotelDetails.roomType}</span></div>}
            {hotelDetails.checkInDate && <div>Check-in : <span className="font-semibold">{hotelDetails.checkInDate}{hotelDetails.checkInTime ? ' ' + hotelDetails.checkInTime : ''}</span></div>}
            {hotelDetails.checkOutDate && <div>Check-out : <span className="font-semibold">{hotelDetails.checkOutDate}{hotelDetails.checkOutTime ? ' ' + hotelDetails.checkOutTime : ''}</span></div>}
            {hotelDetails.totalNights > 0 && <div>Nights : <span className="font-semibold">{hotelDetails.totalNights}</span></div>}
          </div>
        )}

        {/* Retail / Grocery Specific Meta */}
        {retailDetails && (retailDetails.orderNo || retailDetails.counterNo || retailDetails.cashierName) && (
          <div className="pt-0.5 mt-0.5 border-t border-dashed border-gray-300 space-y-0.5 text-gray-700">
            {retailDetails.orderNo && <div>Order No : <span className="font-semibold">{retailDetails.orderNo}</span></div>}
            {retailDetails.counterNo && <div>Counter : <span className="font-semibold">{retailDetails.counterNo}</span></div>}
            {retailDetails.cashierName && <div>Cashier : {retailDetails.cashierName}</div>}
          </div>
        )}
      </div>

      {/* Items Section Header */}
      <div className="text-center my-0.5 text-[10px] font-bold text-gray-700 select-none">
        ========================================
      </div>
      <div className="flex justify-between font-bold text-[10px] text-gray-900 leading-tight py-0.5">
        <div className="w-1/2 text-left">
          Items / HSN / Rate
        </div>
        <div className="w-1/4 text-center">
          Taxable + GST
        </div>
        <div className="w-1/4 text-right">
          Total
        </div>
      </div>
      <div className="text-center my-0.5 text-[10px] font-bold text-gray-700 select-none">
        ========================================
      </div>

      {/* Items List */}
      <div className="space-y-1.5 my-1">
        {lines && lines.length > 0 ? lines.map((l, idx) => {
          const qty = Number(l.qty) || 1;
          const rate = Number(l.rate) || 0;
          const gstPercent = Number(l.gst) || 0;
          const baseTotal = qty * rate;
          const discountAmt = baseTotal * ((Number(l.discount) || 0) / 100);
          const taxable = baseTotal - discountAmt;
          const taxVal = taxable * (gstPercent / 100);
          const lineTotal = taxable + taxVal;

          return (
            <div key={idx} className="space-y-0.5 text-[10px] pb-1 border-b border-dotted border-gray-200">
              {/* Row 1: Item Name, Taxable, Line Total */}
              <div className="flex justify-between items-start font-semibold">
                <span className="w-1/2 pr-1 text-gray-900 leading-snug">{l.name || `Item ${idx + 1}`}</span>
                <span className="w-1/4 text-center text-gray-800">{formatCur(taxable)}</span>
                <span className="w-1/4 text-right font-bold text-gray-900">{formatCur(lineTotal)}</span>
              </div>

              {/* Row 2: Compact Details (Qty, Rate, GST %, HSN) */}
              <div className="flex justify-between items-center text-[9px] text-gray-600">
                <span className="w-1/2">x{qty} {l.unit || 'NOS'} {rate > 0 ? `@ ₹${formatCur(rate)}` : ''}</span>
                <span className="w-1/4 text-center">{gstPercent > 0 ? `+ ${gstPercent.toFixed(2)} %${isInterstate ? ' (IGST)' : ''}` : ''}</span>
                <span className="w-1/4 text-right">{l.hsnSac ? `HSN:${l.hsnSac}` : ''}</span>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-1 italic text-gray-500 text-[10px]">No items added</div>
        )}
      </div>

      {/* Summary Section */}
      <div className="text-center my-0.5 text-[10px] font-bold text-gray-700 select-none">
        ============= SUMMARY =============
      </div>
      <div className="space-y-0.5 text-[10px] text-gray-800 my-1 font-medium">
        <div className="flex justify-between">
          <span>Taxable Amount</span>
          <span className="font-semibold">{formatCur(totals.taxableAmount || totals.subtotal)}</span>
        </div>

        {totals.gstAmount > 0 && (
          isInterstate ? (
            <div className="flex justify-between">
              <span>Add : IGST</span>
              <span>{formatCur(totals.gstAmount)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Add : CGST</span>
                <span>{formatCur(totals.gstAmount / 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Add : SGST</span>
                <span>{formatCur(totals.gstAmount / 2)}</span>
              </div>
            </>
          )
        )}

        {totals.tcsAmount > 0 && (
          <div className="flex justify-between font-semibold text-emerald-700">
            <span>Add : TCS (+)</span>
            <span>+{formatCur(totals.tcsAmount)}</span>
          </div>
        )}

        {totals.tdsAmount > 0 && (
          <div className="flex justify-between font-semibold text-blue-700">
            <span>Less : TDS (-)</span>
            <span>-{formatCur(totals.tdsAmount)}</span>
          </div>
        )}

        {totals.gstAmount > 0 && (
          <>
            <div className="flex justify-between font-semibold border-t pt-0.5 mt-0.5">
              <span>Total Tax ({isInterstate ? "IGST" : "GST"})</span>
              <span>{formatCur(totals.gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount After Tax</span>
              <span className="font-bold">₹{formatCur(totals.grand)}</span>
            </div>
          </>
        )}

        {restaurantDetails?.serviceCharge > 0 && (
          <div className="flex justify-between">
            <span>Service Charge</span>
            <span>+{formatCur(restaurantDetails.serviceCharge)}</span>
          </div>
        )}
      </div>

      <div className="text-center my-0.5 text-[10px] font-bold text-gray-700 select-none">
        ========================================
      </div>
      <div className="flex justify-between font-bold text-xs text-gray-900 my-1">
        <span>Grand Total :</span>
        <span>{formatCur(totals.grand)}</span>
      </div>
      <div className="text-center my-0.5 text-[10px] font-bold text-gray-700 select-none">
        ========================================
      </div>

      {/* Footer Message & UPI QR Code */}
      <div className="text-center space-y-1.5 mt-2">
        {invoice.terms && <div className="text-[10px] text-gray-700">{invoice.terms}</div>}
        {invoice.description && <div className="text-[10px] text-gray-500">{invoice.description}</div>}

        {qrCodeUrl && (
          <div className="flex flex-col items-center pt-1">
            <img src={qrCodeUrl} alt="UPI QR Code" className="w-20 h-20 object-contain border border-gray-300 p-1 rounded" />
            <span className="text-[9.5px] font-bold text-gray-800 mt-0.5">Pay using UPI</span>
          </div>
        )}
      </div>
    </div>
  );
}
