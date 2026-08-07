import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, LayoutTemplate, Palette, Sparkles } from "lucide-react";
import { InvoiceTemplateRenderer } from "@/components/invoice-templates/InvoiceTemplateRenderer";
import { toast } from "sonner";

const TEMPLATE_OPTIONS = [
  { id: "GST Boxed", name: "GST Boxed", desc: "Standard boxed GST accounting layout" },
  { id: "Classic White", name: "Classic White", desc: "Clean & traditional bill design" },
  { id: "Modern Blue", name: "Modern Blue", desc: "Sleek modern layout with header accent" },
  { id: "Minimalist", name: "Minimalist", desc: "Simple, elegant & minimal design" },
  { id: "Business Plus", name: "Business Plus", desc: "Detailed corporate business invoice" },
  { id: "Corporate Pro", name: "Corporate Pro", desc: "Executive corporate template" },
  { id: "Retail Simple", name: "Retail Simple", desc: "Compact retail style bill" },
  { id: "Professional", name: "Professional", desc: "Premium professional invoice design" }
];

const COLOR_OPTIONS = [
  { hex: "#a855f7", name: "Royal Purple" },
  { hex: "#0ea5e9", name: "Ocean Blue" },
  { hex: "#10b981", name: "Emerald Green" },
  { hex: "#ef4444", name: "Crimson Red" },
  { hex: "#f59e0b", name: "Warm Amber" },
  { hex: "#64748b", name: "Slate Gray" },
  { hex: "#1e293b", name: "Dark Charcoal" },
  { hex: "#8b5cf6", name: "Indigo Violet" },
  { hex: "#ec4899", name: "Rose Pink" },
  { hex: "#059669", name: "Forest Green" }
];

export function ChangeThemeModal({ isOpen, onClose, settings, updateSettings }) {
  const currentTheme = settings?.printSettings?.themeName || settings?.printSettings?.invoiceTemplate || "GST Boxed";
  const currentColor = settings?.printSettings?.themeColor || settings?.printSettings?.activeColor || "#a855f7";

  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(settings?.printSettings?.themeName || settings?.printSettings?.invoiceTemplate || "GST Boxed");
      setSelectedColor(settings?.printSettings?.themeColor || settings?.printSettings?.activeColor || "#a855f7");
    }
  }, [isOpen, settings]);

  const handleApply = () => {
    updateSettings("printSettings", {
      themeName: selectedTheme,
      invoiceTemplate: selectedTheme,
      themeColor: selectedColor,
      activeColor: selectedColor,
    });
    toast.success(`Invoice theme updated to ${selectedTheme}`);
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
              <DialogTitle className="text-lg font-bold text-foreground">Transaction Theme & Colors</DialogTitle>
              <p className="text-xs text-muted-foreground">Select invoice template layout and accent color scheme</p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Template & Color Options */}
          <div className="lg:col-span-5 border-r flex flex-col h-full bg-slate-50/50 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Section 1: Accent Color Palette */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Theme Colors</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5 bg-white p-3 rounded-xl border shadow-sm">
                    {COLOR_OPTIONS.map((c) => {
                      const isSelected = selectedColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() => setSelectedColor(c.hex)}
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
                </div>

                {/* Section 2: Invoice Template Layouts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Design Templates</h3>
                  </div>
                  <div className="space-y-2">
                    {TEMPLATE_OPTIONS.map((tmpl) => {
                      const isSelected = selectedTheme === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => setSelectedTheme(tmpl.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/30" 
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>{tmpl.name}</p>
                            <p className="text-[11px] text-muted-foreground">{tmpl.desc}</p>
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
            <span>Selected Color:</span>
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
