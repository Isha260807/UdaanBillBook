import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeTransactionNamesModal({ isOpen, onClose, settings, updateSettings }) {
  const print = settings.printSettings || {};
  const defaultNames = {
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
  };

  const [localNames, setLocalNames] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLocalNames(print.transactionNames || {});
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalNames(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings("printSettings", {
      ...print,
      transactionNames: localNames
    });
    onClose();
  };

  const fields = [
    { key: "sale", label: "Sale" },
    { key: "estimate", label: "Estimate" },
    { key: "paymentIn", label: "Payment In" },
    { key: "saleReturn", label: "Sale Return" },
    { key: "deliveryChallan", label: "Delivery Challan" },
    { key: "proformaInvoice", label: "Proforma Invoice" },
    { key: "purchase", label: "Purchase" },
    { key: "paymentOut", label: "Payment Out" },
    { key: "purchaseReturn", label: "Purchase Return" },
    { key: "purchaseOrder", label: "Purchase Order" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 sm:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Change Transaction Names</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {fields.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <Label className="w-1/3 text-right text-slate-600 text-[13px]">{field.label}</Label>
                <Input
                  className="flex-1 h-9 text-[13px] focus-visible:ring-blue-500"
                  value={localNames[field.key] || ""}
                  placeholder={defaultNames[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end shrink-0 bg-slate-50 rounded-b-lg">
          <button 
            onClick={handleSave}
            className="w-full sm:w-auto justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm"
          >
            DONE
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
