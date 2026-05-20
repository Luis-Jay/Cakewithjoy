import { Fragment, useState, useEffect } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { db } from "../config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Search, Plus, Edit, Trash2, AlertTriangle, Calendar, Package, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Batch {
  id: string;
  quantity: number;
  expirationDate: string;
}

interface InventoryItem {
  id: string;
  name: string;
  batches: Batch[];
  unit: string;
  lowStockThreshold: number;
  lastUpdated: string;
}

const createBatchId = () => `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add item form state
  const [newItem, setNewItem] = useState({
    name: "", unit: "",
    qtyOnStock: "", expOnStock: "",
    qtyNewStock: "", expNewStock: "",
    lowStockThreshold: "",
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [editBatches, setEditBatches] = useState<Batch[]>([]);
  const [editLowStockThreshold, setEditLowStockThreshold] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const unsub = onValue(ref(db, "inventory"), (snap) => {
      const data = snap.val();
      if (!data) { setInventoryItems([]); setLoading(false); return; }
      const list: InventoryItem[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        name: val.name ?? key,
        batches: Array.isArray(val.batches)
          ? val.batches
          : val.batches && typeof val.batches === "object"
          ? Object.entries(val.batches).map(([bKey, bVal]: [string, any]) => ({
              id: bKey,
              quantity: bVal.quantity ?? 0,
              expirationDate: bVal.expirationDate ?? "",
            }))
          : [],
        unit: val.unit ?? "",
        lowStockThreshold: val.lowStockThreshold ?? 0,
        lastUpdated: val.lastUpdated ?? "",
      }));
      setInventoryItems(list);
      setLoading(false);
    }, () => { setInventoryItems([]); setLoading(false); });
    return () => unsub();
  }, []);

  const lowStockItems = inventoryItems.filter((item) => item.batches.reduce((total, batch) => total + batch.quantity, 0) <= item.lowStockThreshold);
  const lowStockCount = lowStockItems.length;

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditBatches(item.batches.map((batch) => ({ ...batch })));
    setEditLowStockThreshold(String(item.lowStockThreshold ?? 0));
    setEditError("");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    setEditBatches([]);
    setEditLowStockThreshold("");
    setEditError("");
  };

  const updateEditBatch = (batchId: string, field: keyof Batch, value: string) => {
    setEditError("");
    setEditBatches((prev) =>
      prev.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              [field]: field === "quantity" ? Number(value) || 0 : value,
            }
          : batch
      )
    );
  };

  const removeEditBatch = (batchId: string) => {
    setEditError("");
    setEditBatches((prev) => prev.filter((batch) => batch.id !== batchId));
  };

  const addEditBatch = () => {
    if (!selectedItem) return;
    const batchId = createBatchId();
    setEditError("");
    setEditBatches((prev) => [
      ...prev,
      { id: batchId, quantity: 0, expirationDate: "" },
    ]);
  };

  const saveItemChanges = async () => {
    if (!selectedItem || editSaving) return;

    const normalizedBatches = editBatches
      .map((batch) => ({
        ...batch,
        quantity: Number(batch.quantity) || 0,
        expirationDate: batch.expirationDate,
      }))
      .filter((batch) => batch.quantity > 0 || batch.expirationDate);

    const hasInvalidBatch = normalizedBatches.some(
      (batch) => batch.quantity < 0 || (batch.quantity > 0 && !batch.expirationDate)
    );

    if (hasInvalidBatch) {
      setEditError("Each batch with stock must include an expiration date.");
      return;
    }

    setEditError("");
    setEditSaving(true);
    try {
      const batchesPayload = normalizedBatches.reduce<Record<string, { quantity: number; expirationDate: string }>>(
        (acc, batch) => {
          acc[batch.id] = {
            quantity: batch.quantity,
            expirationDate: batch.expirationDate,
          };
          return acc;
        },
        {}
      );

      await update(ref(db, `inventory/${selectedItem.id}`), {
        batches: batchesPayload,
        lowStockThreshold: Number(editLowStockThreshold) || 0,
        lastUpdated: new Date().toISOString(),
      });

      toast.success("Inventory item updated successfully.");
      closeEditModal();
    } catch (error) {
      console.error("Failed to update inventory item", error);
      const message = "Could not save changes. Please check your Firebase permissions and try again.";
      setEditError(message);
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const deleteInventoryItem = async (item: InventoryItem) => {
    try {
      await remove(ref(db, `inventory/${item.id}`));
      toast.success("Inventory item deleted.");
      if (selectedItem?.id === item.id) {
        closeEditModal();
      }
    } catch (error) {
      console.error("Failed to delete inventory item", error);
      toast.error("Could not delete inventory item. Please check your Firebase permissions and try again.");
    }
  };

  const toggleRow = (itemId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  const getTotalQuantity = (batches: Batch[]) => {
    return batches.reduce((total, batch) => total + batch.quantity, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isExpiringSoon = (dateString: string) => {
    const expirationDate = new Date(dateString);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration >= 0;
  };

  const isExpired = (dateString: string) => {
    const expirationDate = new Date(dateString);
    const today = new Date();
    return expirationDate < today;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground text-lg">Loading inventory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">
          Track and manage bakery ingredients and supplies with expiration dates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Total Items</p>
            <h2>{inventoryItems.length}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Low Stock Items</p>
            <div className="flex items-center gap-2">
              <h2 className={lowStockCount > 0 ? "text-red-500" : ""}>{lowStockCount}</h2>
              {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Last Updated</p>
            <h2>Nov 11, 2025</h2>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Inventory Items</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                    <DialogDescription>
                      Add a new item to your inventory with stock quantities and expiration dates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input placeholder="e.g., All-Purpose Flour" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Qty On-Stock</Label>
                        <Input type="number" placeholder="0" value={newItem.qtyOnStock} onChange={(e) => setNewItem((p) => ({ ...p, qtyOnStock: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiration (On-Stock)</Label>
                        <Input type="date" value={newItem.expOnStock} onChange={(e) => setNewItem((p) => ({ ...p, expOnStock: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Qty New-Stock</Label>
                        <Input type="number" placeholder="0" value={newItem.qtyNewStock} onChange={(e) => setNewItem((p) => ({ ...p, qtyNewStock: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiration (New-Stock)</Label>
                        <Input type="date" value={newItem.expNewStock} onChange={(e) => setNewItem((p) => ({ ...p, expNewStock: e.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={newItem.unit} onValueChange={(v) => setNewItem((p) => ({ ...p, unit: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="ml">Milliliters (ml)</SelectItem>
                          <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          <SelectItem value="sets">Sets</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Low Stock Threshold</Label>
                      <Input type="number" min="0" placeholder="e.g., 5" value={newItem.lowStockThreshold} onChange={(e) => setNewItem((p) => ({ ...p, lowStockThreshold: String(Math.max(0, Number(e.target.value))) }))} />
                    </div>
                    {addError && (
                      <p className="text-sm text-red-600">{addError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setAddError(""); setIsAddModalOpen(false); }}>Cancel</Button>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      disabled={!newItem.name.trim() || !newItem.unit || addSaving}
                      onClick={async () => {
                        setAddError("");
                        setAddSaving(true);
                        try {
                          const batches: Record<string, { quantity: number; expirationDate: string }> = {};
                          if (newItem.qtyOnStock) {
                            const bRef = createBatchId();
                            batches[bRef] = { quantity: Number(newItem.qtyOnStock), expirationDate: newItem.expOnStock };
                          }
                          if (newItem.qtyNewStock) {
                            const bRef2 = createBatchId();
                            batches[bRef2] = { quantity: Number(newItem.qtyNewStock), expirationDate: newItem.expNewStock };
                          }
                          const itemRef = push(ref(db, "inventory"));
                          await set(itemRef, {
                            name: newItem.name.trim(),
                            unit: newItem.unit,
                            lowStockThreshold: Number(newItem.lowStockThreshold) || 0,
                            batches: Object.keys(batches).length > 0 ? batches : {},
                            lastUpdated: new Date().toISOString(),
                          });
                          setNewItem({ name: "", unit: "", qtyOnStock: "", expOnStock: "", qtyNewStock: "", expNewStock: "", lowStockThreshold: "" });
                          setIsAddModalOpen(false);
                          toast.success("Inventory item added successfully.");
                        } catch (error) {
                          console.error("Failed to add inventory item", error);
                          const message = "Could not add inventory item. Please check your Firebase permissions and try again.";
                          setAddError(message);
                          toast.error(message);
                        } finally { setAddSaving(false); }
                      }}
                    >
                      {addSaving ? "Adding…" : "Add Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Earliest Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isExpanded = expandedRows.has(item.id);
                  const totalQty = getTotalQuantity(item.batches);
                  const earliestExpiration = item.batches.length > 0
                    ? item.batches.reduce((earliest, batch) => {
                        return new Date(batch.expirationDate) < new Date(earliest) ? batch.expirationDate : earliest;
                      }, item.batches[0].expirationDate)
                    : "";

                  return (
                    <Fragment key={item.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRow(item.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <span className={totalQty <= item.lowStockThreshold ? "text-red-600" : ""}>
                            {totalQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Package className="w-3 h-3" />
                            {item.batches.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {earliestExpiration ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className={
                                isExpired(earliestExpiration) ? "text-red-600" :
                                isExpiringSoon(earliestExpiration) ? "text-orange-600" : ""
                              }>
                                {formatDate(earliestExpiration)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {totalQty <= item.lowStockThreshold ? (
                            <Badge className="bg-red-100 text-red-800 gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={isEditModalOpen && selectedItem?.id === item.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setIsEditModalOpen(true);
                                } else {
                                  closeEditModal();
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-2"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="w-3 h-3" />
                                  Update
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Manage Batches - {selectedItem?.name}</DialogTitle>
                                  <DialogDescription>
                                    Update stock quantities and expiration dates for all batches
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  {/* Display all batches */}
                                  {editBatches.map((batch, index) => (
                                    <div key={batch.id} className="border rounded-lg p-4 bg-muted/20">
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="font-semibold">Batch {index + 1}</Label>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500 hover:text-red-700"
                                          type="button"
                                          onClick={() => removeEditBatch(batch.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`batch-qty-${batch.id}`}>Quantity</Label>
                                          <Input 
                                            id={`batch-qty-${batch.id}`}
                                            type="number" 
                                            min="0"
                                            value={String(batch.quantity)}
                                            onChange={(e) => updateEditBatch(batch.id, "quantity", e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`batch-exp-${batch.id}`}>Expiration Date</Label>
                                          <Input 
                                            id={`batch-exp-${batch.id}`}
                                            type="date" 
                                            value={batch.expirationDate}
                                            onChange={(e) => updateEditBatch(batch.id, "expirationDate", e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Add New Batch Button */}
                                  <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    type="button"
                                    onClick={addEditBatch}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add New Batch
                                  </Button>

                                  <div className="bg-muted/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Total Stock:</span>
                                      <span>
                                        {getTotalQuantity(editBatches)} {selectedItem?.unit}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-low-stock-threshold">Low Stock Threshold</Label>
                                    <Input 
                                      id="edit-low-stock-threshold" 
                                      type="number" 
                                      min="0"
                                      value={editLowStockThreshold}
                                      onChange={(e) => {
                                        setEditError("");
                                        setEditLowStockThreshold(String(Math.max(0, Number(e.target.value))));
                                      }}
                                    />
                                  </div>
                                  {editError && (
                                    <p className="text-sm text-red-600">{editError}</p>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={closeEditModal}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    className="bg-primary hover:bg-primary/90" 
                                    onClick={saveItemChanges}
                                    disabled={editSaving}
                                  >
                                    {editSaving ? "Saving..." : "Save Changes"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteInventoryItem(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row - Batch Details */}
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4 space-y-2">
                              <p className="text-sm font-semibold text-muted-foreground mb-3">Batch Details:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.batches.map((batch, index) => (
                                  <div key={batch.id} className="border rounded-lg p-3 bg-background">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">Batch {index + 1}</span>
                                      {(isExpired(batch.expirationDate) || isExpiringSoon(batch.expirationDate)) && (
                                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                                      )}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Quantity:</span>
                                        <span className="font-medium">{batch.quantity} {item.unit}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Expires:</span>
                                        <span className={
                                          isExpired(batch.expirationDate) ? "text-red-600 font-medium" :
                                          isExpiringSoon(batch.expirationDate) ? "text-orange-600 font-medium" : ""
                                        }>
                                          {formatDate(batch.expirationDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
