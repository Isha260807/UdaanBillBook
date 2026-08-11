// Mock platform settings store for business types and other dynamic categories.
import { useEffect, useState } from "react";

const KEY = "Udaan.settings";

const defaultSettings = {
  businessTypes: [
    "Retail Shop",
    "Wholesale / Distribution",
    "Manufacturing",
    "Services",
    "Restaurant / Cafe",
    "Other",
  ],
  gstSettings: {
    enableGst: true,
    enableHsn: true,
    cessOnItem: false,
    reverseCharge: false,
    placeOfSupply: true,
    compositeScheme: false,
    tcs: false,
    tds: false,
    taxRates: [
      { id: "r1", name: "IGST@0%", value: 0 },
      { id: "r2", name: "SGST@0%", value: 0 },
      { id: "r3", name: "CGST@0%", value: 0 },
      { id: "r4", name: "IGST@0.25%", value: 0.25 },
      { id: "r5", name: "SGST@0.125%", value: 0.125 },
      { id: "r6", name: "CGST@0.125%", value: 0.125 },
      { id: "r7", name: "IGST@3%", value: 3 },
      { id: "r8", name: "SGST@1.5%", value: 1.5 },
      { id: "r9", name: "CGST@1.5%", value: 1.5 },
      { id: "r10", name: "IGST@5%", value: 5 },
      { id: "r11", name: "SGST@2.5%", value: 2.5 },
      { id: "r12", name: "CGST@2.5%", value: 2.5 },
      { id: "r13", name: "IGST@12%", value: 12 },
      { id: "r14", name: "SGST@6%", value: 6 },
      { id: "r15", name: "CGST@6%", value: 6 },
      { id: "r16", name: "IGST@18%", value: 18 },
      { id: "r17", name: "SGST@9%", value: 9 },
      { id: "r18", name: "CGST@9%", value: 9 },
    ],
    taxGroups: [
      { id: "g1", name: "GST@0%", cgst: 0, sgst: 0 },
      { id: "g2", name: "GST@0.25%", cgst: 0.125, sgst: 0.125 },
      { id: "g3", name: "GST@3%", cgst: 1.5, sgst: 1.5 },
      { id: "g4", name: "GST@5%", cgst: 2.5, sgst: 2.5 },
      { id: "g5", name: "GST@12%", cgst: 6, sgst: 6 },
      { id: "g6", name: "GST@18%", cgst: 9, sgst: 9 },
      { id: "g7", name: "GST@28%", cgst: 14, sgst: 14 },
      { id: "g8", name: "GST@40%", cgst: 20, sgst: 20 },
    ],
  },
  txnSettings: {
    billNo: true,
    addTime: false,
    cashSaleDefault: false,
    billingName: false,
    poDetails: false,
    ewayBill: false,
    quickEntry: false,
    noPreview: false,
    passcodeEdit: false,
    discountDuringPayment: false,
    linkPayments: false,
    dueDates: false,
    taxOnRate: true,
    displayPurchasePrice: true,
    showLast5Sale: true,
    showLast5Purchase: true,
    freeQty: false,
    count: true,
    firm: "My Company",
    prefixes: {
      sale: "",
      creditNote: "",
      saleOrder: "",
      purchaseOrder: "",
      estimate: "",
      proforma: "",
      deliveryChallan: "",
      paymentIn: "",
    },
    txnWiseTax: false,
    txnWiseDiscount: false,
    roundOff: true,
    roundNearest: 1,
    billingType: "Full",
  },
  generalSettings: {
    passcode: false,
    currency: "₹",
    decimals: 2,
    gstinNumber: true,
    stopNegativeStock: false,
    blockNewItems: false,
    blockNewParties: false,
    transactions: {
      estimate: true,
      proforma: true,
      order: true,
      otherIncome: false,
      fixedAssets: false,
      challan: true,
    },
    godowns: false,
    autoBackup: false,
    auditTrail: true,
    zoom: 100,
  },
  messageSettings: {
    type: "Udaan",
    sendToParty: true,
    updateMsg: false,
    copyToSelf: false,
    autoShare: false,
    showBalance: false,
    showWebLink: true,
    showPaymentLink: false,
    triggers: {
      sales: true,
      purchase: true,
      salesReturn: true,
      purchaseReturn: true,
      paymentIn: true,
      paymentOut: true,
    },
    bodyText: "Thanks for your purchase with us!!\nPurchase Details:",
  },
  itemSettings: {
    enableItem: true,
    whatDoYouSell: "Product",
    barcodeScan: false,
    barcodeScanType: "camera",
    directBarcodeScan: false,
    stockMaintenance: true,
    showLowStockDialog: true,
    itemsUnit: true,
    itemCategory: true,
    description: false,
    itemWiseTax: true,
    itemWiseDiscount: false,
    updateSalePrice: false,
    mrp: false,
    calculateSalePriceFromMrp: false,
    useMrpForBatch: false,
    calculateTaxOnMrp: false,
    serialNo: false,
    batchNo: true,
    expDate: true,
    mfgDate: false,
    modelNo: false,
    size: false,
    customFields: [], // Array of { name, active }
  },
  partySettings: {
    partyType: true,
    phone: true,
    openingBalance: true,
    gstin: false,
    email: false,
    address: false,
  },
  printSettings: {
    regularPrinterDefault: true,
    repeatHeader: true,
    printCompanyName: true,
    companyName: "my company",
    printCompanyLogo: true,
    printAddress: true,
    address: "13 d swastik",
    printEmail: true,
    email: "",
    printPhone: true,
    phone: "9669002380",
    printGstin: true,
    gstinOnSale: "",
    paperSize: "1",
    orientation: "1",
    companyNameTextSize: "4",
    invoiceTextSize: "Medium",
    printOriginalDuplicate: false,
    extraSpaceTop: 0,
    minRowsItemTable: 0,
    // Transaction Names
    transactionNames: {
      sale: "Tax Invoice",
      estimate: "Estimate",
      paymentIn: "Payment In",
      saleReturn: "Credit Note",
      deliveryChallan: "Delivery Challan",
      proformaInvoice: "Proforma Invoice",
      purchase: "Purchase Bill",
      paymentOut: "Payment Out",
      purchaseReturn: "Debit Note",
      purchaseOrder: "Purchase Order"
    },
    // Item Table Columns
    tableColumns: {
      // Item related
      slNo: true,
      itemName: true,
      itemCode: false,
      hsnSac: true,
      // Additional
      batchNo: false,
      expDate: false,
      mfgDate: false,
      mrp: false,
      size: false,
      modelNo: false,
      description: false,
      count: false,
      colour: false,
      material: false,
      brand: false,
      serialNo: false,
      challanNo: false,
      // Amounts & Taxes
      quantity: true,
      unit: false,
      priceUnit: true,
      discount: true,
      discountPercent: false,
      taxablePriceUnit: false,
      taxAmount: true,
      taxPercent: false,
      taxableAmount: false,
      cess: false,
      finalRate: false,
      amount: true
    },
    // Item Table Column Names
    tableColumnNames: {
      slNo: "#",
      itemName: "Item name",
      itemCode: "Item Code",
      hsnSac: "HSN/SAC",
      batchNo: "Batch No.",
      expDate: "Exp. Date",
      mfgDate: "Mfg. Date",
      mrp: "MRP",
      size: "Size",
      modelNo: "Model No.",
      description: "Description",
      count: "Count",
      colour: "Colour",
      material: "Material",
      brand: "Brand",
      serialNo: "Serial No.",
      challanNo: "Challan/Order No.",
      quantity: "Quantity",
      unit: "Unit",
      priceUnit: "Price/Unit",
      discount: "Discount",
      discountPercent: "Discount %",
      taxablePriceUnit: "Taxable Price/Unit",
      taxAmount: "Tax Amount",
      taxPercent: "Tax Percent",
      taxableAmount: "Taxable Amount",
      cess: "Ad. CESS",
      finalRate: "Final Rate",
      amount: "Amount"
    },
    totalItemQuantity: true,
    amountWithDecimal: true,
    receivedAmount: true,
    balanceAmount: true,
    currentBalanceParty: true,
    taxDetails: true,
    youSaved: true,
    printAmountWithGrouping: true,
    amountInWords: "Indian",
    printDescription: true,
    printTermsAndConditions: true,
    printReceivedByDetails: true,
    printDeliveredByDetails: true,
    printSignatureText: true,
    signatureText: "Authorized Signatory",
    paymentMode: false,
    printAcknowledgement: false,
  },
};

const listeners = new Set();

function read() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    
    // Deep merge to safeguard structure
    return {
      ...defaultSettings,
      ...parsed,
      gstSettings: { ...defaultSettings.gstSettings, ...parsed.gstSettings },
      txnSettings: { ...defaultSettings.txnSettings, ...parsed.txnSettings },
      generalSettings: { ...defaultSettings.generalSettings, ...parsed.generalSettings },
      messageSettings: { ...defaultSettings.messageSettings, ...parsed.messageSettings },
      itemSettings: { ...defaultSettings.itemSettings, ...parsed.itemSettings },
      partySettings: { ...defaultSettings.partySettings, ...parsed.partySettings },
      printSettings: { ...defaultSettings.printSettings, ...parsed.printSettings },
    };
  } catch {
    return defaultSettings;
  }
}

export const platformSettings = {
  get() {
    return read();
  },
  save(settings) {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
    listeners.forEach((l) => l());
  },
  update(updates) {
    const current = read();
    const updated = {
      ...current,
      ...updates,
      gstSettings: updates.gstSettings ? { ...current.gstSettings, ...updates.gstSettings } : current.gstSettings,
      txnSettings: updates.txnSettings ? { ...current.txnSettings, ...updates.txnSettings } : current.txnSettings,
      generalSettings: updates.generalSettings ? { ...current.generalSettings, ...updates.generalSettings } : current.generalSettings,
      messageSettings: updates.messageSettings ? { ...current.messageSettings, ...updates.messageSettings } : current.messageSettings,
      itemSettings: updates.itemSettings ? { ...current.itemSettings, ...updates.itemSettings } : current.itemSettings,
      partySettings: updates.partySettings ? { ...current.partySettings, ...updates.partySettings } : current.partySettings,
      printSettings: updates.printSettings ? { ...current.printSettings, ...updates.printSettings } : current.printSettings,
    };
    window.localStorage.setItem(KEY, JSON.stringify(updated));
    listeners.forEach((l) => l());
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(read());
    setHydrated(true);
    const unsub = platformSettings.subscribe(() => setSettings(read()));
    return unsub;
  }, []);

  return { settings, hydrated };
}
