import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus, Search, Upload, Boxes, AlertTriangle, ScanLine, Filter,
  MoreVertical, PlusCircle, MinusCircle, Ban, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMockAuth } from "@/lib/auth-store";
import { AddProductDialog } from "@/components/EntityDialogs";

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

export function InventoryDashboard() {
  const { user } = useMockAuth();
  const isViewer = user?.role === "Viewer";

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const cats = React.useMemo(() => {
    if (categories.length === 0) {
      return ["all", "Grocery", "Bakery", "Dairy", "Packaged"];
    }
    return ["all", ...categories.map(c => c.name)];
  }, [categories]);

  const uniqueCategoriesCount = categories.length;

  // Stock adjustment dialog state
  const [stockDialog, setStockDialog] = useState({ open: false, mode: null, product: null });
  const [stockQty, setStockQty] = useState(1);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items');
      const mapped = res.data.map((item) => ({
        _id: item._id,
        name: item.name,
        sku: item.itemCode || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        cat: item.category || 'General',
        price: item.salePrice || 0,
        purchasePrice: item.purchasePrice || 0,
        taxRate: item.taxRate !== undefined ? item.taxRate : 0,
        hsnSac: item.hsnSac || '',
        unit: item.unit || 'Pcs',
        stock: item.stockQty || 0,
        min: item.lowStockWarning || 10,
        batchNo: item.batchNumber || '',
        expDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : ''
      }));
      setInventory(mapped);
    } catch (error) {
      console.error("Failed to load inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const filtered = cat === "all" ? inventory : inventory.filter((p) => p.cat === cat);
  const lowCount = inventory.filter((p) => p.stock < p.min && p.stock > 0).length;
  const outOfStockCount = inventory.filter((p) => p.stock === 0).length;
  const totalValue = inventory.reduce((s, p) => s + p.price * p.stock, 0);

  const handleAddCategory = async (name) => {
    try {
      await api.post('/categories', { name });
      toast.success(`Category "${name}" created successfully`);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    }
  };

  const handleAdd = async (payload) => {
    try {
      let parsedExpDate = null;
      if (payload.expDate) {
        const trimmedDate = payload.expDate.trim();
        if (trimmedDate.includes('/')) {
          const parts = trimmedDate.split('/');
          if (parts.length === 2) {
            parsedExpDate = new Date(`${parts[1]}-${parts[0]}-01`);
          } else if (parts.length === 3) {
            parsedExpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          parsedExpDate = new Date(trimmedDate);
        }
      }

      if (parsedExpDate && isNaN(parsedExpDate.getTime())) {
        parsedExpDate = null;
      }

      const backendPayload = {
        name: payload.name,
        itemCode: payload.sku,
        category: payload.cat,
        unit: payload.unit || 'Pcs',
        hsnSac: payload.hsnSac || '',
        salePrice: payload.price,
        purchasePrice: payload.price * 0.75,
        taxRate: payload.gst !== undefined ? Number(payload.gst) : 0,
        stockQty: payload.stock,
        lowStockWarning: payload.min,
        batchNumber: payload.batchNo,
        expiryDate: parsedExpDate
      };

      await api.post('/items', backendPayload);
      toast.success(`${payload.name} saved to database`);
      fetchItems();
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error(error.response?.data?.message || "Failed to save product to database");
    }
    setOpen(false);
  };

  // --- Stock Management Handlers ---
  const openStockDialog = (product, mode) => {
    setStockQty(1);
    setStockDialog({ open: true, mode, product });
  };

  const handleStockAdjust = async () => {
    const { mode, product } = stockDialog;
    const qty = Number(stockQty) || 0;
    if (qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const newStock = mode === "add" ? product.stock + qty : Math.max(0, product.stock - qty);

    try {
      await api.put(`/items/${product._id}`, {
        stockQty: newStock
      });
      toast.success(`${qty} units adjusted successfully`);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
    setStockDialog({ open: false, mode: null, product: null });
  };

  const handleOutOfStock = async (product) => {
    try {
      await api.put(`/items/${product._id}`, {
        stockQty: 0
      });
      toast.warning(`${product.name} marked as Out of Stock`);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to adjust stock");
    }
  };

  const openDeleteDialog = (product) => {
    setDeleteDialog({ open: true, product });
  };

  const handleDeleteProduct = async () => {
    const { product } = deleteDialog;
    try {
      await api.delete(`/items/${product._id}`);
      toast.success(`${product.name} deleted successfully`);
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    }
    setDeleteDialog({ open: false, product: null });
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <PageHeader
        title="Inventory"
        actions={
          <div className="flex w-full flex-nowrap items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none px-1 sm:px-4 rounded-lg h-8 text-[9.5px] font-semibold sm:h-9 sm:text-sm" onClick={() => setIsBulkOpen(true)}>
              <Upload className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" /> Bulk
            </Button>
            {!isViewer && (
              <>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none px-1 sm:px-4 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 h-8 text-[9.5px] font-semibold sm:h-9 sm:text-sm" onClick={() => setIsAddCatOpen(true)}>
                  <Plus className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" /> Category
                </Button>
                <Button size="sm" className="flex-1 sm:flex-none px-1 sm:px-4 rounded-lg h-8 text-[9.5px] font-semibold sm:h-9 sm:text-sm" onClick={() => setOpen(true)}>
                  <Plus className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" /> Product
                </Button>
              </>
            )}
          </div>
        }
      />

      <AddProductDialog open={open} onOpenChange={setOpen} onAdd={handleAdd} />
      <AddCategoryDialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen} onAdd={handleAddCategory} />

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialog.open} onOpenChange={(v) => !v && setStockDialog({ open: false, mode: null, product: null })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stockDialog.mode === "add" ? (
                <PlusCircle className="h-5 w-5 text-green-600" />
              ) : (
                <MinusCircle className="h-5 w-5 text-orange-500" />
              )}
              {stockDialog.mode === "add" ? "Add Stock" : "Remove Stock"}
            </DialogTitle>
            <DialogDescription>
              {stockDialog.product?.name} — Current stock: <strong>{stockDialog.product?.stock} units</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stock-qty">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                  onClick={() => setStockQty((q) => Math.max(1, (Number(q) || 0) - 1))}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <Input
                  id="stock-qty"
                  type="number"
                  min={1}
                  value={stockQty === 0 ? "" : stockQty}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(?=\d)/, "");
                    if (raw === "") {
                      setStockQty("");
                    } else {
                      const num = Number(raw);
                      setStockQty(isNaN(num) ? "" : num);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-10 rounded-xl text-center text-lg font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0"
                  onClick={() => setStockQty((q) => (Number(q) || 0) + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {stockDialog.mode === "remove" && stockQty > (stockDialog.product?.stock || 0) && (
              <p className="text-xs text-destructive font-medium">
                ⚠ Quantity exceeds current stock. Stock will be set to 0.
              </p>
            )}
            <div className="rounded-xl bg-secondary/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="font-semibold">{stockDialog.product?.stock} units</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">After Adjustment</span>
                <span className="font-bold text-primary">
                  {stockDialog.mode === "add"
                    ? (stockDialog.product?.stock || 0) + (Number(stockQty) || 0)
                    : Math.max(0, (stockDialog.product?.stock || 0) - (Number(stockQty) || 0))
                  } units
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setStockDialog({ open: false, mode: null, product: null })}>
              Cancel
            </Button>
            <Button
              className={`rounded-xl ${stockDialog.mode === "add" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"} text-white`}
              onClick={handleStockAdjust}
            >
              {stockDialog.mode === "add" ? "Add Stock" : "Remove Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(v) => !v && setDeleteDialog({ open: false, product: null })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.product?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <p className="font-medium">This will permanently remove:</p>
            <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
              <li>Product details and pricing</li>
              <li>Stock records ({deleteDialog.product?.stock} units)</li>
              <li>Stock value of {fmt((deleteDialog.product?.price || 0) * (deleteDialog.product?.stock || 0))}</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteDialog({ open: false, product: null })}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteProduct}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="flex items-center gap-2 sm:gap-3 p-2 sm:p-5 min-w-0">
            <div className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary-soft text-primary">
              <Boxes className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Stock Value</p>
              <p className="text-sm sm:text-xl font-bold truncate">{fmt(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="flex items-center gap-2 sm:gap-3 p-2 sm:p-5 min-w-0">
            <div className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Low Stock Items</p>
              <p className="text-sm sm:text-xl font-bold truncate">{lowCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="flex items-center gap-2 sm:gap-3 p-2 sm:p-5 min-w-0">
            <div className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-100 text-orange-600">
              <Ban className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Out of Stock</p>
              <p className="text-sm sm:text-xl font-bold truncate">{outOfStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="flex items-center gap-2 sm:gap-3 p-2 sm:p-5 min-w-0">
            <div className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-accent-soft text-accent">
              <ScanLine className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Categories</p>
              <p className="text-sm sm:text-xl font-bold truncate">{uniqueCategoriesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-transparent md:bg-white border-0 md:border md:shadow-sm shadow-none min-w-0 w-full overflow-hidden">
        <CardContent className="p-0 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={cat} onValueChange={setCat} className="hidden sm:block w-full overflow-x-auto">
              <TabsList className="rounded-xl inline-flex min-w-max">
                {cats.map((c) => (
                  <TabsTrigger key={c} value={c} className="rounded-lg capitalize">
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search product or SKU…" className="h-10 w-full rounded-xl pl-9 sm:w-64" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl sm:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  {cats.map((c) => (
                    <DropdownMenuItem 
                      key={c} 
                      className="capitalize cursor-pointer"
                      onClick={() => setCat(c)}
                    >
                      {c}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-1 sm:px-4 py-2">Product</TableHead>
                  <TableHead className="hidden sm:table-cell px-1 sm:px-4 py-2">SKU</TableHead>
                  <TableHead className="hidden md:table-cell px-1 sm:px-4 py-2">Category</TableHead>
                  <TableHead className="text-right px-1 sm:px-4 py-2">Price</TableHead>
                  <TableHead className="w-[85px] sm:w-[180px] px-1 sm:px-4 py-2">Stock</TableHead>
                  {!isViewer && <TableHead className="w-[40px] sm:w-[50px] text-center px-1 sm:px-4 py-2">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const low = p.stock < p.min && p.stock > 0;
                  const pct = Math.min(100, (p.stock / (p.min * 3)) * 100);
                  return (
                    <TableRow key={p.sku} className={isOutOfStock ? "opacity-60" : ""}>
                      <TableCell className="px-1 py-2 sm:px-4">
                        <div className="min-w-0 max-w-[95px] sm:max-w-none">
                          <p className="font-semibold text-xs sm:text-sm truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden">{p.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell px-1 sm:px-4 py-2">{p.sku}</TableCell>
                      <TableCell className="hidden md:table-cell px-1 sm:px-4 py-2">
                        <Badge variant="secondary" className="rounded-full">{p.cat}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold px-1 sm:px-4 py-2 text-xs sm:text-sm">{fmt(p.price)}</TableCell>
                      <TableCell className="px-1 py-2 sm:px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="font-medium whitespace-nowrap">{p.stock} units</span>
                            {isOutOfStock ? (
                              <Badge variant="outline" className="border-gray-400/30 bg-gray-100 text-[8px] sm:text-[10px] text-gray-600 px-1 py-0 h-3.5 sm:h-4">
                                Out
                              </Badge>
                            ) : low ? (
                              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-[8px] sm:text-[10px] text-destructive px-1 py-0 h-3.5 sm:h-4">
                                Low
                              </Badge>
                            ) : null}
                          </div>
                          <Progress
                            value={pct}
                            className={`h-1 ${isOutOfStock ? "[&>div]:bg-gray-400" : low ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
                          />
                        </div>
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-center px-1 sm:px-4 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-secondary">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2.5"
                                onClick={() => openStockDialog(p, "add")}
                              >
                                <PlusCircle className="h-4 w-4 text-green-600" />
                                <span>Add Stock</span>
                                <span className="ml-auto text-xs text-muted-foreground">+Qty</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2.5"
                                onClick={() => openStockDialog(p, "remove")}
                                disabled={p.stock === 0}
                              >
                                <MinusCircle className="h-4 w-4 text-orange-500" />
                                <span>Remove Stock</span>
                                <span className="ml-auto text-xs text-muted-foreground">−Qty</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2.5"
                                onClick={() => handleOutOfStock(p)}
                                disabled={p.stock === 0}
                              >
                                <Ban className="h-4 w-4 text-gray-500" />
                                <span>Mark Out of Stock</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Product</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <BulkUploadDialog open={isBulkOpen} onOpenChange={setIsBulkOpen} onUploadSuccess={fetchItems} />
    </div>
  );
}

function AddCategoryDialog({ open, onOpenChange, onAdd }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");
    onAdd(name.trim());
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new category to organize your products.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" placeholder="e.g. Beverages" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl">Save Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkUploadDialog({ open, onOpenChange, onUploadSuccess }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("file");

  const handleReset = () => {
    setText("");
    setFileName("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const parseDataToItems = (dataText) => {
    if (!dataText.trim()) return [];
    const lines = dataText.split("\n");
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      let cols = [];
      if (lines[i].includes("\t")) {
        cols = lines[i].split("\t").map(c => c.trim());
      } else {
        cols = lines[i].split(",").map(c => c.trim());
      }

      if (cols.length === 0 || !cols[0]) continue;

      let parsedExpDate = null;
      const expStr = cols[6];
      if (expStr) {
        const trimmedDate = expStr.trim();
        if (trimmedDate.includes('/')) {
          const parts = trimmedDate.split('/');
          if (parts.length === 2) {
            parsedExpDate = new Date(`${parts[1]}-${parts[0]}-01`);
          } else if (parts.length === 3) {
            parsedExpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          parsedExpDate = new Date(trimmedDate);
        }
      }
      if (parsedExpDate && isNaN(parsedExpDate.getTime())) {
        parsedExpDate = null;
      }

      items.push({
        name: cols[0],
        salePrice: Number(cols[1]) || 0,
        purchasePrice: Number(cols[2]) || Number(cols[1]) * 0.75 || 0,
        stockQty: Number(cols[3]) || 0,
        category: cols[4] || 'General',
        batchNumber: cols[5] || '',
        expiryDate: parsedExpDate
      });
    }
    return items;
  };

  const parsedItems = useMemo(() => parseDataToItems(text), [text]);

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setText(evt.target.result);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Product Name,Sale Price,Purchase Price,Stock Qty,Category,Batch No,Expiry Date\nBasmati Rice 5kg,480,360,78,Grocery,B-102,2026-12-31\nSunflower Oil 1L,180,140,32,Grocery,B-103,2026-06-30\nTata Salt 1kg,25,18,156,Grocery,B-542,2028-05-31\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "udaan_sample_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample template CSV downloaded!");
  };

  const handleProcess = async () => {
    if (parsedItems.length === 0) {
      toast.error("No valid products found to import");
      return;
    }

    try {
      setLoading(true);
      await api.post('/items/bulk', { items: parsedItems });
      toast.success(`Successfully imported ${parsedItems.length} products!`);
      onUploadSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import products. Please check formatting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl rounded-2xl p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Bulk Upload Products</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Easily import multiple inventory items from Excel / CSV in seconds.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Download Template Callout */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-800">1. Need a sample format?</p>
              <p className="text-[11px] text-slate-500">Download sample Excel/CSV template with demo products.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="rounded-xl border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs h-8">
              Download Sample
            </Button>
          </div>

          {/* Step 2: Upload or Paste Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="file" className="rounded-lg text-xs font-semibold">📁 Upload CSV File</TabsTrigger>
              <TabsTrigger value="paste" className="rounded-lg text-xs font-semibold">📋 Paste Excel Rows</TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            {activeTab === "file" && (
              <div className="mt-3">
                {fileName ? (
                  <div className="flex items-center justify-between p-4 border border-emerald-200 rounded-2xl bg-emerald-50/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{fileName}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{parsedItems.length} products ready</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 shrink-0 ml-2"
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/50 transition-all p-4 text-center">
                    <Upload className="h-8 w-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Click or drag & drop CSV file here</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Supports .csv files exported from Excel</span>
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Paste Data Tab */}
            {activeTab === "paste" && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paste-data" className="text-xs font-semibold text-slate-700">Paste Excel/Spreadsheet Columns</Label>
                  {text && (
                    <button type="button" onClick={handleReset} className="text-[11px] text-red-500 hover:underline font-semibold">
                      Clear Text
                    </button>
                  )}
                </div>
                <Textarea
                  id="paste-data"
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="rounded-xl font-mono text-xs p-3 bg-white"
                  placeholder="Product Name,Sale Price,Purchase Price,Stock Qty,Category&#10;Tata Salt 1kg,25,18,156,Grocery"
                />
              </div>
            )}
          </Tabs>

          {/* Live Data Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Preview ({parsedItems.length} Products Found)
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ready to Import</span>
              </div>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="h-7 text-[11px]">Product Name</TableHead>
                      <TableHead className="h-7 text-[11px] text-right">Sale (₹)</TableHead>
                      <TableHead className="h-7 text-[11px] text-right">Purchase (₹)</TableHead>
                      <TableHead className="h-7 text-[11px] text-center">Stock</TableHead>
                      <TableHead className="h-7 text-[11px]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.slice(0, 5).map((item, idx) => (
                      <TableRow key={idx} className="h-7">
                        <TableCell className="font-medium truncate max-w-[120px]">{item.name}</TableCell>
                        <TableCell className="text-right">₹{item.salePrice}</TableCell>
                        <TableCell className="text-right">₹{item.purchasePrice}</TableCell>
                        <TableCell className="text-center font-semibold">{item.stockQty}</TableCell>
                        <TableCell className="truncate max-w-[80px]">{item.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedItems.length > 5 && (
                  <p className="text-[10px] text-slate-400 text-center py-1 bg-slate-50 border-t">
                    + {parsedItems.length - 5} more products will be imported
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleProcess} 
            disabled={loading || parsedItems.length === 0} 
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold px-5"
          >
            {loading ? "Importing Products..." : parsedItems.length > 0 ? `Import ${parsedItems.length} Products` : "Import Products"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

