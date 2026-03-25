import { useState } from "react";
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

interface Batch {
  id: string;
  quantity: number;
  expirationDate: string;
}

interface InventoryItem {
  id: number;
  name: string;
  batches: Batch[];
  unit: string;
  lowStockThreshold: number;
  lastUpdated: string;
}

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: 1,
      name: "All-Purpose Flour",
      batches: [
        { id: "1a", quantity: 15, expirationDate: "2025-12-15" },
        { id: "1b", quantity: 10, expirationDate: "2026-01-20" },
        { id: "1c", quantity: 5, expirationDate: "2026-02-10" },
      ],
      unit: "kg",
      lowStockThreshold: 5,
      lastUpdated: "Nov 10, 2025",
    },
    {
      id: 2,
      name: "Granulated Sugar",
      batches: [
        { id: "2a", quantity: 8, expirationDate: "2026-03-10" },
        { id: "2b", quantity: 7, expirationDate: "2026-04-15" },
        { id: "2c", quantity: 5, expirationDate: "2026-05-20" },
      ],
      unit: "kg",
      lowStockThreshold: 5,
      lastUpdated: "Nov 10, 2025",
    },
    {
      id: 3,
      name: "Unsalted Butter",
      batches: [
        { id: "3a", quantity: 1, expirationDate: "2025-12-05" },
        { id: "3b", quantity: 2, expirationDate: "2025-12-20" },
      ],
      unit: "kg",
      lowStockThreshold: 5,
      lastUpdated: "Nov 11, 2025",
    },
    {
      id: 4,
      name: "Vanilla Extract",
      batches: [
        { id: "4a", quantity: 300, expirationDate: "2026-06-15" },
        { id: "4b", quantity: 200, expirationDate: "2026-08-20" },
        { id: "4c", quantity: 150, expirationDate: "2026-10-05" },
        { id: "4d", quantity: 100, expirationDate: "2026-12-01" },
      ],
      unit: "ml",
      lowStockThreshold: 100,
      lastUpdated: "Nov 9, 2025",
    },
    {
      id: 5,
      name: "Cocoa Powder",
      batches: [
        { id: "5a", quantity: 0.5, expirationDate: "2026-01-30" },
        { id: "5b", quantity: 1.5, expirationDate: "2026-03-15" },
      ],
      unit: "kg",
      lowStockThreshold: 3,
      lastUpdated: "Nov 11, 2025",
    },
    {
      id: 6,
      name: "Eggs (Large)",
      batches: [
        { id: "6a", quantity: 36, expirationDate: "2025-12-08" },
        { id: "6b", quantity: 24, expirationDate: "2025-12-15" },
      ],
      unit: "pcs",
      lowStockThreshold: 24,
      lastUpdated: "Nov 11, 2025",
    },
    {
      id: 7,
      name: "Heavy Cream",
      batches: [
        { id: "7a", quantity: 0.5, expirationDate: "2025-12-03" },
        { id: "7b", quantity: 1.5, expirationDate: "2025-12-10" },
      ],
      unit: "liters",
      lowStockThreshold: 3,
      lastUpdated: "Nov 11, 2025",
    },
    {
      id: 8,
      name: "Baking Powder",
      batches: [
        { id: "8a", quantity: 0.8, expirationDate: "2026-05-20" },
        { id: "8b", quantity: 0.7, expirationDate: "2026-07-10" },
      ],
      unit: "kg",
      lowStockThreshold: 0.5,
      lastUpdated: "Nov 8, 2025",
    },
    {
      id: 9,
      name: "Powdered Sugar",
      batches: [
        { id: "9a", quantity: 6, expirationDate: "2026-02-25" },
        { id: "9b", quantity: 4, expirationDate: "2026-04-10" },
      ],
      unit: "kg",
      lowStockThreshold: 3,
      lastUpdated: "Nov 10, 2025",
    },
    {
      id: 10,
      name: "Food Coloring Set",
      batches: [
        { id: "10a", quantity: 2, expirationDate: "2027-01-15" },
        { id: "10b", quantity: 1, expirationDate: "2027-03-20" },
      ],
      unit: "sets",
      lowStockThreshold: 2,
      lastUpdated: "Nov 5, 2025",
    },
  ]);

  const lowStockItems = inventoryItems.filter((item) => item.batches.reduce((total, batch) => total + batch.quantity, 0) <= item.lowStockThreshold);
  const lowStockCount = lowStockItems.length;

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const toggleRow = (itemId: number) => {
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
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input id="item-name" placeholder="e.g., All-Purpose Flour" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qty-on-stock">Qty On-Stock</Label>
                        <Input id="qty-on-stock" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiration-on-stock">Expiration (On-Stock)</Label>
                        <Input id="expiration-on-stock" type="date" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qty-new-stock">Qty New-Stock</Label>
                        <Input id="qty-new-stock" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiration-new-stock">Expiration (New-Stock)</Label>
                        <Input id="expiration-new-stock" type="date" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select>
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
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
                      <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                      <Input id="low-stock-threshold" type="number" placeholder="e.g., 5" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddModalOpen(false)}>
                      Add Item
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
                  const earliestExpiration = item.batches.reduce((earliest, batch) => {
                    return new Date(batch.expirationDate) < new Date(earliest) ? batch.expirationDate : earliest;
                  }, item.batches[0].expirationDate);

                  return (
                    <>
                      <TableRow key={item.id} className="hover:bg-muted/50">
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
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className={
                              isExpired(earliestExpiration) ? "text-red-600" :
                              isExpiringSoon(earliestExpiration) ? "text-orange-600" : ""
                            }>
                              {formatDate(earliestExpiration)}
                            </span>
                          </div>
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
                            <Dialog open={isEditModalOpen && selectedItem?.id === item.id} onOpenChange={setIsEditModalOpen}>
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
                                  {selectedItem?.batches.map((batch, index) => (
                                    <div key={batch.id} className="border rounded-lg p-4 bg-muted/20">
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="font-semibold">Batch {index + 1}</Label>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500 hover:text-red-700"
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
                                            defaultValue={batch.quantity}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`batch-exp-${batch.id}`}>Expiration Date</Label>
                                          <Input 
                                            id={`batch-exp-${batch.id}`}
                                            type="date" 
                                            defaultValue={batch.expirationDate}
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
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add New Batch
                                  </Button>

                                  <div className="bg-muted/50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Total Stock:</span>
                                      <span>
                                        {getTotalQuantity(selectedItem?.batches || [])} {selectedItem?.unit}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-low-stock-threshold">Low Stock Threshold</Label>
                                    <Input 
                                      id="edit-low-stock-threshold" 
                                      type="number" 
                                      defaultValue={selectedItem?.lowStockThreshold}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    className="bg-primary hover:bg-primary/90" 
                                    onClick={() => setIsEditModalOpen(false)}
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row - Batch Details */}
                      {isExpanded && (
                        <TableRow key={`${item.id}-expanded`} className="bg-muted/30">
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
                    </>
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