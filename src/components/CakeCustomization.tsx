import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Upload, ShoppingCart, Minus, Plus, X, ImageIcon } from "lucide-react";
import { useCartStore } from "../store/cartStore";

type CakeType = "Fondant" | "Naked" | "Number" | "Bento";
type DiscountType = "none" | "senior" | "pwd";

interface TierOption {
  id: string;
  label: string;
  price: number;
}

interface DesignAddon {
  id: string;
  label: string;
  price: number;
  included?: boolean;
}

interface DessertBundle {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const TIER_OPTIONS: Record<CakeType, TierOption[]> = {
  Fondant: [
    { id: "1-tier-6x4", label: '1-Tier (6"x4")', price: 3200 },
    { id: "1-tier-8x6", label: '1-Tier (8"x6")', price: 5400 },
    { id: "2-tier", label: '2-Tier (8"x4" + 6"x4")', price: 5800 },
    { id: "3-tier", label: '3-Tier (10"x6" + 8"x6" + 6"x6")', price: 11000 },
  ],
  Naked: [
    { id: "1-tier-8x4", label: '1-Tier (8"x4")', price: 3500 },
    { id: "2-tier", label: '2-Tier (8"x4" + 6"x4")', price: 6500 },
    { id: "3-tier", label: '3-Tier (10"x4" + 8"x4" + 6"x4")', price: 10000 },
  ],
  Number: [
    { id: "standard", label: 'Standard (10" x 7" x 3")', price: 2000 },
    { id: "with-toppers", label: 'With Toppers (10" x 7" x 3")', price: 2500 },
  ],
  Bento: [
    { id: "small", label: '4"x2"', price: 500 },
    { id: "medium", label: '6"x3"', price: 1700 },
  ],
};

const DESIGN_ADDONS: DesignAddon[] = [
  { id: "character-toppers", label: "Edible Character Toppers (2-3 pcs)", price: 0, included: true },
  { id: "acrylic-topper", label: "Custom Acrylic Topper", price: 150 },
  { id: "dedication-board", label: "Dedication Board", price: 0, included: true },
];

const DESSERT_BUNDLES: Omit<DessertBundle, "quantity">[] = [
  { id: "cupcakes", name: "Cupcakes (Box of 12)", price: 850 },
  { id: "cakepops", name: "Cakepops (12 pcs)", price: 840 },
  { id: "cookies", name: "Sugar Cookies (12 pcs)", price: 960 },
];

const FLAVORS = [
  "Chocolate",
  "Vanilla",
  "Red Velvet",
  "Strawberry",
  "Ube",
  "Lemon",
  "Carrot",
  "Cookies & Cream",
];

export function CakeCustomization({ onGoToCart, autoOpenUpload }: { onGoToCart?: () => void; autoOpenUpload?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);

  // Auto-open file picker when coming from "Upload Design"
  useEffect(() => {
    if (autoOpenUpload) {
      setTimeout(() => {
        document.getElementById("image-upload")?.click();
      }, 100);
    }
  }, [autoOpenUpload]);

  const [cakeType, setCakeType] = useState<CakeType>("Fondant");
  const [selectedTier, setSelectedTier] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([
    "character-toppers",
    "dedication-board",
  ]);
  const [dessertBundles, setDessertBundles] = useState<DessertBundle[]>(
    DESSERT_BUNDLES.map((bundle) => ({ ...bundle, quantity: 0 }))
  );
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idHoldingPhotoFile, setIdHoldingPhotoFile] = useState<File | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFileName(null);
    const input = document.getElementById("image-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const updateBundleQuantity = (bundleId: string, change: number) => {
    setDessertBundles((prev) =>
      prev.map((bundle) =>
        bundle.id === bundleId
          ? { ...bundle, quantity: Math.max(0, bundle.quantity + change) }
          : bundle
      )
    );
  };

  const calculateTotal = () => {
    let total = 0;

    // Base cake price
    const selectedOption = TIER_OPTIONS[cakeType].find((opt) => opt.id === selectedTier);
    if (selectedOption) {
      total += selectedOption.price;
    }

    // Add-ons
    selectedAddons.forEach((addonId) => {
      const addon = DESIGN_ADDONS.find((a) => a.id === addonId);
      if (addon) {
        total += addon.price;
      }
    });

    // Dessert bundles
    dessertBundles.forEach((bundle) => {
      total += bundle.price * bundle.quantity;
    });

    return total;
  };

  const totalPrice = calculateTotal();
  const discountAmount = discountType !== "none" ? totalPrice * 0.20 : 0;
  const finalPrice = totalPrice - discountAmount;

  const handleAddToCart = () => {
    const tierLabel = TIER_OPTIONS[cakeType].find((o) => o.id === selectedTier)?.label ?? "";
    addItem({
      id: `custom-${Date.now()}`,
      name: `${cakeType} Cake`,
      description: `${tierLabel} · ${selectedFlavor}${message ? ` · "${message}"` : ""}`,
      price: finalPrice,
    });
    onGoToCart?.();
  };

  // Determine recommended vehicle for pickup
  const getRecommendedVehicle = () => {
    const selectedOption = TIER_OPTIONS[cakeType].find((opt) => opt.id === selectedTier);
    const hasCupcakes = dessertBundles.find(b => b.id === "cupcakes" && b.quantity > 0);
    
    // Check if it's a 1-tier cake or has cupcakes only
    if (selectedOption?.label.includes("1-Tier") || hasCupcakes) {
      return "Sedan";
    }
    
    // Check if it's a tiered cake (2-tier or 3-tier)
    if (selectedOption?.label.includes("2-Tier") || selectedOption?.label.includes("3-Tier")) {
      return "MPV (Multi-Purpose Vehicle)";
    }
    
    return "Sedan";
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <div className="mb-6">
        <h1 className="mb-2">Customize Your Cake</h1>
        <p className="text-muted-foreground">
          Design your perfect cake with our customization options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Form */}
        <div className="space-y-4">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Design</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {!uploadedImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium mb-1">
                    {isDragOver ? "Drop your image here!" : "Drag & drop your image here"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports JPG, PNG, WEBP, GIF
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); document.getElementById("image-upload")?.click(); }}>
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={uploadedImage}
                    alt="Uploaded design"
                    className="w-full max-h-64 object-contain bg-secondary/10"
                  />
                  <div className="p-3 bg-secondary/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate text-muted-foreground">{uploadedFileName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-primary font-medium">✓ Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-t-none border-t"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    Replace Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cake Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Cake Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {(["Fondant", "Naked", "Number", "Bento"] as CakeType[]).map((type) => (
                  <Button
                    key={type}
                    variant={cakeType === type ? "default" : "outline"}
                    onClick={() => {
                      setCakeType(type);
                      setSelectedTier("");
                    }}
                    className={`${
                      cakeType === type
                        ? "bg-primary hover:bg-primary/90"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tier & Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tier & Size</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                <div className="space-y-2">
                  {TIER_OPTIONS[cakeType].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTier === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                      <span className="text-primary">₱{option.price.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Flavor Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Flavor</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flavor" />
                </SelectTrigger>
                <SelectContent>
                  {FLAVORS.map((flavor) => (
                    <SelectItem key={flavor} value={flavor.toLowerCase()}>
                      {flavor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle>Message on Cake</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Happy Birthday Sarah!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Add-ons & Summary */}
        <div className="space-y-4">
          {/* Design Add-ons */}
          <Card>
            <CardHeader>
              <CardTitle>Design Add-ons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DESIGN_ADDONS.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <span className="text-sm">{addon.label}</span>
                    </div>
                    <span className={`text-sm ${addon.included ? "text-primary" : "text-muted-foreground"}`}>
                      {addon.included ? "Included" : `+₱${addon.price}`}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dessert Bundle Add-ons */}
          <Card>
            <CardHeader>
              <CardTitle>Dessert Bundles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dessertBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="text-sm">{bundle.name}</p>
                      <p className="text-xs text-muted-foreground">₱{bundle.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateBundleQuantity(bundle.id, -1)}
                        disabled={bundle.quantity === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{bundle.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateBundleQuantity(bundle.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="sticky top-24 shadow-lg border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-center">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cake Type:</span>
                  <span>{cakeType}</span>
                </div>
                
                {selectedTier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <span>
                      {TIER_OPTIONS[cakeType].find((opt) => opt.id === selectedTier)?.label}
                    </span>
                  </div>
                )}

                {selectedFlavor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Flavor:</span>
                    <span className="capitalize">{selectedFlavor}</span>
                  </div>
                )}

                {message && (
                  <div className="flex justify-between text-sm items-start">
                    <span className="text-muted-foreground">Message:</span>
                    <span className="text-right max-w-[60%] break-words">"{message}"</span>
                  </div>
                )}

                {uploadedImage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custom Image:</span>
                    <span className="text-primary">✓ Uploaded</span>
                  </div>
                )}
              </div>

              {/* Add-ons Summary */}
              {(selectedAddons.some(id => DESIGN_ADDONS.find(a => a.id === id && a.price > 0)) ||
                dessertBundles.some(b => b.quantity > 0)) && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">Add-ons:</p>
                  {selectedAddons.map((addonId) => {
                    const addon = DESIGN_ADDONS.find((a) => a.id === addonId);
                    if (addon && addon.price > 0) {
                      return (
                        <div key={addonId} className="flex justify-between text-sm">
                          <span>{addon.label}</span>
                          <span>+₱{addon.price}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {dessertBundles.map((bundle) => {
                    if (bundle.quantity > 0) {
                      return (
                        <div key={bundle.id} className="flex justify-between text-sm">
                          <span>{bundle.name} (×{bundle.quantity})</span>
                          <span>+₱{(bundle.price * bundle.quantity).toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Discount Selector */}
              <div className="pt-3 border-t space-y-2">
                <Label className="text-sm">Discount (if applicable)</Label>
                <Select value={discountType} onValueChange={(value: DiscountType) => setDiscountType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Discount</SelectItem>
                    <SelectItem value="senior">Senior Citizen (20%)</SelectItem>
                    <SelectItem value="pwd">PWD (20%)</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* ID Photo Uploads - Shows when discount is selected */}
                {discountType !== "none" && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Please upload photos of your ID for verification
                    </p>
                    
                    {/* Picture of ID */}
                    <div className="space-y-1">
                      <Label htmlFor="id-photo" className="text-xs">
                        1. Picture of ID
                      </Label>
                      <div className="relative">
                        <input
                          type="file"
                          id="id-photo"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setIdPhotoFile(file);
                          }}
                        />
                        <label
                          htmlFor="id-photo"
                          className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {idPhotoFile ? idPhotoFile.name : "Upload ID Photo"}
                          </span>
                        </label>
                        {idPhotoFile && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            ✓ Uploaded successfully
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Owner holding ID */}
                    <div className="space-y-1">
                      <Label htmlFor="id-holding-photo" className="text-xs">
                        2. ID Owner Holding ID
                      </Label>
                      <div className="relative">
                        <input
                          type="file"
                          id="id-holding-photo"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setIdHoldingPhotoFile(file);
                          }}
                        />
                        <label
                          htmlFor="id-holding-photo"
                          className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {idHoldingPhotoFile ? idHoldingPhotoFile.name : "Upload Photo with ID"}
                          </span>
                        </label>
                        {idHoldingPhotoFile && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            ✓ Uploaded successfully
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-3 border-t-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="text-muted-foreground">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount (20%):</span>
                    <span>
                      -₱{discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-primary font-semibold text-lg">
                    ₱{finalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Pickup Details */}
              {selectedTier && (
                <div className="pt-3 border-t bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Pickup Vehicle Recommendation:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✓ Recommended: <span className="font-medium">{getRecommendedVehicle()}</span>
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                    <span>⚠️</span>
                    <span>Motorcycles are not allowed for cake delivery to ensure safe transportation.</span>
                  </p>
                </div>
              )}

              {/* Payment Information */}
              {selectedTier && (
                <div className="pt-3 border-t bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Payment Information:
                  </p>
                  <div className="space-y-2 text-xs text-amber-900 dark:text-amber-100">
                    <div className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <p>
                        <span className="font-semibold">Deposits:</span> A 50% deposit (₱{(finalPrice * 0.5).toLocaleString()}) is required at the time of ordering.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">•</span>
                      <p>
                        <span className="font-semibold">Final Balance:</span> We recommend paying the remaining balance (₱{(finalPrice * 0.5).toLocaleString()}) via <span className="font-medium">Cash</span>, <span className="font-medium">BDO to BDO</span>, or <span className="font-medium">GCash to GCash</span> for faster processing and added security.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-amber-200 dark:border-amber-800">
                      <span>⚠️</span>
                      <p className="text-red-700 dark:text-red-400">
                        The cake will only be <span className="font-semibold">released once the balance is fully settled</span>. To avoid delays, ensure the balance is paid before the delivery is scheduled. We do not accept payments after the cake is delivered or received.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 mt-4"
                disabled={!selectedTier || !selectedFlavor}
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>

              {/* Pay Deposit Button */}
              {selectedTier && (
                <Button
                  variant="outline"
                  className="w-full gap-2 mt-2"
                  size="lg"
                  onClick={() => setShowQRPayment(true)}
                >
                  View QR Payment Options
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Payment Dialog/Modal */}
      <Dialog open={showQRPayment} onOpenChange={setShowQRPayment}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Pay 50% Deposit</DialogTitle>
            <DialogDescription className="text-center">
              Scan QR code to pay ₱{(finalPrice * 0.5).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* GCash Payment */}
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-center mb-3">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">GCash Payment</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Scan with GCash App</p>
              </div>
              
              {/* Mockup QR Code for GCash */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-4 border-blue-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 ${
                            Math.random() > 0.5 ? 'bg-blue-900' : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-blue-900">GCASH QR</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-blue-900 dark:text-blue-100">
                <p><span className="font-semibold">Account Name:</span> Cake with Joy</p>
                <p><span className="font-semibold">Account Number:</span> 09XX XXX XXXX</p>
                <p><span className="font-semibold">Amount:</span> ₱{(finalPrice * 0.5).toLocaleString()}</p>
              </div>
            </div>

            {/* BDO Payment */}
            <div className="border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
              <div className="text-center mb-3">
                <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">BDO Bank Transfer</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">Scan with BDO App or use account details</p>
              </div>
              
              {/* Mockup QR Code for BDO */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border-4 border-orange-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 ${
                            Math.random() > 0.5 ? 'bg-orange-900' : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-orange-900">BDO QR</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-orange-900 dark:text-orange-100">
                <p><span className="font-semibold">Account Name:</span> Cake with Joy</p>
                <p><span className="font-semibold">Account Number:</span> 0123 4567 8901</p>
                <p><span className="font-semibold">Amount:</span> ₱{(finalPrice * 0.5).toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-2">
              <p className="font-semibold">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Scan the QR code using your preferred payment app</li>
                <li>Enter the exact deposit amount: ₱{(finalPrice * 0.5).toLocaleString()}</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Send the screenshot to verify your order</li>
              </ol>
              <p className="text-primary pt-2">
                ✓ Your order will be confirmed once payment is verified
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}