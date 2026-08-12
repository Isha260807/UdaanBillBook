import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, LayoutTemplate, Palette, Sparkles, FileText, Truck } from "lucide-react";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";
import { TEMPLATES } from "@/components/invoice-templates/registry";
import { toast } from "sonner";

const INVOICE_DESCRIPTIONS = {
  "Standard (Boxed)": "Standard boxed GST accounting layout with grid borders",
  "GST Boxed": "Standard boxed GST accounting layout with grid borders",
  "Classic": "Clean & traditional bill design for standard retail",
  "Classic White": "Clean & traditional bill design for standard retail",
  "Modern": "Sleek modern layout with header color accent",
  "Modern Blue": "Sleek modern layout with header color accent",
  "Minimal": "Simple, elegant & minimal typography layout",
  "Minimalist": "Simple, elegant & minimal typography layout",
  "Professional": "Premium executive corporate invoice design",
  "Business Plus": "Detailed corporate business invoice format",
  "Corporate Pro": "Executive corporate enterprise template",
  "Standard Plus": "Sleek compact header bill template with bottom total box",
  "Premium Pro": "Tax Invoice with Acknowledgement slip & signature block",
  "Vyapar Red": "Sleek compact header bill template with bottom total box",
  "Vyapar Purple": "Tax Invoice with Acknowledgement slip & signature block"
};

const EWAY_DESCRIPTIONS = {
  "Official E-Way": "Government official standard E-Way Bill layout",
  "Official Yellow E-Way": "Standard yellow-green official e-Way Bill template",
  "Green E-Way": "Eco-green styled clean E-Way Bill format",
  "Minimal E-Way": "Compact minimalist E-Way Bill summary"
};

const COLOR_OPTIONS = [
  { hex: "#0ea5e9", name: "Ocean Blue" },
  { hex: "#a855f7", name: "Royal Purple" },
  { hex: "#10b981", name: "Emerald Green" },
  { hex: "#ef4444", name: "Crimson Red" },
  { hex: "#f59e0b", name: "Warm Amber" },
  { hex: "#64748b", name: "Slate Gray" },
  { hex: "#1e293b", name: "Dark Charcoal" },
  { hex: "#8b5cf6", name: "Indigo Violet" },
  { hex: "#ec4899", name: "Rose Pink" },
  { hex: "#059669", name: "Forest Green" }
];

const DEFAULT_TEMPLATE_COLORS = {
  "Standard (Boxed)": "#1e293b",
  "Classic": "#0ea5e9",
  "Modern": "#4f46e5",
  "Minimal": "#64748b",
  "Professional": "#10b981",
  "Business Plus": "#a855f7",
  "Corporate Pro": "#1e293b",
  "Standard Plus": "#8d2b2b",
  "Premium Pro": "#4a3556",
  "Vyapar Red": "#8d2b2b",
  "Vyapar Purple": "#4a3556",
  "Official E-Way": "#059669",
  "Official Yellow E-Way": "#e3ec9c",
  "Green E-Way": "#10b981",
  "Minimal E-Way": "#64748b"
};

export function ChangeThemeModal({ isOpen, onClose, settings, updateSettings }) {
  const currentTheme = settings?.printSettings?.themeName || settings?.printSettings?.invoiceTemplate || "Standard (Boxed)";
  const savedTemplateColors = settings?.printSettings?.templateColors || {};
  const currentColor = savedTemplateColors[currentTheme] || settings?.printSettings?.themeColor || settings?.printSettings?.activeColor || DEFAULT_TEMPLATE_COLORS[currentTheme] || "#0ea5e9";

  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [templateColors, setTemplateColors] = useState(savedTemplateColors);
  const [activeTab, setActiveTab] = useState("INVOICE");

  useEffect(() => {
    if (isOpen) {
      let theme = settings?.printSettings?.themeName || settings?.printSettings?.invoiceTemplate || "Standard (Boxed)";
      if (theme === "Vyapar Red") theme = "Standard Plus";
      if (theme === "Vyapar Purple") theme = "Premium Pro";
      const colorsMap = settings?.printSettings?.templateColors || {};
      const color = colorsMap[theme] || settings?.printSettings?.themeColor || settings?.printSettings?.activeColor || DEFAULT_TEMPLATE_COLORS[theme] || "#0ea5e9";
      
      setSelectedTheme(theme);
      setSelectedColor(color);
      setTemplateColors(colorsMap);

      if (Object.keys(TEMPLATES.EWAY || {}).includes(theme)) {
        setActiveTab("EWAY");
      } else {
        setActiveTab("INVOICE");
      }
    }
  }, [isOpen, settings]);

  const invoiceTemplateKeys = Object.keys(TEMPLATES.INVOICE || {}).filter(k => !["GST Boxed", "Classic White", "Modern Blue", "Minimalist", "Custom HTML", "Vyapar Red", "Vyapar Purple"].includes(k));
  const ewayTemplateKeys = Object.keys(TEMPLATES.EWAY || {});

  const handleSelectTemplate = (tmplKey) => {
    setSelectedTheme(tmplKey);
    const colorForTmpl = templateColors[tmplKey] || DEFAULT_TEMPLATE_COLORS[tmplKey] || "#0ea5e9";
    setSelectedColor(colorForTmpl);
  };

  const handleSelectColor = (hex) => {
    setSelectedColor(hex);
    setTemplateColors(prev => ({
      ...prev,
      [selectedTheme]: hex
    }));
  };

  const handleApply = () => {
    const updatedMap = {
      ...templateColors,
      [selectedTheme]: selectedColor
    };

    updateSettings("printSettings", {
      themeName: selectedTheme,
      invoiceTemplate: selectedTheme,
      themeColor: selectedColor,
      activeColor: selectedColor,
      templateColors: updatedMap
    });
    toast.success(`Template updated to ${selectedTheme}`);
    onClose();
  };

  const mockInvoice = {
    sellerDetails: {
      companyName: settings?.printSettings?.companyName || "MY COMPANY",
      address: "123 Business Street, City, Delhi - 110001",
      phone: "9876543210",
      email: "info@mycompany.com",
      gstin: settings?.gstSettings?.gstin || "07AQXPD2556K2ZB"
    },
    bankDetails: {
      accountNumber: "921020024898267",
      bankName: "Axis Bank",
      ifsc: "UTIB0003532",
      branchName: "Main Branch"
    },
    lines: [
      { name: "Sample Item 1", hsnSac: "1234", qty: 2, price: 1500, discount: 0, gst: 18, amount: 3000 },
      { name: "Sample Service 2", hsnSac: "5678", qty: 1, price: 2500, discount: 5, gst: 18, amount: 2375 }
    ],
    invoiceNumber: "INV-2026-001",
    date: new Date().toISOString(),
    billingName: "Walk-in Customer",
    billedToAddress: "Connaught Place, New Delhi",
    billedToMobile: "9999999999",
    placeOfSupply: "Delhi"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-card border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Transaction Theme & Templates</DialogTitle>
              <p className="text-xs text-muted-foreground">Select layout templates for Invoice and E-Way Bill</p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Category Tabs & Template List */}
          <div className="lg:col-span-5 border-r flex flex-col h-full bg-slate-50/50 overflow-hidden">
            {/* Category Switcher Tabs */}
            <div className="p-3 border-b bg-white flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("INVOICE")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "INVOICE"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Invoice Templates ({invoiceTemplateKeys.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("EWAY")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "EWAY"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                E-Way Bill ({ewayTemplateKeys.length})
              </button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Section 1: Color Palette */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Theme Colors</h3>
                  </div>
                  <div className="bg-white p-3 rounded-xl border shadow-sm space-y-2.5">
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_OPTIONS.map((c) => {
                        const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.name}
                            onClick={() => handleSelectColor(c.hex)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isSelected ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md" : "hover:scale-105 opacity-90"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Hex Color Code Input & Native Picker */}
                    <div className="pt-2 border-t flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full border border-slate-300 shadow-sm overflow-hidden shrink-0 cursor-pointer" title="Pick Custom Color">
                        <input
                          type="color"
                          value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#0ea5e9'}
                          onChange={(e) => handleSelectColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">#</span>
                        <input
                          type="text"
                          placeholder="0EA5E9"
                          value={selectedColor.startsWith('#') ? selectedColor.slice(1) : selectedColor}
                          onChange={(e) => {
                            const val = e.target.value.trim().replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                            handleSelectColor(`#${val}`);
                          }}
                          className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50/50"
                          maxLength={6}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Color Code</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Templates List */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {activeTab === "INVOICE" ? "Invoice Design Templates" : "E-Way Bill Templates"}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {(activeTab === "INVOICE" ? invoiceTemplateKeys : ewayTemplateKeys).map((tmplKey) => {
                      const isSelected = selectedTheme === tmplKey;
                      const desc = INVOICE_DESCRIPTIONS[tmplKey] || EWAY_DESCRIPTIONS[tmplKey] || "Standard template format";
                      return (
                        <div
                          key={tmplKey}
                          onClick={() => handleSelectTemplate(tmplKey)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/30" 
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>{tmplKey}</p>
                            <p className="text-[11px] text-muted-foreground">{desc}</p>
                          </div>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Live Invoice Preview */}
          <div className="hidden lg:flex lg:col-span-7 bg-slate-200/70 p-4 flex-col items-center justify-center overflow-hidden relative">
            <div className="text-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-3 py-1 rounded-full border shadow-sm">
                Live Preview • {selectedTheme}
              </span>
            </div>
            <div className="w-full h-full max-h-[92%] bg-white rounded-xl shadow-2xl border overflow-auto custom-scrollbar p-2 flex justify-center">
              <div className="w-full max-w-[750px] transform origin-top scale-[0.82]">
                <InvoiceTemplateRenderer
                  invoice={mockInvoice}
                  documentType={activeTab === "EWAY" ? "EWAY" : "INVOICE"}
                  printSettings={{
                    ...settings?.printSettings,
                    themeName: selectedTheme,
                    themeColor: selectedColor,
                    activeColor: selectedColor
                  }}
                  gstSettings={settings?.gstSettings || {}}
                  templateName={selectedTheme}
                  themeColor={selectedColor}
                  numberToWords={() => "Five Thousand Three Hundred Seventy Five Rupees Only"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t bg-white flex flex-row items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-2 pl-2">
            <span>Selected Theme:</span>
            <span className="h-3.5 w-3.5 rounded-full border shadow-sm inline-block" style={{ backgroundColor: selectedColor }}></span>
            <span className="font-bold text-slate-700">{selectedTheme}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs h-9">
              Cancel
            </Button>
            <Button onClick={handleApply} className="rounded-xl text-xs h-9 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              Apply Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
