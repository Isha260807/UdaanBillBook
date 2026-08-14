import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmtNum = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "0.00";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function numberToIndianWords(num) {
  if (num === 0) return "Zero Rupees Only";
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanOneThousand(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return a[hundred] + " Hundred" + (rest ? " " + convertLessThanOneThousand(rest) : "");
  }
  
  let str = "";
  let temp = Math.floor(num);
  const paise = Math.round((num - temp) * 100);
  
  if (temp >= 10000000) {
    const crore = Math.floor(temp / 10000000);
    str += convertLessThanOneThousand(crore) + " Crore ";
    temp %= 10000000;
  }
  if (temp >= 100000) {
    const lakh = Math.floor(temp / 100000);
    str += convertLessThanOneThousand(lakh) + " Lakh ";
    temp %= 100000;
  }
  if (temp >= 1000) {
    const thousand = Math.floor(temp / 1000);
    str += convertLessThanOneThousand(thousand) + " Thousand ";
    temp %= 1000;
  }
  if (temp > 0) {
    str += convertLessThanOneThousand(temp);
  }
  
  str = str.trim() + " Rupees";
  
  if (paise > 0) {
    str += " and " + convertLessThanOneThousand(paise) + " Paise";
  }
  
  return str + " Only";
}

export async function downloadInvoicePdf(rawDocData, options = {}) {
  const invNumber = rawDocData?.number || rawDocData?.invoiceNumber || "Invoice";
  const printArea = document.getElementById("invoice-print-area");

  if (printArea) {
    try {
      // 1. Ensure all <img> tags are fully loaded in DOM
      const imgs = Array.from(printArea.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";
            tempImg.onload = resolve;
            tempImg.onerror = resolve;
            tempImg.src = img.src;
          });
        })
      );

      // 2. Capture printArea via html2canvas
      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      if (options.preview) {
        const blobUrl = pdf.output("bloburl");
        window.open(blobUrl, "_blank");
      } else {
        pdf.save(`${invNumber}.pdf`);
      }
      return;
    } catch (err) {
      console.error("html2canvas PDF generation error:", err);
      return;
    }
  }
  const data = {
    number: rawDocData?.number || rawDocData?.invoiceNumber || "-",
    date: rawDocData?.date ? (typeof rawDocData.date === 'string' && rawDocData.date.includes('T') ? rawDocData.date.split('T')[0] : String(rawDocData.date)) : "-",
    business: {
      name: rawDocData?.business?.name || rawDocData?.sellerDetails?.companyName || "-",
      address: rawDocData?.business?.address || rawDocData?.sellerDetails?.address || "-",
      phone: rawDocData?.business?.phone || rawDocData?.sellerDetails?.phone || "-",
      email: rawDocData?.business?.email || rawDocData?.sellerDetails?.email || "-",
      gstin: rawDocData?.business?.gstin || rawDocData?.sellerDetails?.gstin || "-",
      pan: rawDocData?.business?.pan || "-",
    },
    party: {
      name: rawDocData?.party?.name || (typeof rawDocData?.party === 'string' ? rawDocData.party : null) || rawDocData?.partyName || rawDocData?.billingName || "-",
      phone: rawDocData?.party?.phone || rawDocData?.billedToMobile || rawDocData?.shippingDetails?.phone || "-",
      address: rawDocData?.party?.address || rawDocData?.billedToAddress || rawDocData?.shippingDetails?.address || "-",
      email: rawDocData?.party?.email || "-",
      gstin: rawDocData?.party?.gstin || rawDocData?.billedToGstin || rawDocData?.shippingDetails?.gstin || "-",
      state: rawDocData?.party?.state || rawDocData?.billedToState || rawDocData?.shippingDetails?.state || "-",
      stateCode: rawDocData?.party?.stateCode || "07",
    },
    reverseCharge: rawDocData?.reverseCharge || "No",
    challanNo: rawDocData?.challanNo || rawDocData?.transportDetails?.lrNumber || "-",
    vehicleNo: rawDocData?.vehicleNo || rawDocData?.transportDetails?.vehicleNumber || "-",
    dateOfSupply: rawDocData?.dateOfSupply || "-",
    placeOfSupply: rawDocData?.placeOfSupply || rawDocData?.shippingDetails?.placeOfDelivery || "-",
    taxInclusive: rawDocData?.taxInclusive !== undefined ? rawDocData.taxInclusive : true,
    lines: (Array.isArray(rawDocData?.lines) && rawDocData.lines.length > 0) 
      ? rawDocData.lines 
      : (Array.isArray(rawDocData?.items) ? rawDocData.items.map(it => ({
          name: it.name || "Item",
          hsnSac: it.hsnSac || "",
          qty: Number(it.qty) || 1,
          rate: Number(it.rate) || 0,
          gst: Number(it.gst) || 0
        })) : []),
    bank: {
      accountHolder: rawDocData?.bank?.accountHolder || rawDocData?.bankDetails?.accountHolder || "-",
      accountNumber: rawDocData?.bank?.accountNumber || rawDocData?.bankDetails?.accountNumber || "-",
      ifsc: rawDocData?.bank?.ifsc || rawDocData?.bankDetails?.ifsc || "-",
      name: rawDocData?.bank?.name || rawDocData?.bankDetails?.bankName || "-",
      branch: rawDocData?.bank?.branch || rawDocData?.bankDetails?.branchName || "-",
    },
    terms: rawDocData?.terms || "1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.",
  };

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // 1. Document Header (Centered business details)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.business.name.toUpperCase(), pageW / 2, 40, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.business.address, pageW / 2, 52, { align: "center" });
  doc.text(`Phone: ${data.business.phone}  |  Email: ${data.business.email}`, pageW / 2, 63, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN : ${data.business.gstin}  |  PAN No: ${data.business.pan}`, pageW / 2, 74, { align: "center" });

  // 2. Title Section (TAX INVOICE)
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.rect(35, 85, 525, 36);
  doc.line(450, 85, 450, 121);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TAX INVOICE", 242.5, 107, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("Original for Recipient", 505, 95, { align: "center" });
  doc.text("Duplicate for Transporter", 505, 106, { align: "center" });
  doc.text("Triplicate for Supplier", 505, 117, { align: "center" });

  // 3. Invoice & Transport details box
  doc.rect(35, 121, 525, 55);
  doc.line(280, 121, 280, 176);

  // Left Column
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Reverse Charge", 42, 133);
  doc.text(`: ${data.reverseCharge}`, 120, 133);
  doc.text("Invoice No.", 42, 144);
  doc.text(`: ${data.number}`, 120, 144);
  doc.text("Invoice Date", 42, 155);
  doc.text(`: ${data.date}`, 120, 155);
  doc.text("State", 42, 166);
  doc.text(`: ${data.party.state}`, 120, 166);

  // Right Column
  doc.text("Challan No.", 288, 133);
  doc.text(data.challanNo ? `: ${data.challanNo}` : ":", 370, 133);
  doc.text("Vehicle No.", 288, 144);
  doc.text(`: ${data.vehicleNo}`, 370, 144);
  doc.text("Date of Supply", 288, 155);
  doc.text(data.dateOfSupply ? `: ${data.dateOfSupply}` : ":", 370, 155);
  doc.text("Place of Supply", 288, 166);
  doc.text(data.placeOfSupply ? `: ${data.placeOfSupply}` : ":", 370, 166);

  // State Code Badge
  doc.setFillColor(255, 255, 255);
  doc.rect(200, 152, 70, 20, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("State Code", 235, 160, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(data.party.stateCode, 235, 169, { align: "center" });

  // 4. Details of Receiver | Billed to:
  doc.rect(35, 176, 525, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Details of Receiver | Billed to:", 297.5, 185, { align: "center" });

  // Render buyer details dynamically to calculate billedToEndY
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  let currentY = 200;
  
  doc.text("Name", 42, currentY);
  doc.text(`: ${data.party.name}`, 120, currentY);
  currentY += 10;
  
  doc.text("Address", 42, currentY);
  doc.text(":", 120, currentY);
  const partyAddrLines = doc.splitTextToSize(data.party.address, 330);
  partyAddrLines.forEach((line, idx) => {
    doc.text(line, 125, currentY + idx * 9);
  });
  currentY += Math.max(1, partyAddrLines.length) * 9 + 1;
  
  doc.text("E-MAIL", 42, currentY);
  doc.text(`: ${data.party.email}`, 120, currentY);
  currentY += 10;
  
  doc.text("GSTIN", 42, currentY);
  doc.text(`: ${data.party.gstin}`, 120, currentY);
  currentY += 10;
  
  doc.text("MOBILE", 42, currentY);
  doc.text(`: ${data.party.phone}`, 120, currentY);
  currentY += 10;
  
  doc.text("State", 42, currentY);
  doc.text(`: ${data.party.state}`, 120, currentY);
  currentY += 10;

  const billedToEndY = currentY;

  // Draw billed to box outline
  doc.rect(35, 188, 525, billedToEndY - 188);

  // State Code Badge inside buyer box
  doc.setFillColor(255, 255, 255);
  doc.rect(480, billedToEndY - 25, 70, 20, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("State Code", 515, billedToEndY - 17, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(data.party.stateCode, 515, billedToEndY - 8, { align: "center" });

  // 5. Inter-state detection for PDF
  const sellerStateCode = (data.business.gstin || "").slice(0, 2);
  const customerStateCode = (data.party.gstin || "").slice(0, 2);
  const sellerStateName = (data.business.address || "").toLowerCase();
  const customerStateName = (data.placeOfSupply || data.party.state || "").toLowerCase();

  let isInterstate = false;
  if (sellerStateCode && customerStateCode && sellerStateCode.length === 2 && customerStateCode.length === 2 && /^\d+$/.test(sellerStateCode) && /^\d+$/.test(customerStateCode)) {
    isInterstate = sellerStateCode !== customerStateCode;
  } else if (sellerStateName && customerStateName && sellerStateName.length > 2 && customerStateName.length > 2) {
    isInterstate = !sellerStateName.includes(customerStateName) && !customerStateName.includes(sellerStateName);
  }

  // 5. Items table
  const rows = data.lines.map((l, i) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const gst = Number(l.gst) || 0;
    
    let taxableValue = 0;
    let gstAmount = 0;
    let lineTotal = 0;
    
    if (data.taxInclusive) {
      lineTotal = qty * rate;
      taxableValue = lineTotal / (1 + gst / 100);
      gstAmount = lineTotal - taxableValue;
    } else {
      taxableValue = qty * rate;
      gstAmount = taxableValue * (gst / 100);
      lineTotal = taxableValue + gstAmount;
    }
    
    const cgstRate = `${(gst / 2).toFixed(1)}%`;
    const cgstAmount = fmtNum(gstAmount / 2);
    const sgstRate = `${(gst / 2).toFixed(1)}%`;
    const sgstAmount = fmtNum(gstAmount / 2);
    const discount = Number(l.discount) || 0;
    
    if (isInterstate) {
      return [
        String(i + 1),
        l.name || "",
        l.hsnSac || "",
        String(qty),
        fmtNum(rate),
        fmtNum(discount),
        fmtNum(taxableValue),
        `${gst.toFixed(1)}%`,
        fmtNum(gstAmount),
        fmtNum(lineTotal)
      ];
    }

    return [
      String(i + 1),
      l.name || "",
      l.hsnSac || "",
      String(qty),
      fmtNum(rate),
      fmtNum(discount),
      fmtNum(taxableValue),
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      fmtNum(lineTotal)
    ];
  });

  // Calculate totals
  const totalQty = data.lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalGrand = 0;

  data.lines.forEach((l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const gst = Number(l.gst) || 0;
    
    let taxableValue = 0;
    let gstAmount = 0;
    let lineTotal = 0;
    
    if (data.taxInclusive) {
      lineTotal = qty * rate;
      taxableValue = lineTotal / (1 + gst / 100);
      gstAmount = lineTotal - taxableValue;
    } else {
      taxableValue = qty * rate;
      gstAmount = taxableValue * (gst / 100);
      lineTotal = taxableValue + gstAmount;
    }
    
    totalTaxable += taxableValue;
    totalCgst += gstAmount / 2;
    totalSgst += gstAmount / 2;
    totalGrand += lineTotal;
  });

  const isRcm = String(data.reverseCharge || "").toLowerCase() === "yes";
  if (isRcm) {
    totalGrand = totalTaxable;
  }

  // Add the summary row at the end of body
  if (isInterstate) {
    rows.push([
      "",
      "Total Summary",
      "",
      String(totalQty),
      "",
      "",
      fmtNum(totalTaxable),
      "",
      fmtNum(totalCgst + totalSgst),
      fmtNum(totalGrand)
    ]);
  } else {
    rows.push([
      "",
      "Total Summary",
      "",
      String(totalQty),
      "",
      "",
      fmtNum(totalTaxable),
      "",
      fmtNum(totalCgst),
      "",
      fmtNum(totalSgst),
      fmtNum(totalGrand)
    ]);
  }

  const head = isInterstate ? [
    [
      { content: '#', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'ITEM NAME', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'QUANTITY', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'PRICE/UNIT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'DISCOUNT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'TAXABLE\nVALUE', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'AMOUNT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
    ],
    [
      { content: 'Rate', styles: { halign: 'center' } },
      { content: 'Amount', styles: { halign: 'center' } }
    ]
  ] : [
    [
      { content: '#', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'ITEM NAME', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'QUANTITY', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'PRICE/UNIT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'DISCOUNT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'TAXABLE\nVALUE', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'AMOUNT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
    ],
    [
      { content: 'Rate', styles: { halign: 'center' } },
      { content: 'Amount', styles: { halign: 'center' } },
      { content: 'Rate', styles: { halign: 'center' } },
      { content: 'Amount', styles: { halign: 'center' } }
    ]
  ];

  autoTable(doc, {
    startY: billedToEndY,
    margin: { left: 35, right: 35 },
    head: head,
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: isInterstate ? {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 155, halign: 'left' },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' },
      5: { cellWidth: 45, halign: 'right' },
      6: { cellWidth: 55, halign: 'right' },
      7: { cellWidth: 35, halign: 'center' },
      8: { cellWidth: 50, halign: 'right' },
      9: { cellWidth: 55, halign: 'right' }
    } : {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 135, halign: 'left' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 45, halign: 'right' },
      6: { cellWidth: 50, halign: 'right' },
      7: { cellWidth: 30, halign: 'center' },
      8: { cellWidth: 40, halign: 'right' },
      9: { cellWidth: 30, halign: 'center' },
      10: { cellWidth: 40, halign: 'right' },
      11: { cellWidth: 45, halign: 'right' }
    },
    didParseCell: function(cellData) {
      if (cellData.row.index === cellData.table.body.length - 1) {
        cellData.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const endY = doc.lastAutoTable.finalY;

  // 6. Footer section (totals, bank, terms, sign)
  let footerY = endY;
  // We need around 170 pt for totals + bank + terms + signatory
  if (footerY + 170 > doc.internal.pageSize.getHeight() - 35) {
    doc.addPage();
    footerY = 35;
  }

  // Draw Bank & Totals Box (X = 35 to X = 560, height = 90)
  doc.rect(35, footerY, 525, 90);
  doc.line(295, footerY, 295, footerY + 90);

  // Left column - Words & Bank details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Total Invoice Amount in words", 42, footerY + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const wordsLines = doc.splitTextToSize(numberToIndianWords(totalGrand), 250);
  wordsLines.forEach((line, idx) => {
    doc.text(line, 42, footerY + 19 + idx * 8);
  });

  doc.line(35, footerY + 37, 295, footerY + 37);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Bank Details", 42, footerY + 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Account Holder Name : ${data.bank.accountHolder}`, 42, footerY + 54);
  doc.text(`Bank Account Number : ${data.bank.accountNumber}`, 42, footerY + 62);
  doc.text(`Bank IFSC Code : ${data.bank.ifsc}`, 42, footerY + 70);
  doc.text(`Bank Name : ${data.bank.name}`, 42, footerY + 78);
  doc.text(`Bank Branch Name : ${data.bank.branch}`, 42, footerY + 86);

  // Right column - Totals grid
  for (let r = 1; r < 5; r++) {
    doc.line(295, footerY + r * 18, 560, footerY + r * 18);
  }

  const isRcmDoc = String(data.reverseCharge || "").toLowerCase() === "yes";

  const totalLines = isInterstate ? [
    { label: "Total Amount Before Tax", val: fmtNum(totalTaxable), bold: false },
    { label: "Add : IGST", val: fmtNum(totalCgst + totalSgst), bold: false },
    { label: "Tax Amount : GST", val: fmtNum(totalCgst + totalSgst), bold: false },
    { label: isRcmDoc ? "Total Payable (Excl. Tax RCM)" : "Amount With Tax", val: fmtNum(totalGrand), bold: true },
  ] : [
    { label: "Total Amount Before Tax", val: fmtNum(totalTaxable), bold: false },
    { label: "Add : CGST", val: fmtNum(totalCgst), bold: false },
    { label: "Add : SGST", val: fmtNum(totalSgst), bold: false },
    { label: "Tax Amount : GST", val: fmtNum(totalCgst + totalSgst), bold: false },
    { label: isRcmDoc ? "Total Payable (Excl. Tax RCM)" : "Amount With Tax", val: fmtNum(totalGrand), bold: true },
  ];

  totalLines.forEach((item, idx) => {
    const rowY = footerY + (idx * 18) + 12;
    doc.setFont("helvetica", item.bold ? "bold" : "normal");
    doc.setFontSize(item.bold ? 8.5 : 7.5);
    doc.text(item.label + "  :", 300, rowY);
    doc.text(item.val, 555, rowY, { align: "right" });
  });

  // Terms & Signatory box (X = 35 to 560, height = 80)
  doc.rect(35, footerY + 90, 525, 80);
  doc.line(330, footerY + 90, 330, footerY + 170);

  // Left - Terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Terms And Conditions", 42, footerY + 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const termsLines = doc.splitTextToSize(data.terms, 280);
  termsLines.forEach((line, idx) => {
    doc.text(line, 42, footerY + 110 + idx * 8);
  });

  // Right - Authorized Signatory
  const rightCenter = 445;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Certified that the particular given above are true and correct", rightCenter, footerY + 100, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`For, ${data.business.name.toUpperCase()}`, rightCenter, footerY + 112, { align: "center" });
  
  doc.text("Authorised Signatory", rightCenter, footerY + 162, { align: "center" });

  if (options.preview) {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  } else {
    doc.save(`${data.number}.pdf`);
  }
}

export function printInvoiceHtml() {
  const printArea = document.getElementById("invoice-print-area");
  if (!printArea) {
    toast.error("Invoice area not found");
    return;
  }
  const printContent = printArea.innerHTML;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 4mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 0; }
          img { max-width: 100% !important; }
        </style>
      </head>
      <body class="bg-white p-2">
        <div class="max-w-4xl mx-auto p-1">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
