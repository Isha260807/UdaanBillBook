import { useEffect, useState } from "react";
import api from "./api";

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
      { id: "r1", name: "GST@0%", value: 0 },
      { id: "r2", name: "GST@0.25%", value: 0.25 },
      { id: "r3", name: "GST@3%", value: 3 },
      { id: "r4", name: "GST@5%", value: 5 },
      { id: "r5", name: "GST@12%", value: 12 },
      { id: "r6", name: "GST@18%", value: 18 },
      { id: "r7", name: "GST@28%", value: 28 },
      { id: "r8", name: "GST@40%", value: 40 },
      { id: "ir1", name: "IGST@0%", value: 0 },
      { id: "ir4", name: "IGST@5%", value: 5 },
      { id: "ir5", name: "IGST@12%", value: 12 },
      { id: "ir6", name: "IGST@18%", value: 18 },
      { id: "ir7", name: "IGST@28%", value: 28 },
      { id: "ir8", name: "IGST@40%", value: 40 }
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
      { id: "ig1", name: "IGST@0%", igst: 0 },
      { id: "ig4", name: "IGST@5%", igst: 5 },
      { id: "ig5", name: "IGST@12%", igst: 12 },
      { id: "ig6", name: "IGST@18%", igst: 18 },
      { id: "ig7", name: "IGST@28%", igst: 28 },
      { id: "ig8", name: "IGST@40%", igst: 40 }
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
    customFields: [],
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
    tableColumns: {
      slNo: true,
      itemName: true,
      itemCode: false,
      hsnSac: true,
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
let cachedSettings = null;

function mergeWithDefault(parsed) {
  if (!parsed) return defaultSettings;
  return {
    ...defaultSettings,
    ...parsed,
    gstSettings: {
      ...defaultSettings.gstSettings,
      ...(parsed.gstSettings || {}),
      taxRates: Array.isArray(parsed.gstSettings?.taxRates) ? parsed.gstSettings.taxRates : [],
      taxGroups: Array.isArray(parsed.gstSettings?.taxGroups) ? parsed.gstSettings.taxGroups : [],
    },
    txnSettings: { ...defaultSettings.txnSettings, ...(parsed.txnSettings || {}) },
    generalSettings: { ...defaultSettings.generalSettings, ...(parsed.generalSettings || {}) },
    messageSettings: { ...defaultSettings.messageSettings, ...(parsed.messageSettings || {}) },
    itemSettings: { ...defaultSettings.itemSettings, ...(parsed.itemSettings || {}) },
    partySettings: { ...defaultSettings.partySettings, ...(parsed.partySettings || {}) },
    printSettings: { ...defaultSettings.printSettings, ...(parsed.printSettings || {}) },
  };
}

function read() {
  if (cachedSettings) return cachedSettings;
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    cachedSettings = mergeWithDefault(JSON.parse(raw));
    return cachedSettings;
  } catch {
    return defaultSettings;
  }
}

async function fetchFromDB() {
  try {
    const res = await api.get("/settings");
    if (res.data) {
      const merged = mergeWithDefault(res.data);
      cachedSettings = merged;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, JSON.stringify(merged));
      }
      listeners.forEach((l) => l());
      return merged;
    }
  } catch (err) {
    console.warn("Could not sync settings from DB, using fallback:", err?.message);
  }
  return read();
}

async function saveToDB(settingsObj) {
  try {
    await api.put("/settings", settingsObj);
  } catch (err) {
    console.warn("Failed to persist settings to DB:", err?.message);
  }
}

export const platformSettings = {
  get() {
    return read();
  },
  fetchFromDB,
  save(settings) {
    const merged = mergeWithDefault(settings);
    cachedSettings = merged;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(merged));
    }
    listeners.forEach((l) => l());
    saveToDB(merged);
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
    cachedSettings = updated;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(updated));
    }
    listeners.forEach((l) => l());
    saveToDB(updates);
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState(() => read());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Initial fetch from MongoDB Database
    fetchFromDB().then((dbData) => {
      if (isMounted && dbData) {
        setSettings(dbData);
        setHydrated(true);
      }
    });

    const unsub = platformSettings.subscribe(() => {
      if (isMounted) setSettings(read());
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  return { settings, hydrated };
}
