import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileDown, Share2, Eye, ArrowLeft, MoreVertical, Store, User, FileText, ShoppingBag, Landmark, Info } from "lucide-react";
import { toast } from "sonner";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { usePlatformSettings } from "@/lib/platform-settings";
import api from "@/lib/api";

const fmt = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MOCK_PRODUCTS = [
  { name: "Basmati Rice 5kg", sku: "RCE-005", cat: "Grocery", price: 480, hsnSac: "1006" },
  { name: "Sunflower Oil 1L", sku: "OIL-001", cat: "Grocery", price: 180, hsnSac: "1512" },
  { name: "Toor Dal 1kg", sku: "DAL-001", cat: "Grocery", price: 150, hsnSac: "0713" },
  { name: "Tata Salt 1kg", sku: "SLT-001", cat: "Grocery", price: 25, hsnSac: "2501" },
  { name: "Atta 10kg", sku: "ATA-010", cat: "Grocery", price: 500, hsnSac: "1101" },
  { name: "Britannia Bread", sku: "BRD-001", cat: "Bakery", price: 45, hsnSac: "1905" },
  { name: "Amul Butter 500g", sku: "BTR-500", cat: "Dairy", price: 290, hsnSac: "0405" },
  { name: "Kissan Jam 700g", sku: "JAM-700", cat: "Packaged", price: 220, hsnSac: "2007" },
];

const MOCK_PARTIES = [
  { name: "Anil Sweets", phone: "9876543210", address: "Okhla, New Delhi", email: "anil@sweets.com", gstin: "07AAAAA1234A1Z1" },
  { name: "Patel Stores", phone: "9876543211", address: "MG Road, Pune", email: "patel@stores.com", gstin: "07BBBBB1234B1Z2" },
  { name: "Sharma Kirana", phone: "9876543212", address: "Sector 15, Noida", email: "sharma@kirana.com", gstin: "07CCCCC1234C1Z3" },
  { name: "Green Mart", phone: "9876543213", address: "Gachibowli, Hyderabad", email: "green@mart.com", gstin: "07DDDDD1234D1Z4" },
  { name: "FreshFarm Supplies", phone: "9876543214", address: "Karnal, Haryana", email: "fresh@farm.com", gstin: "07EEEEE1234E1Z5" },
];

export function NewInvoiceDialog({
  open, onOpenChange, onAdd,
}) {
  const { settings } = usePlatformSettings();
  const { gstSettings, txnSettings, generalSettings, itemSettings, partySettings } = settings;

  const isLite = txnSettings?.billingType === "Lite";
  const showBankAndTerms = !isLite && (txnSettings?.bankDetails || txnSettings?.termsAndConditions);
  const [activeTab, setActiveTab] = useState("party");
  
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdModal, setShowAdModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('pendingDialogInvoice');
    if (saved && open) {
      try {
        const data = JSON.parse(saved);
        setPendingSave(data);
        const isResume = sessionStorage.getItem('resumeInvoiceFlow') === 'true';
        if (isResume) {
          sessionStorage.removeItem('resumeInvoiceFlow');
          setTimeout(() => continueFlow(null, data, true), 300);
        }
      } catch(e) {}
      sessionStorage.removeItem('pendingDialogInvoice');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveTab(isLite ? "party" : "business");
    }
  }, [open, isLite]);

  // Backend Lists
  const [partiesList, setPartiesList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  useEffect(() => {
    const fetchPartiesAndItems = async () => {
      try {
        const [partiesRes, itemsRes] = await Promise.all([
          api.get("/parties"),
          api.get("/items")
        ]);
        setPartiesList(partiesRes.data || []);
        setItemsList(itemsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch parties/items from backend:", err);
      }
    };
    if (open) {
      fetchPartiesAndItems();
    }
  }, [open]);

  // Normalize backend lists with fallback to mock data
  const partiesToShow = useMemo(() => {
    if (partiesList && partiesList.length > 0) {
      return partiesList.map(p => ({
        _id: p._id,
        name: p.name,
        phone: p.phone || "",
        address: p.address || "",
        email: p.email || "",
        gstin: p.gstin || "",
      }));
    }
    return MOCK_PARTIES;
  }, [partiesList]);

  const productsToShow = useMemo(() => {
    if (itemsList && itemsList.length > 0) {
      return itemsList.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.salePrice || 0,
        hsnSac: item.hsnSac || "",
        gst: item.taxRate || 0,
        unit: item.unit || "PCS"
      }));
    }
    return MOCK_PRODUCTS;
  }, [itemsList]);

  // Business Details
  const [businessName, setBusinessName] = useState("KESHAV TRAVELS");
  const [businessAddress, setBusinessAddress] = useState("S-99/134 first floor moti lal nehru camp JNU, New Delhi , Delhi, 110067");
  const [businessPhone, setBusinessPhone] = useState("+919718403525");
  const [businessEmail, setBusinessEmail] = useState("dpakk1989@gmail.com");
  const [businessGstin, setBusinessGstin] = useState("07AQXPD2556K2ZB");
  const [businessPan, setBusinessPan] = useState("AQXPD2556K");

  // Party Details
  const [party, setParty] = useState("Subhash Chand nbcc");
  const [phone, setPhone] = useState("01145661608336");
  const [partyAddress, setPartyAddress] = useState("Ground floor okhla phase-1 South east Delhi, Delhi, 110020");
  const [partyEmail, setPartyEmail] = useState("subhash.chand.nbcc.@nic.in");
  const [partyGstin, setPartyGstin] = useState("07AAECN7829F1ZA");
  const [partyState, setPartyState] = useState("Delhi");
  const [partyStateCode, setPartyStateCode] = useState("07");

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState("85");
  const [invoiceDate, setInvoiceDate] = useState("30/09/2024");
  const [invoiceTime, setInvoiceTime] = useState("12:00 PM");
  const [reverseCharge, setReverseCharge] = useState("yes");
  const [challanNo, setChallanNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("DL2CAZ6541");
  const [dateOfSupply, setDateOfSupply] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  // Items List
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [lines, setLines] = useState([
    {
      name: "Monthly taxi bill for the month of 01/09/2024 to 30/09/2024",
      hsnSac: "996601",
      qty: 1,
      freeQty: 0,
      unit: "1",
      rate: 46250,
      gst: 5,
      discount: 0,
    },
  ]);

  // Bank & Terms
  const [bankAccountHolder, setBankAccountHolder] = useState("Keshav travels");
  const [bankAccountNumber, setBankAccountNumber] = useState("921020024898267");
  const [bankIfsc, setBankIfsc] = useState("UTIB0003532");
  const [bankName, setBankName] = useState("Axis Bank");
  const [bankBranch, setBankBranch] = useState("R K PURAM");
  const [terms, setTerms] = useState(
    "1. We are responsible for the loss of singed ,Duty slip, please check\n2. Interest@24% will be charged if bill not paid within 15 days of bill date\n3. All Dispute are subject to delhi jurisdictions"
  );

  // Flat Transaction-wise Discount
  const [flatDiscountPercent, setFlatDiscountPercent] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);

  // Reset/Set defaults when settings are loaded
  useEffect(() => {
    if (txnSettings?.prefixes?.sale) {
      setInvoiceNumber(txnSettings.prefixes.sale + "85");
    } else {
      setInvoiceNumber("85");
    }
  }, [txnSettings]);

  // Apply default cash sale if enabled
  useEffect(() => {
    if (open && txnSettings?.cashSaleDefault) {
      setParty("Cash Sale");
      setPhone("9999999999");
      setPartyAddress("Counter Sale");
      setPartyEmail("");
      setPartyGstin("");
    }
  }, [open, txnSettings]);

  const totals = useMemo(() => {
    let subtotal = 0; // Sum of taxable values
    let tax = 0;      // Sum of tax amounts
    let grand = 0;    // Sum of line totals
    
    lines.forEach((l) => {
      const q = Number(l.qty) || 0;
      const r = Number(l.rate) || 0;
      const g = itemSettings?.itemWiseTax ? (Number(l.gst) || 0) : 0;
      const d = itemSettings?.itemWiseDiscount ? (Number(l.discount) || 0) : 0;
      
      const rateAfterDisc = r * (1 - d / 100);
      
      let lineTotal = 0;
      let taxableVal = 0;
      let taxVal = 0;
      
      if (taxInclusive) {
        lineTotal = q * rateAfterDisc;
        taxableVal = lineTotal / (1 + g / 100);
        taxVal = lineTotal - taxableVal;
      } else {
        taxableVal = q * rateAfterDisc;
        taxVal = taxableVal * (g / 100);
        lineTotal = taxableVal + taxVal;
      }
      
      subtotal += taxableVal;
      tax += taxVal;
      grand += lineTotal;
    });

    let originalGrand = grand;

    // Apply transaction-wise discount
    if (txnSettings?.txnWiseDiscount && flatDiscountPercent > 0) {
      const discountAmount = grand * (flatDiscountPercent / 100);
      grand = grand - discountAmount;
    }

    // Apply Round Off
    const roundedGrand = txnSettings?.roundOff
      ? Math.round(grand / txnSettings.roundNearest) * txnSettings.roundNearest
      : grand;
    
    return { subtotal, tax, grand: roundedGrand, originalGrand };
  }, [lines, taxInclusive, flatDiscountPercent, itemSettings, txnSettings]);

  const update = (i, patch) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const addLine = () =>
    setLines((ls) => [...ls, { name: "", hsnSac: "", qty: 1, freeQty: 0, unit: "1", rate: 0, gst: 18, discount: 0 }]);

  const removeLine = (i) =>
    setLines((ls) => ls.filter((_, idx) => idx !== i));

  const buildData = () => ({
    number: invoiceNumber,
    date: invoiceDate + (txnSettings?.addTime ? ` ${invoiceTime}` : ""),
    business: {
      name: businessName,
      address: businessAddress,
      phone: businessPhone,
      email: businessEmail,
      gstin: businessGstin,
      pan: businessPan,
    },
    party: {
      name: party,
      phone: phone,
      address: partyAddress,
      email: partyEmail,
      gstin: partyGstin,
      state: partyState,
      stateCode: partyStateCode,
    },
    reverseCharge: reverseCharge,
    challanNo: challanNo,
    vehicleNo: vehicleNo,
    dateOfSupply: dateOfSupply,
    placeOfSupply: placeOfSupply,
    taxInclusive: taxInclusive,
    lines: lines.map(l => ({
      ...l,
      gst: itemSettings?.itemWiseTax ? l.gst : 0,
      discount: itemSettings?.itemWiseDiscount ? l.discount : 0,
    })).filter((l) => l.name.trim() && l.qty > 0),
    bank: {
      accountHolder: bankAccountHolder,
      accountNumber: bankAccountNumber,
      ifsc: bankIfsc,
      name: bankName,
      branch: bankBranch,
    },
    terms: terms,
    flatDiscountPercent: txnSettings?.txnWiseDiscount ? flatDiscountPercent : 0,
    roundOffDifference: totals.grand - totals.originalGrand,
    grandTotal: totals.grand,
  });

  const onSave = async () => {
    if (!invoiceNumber.trim()) return toast.error("Invoice number is required");
    if (!party.trim()) return toast.error("Please enter party name");
    if (!lines.some((l) => l.name.trim() && l.qty > 0)) return toast.error("Add at least one item");

    let parsedDate = new Date();
    if (invoiceDate) {
      if (invoiceDate.includes('/')) {
        const parts = invoiceDate.split('/');
        if (parts.length === 3) {
          parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        parsedDate = new Date(invoiceDate);
      }
    }

    const payload = {
      invoiceNumber: invoiceNumber,
      party: selectedPartyId || null,
      partyName: party || "Walk-in Customer",
      billingName: party || "Walk-in Customer",
      type: "Sale",
      date: parsedDate,
      items: lines.filter(l => l.name.trim() && l.qty > 0).map(l => ({
        item: l.item || null,
        name: l.name,
        hsnSac: l.hsnSac || "",
        qty: Number(l.qty) || 1,
        rate: Number(l.rate) || 0,
        discount: Number(l.discount) || 0,
        gst: Number(l.gst) || 0
      })),
      subtotal: totals.subtotal,
      discountAmount: totals.originalGrand * (flatDiscountPercent / 100),
      taxableAmount: totals.subtotal,
      gstAmount: totals.tax,
      roundOff: totals.grand - totals.originalGrand,
      grandTotal: totals.grand,
      invoiceTemplate: "GST Boxed",
      themeColor: "slate",
      status: receivedAmount >= totals.grand ? "Paid" : (receivedAmount > 0 ? "Partial" : "Unpaid"),
      receivedAmount: receivedAmount,
      billedToAddress: partyAddress || "",
      billedToGstin: partyGstin || "",
      billedToMobile: phone || "",
      billedToState: partyState || "Delhi",
      sellerDetails: {
        companyName: businessName || "",
        address: businessAddress || "",
        phone: businessPhone || "",
        email: businessEmail || "",
        gstin: businessGstin || "",
        logoUrl: settings?.printSettings?.logoUrl || "",
      },
      logoUrl: settings?.printSettings?.logoUrl || "",
      bankDetails: {
        accountHolder: bankAccountHolder || "",
        accountNumber: bankAccountNumber || "",
        ifsc: bankIfsc || "",
        bankName: bankName || "",
        branchName: bankBranch || "",
      },
      transportDetails: {
        vehicleNumber: vehicleNo || "",
        lrNumber: challanNo || "",
      },
      terms: terms || "",
    };

    setPendingSave(payload);

    try {
      const { data: user } = await api.get('/auth/me');
      
      if (user.showAds) {
        setShowAdModal(true);
        return; // wait for ad to finish
      }
      
      continueFlow(user, payload);
    } catch (err) {
      toast.error("Failed to check user settings.");
    }
  };

  const continueFlow = async (user = null, payloadObj = null, forceResume = false) => {
    const payload = payloadObj || pendingSave;
    if (!user) {
      try {
        const res = await api.get('/auth/me');
        user = res.data;
      } catch (e) {
        toast.error("Failed to check user settings.");
        return;
      }
    }

    if (user.billsGenerated === 0 && !forceResume) {
      sessionStorage.setItem('pendingDialogInvoice', JSON.stringify(payload));
      navigate('/register', { state: { returnUrl: location.pathname } });
      return;
    }

    if (user.billLimit !== -1 && user.billsGenerated >= user.billLimit) {
      setShowSubModal(true);
      return;
    }

    executeSave(payload);
  };

  const executeSave = async (payloadObj = null) => {
    const payload = payloadObj || pendingSave;
    if (!payload) return;

    try {
      await api.post("/invoices", payload);
      toast.success("Invoice created successfully!");
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      if (err.response?.data?.message === 'LIMIT_REACHED') {
        setShowSubModal(true);
      } else {
        toast.error(err.response?.data?.message || "Failed to save invoice");
      }
    } finally {
      setPendingSave(null);
    }
  };

  const onDownload = () => {
    if (!party.trim()) return toast.error("Please enter party name");
    const data = buildData();
    if (!data.lines.length) return toast.error("Add at least one item");
    downloadInvoicePdf(data);
    toast.success("Invoice PDF downloaded");
  };

  const onPreview = () => {
    if (!party.trim()) return toast.error("Please enter party name");
    const data = buildData();
    if (!data.lines.length) return toast.error("Add at least one item");
    downloadInvoicePdf(data, { preview: true });
    toast.success("Opening invoice preview...");
  };

  const onWhatsApp = () => {
    if (!phone || phone.length < 10) return toast.error("Enter party phone");
    const msg = encodeURIComponent(
      `Hi ${party}, your invoice from ${businessName} for ${fmt(totals.grand)} is ready.`,
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
    toast.success("Opening WhatsApp…");
  };

  if (!gstSettings || !txnSettings) return null;

  // Compute tabs dynamic grids
  let activeTabCount = 3; // Buyer, Invoice, Items are always there
  if (!isLite) activeTabCount++; // Seller Info
  if (showBankAndTerms) activeTabCount++; // Bank & Terms

  const gridColsClass = 
    activeTabCount === 3 ? "grid-cols-3" :
    activeTabCount === 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-screen !max-w-[100vw] h-[100dvh] !rounded-none !m-0 sm:!w-full sm:!max-w-5xl sm:h-auto sm:!rounded-xl sm:!m-auto p-0 sm:p-6 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] sm:bg-background border-none flex flex-col gap-0">
        
        {/* Mobile Custom App Bar */}
        <div className="flex sm:hidden items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-30 shadow-sm shrink-0">
          <button onClick={() => onOpenChange(false)} className="p-2 -ml-2 text-blue-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-blue-700">Create New Invoice</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2 text-gray-700 outline-none">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:hidden">
              <DropdownMenuItem onClick={onWhatsApp} className="flex items-center gap-2 cursor-pointer py-2">
                <Share2 className="h-4 w-4 text-green-600" />
                <span>WhatsApp</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview} className="flex items-center gap-2 cursor-pointer py-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload} className="flex items-center gap-2 cursor-pointer py-2">
                <FileDown className="h-4 w-4 text-gray-600" />
                <span>PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSave} className="flex items-center gap-2 cursor-pointer py-2 text-green-700 font-medium focus:text-green-700">
                <FileDown className="h-4 w-4" />
                <span>Save Invoice</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Header */}
        <DialogHeader className="hidden sm:block pr-8 sm:pr-0 pt-4 sm:pt-0 px-4 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl leading-tight">Create New Invoice ({txnSettings.billingType} Mode)</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enter invoice details across the tabs. Auto-calculates tax breakdown. Share via WhatsApp or download.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 sm:p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-4 max-w-full px-4 sm:px-0 mt-4 sm:mt-0">
          <TabsList className="flex overflow-x-auto w-full bg-transparent justify-start gap-2 h-auto py-2 scrollbar-none border-b sm:border-none">
            {!isLite && (
              <TabsTrigger value="business" className="rounded-full text-sm font-semibold px-4 py-2 shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 border data-[state=active]:border-blue-600">
                <Store className="mr-2 h-4 w-4" /> Seller Info
              </TabsTrigger>
            )}
            <TabsTrigger value="party" className="rounded-full text-sm font-semibold px-4 py-2 shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 border data-[state=active]:border-blue-600">
                <User className="mr-2 h-4 w-4" /> Buyer Info
            </TabsTrigger>
            <TabsTrigger value="invoice" className="rounded-full text-sm font-semibold px-4 py-2 shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 border data-[state=active]:border-blue-600">
                <FileText className="mr-2 h-4 w-4" /> Invoice Info
            </TabsTrigger>
            <TabsTrigger value="items" className="rounded-full text-sm font-semibold px-4 py-2 shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 border data-[state=active]:border-blue-600">
                <ShoppingBag className="mr-2 h-4 w-4" /> Items & Taxes
            </TabsTrigger>
            {showBankAndTerms && (
              <TabsTrigger value="bank" className="rounded-full text-sm font-semibold px-4 py-2 shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 border data-[state=active]:border-blue-600">
                <Landmark className="mr-2 h-4 w-4" /> Bank & Terms
              </TabsTrigger>
            )}
          </TabsList>

          {/* Seller / Business Details */}
          {!isLite && (
            <TabsContent value="business" className="space-y-4 pt-1">
              <div className="bg-white sm:bg-transparent rounded-2xl border sm:border-none p-5 sm:p-0">
                <div className="flex items-center gap-3 mb-5">
                  <Store className="h-6 w-6 text-blue-700" />
                  <h3 className="text-lg font-bold text-gray-900">Business Identity</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="biz-name">Company Name</Label>
                  <Input id="biz-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                {partySettings.phone && (
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="biz-phone">Company Phone</Label>
                    <Input id="biz-phone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                )}
                {partySettings.email && (
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="biz-email">Company Email</Label>
                    <Input id="biz-email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                )}
                {generalSettings.gstinNumber && (
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="biz-gst">GSTIN</Label>
                    <Input id="biz-gst" value={businessGstin} onChange={(e) => setBusinessGstin(e.target.value.toUpperCase())} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                )}
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="biz-pan">PAN No.</Label>
                  <Input id="biz-pan" value={businessPan} onChange={(e) => setBusinessPan(e.target.value.toUpperCase())} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              </div>
              {partySettings.address && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="biz-addr">Company Address</Label>
                  <Textarea id="biz-addr" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="min-h-[60px] rounded-xl text-sm" />
                </div>
              )}
              </div>
              <div className="mt-5 p-4 bg-blue-50 text-blue-800 rounded-xl flex gap-3 text-xs sm:text-sm border border-blue-100">
                <Info className="h-5 w-5 shrink-0" />
                <p>Ensure your GSTIN and PAN match your legal registration to avoid compliance issues during tax filing.</p>
              </div>
              <div className="flex justify-end pt-5">
                <Button type="button" onClick={() => setActiveTab("party")} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                  Continue to Buyer Info →
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Buyer / Party Details */}
          <TabsContent value="party" className="space-y-4 pt-1">
            <div className="bg-white sm:bg-transparent rounded-2xl border sm:border-none p-5 sm:p-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-full text-blue-700"><User className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Buyer Details</h3>
                  <p className="text-xs text-gray-500">Step 2 of 4: Billing Information</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="party-name">Billed To (Party Name)</Label>
                {generalSettings.blockNewParties ? (
                  <Select
                    value={party}
                    onValueChange={(val) => {
                      const p = partiesToShow.find(x => x.name === val);
                      setParty(val);
                      if (p) {
                        setSelectedPartyId(p._id || null);
                        setPhone(p.phone);
                        setPartyAddress(p.address);
                        setPartyEmail(p.email);
                        setPartyGstin(p.gstin);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white"><SelectValue placeholder="Select Party" /></SelectTrigger>
                    <SelectContent>
                      {partiesToShow.map(p => (
                        <SelectItem key={p.name || p._id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="party-name"
                    value={party}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParty(val);
                      const matchingParty = partiesToShow.find(p => p.name.toLowerCase() === val.toLowerCase());
                      if (matchingParty) {
                        setSelectedPartyId(matchingParty._id || null);
                        setPhone(matchingParty.phone);
                        setPartyAddress(matchingParty.address);
                        setPartyEmail(matchingParty.email);
                        setPartyGstin(matchingParty.gstin);
                      } else {
                        setSelectedPartyId(null);
                      }
                    }}
                    className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                )}
              </div>
              {partySettings.phone && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="party-phone">Party Mobile</Label>
                  <Input id="party-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {partySettings.email && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="party-email">Party Email</Label>
                  <Input id="party-email" value={partyEmail} onChange={(e) => setPartyEmail(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {partySettings.gstin && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="party-gst">Party GSTIN</Label>
                  <Input id="party-gst" value={partyGstin} onChange={(e) => setPartyGstin(e.target.value.toUpperCase())} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="party-state">Party State</Label>
                <Input id="party-state" value={partyState} onChange={(e) => setPartyState(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="party-state-code">State Code</Label>
                <Input id="party-state-code" value={partyStateCode} onChange={(e) => setPartyStateCode(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
              </div>
            </div>
            {partySettings.address && (
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="party-addr">Billing Address</Label>
                <Textarea id="party-addr" value={partyAddress} onChange={(e) => setPartyAddress(e.target.value)} className="min-h-[60px] rounded-xl text-sm" />
              </div>
            )}
            </div>
            <div className="flex justify-end pt-5">
              <Button type="button" onClick={() => setActiveTab("invoice")} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                Continue to Invoice Info →
              </Button>
            </div>
          </TabsContent>

          {/* Invoice / Shipping / Transport Info */}
          <TabsContent value="invoice" className="space-y-4 pt-1">
            <div className="bg-white sm:bg-transparent rounded-2xl border sm:border-none p-5 sm:p-0">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                <p className="text-sm text-gray-500">Provide the legal and chronological details for this document.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {txnSettings.billNo && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-no">Invoice No.</Label>
                  <Input id="inv-no" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="inv-date">Invoice Date</Label>
                <Input id="inv-date" placeholder="e.g. 30/09/2024" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
              </div>
              {txnSettings.addTime && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-time">Invoice Time</Label>
                  <Input id="inv-time" type="time" value={invoiceTime} onChange={(e) => setInvoiceTime(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {gstSettings.reverseCharge && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-rev-charge">Reverse Charge</Label>
                  <Select value={reverseCharge} onValueChange={setReverseCharge}>
                    <SelectTrigger className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {txnSettings.challanNo && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-challan">Challan No.</Label>
                  <Input id="inv-challan" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {txnSettings.vehicleNo && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-veh">Vehicle No.</Label>
                  <Input id="inv-veh" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {txnSettings.dateOfSupply && (
                <div className="space-y-1.5">
                  <Label htmlFor="inv-supply-date" className="text-xs font-semibold text-slate-700">Date of Supply</Label>
                  <Input type="date" id="inv-supply-date" value={dateOfSupply} onChange={(e) => setDateOfSupply(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              {gstSettings.placeOfSupply && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="inv-place">Place of Supply</Label>
                  <Input id="inv-place" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              )}
              <div className="space-y-1 sm:space-y-1.5">
                <Label htmlFor="inv-received">Received Amount (₹)</Label>
                <Input id="inv-received" type="number" min={0} value={receivedAmount === 0 ? "" : receivedAmount} onChange={(e) => setReceivedAmount(e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" onFocus={(e) => e.target.select()} />
              </div>
            </div>
            </div>
            <div className="flex justify-end pt-5">
              <Button type="button" onClick={() => setActiveTab("items")} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                Continue to Items & Taxes →
              </Button>
            </div>
          </TabsContent>

          {/* Items & Taxes Table */}
          <TabsContent value="items" className="space-y-4 pt-1">
            <div className="bg-white sm:bg-transparent rounded-2xl border sm:border-none p-5 sm:p-0">
            {txnSettings.taxOnRate && (
              <div className="flex items-center gap-2">
                <Checkbox id="tax-inclusive" checked={taxInclusive} onCheckedChange={(c) => setTaxInclusive(!!c)} />
                <Label htmlFor="tax-inclusive" className="cursor-pointer text-sm font-medium">Tax Inclusive Rates (Prices include GST)</Label>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-semibold">Items List</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLine} className="rounded-lg">
                <Plus className="mr-1 h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lines.map((l, i) => {
                const lineQty = Number(l.qty) || 0;
                const lineRate = Number(l.rate) || 0;
                const lineGst = itemSettings?.itemWiseTax ? (Number(l.gst) || 0) : 0;
                const lineDisc = itemSettings?.itemWiseDiscount ? (Number(l.discount) || 0) : 0;

                const priceAfterDisc = lineRate * (1 - lineDisc / 100);

                let displayTotal = 0;
                if (taxInclusive) {
                  displayTotal = lineQty * priceAfterDisc;
                } else {
                  displayTotal = lineQty * priceAfterDisc * (1 + lineGst / 100);
                }

                // Count layout options based on active columns
                const hasHsn = gstSettings.enableHsn;
                const hasUnit = itemSettings?.itemsUnit;
                const hasFree = txnSettings.freeQty;
                const hasDisc = itemSettings?.itemWiseDiscount;
                const hasTax = itemSettings?.itemWiseTax;

                return (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Product Selection */}
                      <div className="col-span-12 md:col-span-4">
                        <Label className="text-[11px] text-muted-foreground">Product Name</Label>
                        {generalSettings.blockNewItems ? (
                          <Select
                            value={l.name}
                            onValueChange={(val) => {
                              const prod = productsToShow.find(p => p.name === val);
                              update(i, {
                                name: val,
                                item: prod?._id || null,
                                hsnSac: prod?.hsnSac || "",
                                rate: prod?.price || 0,
                                gst: prod?.gst || 0,
                                unit: prod?.unit || "PCS"
                              });
                            }}
                          >
                            <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Select Product" /></SelectTrigger>
                            <SelectContent>
                              {productsToShow.map(p => (
                                <SelectItem key={p.name || p._id} value={p.name}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={l.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const prod = productsToShow.find(p => p.name.toLowerCase() === val.toLowerCase());
                              update(i, {
                                name: val,
                                item: prod?._id || null,
                                hsnSac: prod?.hsnSac || l.hsnSac || "",
                                rate: prod?.price || l.rate || 0,
                                gst: prod?.gst || l.gst || 0,
                                unit: prod?.unit || l.unit || "PCS"
                              });
                            }}
                            placeholder="Item description"
                            className="h-9 rounded-lg"
                          />
                        )}
                      </div>

                      {/* HSN Code */}
                      {hasHsn && (
                        <div className="col-span-6 md:col-span-1">
                          <Label className="text-[11px] text-muted-foreground">HSN/SAC</Label>
                          <Input value={l.hsnSac || ""} onChange={(e) => update(i, { hsnSac: e.target.value })} placeholder="996601" className="h-9 rounded-lg" />
                        </div>
                      )}

                      {/* Chargeable Quantity */}
                      <div className="col-span-4 md:col-span-1">
                        <Label className="text-[11px] text-muted-foreground">Qty</Label>
                        <Input type="number" min={1} value={l.qty} onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                      </div>

                      {/* Free Quantity */}
                      {hasFree && (
                        <div className="col-span-4 md:col-span-1">
                          <Label className="text-[11px] text-muted-foreground">Free Qty</Label>
                          <Input type="number" min={0} value={l.freeQty || 0} onChange={(e) => update(i, { freeQty: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                        </div>
                      )}

                      {/* Measuring Unit */}
                      {hasUnit && (
                        <div className="col-span-4 md:col-span-1">
                          <Label className="text-[11px] text-muted-foreground">Unit</Label>
                          <Input value={l.unit || ""} onChange={(e) => update(i, { unit: e.target.value })} placeholder="1" className="h-9 rounded-lg" />
                        </div>
                      )}

                      {/* Rate */}
                      <div className="col-span-6 md:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Rate ({taxInclusive ? "Inc" : "Exc"})</Label>
                        <Input type="number" min={0} value={l.rate} onChange={(e) => update(i, { rate: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                      </div>

                      {/* Item-wise Discount */}
                      {hasDisc && (
                        <div className="col-span-6 md:col-span-1">
                          <Label className="text-[11px] text-muted-foreground">Disc %</Label>
                          <Input type="number" min={0} max={100} value={l.discount || 0} onChange={(e) => update(i, { discount: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                        </div>
                      )}

                      {/* GST Selection */}
                      {hasTax && (
                        <div className="col-span-6 md:col-span-1">
                          <Label className="text-[11px] text-muted-foreground">GST %</Label>
                          <Select value={String(l.gst)} onValueChange={(v) => update(i, { gst: Number(v) })}>
                            <SelectTrigger className="h-9 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gstSettings.taxRates.map((tr) => (
                                <SelectItem key={tr.id} value={String(tr.value)}>{tr.value}%</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Line total indicator and delete button */}
                      <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-3 self-end pb-2">
                        <div className="text-right text-xs font-semibold md:hidden">Line Total:</div>
                        <div className="text-right text-sm font-bold text-gray-900 pr-1">{fmt(displayTotal)}</div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeLine(i)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
            <div className="flex justify-end pt-5">
              {showBankAndTerms ? (
                <Button type="button" onClick={() => setActiveTab("bank")} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                  Continue to Bank & Terms →
                </Button>
              ) : (
                <Button type="button" onClick={onSave} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                  Save Invoice
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Bank Details & Terms */}
          {showBankAndTerms && (
            <TabsContent value="bank" className="space-y-4 pt-1">
              <div className="bg-white sm:bg-transparent rounded-2xl border sm:border-none p-5 sm:p-0">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900">Bank Details & Terms</h3>
              </div>
              {txnSettings.bankDetails && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="bank-holder">Account Holder Name</Label>
                    <Input id="bank-holder" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="bank-acc">Account Number</Label>
                    <Input id="bank-acc" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="bank-ifsc">IFSC Code</Label>
                    <Input id="bank-ifsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label htmlFor="bank-branch">Branch Name</Label>
                    <Input id="bank-branch" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className="h-12 sm:h-10 rounded-xl text-sm bg-gray-50 border-gray-200 focus:bg-white" />
                  </div>
                </div>
              )}
              {txnSettings.termsAndConditions && (
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="terms-cond">Terms & Conditions</Label>
                  <Textarea id="terms-cond" value={terms} onChange={(e) => setTerms(e.target.value)} className="min-h-[80px] rounded-xl text-sm" />
                </div>
              )}
              </div>
              <div className="flex justify-end pt-5">
                <Button type="button" onClick={onSave} className="w-full sm:w-auto h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base">
                  Save Invoice
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
        </div>

        {/* Mobile Fixed Bottom App Bar */}
        <div className="sticky sm:static bottom-0 left-0 right-0 bg-white sm:bg-transparent border-t sm:border-none shadow-[0_-10px_30px_rgba(0,0,0,0.1)] sm:shadow-none z-30 shrink-0">
          
          {/* Live Auto-Calculated Totals Grid */}
          <div className="bg-white sm:bg-secondary/50 sm:border sm:rounded-xl p-3 sm:p-4 text-xs">
            {txnSettings.txnWiseDiscount && (
              <div className="flex justify-end items-center gap-3 mb-3">
                <span className="font-semibold text-gray-700">Invoice Level Discount (%):</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={flatDiscountPercent}
                  onChange={(e) => setFlatDiscountPercent(Number(e.target.value) || 0)}
                  className="w-20 h-8 rounded-lg text-right border-gray-300"
                />
              </div>
            )}

            <div className="grid grid-cols-3 text-center divide-x">
              <div className="px-1">
                <span className="text-gray-500 block mb-1 text-[11px] sm:text-xs">Taxable</span>
                <span className="text-sm font-bold text-gray-900">{fmt(totals.subtotal)}</span>
              </div>
              <div className="px-1">
                <span className="text-gray-500 block mb-1 text-[11px] sm:text-xs">GST</span>
                <span className="text-sm font-bold text-gray-900">
                  {fmt(totals.tax)}
                </span>
              </div>
              <div className="px-1">
                <span className="text-gray-500 block mb-1 text-[11px] sm:text-xs">Grand Total</span>
                <span className="text-sm font-bold text-green-700">
                  {fmt(totals.grand)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="hidden sm:flex sm:flex-row gap-2 p-0 mt-4 w-full bg-transparent">
            <Button variant="ghost" onClick={onWhatsApp} className="flex flex-col h-[60px] w-full rounded-xl hover:bg-gray-200 text-gray-700 px-0">
              <Share2 className="h-5 w-5 mb-1 text-green-600" />
              <span className="text-[10px] leading-tight font-medium">WhatsApp</span>
            </Button>
            <Button variant="ghost" onClick={onPreview} className="flex flex-col h-[60px] w-full rounded-xl hover:bg-gray-200 text-gray-700 px-0">
              <Eye className="h-5 w-5 mb-1" />
              <span className="text-[10px] leading-tight font-medium">Preview</span>
            </Button>
            <Button variant="ghost" onClick={onDownload} className="flex flex-col h-[60px] w-full rounded-xl hover:bg-gray-200 text-gray-700 px-0">
              <FileDown className="h-5 w-5 mb-1" />
              <span className="text-[10px] leading-tight font-medium">PDF</span>
            </Button>
            <Button onClick={onSave} className="flex flex-col h-[60px] w-full rounded-xl bg-[#5cf896] hover:bg-[#43e680] text-black border-none px-0 shadow-sm">
              <FileDown className="h-5 w-5 mb-1" />
              <span className="text-[10px] leading-tight font-bold">Save Invoice</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Advertisement</span>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upgrade Your Business Today!</h3>
              <div className="h-32 w-full bg-emerald-100 rounded-xl mb-4 flex items-center justify-center text-emerald-800/50">
                [ Sponsored Content ]
              </div>
              <p className="text-sm text-gray-600">Get 50% off on premium subscriptions this month.</p>
            </div>
            <div className="p-4 flex justify-end">
              <Button onClick={() => { setShowAdModal(false); continueFlow(); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Skip Ad & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Choose a Plan</h3>
              <p className="text-sm text-gray-500 mb-6">Select a subscription plan to continue generating bills.</p>
              
              <div className="space-y-3">
                <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => { setShowSubModal(false); executeSave(); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-emerald-800">Free Trial</span>
                    <span className="font-bold text-emerald-600">₹0/mo</span>
                  </div>
                  <p className="text-xs text-emerald-600 text-left">Generate up to 10 bills free</p>
                </div>
                <div className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { navigate('/pricing'); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-800">Pro Plan</span>
                    <span className="font-bold text-blue-600">₹499/mo</span>
                  </div>
                  <p className="text-xs text-gray-500 text-left">Unlimited bills + Priority support</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <Button variant="ghost" onClick={() => { setShowSubModal(false); setPendingSave(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
