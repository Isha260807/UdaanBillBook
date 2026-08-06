import { platformSettings } from "./platform-settings";

/**
 * Builds the exact WhatsApp invoice share message based on user's TRANSACTION MESSAGE settings
 * 
 * @param {Object} invoice - Invoice object (payload or saved invoice)
 * @returns {string} Formatted WhatsApp message string
 */
export function buildWhatsAppMessage(invoice) {
  const settings = platformSettings.get();
  const messageSettings = settings?.messageSettings || {};

  const bodyText = messageSettings.bodyText || "Thanks for your purchase with us!!\nPurchase Details:";
  const partyName = invoice.partyName || invoice.customer || invoice.party || "Customer";
  const invNumber = invoice.invoiceNumber || invoice.id || "INV";
  const grandTotal = Number(invoice.grandTotal || invoice.grand || invoice.amount || 0).toFixed(2);
  const receivedAmt = Number(invoice.receivedAmount || 0).toFixed(2);
  const balanceAmt = Number(invoice.balanceAmount || (grandTotal - receivedAmt)).toFixed(2);
  const partyTotalBalance = invoice.partyBalance !== undefined ? Number(invoice.partyBalance).toFixed(2) : null;

  let msgLines = [
    bodyText,
    `*Invoice Number:* ${invNumber}`,
    `*Invoice Amount:* ₹${grandTotal}`,
    `*Received:* ₹${receivedAmt}`,
    `*Balance:* ₹${balanceAmt}`
  ];

  if (messageSettings.showBalance && partyTotalBalance !== null) {
    msgLines.push(`*Total Balance:* ₹${partyTotalBalance}`);
  }

  if (messageSettings.showPaymentLink) {
    const invId = invoice._id || invoice.id || invNumber;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://udaanbillbook.co";
    msgLines.push(`*Payment Link:* ${origin}/pay/${invId}`);
  }

  if (messageSettings.showWebLink) {
    const invId = invoice._id || invoice.id || invNumber;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://udaanbillbook.co";
    msgLines.push(`\nView Invoice: ${origin}/invoice/${invId}`);
  }

  return msgLines.join("\n");
}

/**
 * Opens WhatsApp web/app link to share invoice message directly
 * 
 * @param {Object} invoice - Invoice object
 * @param {string} phone - Target phone number (optional)
 */
export function openWhatsAppShare(invoice, phone = "") {
  const rawPhone = phone || invoice.phone || invoice.billedToMobile || invoice.partyPhone || invoice.party?.phone || invoice.shippingDetails?.phone || "";
  const cleanPhone = String(rawPhone).replace(/\D/g, "");
  const formattedPhone = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : "";

  const msgText = buildWhatsAppMessage(invoice);
  const encodedMsg = encodeURIComponent(msgText);

  const waUrl = formattedPhone 
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}` 
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  const newWindow = window.open(waUrl, "_blank", "noopener,noreferrer");
  if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
    // If popup was blocked by browser popup blocker, redirect fallback
    window.location.href = waUrl;
  }
}
