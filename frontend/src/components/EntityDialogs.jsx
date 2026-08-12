import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePlatformSettings } from "@/lib/platform-settings";
import api from "@/lib/api";

export function AddProductDialog({
  open, onOpenChange, onAdd,
}) {
  const { settings } = usePlatformSettings();
  const { itemSettings } = settings;
  const [showScanner, setShowScanner] = useState(false);

  const [f, setF] = useState({
    name: "",
    sku: "",
    cat: "Grocery",
    price: "",
    stock: "",
    description: "",
    mrp: "",
    serialNo: "",
    batchNo: "",
    expDate: "",
    mfgDate: "",
    modelNo: "",
    size: "",
    unit: "Pcs",
    gst: "0",
    hsnSac: "",
    discount: "",
    customFieldsData: {},
  });

  const [categories, setCategories] = useState([]);

  // Reset form and fetch categories when dialog opens/closes
  useEffect(() => {
    if (open) {
      setF({
        name: "",
        sku: "",
        cat: "Grocery",
        price: "",
        stock: "",
        description: "",
        mrp: "",
        serialNo: "",
        batchNo: "",
        expDate: "",
        mfgDate: "",
        modelNo: "",
        size: "",
        unit: "Pcs",
        gst: "0",
        hsnSac: "",
        discount: "",
        customFieldsData: {},
      });

      const fetchCategories = async () => {
        try {
          const res = await api.get('/categories');
          setCategories(res.data || []);
          if (res.data && res.data.length > 0) {
            setF(p => ({ ...p, cat: res.data[0].name }));
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      };
      fetchCategories();
    }
  }, [open]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setCustomVal = (name, val) =>
    setF((p) => ({
      ...p,
      customFieldsData: { ...p.customFieldsData, [name]: val },
    }));

  if (!itemSettings) return null;

  const isServiceOnly = itemSettings.whatDoYouSell === "Service";
  const isProductOnly = itemSettings.whatDoYouSell === "Product";

  const defaultCats = [];
  if (!isServiceOnly) {
    defaultCats.push({ name: "Grocery" }, { name: "Bakery" }, { name: "Dairy" }, { name: "Packaged" });
  }
  if (!isProductOnly) {
    defaultCats.push({ name: "Services" });
  }
  defaultCats.push({ name: "Other" });

  const titleText = isServiceOnly ? "Add Service" : "Add Product";
  const descText = isServiceOnly 
    ? "Setup service information and pricing preferences."
    : "Setup inventory information and pricing preferences.";
  const nameLabel = isServiceOnly ? "Service name" : "Product name";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descText}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.name.trim()) return toast.error(`Enter ${isServiceOnly ? 'service' : 'product'} name`);
            if (!f.price) return toast.error("Enter price");

            const payload = {
              name: f.name.trim(),
              sku: f.sku.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
              cat: itemSettings.itemCategory ? f.cat : "General",
              price: Number(f.price),
              stock: itemSettings.stockMaintenance ? (Number(f.stock) || 0) : 0,
              min: 10,
            };

            if (itemSettings.description) payload.description = f.description.trim();
            if (itemSettings.mrp) payload.mrp = Number(f.mrp) || 0;
            if (itemSettings.serialNo) payload.serialNo = f.serialNo.trim();
            if (itemSettings.batchNo) payload.batchNo = f.batchNo.trim();
            if (itemSettings.expDate) payload.expDate = f.expDate.trim();
            if (itemSettings.mfgDate) payload.mfgDate = f.mfgDate.trim();
            if (itemSettings.modelNo) payload.modelNo = f.modelNo.trim();
            if (itemSettings.size) payload.size = f.size.trim();
            if (itemSettings.itemsUnit) payload.unit = f.unit;
            if (itemSettings.itemWiseTax) {
              payload.gst = Number(f.gst) || 0;
              payload.hsnSac = f.hsnSac.trim();
            }
            if (itemSettings.itemWiseDiscount) payload.discount = Number(f.discount) || 0;
            payload.customFieldsData = f.customFieldsData;

            if (onAdd) {
              onAdd(payload);
            }

            toast.success(`${f.name} added to inventory`);
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pname">{nameLabel}</Label>
            <Input id="pname" value={f.name} onChange={(e) => set("name", e.target.value)} className="h-10 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemSettings.barcodeScan && (
              <div className="space-y-1.5">
                <Label htmlFor="psku">SKU / Barcode</Label>
                <div className="relative">
                  <Input 
                    id="psku" 
                    value={f.sku} 
                    onChange={(e) => set("sku", e.target.value)} 
                    className="h-10 rounded-xl pr-[100px]" 
                    placeholder="Item Code / Barcode" 
                  />
                  <button 
                    type="button"
                    onClick={() => set("sku", "3866" + Math.floor(100000 + Math.random() * 900000))}
                    className="absolute right-2 top-1.5 h-7 px-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                  >
                    Assign Code
                  </button>
                </div>
                {(itemSettings.barcodeScanType === "camera" || !itemSettings.barcodeScanType) && (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer py-1"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M9 11h6M9 15h6M12 8v8" />
                    </svg>
                    Scan code
                  </button>
                )}
              </div>
            )}
            {itemSettings.itemCategory && (
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={f.cat} onValueChange={(v) => set("cat", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(categories.length > 0 ? categories : defaultCats).map((c) => (
                      <SelectItem key={c._id || c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {itemSettings.itemsUnit && (
              <div className="space-y-1.5">
                <Label htmlFor="punit">Measuring Unit</Label>
                <Select value={f.unit} onValueChange={(v) => set("unit", v)}>
                  <SelectTrigger id="punit" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pcs">Pcs (Pieces)</SelectItem>
                    <SelectItem value="Kgs">Kgs (Kilograms)</SelectItem>
                    <SelectItem value="Ltrs">Ltrs (Litres)</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Nos">Nos (Numbers)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pprice">Price (₹)</Label>
              <Input id="pprice" type="number" value={f.price} onChange={(e) => set("price", e.target.value)} className="h-10 rounded-xl" />
            </div>
            {itemSettings.stockMaintenance && (
              <div className="space-y-1.5">
                <Label htmlFor="pstock">Opening stock</Label>
                <Input id="pstock" type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} className="h-10 rounded-xl" />
              </div>
            )}
          </div>

          {/* Tax and Discount settings */}
          {(itemSettings.itemWiseTax || itemSettings.itemWiseDiscount) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t pt-3 mt-2">
              {itemSettings.itemWiseTax && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="phsn">HSN/SAC Code</Label>
                    <Input id="phsn" value={f.hsnSac} onChange={(e) => set("hsnSac", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. 996601" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pgst">Default GST Rate</Label>
                    <Select value={f.gst} onValueChange={(v) => set("gst", v)}>
                      <SelectTrigger id="pgst" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {itemSettings.itemWiseDiscount && (
                <div className="space-y-1.5">
                  <Label htmlFor="pdisc_rate">Default Discount (%)</Label>
                  <Input id="pdisc_rate" type="number" min={0} max={100} value={f.discount} onChange={(e) => set("discount", e.target.value)} className="h-10 rounded-xl" placeholder="0" />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {itemSettings.description && (
            <div className="space-y-1.5">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" value={f.description} onChange={(e) => set("description", e.target.value)} className="min-h-[60px] rounded-xl" />
            </div>
          )}

          {/* MRP Field */}
          {itemSettings.mrp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pmrp">MRP (₹)</Label>
                <Input id="pmrp" type="number" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} className="h-10 rounded-xl" />
              </div>
            </div>
          )}

          {/* Tracking details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemSettings.serialNo && (
              <div className="space-y-1.5">
                <Label htmlFor="pserial">Serial No./ IMEI No.</Label>
                <Input id="pserial" value={f.serialNo} onChange={(e) => set("serialNo", e.target.value)} className="h-10 rounded-xl" placeholder="Enter Serial No" />
              </div>
            )}
            {itemSettings.batchNo && (
              <div className="space-y-1.5">
                <Label htmlFor="pbatch">Batch No.</Label>
                <Input id="pbatch" value={f.batchNo} onChange={(e) => set("batchNo", e.target.value)} className="h-10 rounded-xl" placeholder="Enter Batch No" />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemSettings.mfgDate && (
              <div className="space-y-1.5">
                <Label htmlFor="pmfg">Mfg. Date (dd/mm/yyyy)</Label>
                <Input id="pmfg" value={f.mfgDate} onChange={(e) => set("mfgDate", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. 10/12/2025" />
              </div>
            )}
            {itemSettings.expDate && (
              <div className="space-y-1.5">
                <Label htmlFor="pexp">Exp. Date (mm/yyyy)</Label>
                <Input id="pexp" value={f.expDate} onChange={(e) => set("expDate", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. 12/2026" />
              </div>
            )}
          </div>

          {/* Model & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemSettings.modelNo && (
              <div className="space-y-1.5">
                <Label htmlFor="pmodel">Model No.</Label>
                <Input id="pmodel" value={f.modelNo} onChange={(e) => set("modelNo", e.target.value)} className="h-10 rounded-xl" />
              </div>
            )}
            {itemSettings.size && (
              <div className="space-y-1.5">
                <Label htmlFor="psize">Size</Label>
                <Input id="psize" value={f.size} onChange={(e) => set("size", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. XL, 10 inches" />
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {itemSettings.customFields && itemSettings.customFields.filter(cf => cf.active).length > 0 && (
            <div className="border-t pt-3 mt-2 space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Custom Attributes</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itemSettings.customFields.filter(cf => cf.active).map((cf) => (
                  <div key={cf.name} className="space-y-1.5">
                    <Label>{cf.name}</Label>
                    <Input
                      value={f.customFieldsData[cf.name] || ""}
                      onChange={(e) => setCustomVal(cf.name, e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <BarcodeScannerModal 
        open={showScanner} 
        onOpenChange={setShowScanner} 
        onScan={(code) => set("sku", code)} 
      />
    </Dialog>
  );
}

export function AddPartyDialog({
  open, onOpenChange, onAdd,
}) {
  const { settings } = usePlatformSettings();
  const { partySettings } = settings;

  const [f, setF] = useState({
    name: "",
    phone: "",
    type: "Customer",
    opening: "",
    gstin: "",
    email: "",
    address: "",
  });

  const [partyTypes, setPartyTypes] = useState([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const fetchPartyTypes = async () => {
    try {
      const res = await api.get('/party-types');
      setPartyTypes(res.data || []);
      if (res.data && res.data.length > 0) {
        setF(p => ({ ...p, type: res.data[0].name }));
      }
    } catch (error) {
      console.error("Failed to load party types:", error);
    }
  };

  useEffect(() => {
    if (open) {
      setF({
        name: "",
        phone: "",
        type: "Customer",
        opening: "",
        gstin: "",
        email: "",
        address: "",
      });
      setShowAddType(false);
      setNewTypeName("");
      fetchPartyTypes();
    }
  }, [open]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return toast.error("Enter type name");
    try {
      const res = await api.post('/party-types', { name: newTypeName.trim() });
      toast.success(`Type "${res.data.name}" added`);
      setNewTypeName("");
      setShowAddType(false);
      // Refresh types list and set newly created one as active type
      const updatedTypes = await api.get('/party-types');
      setPartyTypes(updatedTypes.data || []);
      set("type", res.data.name);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create type");
    }
  };

  const handleDeleteType = async (typeId) => {
    try {
      await api.delete(`/party-types/${typeId}`);
      toast.success("Party type deleted");
      const updatedTypes = await api.get('/party-types');
      setPartyTypes(updatedTypes.data || []);
      set("type", "Customer");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete party type");
    }
  };

  if (!partySettings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Party</DialogTitle>
          <DialogDescription>Customer or supplier ledger registration.</DialogDescription>
        </DialogHeader>

        {showAddType ? (
          <div className="space-y-4 py-2">
            <h4 className="font-semibold text-sm">Manage Party Types</h4>
            
            {/* List of current types */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <Label>Existing Types</Label>
              <div className="space-y-1.5">
                {partyTypes.map((t) => {
                  const isDefault = ["Customer", "Supplier"].includes(t.name);
                  return (
                    <div key={t._id || t.name} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800 capitalize">{t.name}</span>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteType(t._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isDefault && <span className="text-[10px] text-slate-400 font-medium italic">Default</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-dashed">
              <Label htmlFor="new-type-name">Add New Type</Label>
              <Input
                id="new-type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="h-10 rounded-xl text-sm"
                placeholder="e.g. Distributor"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowAddType(false)}>Back</Button>
              <Button type="button" onClick={handleCreateType} className="rounded-xl">Add Type</Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!f.name.trim()) return toast.error("Enter party name");
              if (partySettings.phone && f.phone.length !== 10) return toast.error("Enter 10-digit phone");

              const balanceVal = Number(f.opening) || 0;
              const payload = {
                name: f.name.trim(),
                type: partySettings.partyType ? f.type : "Customer",
                phone: partySettings.phone ? `+91 ${f.phone.slice(0, 4)} ${f.phone.slice(4)}` : "N/A",
                balance: balanceVal,
                balanceType: balanceVal >= 0 ? "To Receive" : "To Pay"
              };

              if (partySettings.gstin) payload.gstin = f.gstin.trim();
              if (partySettings.email) payload.email = f.email.trim();
              if (partySettings.address) payload.address = f.address.trim();

              if (onAdd) {
                onAdd(payload);
              }

              toast.success(`${f.name} added`);
              onOpenChange(false);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="paname">Party name</Label>
              <Input id="paname" value={f.name} onChange={(e) => set("name", e.target.value)} className="h-10 rounded-xl" />
            </div>

            <div className="flex gap-3">
              {partySettings.phone && (
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Label htmlFor="paphone">Mobile</Label>
                  <Input
                    id="paphone" inputMode="numeric" maxLength={10}
                    value={f.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
              {partySettings.partyType && (
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <Label className="whitespace-nowrap">Type</Label>
                    <button
                      type="button"
                      onClick={() => setShowAddType(true)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold whitespace-nowrap"
                    >
                      + Add Type
                    </button>
                  </div>
                  <Select value={f.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger className="h-10 rounded-xl w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {partyTypes.map((t) => (
                        <SelectItem key={t._id || t.name} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {partySettings.openingBalance && (
              <div className="space-y-1.5">
                <Label htmlFor="paopen">Opening balance (₹)</Label>
                <Input id="paopen" type="number" value={f.opening} onChange={(e) => set("opening", e.target.value)} className="h-10 rounded-xl" placeholder="0" />
              </div>
            )}

            {partySettings.gstin && (
              <div className="space-y-1.5">
                <Label htmlFor="pagstin">Party GSTIN</Label>
                <Input id="pagstin" value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} className="h-10 rounded-xl" placeholder="07XXXXX1234XX" />
              </div>
            )}

            {partySettings.email && (
              <div className="space-y-1.5">
                <Label htmlFor="paemail">Party Email</Label>
                <Input id="paemail" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. party@mail.com" />
              </div>
            )}

            {partySettings.address && (
              <div className="space-y-1.5">
                <Label htmlFor="paaddress">Billing Address</Label>
                <Textarea id="paaddress" value={f.address} onChange={(e) => set("address", e.target.value)} className="min-h-[60px] rounded-xl" />
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm">Save Party</Button>
              <Button type="button" variant="ghost" className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground" onClick={() => onOpenChange(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CashInOutDialog({
  open, onOpenChange, onAdd,
}) {
  const [f, setF] = useState({ desc: "", amount: "", type: "IN", party: "", mode: "Cash" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cash In/Out</DialogTitle>
          <DialogDescription>Record a manual cash or bank transaction.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.desc.trim()) return toast.error("Enter description");
            if (!f.amount) return toast.error("Enter amount");
            
            if (onAdd) {
              onAdd({
                desc: f.desc.trim(),
                date: "Just now",
                amount: Number(f.amount),
                type: f.type,
                party: f.party.trim() || "General",
                mode: f.mode,
              });
            }
            
            toast.success("Transaction recorded");
            onOpenChange(false);
            setF({ desc: "", amount: "", type: "IN", party: "", mode: "Cash" });
          }}
        >
          <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-xl">
             <Button 
                type="button" 
                variant={f.type === 'IN' ? 'default' : 'ghost'} 
                className="rounded-lg h-9"
                onClick={() => set('type', 'IN')}
             >Cash In</Button>
             <Button 
                type="button" 
                variant={f.type === 'OUT' ? 'destructive' : 'ghost'} 
                className="rounded-lg h-9 text-destructive hover:text-destructive"
                onClick={() => set('type', 'OUT')}
             >Cash Out</Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={f.desc} onChange={(e) => set("desc", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. Received from customer" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount (₹)</Label>
              <Input id="amt" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select value={f.mode} onValueChange={(v) => set("mode", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="party">Party (Optional)</Label>
            <Input id="party" value={f.party} onChange={(e) => set("party", e.target.value)} className="h-10 rounded-xl" placeholder="e.g. John Doe" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">Record Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BarcodeScannerModal({ open, onOpenChange, onScan }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setError("Failed to access camera. Please check permissions.");
          setLoading(false);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    const randomBarcode = "3866" + Math.floor(100000 + Math.random() * 900000);
    onScan(randomBarcode);
    toast.success(`Barcode Scanned: ${randomBarcode}`);
    stopCamera();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if(!v) stopCamera(); onOpenChange(v); }}>
      <DialogContent className="max-w-md rounded-2xl overflow-hidden bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Scan Barcode / QR Code</DialogTitle>
          <DialogDescription className="text-slate-400">Point your camera at a barcode to scan it.</DialogDescription>
        </DialogHeader>
        
        <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
          {loading && <div className="text-slate-400 text-sm">Accessing camera...</div>}
          {error && <div className="text-red-400 text-sm px-4 text-center">{error}</div>}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
            style={{ display: stream ? 'block' : 'none' }}
          />

          {stream && (
            <>
              {/* Scanner targeting box */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-blue-400"></div>
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-blue-400"></div>
                  <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-blue-400"></div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-blue-400"></div>
                  
                  {/* Laser line animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{
                    animation: "scanAnim 2.5s infinite ease-in-out"
                  }}></div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between items-center mt-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => { stopCamera(); onOpenChange(false); }}
          >
            Cancel
          </Button>
          {stream && (
            <Button 
              type="button" 
              onClick={handleCapture}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
            >
              Capture & Scan
            </Button>
          )}
        </DialogFooter>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scanAnim {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}
