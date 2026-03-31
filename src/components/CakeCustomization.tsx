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
import { Upload, ShoppingCart, Minus, Plus, X, ImageIcon, Zap } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { DEFAULT_PRICING } from "./PricingManagement";

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

// Free add-ons that are always included — not admin-configurable
const INCLUDED_ADDONS: DesignAddon[] = [
  { id: "character-toppers", label: "Edible Character Toppers (2-3 pcs)", price: 0, included: true },
  { id: "dedication-board", label: "Dedication Board", price: 0, included: true },
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
    DEFAULT_PRICING.bundles.map((bundle) => ({ ...bundle, quantity: 0 }))
  );
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [rushOrder, setRushOrder] = useState(false);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idHoldingPhotoFile, setIdHoldingPhotoFile] = useState<File | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);

  // Load admin-configured pricing from Firebase
  useEffect(() => {
    const unsub = onValue(ref(db, "cakePricing"), (snap) => {
      const raw = snap.val();
      if (!raw) return;
      // Firebase RTDB stores arrays as numeric-keyed objects — normalize them back
      const normalized = {
        tiers: Object.fromEntries(
          Object.entries(raw.tiers || {}).map(([k, v]) => [k, Object.values(v as object)])
        ) as typeof DEFAULT_PRICING.tiers,
        addons: Object.values(raw.addons || {}) as typeof DEFAULT_PRICING.addons,
        bundles: Object.values(raw.bundles || {}) as typeof DEFAULT_PRICING.bundles,
        flavors: Object.values(raw.flavors || {}) as string[],
      };
      setPricing(normalized);
      setDessertBundles(normalized.bundles.map((b) => ({ ...b, quantity: 0 })));
    });
    return () => unsub();
  }, []);

  // Combine always-free add-ons with admin-configurable paid add-ons
  const allAddons: DesignAddon[] = [
    INCLUDED_ADDONS[0],
    ...pricing.addons.map((a) => ({ ...a, included: false as const })),
    INCLUDED_ADDONS[1],
  ];

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
    const selectedOption = (pricing.tiers[cakeType] ?? []).find((opt) => opt.id === selectedTier);
    if (selectedOption) {
      total += selectedOption.price;
    }

    // Add-ons
    selectedAddons.forEach((addonId) => {
      const addon = allAddons.find((a) => a.id === addonId);
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
  const discountedPrice = totalPrice - discountAmount;
  const rushFee = rushOrder ? Math.round(discountedPrice * 0.20) : 0;
  const finalPrice = discountedPrice + rushFee;

  const handleAddToCart = () => {
    const tierLabel = (pricing.tiers[cakeType] ?? []).find((o) => o.id === selectedTier)?.label ?? "";
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
    const selectedOption = (pricing.tiers[cakeType] ?? []).find((opt) => opt.id === selectedTier);
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

  // Shared card style
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 20,
    border: "1.5px solid rgba(216,159,200,0.3)",
    boxShadow: "0 2px 16px rgba(199,125,179,0.08)",
    overflow: "hidden",
    marginBottom: 0,
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "18px 22px 14px",
    borderBottom: "1px solid rgba(216,159,200,0.18)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: "#4a2e42",
    fontFamily: "Georgia, serif",
    margin: 0,
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: "18px 22px",
  };

  return (
    <div style={{ background: "#F4E9F2", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ background: "linear-gradient(135deg, #f9eef7 0%, #f0d9ec 50%, #F4E9F2 100%)", borderBottom: "1px solid rgba(216,159,200,0.25)", padding: "36px 0 28px" }}>
        <div className="container mx-auto px-6">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c77db3", marginBottom: 6 }}>
            Build Your Order
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0, fontFamily: "Georgia, serif", lineHeight: 1.1 }}>
            Customize Your Cake
          </h1>
          <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6, marginBottom: 0 }}>
            Design your perfect cake with our customization options.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-6" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Upload Design */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Upload Your Design</p>
              </div>
              <div style={cardBodyStyle}>
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
                    onClick={() => document.getElementById("image-upload")?.click()}
                    style={{
                      border: `2px dashed ${isDragOver ? "#c77db3" : "rgba(216,159,200,0.5)"}`,
                      borderRadius: 14,
                      padding: "32px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: isDragOver ? "rgba(199,125,179,0.06)" : "rgba(249,238,247,0.4)",
                      transition: "all 0.2s",
                    }}
                  >
                    <Upload style={{ width: 36, height: 36, margin: "0 auto 12px", color: isDragOver ? "#c77db3" : "#8b6f84", display: "block" }} />
                    <p style={{ fontWeight: 600, color: "#4a2e42", marginBottom: 4, fontSize: 14 }}>
                      {isDragOver ? "Drop your image here!" : "Drag & drop your image here"}
                    </p>
                    <p style={{ fontSize: 12, color: "#8b6f84", marginBottom: 16 }}>Supports JPG, PNG, WEBP, GIF</p>
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); document.getElementById("image-upload")?.click(); }}
                      style={{
                        background: "none",
                        border: "1.5px solid rgba(216,159,200,0.6)",
                        borderRadius: 100,
                        padding: "7px 20px",
                        fontSize: 13,
                        color: "#8b6f84",
                        cursor: "pointer",
                        fontFamily: "system-ui, sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      Browse Files
                    </button>
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(216,159,200,0.3)" }}>
                    <img
                      src={uploadedImage}
                      alt="Uploaded design"
                      style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block", background: "#f9eef7" }}
                    />
                    <div style={{ padding: "10px 14px", background: "#f9eef7", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <ImageIcon style={{ width: 15, height: 15, color: "#c77db3", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#8b6f84", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFileName}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: "#c77db3", fontWeight: 600 }}>✓ Uploaded</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#8b6f84", padding: 4, display: "flex", alignItems: "center" }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      style={{
                        width: "100%", background: "none", border: "none", borderTop: "1px solid rgba(216,159,200,0.3)",
                        padding: "9px 0", fontSize: 13, color: "#8b6f84", cursor: "pointer",
                        fontFamily: "system-ui, sans-serif", fontWeight: 500,
                      }}
                    >
                      Replace Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cake Type */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Cake Type</p>
              </div>
              <div style={cardBodyStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {(["Fondant", "Naked", "Number", "Bento"] as CakeType[]).map((type) => {
                    const active = cakeType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => { setCakeType(type); setSelectedTier(""); }}
                        style={{
                          padding: "9px 0",
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: active ? "none" : "1.5px solid rgba(216,159,200,0.5)",
                          background: active ? "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)" : "#ffffff",
                          color: active ? "#ffffff" : "#8b6f84",
                          boxShadow: active ? "0 4px 14px rgba(199,125,179,0.35)" : "none",
                          transition: "all 0.18s",
                          fontFamily: "system-ui, sans-serif",
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tier & Size */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Tier & Size</p>
              </div>
              <div style={cardBodyStyle}>
                <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(pricing.tiers[cakeType] ?? []).map((option) => {
                      const active = selectedTier === option.id;
                      return (
                        <label
                          key={option.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: active ? "2px solid #c77db3" : "1.5px solid rgba(216,159,200,0.3)",
                            background: active ? "rgba(199,125,179,0.05)" : "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.18s",
                            borderLeft: active ? "4px solid #c77db3" : undefined,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <RadioGroupItem value={option.id} id={option.id} />
                            <span style={{ fontSize: 13, color: "#4a2e42" }}>{option.label}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#c77db3" }}>₱{option.price.toLocaleString()}</span>
                        </label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Flavor */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Flavor</p>
              </div>
              <div style={cardBodyStyle}>
                <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                  <SelectTrigger style={{ borderColor: "rgba(216,159,200,0.5)", borderRadius: 10, color: "#4a2e42" }}>
                    <SelectValue placeholder="Select flavor" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricing.flavors.map((flavor) => (
                      <SelectItem key={flavor} value={flavor.toLowerCase()}>
                        {flavor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message on Cake */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Message on Cake</p>
              </div>
              <div style={cardBodyStyle}>
                <Textarea
                  placeholder="e.g., Happy Birthday Sarah!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  style={{ borderColor: "rgba(216,159,200,0.5)", borderRadius: 10, color: "#4a2e42", resize: "none" }}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Design Add-ons */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Design Add-ons</p>
              </div>
              <div style={cardBodyStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allAddons.map((addon) => {
                    const checked = selectedAddons.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "11px 14px",
                          borderRadius: 12,
                          border: checked ? "1.5px solid rgba(199,125,179,0.45)" : "1.5px solid rgba(216,159,200,0.25)",
                          background: checked ? "rgba(199,125,179,0.04)" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.18s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Checkbox
                            id={addon.id}
                            checked={checked}
                            onCheckedChange={() => handleAddonToggle(addon.id)}
                          />
                          <span style={{ fontSize: 13, color: "#4a2e42" }}>{addon.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: addon.included ? "#c77db3" : "#8b6f84" }}>
                          {addon.included ? "Included" : `+₱${addon.price}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dessert Bundles */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <p style={cardTitleStyle}>Dessert Bundles</p>
              </div>
              <div style={cardBodyStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dessertBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: bundle.quantity > 0 ? "1.5px solid rgba(199,125,179,0.4)" : "1.5px solid rgba(216,159,200,0.25)",
                        background: bundle.quantity > 0 ? "rgba(199,125,179,0.04)" : "#ffffff",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: "#4a2e42", margin: 0, fontWeight: 500 }}>{bundle.name}</p>
                        <p style={{ fontSize: 11, color: "#8b6f84", margin: "2px 0 0" }}>₱{bundle.price.toLocaleString()} each</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          onClick={() => updateBundleQuantity(bundle.id, -1)}
                          disabled={bundle.quantity === 0}
                          style={{
                            width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1.5px solid rgba(216,159,200,0.5)", background: bundle.quantity === 0 ? "#f9f9f9" : "#fff",
                            cursor: bundle.quantity === 0 ? "not-allowed" : "pointer", color: bundle.quantity === 0 ? "#ccc" : "#8b6f84",
                            transition: "all 0.15s",
                          }}
                        >
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#4a2e42", minWidth: 20, textAlign: "center" }}>{bundle.quantity}</span>
                        <button
                          onClick={() => updateBundleQuantity(bundle.id, 1)}
                          style={{
                            width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            border: "none", background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
                            cursor: "pointer", color: "#fff", transition: "all 0.15s",
                          }}
                        >
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary — sticky card */}
            <div style={{ ...cardStyle, position: "sticky", top: 24, border: "2px solid rgba(199,125,179,0.3)", boxShadow: "0 8px 32px rgba(199,125,179,0.14)" }}>
              {/* Summary header with gradient */}
              <div style={{ background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)", padding: "16px 22px" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: "Georgia, serif", margin: 0, textAlign: "center" }}>
                  Order Summary
                </p>
              </div>

              <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 0 }}>

                {/* Cake details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#8b6f84" }}>Cake Type:</span>
                    <span style={{ color: "#4a2e42", fontWeight: 500 }}>{cakeType}</span>
                  </div>
                  {selectedTier && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#8b6f84" }}>Size:</span>
                      <span style={{ color: "#4a2e42", fontWeight: 500 }}>
                        {(pricing.tiers[cakeType] ?? []).find((opt) => opt.id === selectedTier)?.label}
                      </span>
                    </div>
                  )}
                  {selectedFlavor && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#8b6f84" }}>Flavor:</span>
                      <span style={{ color: "#4a2e42", fontWeight: 500, textTransform: "capitalize" }}>{selectedFlavor}</span>
                    </div>
                  )}
                  {message && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: "#8b6f84", flexShrink: 0 }}>Message:</span>
                      <span style={{ color: "#4a2e42", fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>"{message}"</span>
                    </div>
                  )}
                  {uploadedImage && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#8b6f84" }}>Custom Image:</span>
                      <span style={{ color: "#c77db3", fontWeight: 600 }}>✓ Uploaded</span>
                    </div>
                  )}
                </div>

                {/* Add-ons summary */}
                {(selectedAddons.some(id => allAddons.find(a => a.id === id && a.price > 0)) ||
                  dessertBundles.some(b => b.quantity > 0)) && (
                  <div style={{ borderTop: "1px solid rgba(216,159,200,0.25)", paddingTop: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 12, color: "#8b6f84", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Add-ons</p>
                    {selectedAddons.map((addonId) => {
                      const addon = allAddons.find((a) => a.id === addonId);
                      if (addon && addon.price > 0) {
                        return (
                          <div key={addonId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "#4a2e42" }}>{addon.label}</span>
                            <span style={{ color: "#8b6f84" }}>+₱{addon.price}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    {dessertBundles.map((bundle) => {
                      if (bundle.quantity > 0) {
                        return (
                          <div key={bundle.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "#4a2e42" }}>{bundle.name} (×{bundle.quantity})</span>
                            <span style={{ color: "#8b6f84" }}>+₱{(bundle.price * bundle.quantity).toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Discount selector */}
                <div style={{ borderTop: "1px solid rgba(216,159,200,0.25)", paddingTop: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Label style={{ fontSize: 12, color: "#8b6f84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Discount (if applicable)
                  </Label>
                  <Select value={discountType} onValueChange={(value: DiscountType) => setDiscountType(value)}>
                    <SelectTrigger className="w-full" style={{ borderColor: "rgba(216,159,200,0.5)", borderRadius: 10, color: "#4a2e42" }}>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="senior">Senior Citizen (20%)</SelectItem>
                      <SelectItem value="pwd">PWD (20%)</SelectItem>
                    </SelectContent>
                  </Select>

                  {discountType !== "none" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                      <p style={{ fontSize: 12, color: "#8b6f84", margin: 0 }}>
                        Please upload photos of your ID for verification
                      </p>

                      {/* Picture of ID */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <Label htmlFor="id-photo" style={{ fontSize: 12, color: "#4a2e42", fontWeight: 500 }}>
                          1. Picture of ID
                        </Label>
                        <input type="file" id="id-photo" className="hidden" accept="image/*"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) setIdPhotoFile(file); }} />
                        <label
                          htmlFor="id-photo"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "9px 14px", border: "2px dashed rgba(216,159,200,0.5)", borderRadius: 10,
                            cursor: "pointer", fontSize: 12, color: "#8b6f84", background: "rgba(249,238,247,0.4)",
                          }}
                        >
                          <Upload style={{ width: 14, height: 14 }} />
                          {idPhotoFile ? idPhotoFile.name : "Upload ID Photo"}
                        </label>
                        {idPhotoFile && (
                          <p style={{ fontSize: 11, color: "#22c55e", margin: 0 }}>✓ Uploaded successfully</p>
                        )}
                      </div>

                      {/* ID Owner holding ID */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <Label htmlFor="id-holding-photo" style={{ fontSize: 12, color: "#4a2e42", fontWeight: 500 }}>
                          2. ID Owner Holding ID
                        </Label>
                        <input type="file" id="id-holding-photo" className="hidden" accept="image/*"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) setIdHoldingPhotoFile(file); }} />
                        <label
                          htmlFor="id-holding-photo"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "9px 14px", border: "2px dashed rgba(216,159,200,0.5)", borderRadius: 10,
                            cursor: "pointer", fontSize: 12, color: "#8b6f84", background: "rgba(249,238,247,0.4)",
                          }}
                        >
                          <Upload style={{ width: 14, height: 14 }} />
                          {idHoldingPhotoFile ? idHoldingPhotoFile.name : "Upload Photo with ID"}
                        </label>
                        {idHoldingPhotoFile && (
                          <p style={{ fontSize: 11, color: "#22c55e", margin: 0 }}>✓ Uploaded successfully</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing breakdown */}
                <div style={{ borderTop: "1px solid rgba(216,159,200,0.25)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#8b6f84" }}>Subtotal:</span>
                    <span style={{ color: "#4a2e42" }}>₱{totalPrice.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#22c55e" }}>Discount (20%):</span>
                      <span style={{ color: "#22c55e" }}>-₱{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "2px solid rgba(216,159,200,0.35)", marginTop: 4 }}>
                    <span style={{ fontWeight: 600, color: "#4a2e42", fontSize: 15 }}>Total Amount:</span>
                    <span style={{ fontWeight: 700, color: "#c77db3", fontSize: 20, fontFamily: "Georgia, serif" }}>
                      ₱{finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pickup Vehicle Recommendation */}
                {selectedTier && (
                  <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(219,234,254,0.6)", border: "1px solid rgba(147,197,253,0.4)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", margin: 0 }}>
                      Pickup Vehicle Recommendation:
                    </p>
                    <p style={{ fontSize: 12, color: "#1d4ed8", margin: 0 }}>
                      ✓ Recommended: <strong>{getRecommendedVehicle()}</strong>
                    </p>
                    <p style={{ fontSize: 11, color: "#dc2626", margin: 0, display: "flex", gap: 4, alignItems: "flex-start" }}>
                      <span>⚠️</span>
                      <span>Motorcycles are not allowed for cake delivery to ensure safe transportation.</span>
                    </p>
                  </div>
                )}

                {/* Payment Information */}
                {selectedTier && (
                  <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(254,243,199,0.7)", border: "1px solid rgba(252,211,77,0.4)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", margin: 0 }}>
                      Payment Information:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#78350f" }}>
                        <span style={{ fontWeight: 600 }}>•</span>
                        <p style={{ margin: 0 }}>
                          <strong>Deposits:</strong> A 50% deposit (₱{(finalPrice * 0.5).toLocaleString()}) is required at the time of ordering.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#78350f" }}>
                        <span style={{ fontWeight: 600 }}>•</span>
                        <p style={{ margin: 0 }}>
                          <strong>Final Balance:</strong> We recommend paying the remaining balance (₱{(finalPrice * 0.5).toLocaleString()}) via <strong>Cash</strong>, <strong>BDO to BDO</strong>, or <strong>GCash to GCash</strong> for faster processing and added security.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#dc2626", borderTop: "1px solid rgba(252,211,77,0.4)", paddingTop: 6 }}>
                        <span>⚠️</span>
                        <p style={{ margin: 0 }}>
                          The cake will only be <strong>released once the balance is fully settled</strong>. To avoid delays, ensure the balance is paid before the delivery is scheduled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <button
                  disabled={!selectedTier || !selectedFlavor}
                  onClick={handleAddToCart}
                  style={{
                    marginTop: 18,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px 0",
                    borderRadius: 100,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "system-ui, sans-serif",
                    cursor: !selectedTier || !selectedFlavor ? "not-allowed" : "pointer",
                    border: "none",
                    background: !selectedTier || !selectedFlavor
                      ? "rgba(216,159,200,0.35)"
                      : "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
                    color: !selectedTier || !selectedFlavor ? "#c0a0b8" : "#fff",
                    boxShadow: !selectedTier || !selectedFlavor ? "none" : "0 6px 20px rgba(199,125,179,0.4)",
                    transition: "all 0.2s",
                    letterSpacing: "0.02em",
                  }}
                >
                  <ShoppingCart style={{ width: 18, height: 18 }} />
                  Add to Cart
                </button>

                {/* View QR Payment */}
                {selectedTier && (
                  <button
                    onClick={() => setShowQRPayment(true)}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 0",
                      borderRadius: 100,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "system-ui, sans-serif",
                      cursor: "pointer",
                      border: "1.5px solid rgba(216,159,200,0.6)",
                      background: "none",
                      color: "#8b6f84",
                      transition: "all 0.18s",
                    }}
                  >
                    View QR Payment Options
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Payment Dialog — unchanged */}
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
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-4 border-blue-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-blue-900' : 'bg-white'}`} />
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
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border-4 border-orange-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-orange-900' : 'bg-white'}`} />
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