import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info, ChevronRight } from "lucide-react";
import { ItemTableCustomizationModal } from "./ItemTableCustomizationModal";
import { ChangeTransactionNamesModal } from "./ChangeTransactionNamesModal";
import { ChangeThemeModal } from "./ChangeThemeModal";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";

export function PrintSettingsTab({ settings, updateSettings, isMobile }) {
  const print = settings.printSettings || {};
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const tableCols = print.tableColumns || {};
  const names = print.transactionNames || {};
  const colNames = print.tableColumnNames || {};

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // A4 width in pixels is ~794px at 96 DPI.
        // We calculate available width minus padding (32px).
        const availableWidth = entry.contentRect.width - 32;
        // Calculate the scale needed to fit the width. Cap it at 1 (100%).
        const newScale = Math.min(1, availableWidth / 794);
        setScale(newScale);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleUpdate = (key, value) => {
    updateSettings("printSettings", { [key]: value });
  };

  const renderControl = (key, label, disabled = false) => {
    const checked = print[key];
    const onChange = (val) => handleUpdate(key, val);

    return (
      <div className="flex items-center gap-3 py-1 cursor-pointer group">
        <Checkbox 
          checked={!!checked} 
          onCheckedChange={(c) => onChange(!!c)} 
          disabled={disabled} 
          id={`print-${key}`} 
          className="h-5 w-5 rounded shadow-sm data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300" 
        />
        <Label htmlFor={`print-${key}`} className={`text-[13px] cursor-pointer flex items-center gap-2 ${disabled ? "opacity-40" : ""}`}>
          {label}
          <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Label>
      </div>
    );
  };

  const renderCheckInput = (checkKey, inputKey, label, inputType = "text") => {
    const checked = print[checkKey];
    const value = print[inputKey] || "";

    return (
      <div className="flex flex-col gap-1 py-1.5 group">
        <div className="flex items-center gap-3 cursor-pointer">
          <Checkbox 
            checked={!!checked} 
            onCheckedChange={(c) => handleUpdate(checkKey, !!c)} 
            className="h-5 w-5 rounded shadow-sm data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300" 
            id={`print-${checkKey}`}
          />
          <Label htmlFor={`print-${checkKey}`} className="text-[13px] cursor-pointer">
            {label}
          </Label>
        </div>
        {!!checked && (
          <div className="relative flex-1 max-w-[320px] flex items-center gap-2 pl-8 mt-1.5">
            <div className="relative flex-1">
              <Label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 z-10">{label}</Label>
              <Input 
                type={inputType}
                value={value} 
                onChange={(e) => handleUpdate(inputKey, e.target.value)} 
                className="h-10 text-[13px] bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0" 
              />
            </div>
            <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>
    );
  };

  // Convert "4" string to actual pixel font sizes for preview
  const getHeaderSize = () => {
    const s = print.companyNameTextSize || "Large";
    if (s === "Small") return 16;
    if (s === "Medium") return 20;
    if (s === "Large") return 24;
    if (s === "Extra Large") return 28;
    return 24;
  };

  const getBodySize = () => {
    const s = print.invoiceTextSize || "Medium";
    if (s === "Small") return 10;
    if (s === "Medium") return 12;
    if (s === "Large") return 14;
    if (s === "Extra Large") return 16;
    return 12;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start h-[calc(100vh-10rem)] xl:h-[80vh]">
      {/* Scrollable Settings Panel */}
      <div className="w-full xl:w-[380px] shrink-0 space-y-8 overflow-y-auto h-full pr-4 pb-20 custom-scrollbar">
        
        {/* Header Tabs (Thermal removed) */}
        <div className="flex gap-4 border-b">
          <span className="text-[13px] font-bold text-blue-600 border-b-2 border-blue-600 pb-2 uppercase px-1">Regular Printer</span>
        </div>

        <div className="space-y-3 px-1 pt-2">
            {renderControl("regularPrinterDefault", "Make Regular Printer Default")}
        </div>

        {/* Section: Themes */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-800 bg-slate-100 p-2 text-sm">Themes</h3>
          <div className="space-y-3 px-2">
             <div className="flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded" onClick={() => setIsThemeModalOpen(true)}>
                <Label className="text-[14px] text-slate-800 cursor-pointer">Change Theme and Colors</Label>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                  <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>
             
             {/* Text size, Page size, Orientation are kept in formatting section below to not disturb existing UI layout too much, or they can be moved here. The user requested not to disturb other UI. */}
          </div>
        </div>

        {/* Section 1: Print Company Info / Header */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-800 bg-slate-100 p-2 text-sm">Print Company Info/Header</h3>
          <div className="space-y-3 px-1">
            {renderControl("repeatHeader", "Print repeat header in all pages")}

            {renderCheckInput("printCompanyName", "companyName", "Company Name")}

            <div className="flex items-center gap-4 py-1.5 group">
              <Checkbox 
                checked={!!print.printCompanyLogo} 
                onCheckedChange={(c) => handleUpdate("printCompanyLogo", !!c)} 
                className="h-5 w-5 rounded shadow-sm data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300" 
              />
              <label className="text-[13px] flex items-center gap-2 cursor-pointer">
                Company Logo <span className="text-blue-500 font-normal hover:underline">(Change)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleUpdate("logoUrl", reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </label>
            </div>
            {print.logoUrl && (
              <div className="flex items-center gap-3 pl-8 mb-2">
                <div className="border rounded p-1 bg-white w-16 h-10 flex items-center justify-center">
                  <img src={print.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleUpdate("logoUrl", "")} 
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Remove Logo
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 py-1.5 group">
              <Checkbox 
                checked={!!print.printQrCode} 
                onCheckedChange={(c) => handleUpdate("printQrCode", !!c)} 
                className="h-5 w-5 rounded shadow-sm data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300" 
              />
              <label className="text-[13px] flex items-center gap-2 cursor-pointer">
                UPI / E-Way QR Code <span className="text-blue-500 font-normal hover:underline">(Change)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleUpdate("qrCodeUrl", reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </label>
            </div>
            {print.qrCodeUrl && (
              <div className="flex items-center gap-3 pl-8 mb-2">
                <div className="border rounded p-1 bg-white w-16 h-16 flex items-center justify-center">
                  <img src={print.qrCodeUrl} alt="QR Code" className="max-h-full max-w-full object-contain" />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleUpdate("qrCodeUrl", "")} 
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Remove QR
                </button>
              </div>
            )}

            {renderCheckInput("printAddress", "address", "Address")}
            {renderCheckInput("printEmail", "email", "Email")}
            {renderCheckInput("printPhone", "phone", "Phone Number")}
            {renderCheckInput("printGstin", "gstinOnSale", "GSTIN on Sale")}
          </div>
        </div>

        {/* Formatting Section */}
        <div className="space-y-4 px-1">
          <div className="grid grid-cols-2 gap-4 max-w-[500px]">
            <div className="flex flex-col gap-1 group">
              <Label className="text-[13px] text-slate-600 font-medium">Paper Size</Label>
              <div className="flex items-center gap-2">
                <Select value={print.paperSize || "A4"} onValueChange={(v) => handleUpdate("paperSize", v)}>
                  <SelectTrigger className="w-full h-9 text-[13px] bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                  </SelectContent>
                </Select>
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1 group">
              <Label className="text-[13px] text-slate-600 font-medium">Orientation</Label>
              <div className="flex items-center gap-2">
                <Select value={print.orientation || "Portrait"} onValueChange={(v) => handleUpdate("orientation", v)}>
                  <SelectTrigger className="w-full h-9 text-[13px] bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portrait">Portrait</SelectItem>
                    <SelectItem value="Landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1 group">
              <Label className="text-[13px] text-slate-600 font-medium">Company Name Text Size</Label>
              <div className="flex items-center gap-2">
                <Select value={print.companyNameTextSize || "Large"} onValueChange={(v) => handleUpdate("companyNameTextSize", v)}>
                  <SelectTrigger className="w-full h-9 text-[13px] bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                    <SelectItem value="Extra Large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1 group">
              <Label className="text-[13px] text-slate-600 font-medium">Invoice Text Size</Label>
              <div className="flex items-center gap-2">
                <Select value={print.invoiceTextSize || "Medium"} onValueChange={(v) => handleUpdate("invoiceTextSize", v)}>
                  <SelectTrigger className="w-full h-9 text-[13px] bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                    <SelectItem value="Extra Large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            {renderControl("printOriginalDuplicate", "Print Original/Duplicate")}
          </div>

          <div className="flex items-center gap-4 py-1.5 group">
            <Label className="text-[13px] text-slate-700">Extra space on Top of PDF</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={print.extraSpaceTop || "0"} 
                onChange={(e) => handleUpdate("extraSpaceTop", e.target.value)} 
                className="w-16 h-8 text-[13px] bg-white" 
              />
              <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[13px] text-blue-500 hover:underline cursor-pointer" onClick={() => setIsNameModalOpen(true)}>Change Transaction Names {'>'}</span>
          </div>
        </div>

        {/* Section 2: Item Table */}
        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Item Table</h3>
          <div className="px-1 space-y-4">
            <div className="flex items-center gap-4 py-1.5 group">
              <Label className="text-[13px] text-slate-700">Min No. of Rows in Item Table</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="0" 
                  max="50" 
                  value={print.minRowsItemTable || "0"} 
                  onChange={(e) => handleUpdate("minRowsItemTable", e.target.value)} 
                  className="w-16 h-8 text-[13px] bg-white" 
                />
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div>
              <span className="text-[13px] text-blue-500 hover:underline cursor-pointer" onClick={() => setIsTableModalOpen(true)}>Item Table Customization {'>'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Totals & Taxes */}
        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Totals & Taxes</h3>
          <div className="px-1 space-y-3">
            {renderControl("totalItemQuantity", "Total Item Quantity")}
            {renderControl("amountWithDecimal", "Amount with Decimal e.g. 0.00")}
            {renderControl("receivedAmount", "Received Amount")}
            {renderControl("balanceAmount", "Balance Amount")}
            {renderControl("currentBalanceParty", "Current Balance of Party")}
            {renderControl("taxDetails", "Tax Details")}
            {renderControl("youSaved", "You Saved")}
            {renderControl("printAmountWithGrouping", "Print Amount with Grouping")}
            
            <div className="flex items-center gap-4 py-1.5 group pt-2">
              <Label className="text-[13px] text-slate-700">Amount in Words</Label>
              <div className="flex items-center gap-2">
                <Select value={print.amountInWords || "Indian"} onValueChange={(v) => handleUpdate("amountInWords", v)}>
                  <SelectTrigger className="w-32 h-9 text-[13px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indian">Indian</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
                <Info className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Footer */}
        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Footer</h3>
          <div className="px-1 space-y-3">
            {renderControl("printDescription", "Print Description")}
            {renderControl("printTermsAndConditions", "Print Terms and Conditions")}
            {renderControl("printReceivedByDetails", "Print Received by details")}
            {renderControl("printDeliveredByDetails", "Print Delivered by details")}
            
            {renderControl("printSignatureText", "Print Signature Text")}

            {renderControl("paymentMode", "Payment Mode")}
            {renderControl("printAcknowledgement", "Print Acknowledgement")}
          </div>
        </div>
      </div>

      {/* Sticky Live Preview Panel */}
      <div className="w-full xl:flex-1 h-[500px] xl:h-full block overflow-hidden">
        <div className="sticky top-0 h-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex flex-col shadow-inner">
          <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center items-start custom-scrollbar">
            {/* Wrapper to maintain proper dimensions for the scaled sheet */}
            <div style={{ width: 794 * scale, height: 1123 * scale }} className="shrink-0 flex justify-center relative">
              {/* The Invoice Preview Sheet */}
              <div 
                className="w-[210mm] bg-white shadow-md border absolute top-0 left-0 p-8 text-slate-800 font-sans origin-top-left"
                style={{ 
                  minHeight: "297mm",
                  transform: `scale(${scale})`,
                }}
              >
                <InvoiceTemplateRenderer
                  invoice={{
                    customer: "Classic enterprises",
                    receivedAmount: 0,
                    status: "Unpaid",
                    paymentMethod: "Bank Transfer",
                    paymentDetails: {
                      bankName: "Axis Bank",
                      accountNumber: "921020024898267",
                      ifsc: "UTIB0003532"
                    },
                    lines: [
                      { name: "ITEM 1", hsnSac: "1234", qty: 2, rate: 10, discount: 1, gst: 5 },
                      { name: "ITEM 2", hsnSac: "6325", qty: 1, rate: 30, discount: 0, gst: 18 }
                    ],
                    reverseCharge: "No",
                    challanNo: "CH-8921",
                    vehicleNo: "DL-3C-AA-1122",
                    dateOfSupply: new Date().toISOString(),
                    placeOfSupply: "Delhi",
                    billedToAddress: "Plot No. 1, Shop No. 8, Koramangala, Banglore, 560034",
                    billedToGstin: "29AAECN7829F1ZA",
                    billedToMobile: "8888888888",
                    billedToState: "Karnataka",
                    invoiceNumber: "INV-101",
                    date: new Date().toISOString()
                  }}
                  printSettings={print}
                  templateName={print.themeName || print.invoiceTemplate || "GST Boxed"}
                  themeColor={print.themeColor || print.activeColor || "#a855f7"}
                  activeColor={print.themeColor || print.activeColor || "#a855f7"}
                  numberToWords={(val) => "Forty Five Rupees and Eighty Paisa only"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ItemTableCustomizationModal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} settings={settings} updateSettings={updateSettings} />
      <ChangeTransactionNamesModal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)} settings={settings} updateSettings={updateSettings} />
      <ChangeThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} settings={settings} updateSettings={updateSettings} />
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
