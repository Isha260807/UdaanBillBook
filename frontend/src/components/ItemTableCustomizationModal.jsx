import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ItemTableCustomizationModal({ isOpen, onClose, settings, updateSettings }) {
  const print = settings.printSettings || {};
  const [localColumns, setLocalColumns] = useState({});
  const [localNames, setLocalNames] = useState({});
  const [order, setOrder] = useState([]);

  const defaultOrder = [
    "slNo",
    "itemName",
    "itemCode",
    "hsnSac",
    "batchNo",
    "expDate",
    "mfgDate",
    "mrp",
    "size",
    "modelNo",
    "description",
    "count",
    "colour",
    "material",
    "brand",
    "serialNo",
    "challanNo",
    "quantity",
    "unit",
    "priceUnit",
    "discount",
    "discountPercent",
    "taxablePriceUnit",
    "taxAmount",
    "taxPercent",
    "taxableAmount",
    "cess",
    "finalRate",
    "amount"
  ];

  const getLabelForKey = (key) => {
    const labels = {
      slNo: "#",
      itemName: "Item name",
      hsnSac: "HSN/SAC",
      itemCode: "Item Code",
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
    };
    return labels[key] || key;
  };

  useEffect(() => {
    if (isOpen) {
      setLocalColumns(print.tableColumns || {});
      setLocalNames(print.tableColumnNames || {});
      setOrder(print.columnOrder || defaultOrder);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleUpdate = (key, value) => {
    setLocalColumns(prev => ({ ...prev, [key]: value }));
  };

  const handleNameUpdate = (key, value) => {
    setLocalNames(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings("printSettings", {
      ...print,
      tableColumns: localColumns,
      tableColumnNames: localNames,
      columnOrder: order
    });
    onClose();
  };

  const moveColumn = (index, direction) => {
    const newOrder = [...order];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setOrder(newOrder);
    }
  };

  const activeColsInOrder = order.filter(key => localColumns[key]);

  const renderCheckGroup = (key, defaultLabel, inputLabel = null) => {
    const checked = localColumns[key];
    const customName = localNames[key] || "";
    
    return (
      <div className="flex items-start gap-3 py-2 group">
        <Checkbox 
          checked={!!checked} 
          onCheckedChange={(c) => handleUpdate(key, !!c)} 
          className="mt-1 h-4 w-4 rounded shadow-sm data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-slate-300" 
        />
        <div className="flex flex-col gap-1 w-full max-w-[240px]">
          <Label className="text-[13px] text-slate-700 cursor-pointer" onClick={() => handleUpdate(key, !checked)}>
            {defaultLabel}
          </Label>
          {inputLabel && (
            <div className="relative mt-1">
              <Input 
                value={customName} 
                onChange={(e) => handleNameUpdate(key, e.target.value)}
                disabled={!checked}
                className={`h-8 text-[12px] bg-white border-slate-200 text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500 ${!checked ? "opacity-50" : ""}`} 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 sm:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Item Table Customization</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Header Preview */}
        <div className="px-6 pb-2 shrink-0 overflow-x-auto">
          <div className="min-w-[800px] border border-slate-200 rounded-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-400 text-white text-[12px]">
                  {activeColsInOrder.map((key, idx) => (
                    <th key={key} className="p-2 font-medium group/hdr border-r border-indigo-300">
                      <div className="flex items-center justify-between gap-2">
                        <span>{localNames[key] || getLabelForKey(key)}</span>
                        <div className="flex items-center gap-1 shrink-0 bg-black/20 p-0.5 rounded">
                          <button 
                            type="button"
                            onClick={() => moveColumn(order.indexOf(key), -1)} 
                            disabled={order.indexOf(key) === 0}
                            className="px-1 text-white hover:bg-white/20 rounded text-[9px] font-bold disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveColumn(order.indexOf(key), 1)} 
                            disabled={order.indexOf(key) === order.length - 1}
                            className="px-1 text-white hover:bg-white/20 rounded text-[9px] font-bold disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-[12px] text-slate-700 bg-white">
                  {activeColsInOrder.map((key) => {
                    const samples = {
                      slNo: "1",
                      itemName: "Item 1",
                      hsnSac: "101",
                      itemCode: "ITM001",
                      batchNo: "B10",
                      expDate: "09/24",
                      mfgDate: "31/12",
                      mrp: "₹ 500",
                      size: "1",
                      modelNo: "MDL1",
                      description: "Desc...",
                      count: "10",
                      colour: "Red",
                      material: "Cotton",
                      brand: "Puma",
                      serialNo: "SN123",
                      challanNo: "CH001",
                      quantity: "1",
                      unit: "Pcs",
                      priceUnit: "₹ 500",
                      discount: "₹ 25",
                      discountPercent: "5%",
                      taxablePriceUnit: "₹ 475",
                      taxAmount: "₹ 85",
                      taxPercent: "18%",
                      taxableAmount: "₹ 475",
                      cess: "₹ 0",
                      finalRate: "₹ 560",
                      amount: "₹ 560"
                    };
                    return <td key={key} className="p-2 border-r">{samples[key] || "-"}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Body columns */}
        <div className="flex-1 overflow-y-auto px-6 py-4 border-t custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1 */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Item related columns</h3>
              <div className="space-y-1">
                {renderCheckGroup("slNo", "#", "Sl No.")}
                {renderCheckGroup("itemName", "Item name", "Item Name")}
                {renderCheckGroup("itemCode", "Item Code", "Item Code")}
                {renderCheckGroup("hsnSac", "HSN/ SAC", "HSN/SAC")}
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b flex justify-between">
                Additional Item Columns
                <span className="text-xs bg-slate-700 text-white px-2 py-0.5 rounded cursor-pointer">Drag and Drop Columns to Re-Order</span>
              </h3>
              <div className="space-y-1">
                {renderCheckGroup("batchNo", "Batch No.")}
                {renderCheckGroup("expDate", "Exp. Date")}
                {renderCheckGroup("mfgDate", "Mfg. Date")}
                {renderCheckGroup("mrp", "MRP")}
                {renderCheckGroup("size", "Size")}
                {renderCheckGroup("modelNo", "Model No.")}
                {renderCheckGroup("description", "Description")}
                {renderCheckGroup("count", "Count")}
                {renderCheckGroup("colour", "Colour")}
                {renderCheckGroup("material", "Material")}
                {renderCheckGroup("brand", "Brand")}
              </div>

              <h3 className="font-bold text-slate-800 mt-6 mb-4 pb-2 border-b">Item Serial Number</h3>
              <div className="space-y-1">
                {renderCheckGroup("serialNo", "Serial No.")}
              </div>

              <h3 className="font-bold text-slate-800 mt-6 mb-4 pb-2 border-b">Additional Fields</h3>
              <div className="space-y-1">
                {renderCheckGroup("challanNo", "Challan/Order No.")}
              </div>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Amounts, Totals & Taxes</h3>
              <div className="space-y-1">
                {renderCheckGroup("quantity", "Quantity", "Quantity")}
                {renderCheckGroup("unit", "Unit", "Unit Of Measurement")}
                {renderCheckGroup("priceUnit", "Price/ Unit", "Price/Unit")}
                {renderCheckGroup("discount", "Discount", "Discount/Amount")}
                {renderCheckGroup("discountPercent", "Discount Percent")}
                {renderCheckGroup("taxablePriceUnit", "Taxable Price/ Unit", "Taxable Price/Unit")}
                {renderCheckGroup("taxAmount", "Tax Amount")}
                {renderCheckGroup("taxPercent", "Tax Percent")}
                {renderCheckGroup("taxableAmount", "Taxable amount", "Taxable Amount")}
                {renderCheckGroup("cess", "Ad. CESS", "Additional Cess")}
                {renderCheckGroup("finalRate", "Final Rate", "Final Price/Unit")}
                {renderCheckGroup("amount", "Amount", "Total Amount")}
              </div>
            </div>

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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
