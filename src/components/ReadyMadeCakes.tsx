import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ShoppingCart, Upload, Search, X, Tag, ChevronDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useCartStore } from "../store/cartStore";

type DiscountType = "none" | "senior" | "pwd";
type Category = "All" | "Birthday" | "Wedding" | "Anniversary" | "Baby Shower" | "Graduation" | "Holiday";

interface ReadyMadeCake {
  id: string;
  name: string;
  description: string;
  image: string;
  flavor: string;
  size: string;
  price: number;
  available: boolean;
  category: Category;
}

const CATEGORIES: { id: Category; emoji: string }[] = [
  { id: "All", emoji: "🎂" },
  { id: "Birthday", emoji: "🎉" },
  { id: "Wedding", emoji: "💍" },
  { id: "Anniversary", emoji: "💑" },
  { id: "Baby Shower", emoji: "🍼" },
  { id: "Graduation", emoji: "🎓" },
  { id: "Holiday", emoji: "🎄" },
];

// Default cakes — seeded to Firebase on first MenuManagement load
export const DEFAULT_CAKES: Omit<ReadyMadeCake, "id">[] = [
  { name: "Birthday Celebration Cake", description: "Colorful frosted cake perfect for birthday parties", image: "https://images.unsplash.com/photo-1582232655383-0826ba4f1347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNha2UlMjBjb2xvcmZ1bCUyMGZyb3N0aW5nfGVufDF8fHx8MTc3MDU2NzAwM3ww&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Vanilla", size: '8"x4"', price: 1800, available: true, category: "Birthday" },
  { name: "Chocolate Dream", description: "Rich chocolate cake with chocolate ganache", image: "https://images.unsplash.com/photo-1645805740318-31bb7604ffd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwZWxlZ2FudCUyMHNsaWNlZHxlbnwxfHx8fDE3NzA1NjcwMDR8MA&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Chocolate", size: '8"x4"', price: 2000, available: true, category: "Birthday" },
  { name: "Strawberry Delight", description: "Fresh strawberries with light cream frosting", image: "https://images.unsplash.com/photo-1573730886197-8636f98b2de0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZSUyMGRlY29yYXRlZCUyMGZyZXNofGVufDF8fHx8MTc3MDU2NzAwNHww&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Strawberry", size: '6"x4"', price: 1500, available: true, category: "Anniversary" },
  { name: "Classic Vanilla", description: "Traditional layered vanilla cake", image: "https://images.unsplash.com/photo-1719257795483-fd36e004549e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YW5pbGxhJTIwY2FrZSUyMGxheWVyZWQlMjBjbGFzc2ljfGVufDF8fHx8MTc3MDU2NzAwNXww&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Vanilla", size: '8"x6"', price: 2200, available: true, category: "Wedding" },
  { name: "Red Velvet Romance", description: "Classic red velvet with cream cheese frosting", image: "https://images.unsplash.com/photo-1700224643955-634f6f11418a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB2ZWx2ZXQlMjBjYWtlJTIwY3JlYW0lMjBjaGVlc2V8ZW58MXx8fHwxNzcwNTY3MDA1fDA&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Red Velvet", size: '8"x4"', price: 1900, available: true, category: "Wedding" },
  { name: "Ube Delight", description: "Filipino favorite purple yam cake", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZXxlbnwxfHx8fDE3NjI4MzAyNTN8MA&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Ube", size: '6"x4"', price: 1700, available: true, category: "Baby Shower" },
  { name: "Graduation Glory", description: "Elegant cake to celebrate academic achievements", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2FrZXxlbnwxfHx8fDE3NzA1NjcwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Chocolate", size: '8"x4"', price: 2100, available: true, category: "Graduation" },
  { name: "Holiday Special", description: "Festive cake for the holiday season", image: "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJpc3RtYXMlMjBjYWtlJTIwZmVzdGl2ZXxlbnwxfHx8fDE3NzA1NjcwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080", flavor: "Red Velvet", size: '8"x6"', price: 2500, available: true, category: "Holiday" },
];

export function ReadyMadeCakes({ initialCategory }: { initialCategory?: string }) {
  const [cakes, setCakes] = useState<ReadyMadeCake[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCake, setSelectedCake] = useState<ReadyMadeCake | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>((initialCategory as Category) ?? "All");
  const [search, setSearch] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("none");

  useEffect(() => {
    const unsub = onValue(ref(db, "menuItems"), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setCakes([]); setLoadingMenu(false); return; }
      const list: ReadyMadeCake[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        ...(val as Omit<ReadyMadeCake, "id">),
      })).filter((c) => c.available); // customers only see available items
      setCakes(list);
      setLoadingMenu(false);
    });
    return () => unsub();
  }, []);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idHoldingPhotoFile, setIdHoldingPhotoFile] = useState<File | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit"); // New state for payment type

  const calculatePrice = () => {
    if (!selectedCake) return 0;
    const discountAmount = discountType !== "none" ? selectedCake.price * 0.20 : 0;
    return selectedCake.price - discountAmount;
  };

  const finalPrice = calculatePrice();
  const discountAmount = selectedCake && discountType !== "none" ? selectedCake.price * 0.20 : 0;

  const filteredCakes = cakes.filter((cake: ReadyMadeCake) => {
    const matchesCategory = activeCategory === "All" || cake.category === activeCategory;
    const matchesSearch = cake.name.toLowerCase().includes(search.toLowerCase()) ||
      cake.flavor.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loadingMenu) return (
    <div style={{ background: "#F4E9F2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b6f84", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
      Loading menu…
    </div>
  );

  return (
    <div style={{ background: "#F4E9F2", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #f9eef7 0%, #f0d9ec 50%, #F4E9F2 100%)", borderBottom: "1px solid rgba(216,159,200,0.25)", padding: "36px 0 28px" }}>
        <div className="container mx-auto px-6">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c77db3", marginBottom: 6 }}>
                Our Collection
              </p>
              <h1 style={{ fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0, fontFamily: "Georgia, serif", lineHeight: 1.1 }}>
                Cake Menu
              </h1>
              <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6, marginBottom: 0 }}>
                Handcrafted for every occasion — pick your favorite or customize your own.
              </p>
            </div>
            {/* Search */}
            <div style={{ position: "relative", minWidth: 260 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#8b6f84" }} />
              <Input
                placeholder="Search by name or flavor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(216,159,200,0.4)", borderRadius: 100, fontSize: 13, color: "#4a2e42" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">

        {/* ── Category Tabs ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {CATEGORIES.map((cat) => {
            const count = cat.id === "All" ? cakes.length : cakes.filter((c: ReadyMadeCake) => c.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedCake(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 500,
                  whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.18s",
                  border: active ? "none" : "1px solid rgba(216,159,200,0.4)",
                  background: active ? "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)" : "rgba(255,255,255,0.8)",
                  color: active ? "#fff" : "#8b6f84",
                  boxShadow: active ? "0 4px 14px rgba(199,125,179,0.35)" : "none",
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.id}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 100,
                  background: active ? "rgba(255,255,255,0.25)" : "rgba(216,159,200,0.15)",
                  color: active ? "#fff" : "#c77db3",
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Result line ── */}
        <p style={{ fontSize: 12, color: "#8b6f84", marginBottom: 20 }}>
          {filteredCakes.length} {filteredCakes.length === 1 ? "cake" : "cakes"} found
          {search && <> for "<span style={{ color: "#4a2e42", fontWeight: 600 }}>{search}</span>"</>}
        </p>

        {/* ── Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
          {filteredCakes.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: "80px 0", textAlign: "center", color: "#8b6f84" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>{search ? "🔍" : CATEGORIES.find(c => c.id === activeCategory)?.emoji}</p>
              <p style={{ fontWeight: 600, color: "#4a2e42" }}>{search ? "No cakes match your search" : "No cakes in this category yet"}</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>{search ? "Try a different keyword" : "Check back soon!"}</p>
            </div>
          ) : filteredCakes.map((cake) => {
            const isSelected = selectedCake?.id === cake.id;
            return (
              <div
                key={cake.id}
                onClick={() => setSelectedCake(cake)}
                className="group"
                style={{
                  background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer",
                  transition: "all 0.2s", border: isSelected ? "2px solid #c77db3" : "1.5px solid rgba(216,159,200,0.25)",
                  boxShadow: isSelected ? "0 8px 30px rgba(199,125,179,0.25)" : "0 2px 12px rgba(199,125,179,0.08)",
                  transform: isSelected ? "translateY(-2px)" : undefined,
                }}
                onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(199,125,179,0.2)"; } }}
                onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(199,125,179,0.08)"; } }}
              >
                {/* Image */}
                <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#f9eef7" }}>
                  <ImageWithFallback
                    src={cake.image}
                    alt={cake.name}
                    className="group-hover:scale-105"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", display: "block" }}
                  />
                  {/* Top badges */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                    {cake.available && (
                      <span style={{ background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.04em" }}>
                        AVAILABLE
                      </span>
                    )}
                  </div>
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "#c77db3", color: "#fff", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, boxShadow: "0 2px 8px rgba(199,125,179,0.5)" }}>
                      ✓
                    </div>
                  )}
                  {/* Bottom row: category + price */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 12px 10px", background: "linear-gradient(to top, rgba(74,46,66,0.7) 0%, transparent 100%)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <span style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 100 }}>
                      {CATEGORIES.find(c => c.id === cake.category)?.emoji} {cake.category}
                    </span>
                    <span style={{ background: "linear-gradient(135deg, #d89fc8, #c77db3)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 11px", borderRadius: 100, boxShadow: "0 2px 8px rgba(199,125,179,0.4)" }}>
                      ₱{cake.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#4a2e42", margin: 0, marginBottom: 4, lineHeight: 1.3 }}>{cake.name}</p>
                  <p style={{ fontSize: 12, color: "#8b6f84", margin: 0, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{cake.description}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 11, background: "rgba(216,159,200,0.12)", color: "#c77db3", padding: "3px 10px", borderRadius: 100, fontWeight: 500 }}>{cake.flavor}</span>
                    <span style={{ fontSize: 11, background: "rgba(216,159,200,0.12)", color: "#c77db3", padding: "3px 10px", borderRadius: 100, fontWeight: 500 }}>{cake.size}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Order Panel ── */}
      {selectedCake && (() => {
        const addItem = useCartStore.getState().addItem;

        const fileToDataUrl = (file: File): Promise<string> =>
          new Promise((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target!.result as string);
            reader.readAsDataURL(file);
          });

        const compressImage = (dataUrl: string, maxPx = 900): Promise<string> =>
          new Promise((res) => {
            const img = new Image();
            img.onload = () => {
              let { width: w, height: h } = img;
              if (w > maxPx || h > maxPx) {
                if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx; }
                else { w = Math.round((w * maxPx) / h); h = maxPx; }
              }
              const c = document.createElement("canvas");
              c.width = w; c.height = h;
              c.getContext("2d")!.drawImage(img, 0, 0, w, h);
              res(c.toDataURL("image/jpeg", 0.8));
            };
            img.src = dataUrl;
          });

        const handleAddToCart = async () => {
          let idPhoto: string | undefined;
          let idHoldingPhoto: string | undefined;
          if (discountType !== "none" && idPhotoFile && idHoldingPhotoFile) {
            const [raw1, raw2] = await Promise.all([
              fileToDataUrl(idPhotoFile),
              fileToDataUrl(idHoldingPhotoFile),
            ]);
            [idPhoto, idHoldingPhoto] = await Promise.all([
              compressImage(raw1),
              compressImage(raw2),
            ]);
          }
          addItem({
            id: selectedCake.id,
            name: selectedCake.name,
            description: `${selectedCake.flavor} · ${selectedCake.size}`,
            price: finalPrice,
            discountType: discountType !== "none" ? discountType : undefined,
            idPhoto,
            idHoldingPhoto,
          });
          setSelectedCake(null);
        };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 400, pointerEvents: "none" }}>
            {/* Backdrop */}
            <div
              onClick={() => setSelectedCake(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(74,46,66,0.25)", backdropFilter: "blur(2px)", pointerEvents: "all" }}
            />
            {/* Panel */}
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: 400,
              background: "#fff", boxShadow: "-8px 0 48px rgba(74,46,66,0.18)",
              display: "flex", flexDirection: "column", overflowY: "auto",
              fontFamily: "system-ui, sans-serif", pointerEvents: "all",
            }}>

              {/* Cake image hero */}
              <div style={{ position: "relative", height: 240, flexShrink: 0, background: "#f5e6f2" }}>
                <ImageWithFallback
                  src={selectedCake.image}
                  alt={selectedCake.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(74,46,66,0.75) 0%, transparent 55%)" }} />
                {/* Close */}
                <button
                  onClick={() => setSelectedCake(null)}
                  style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
                >
                  <X size={15} color="#4a2e42" />
                </button>
                {/* Name overlay */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", color: "#fff", padding: "2px 10px", borderRadius: 100 }}>
                      {CATEGORIES.find(c => c.id === selectedCake.category)?.emoji} {selectedCake.category}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>{selectedCake.name}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{selectedCake.description}</p>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Flavor + Size pills */}
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "rgba(216,159,200,0.1)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(216,159,200,0.3)" }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>Flavor</p>
                    <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: "#4a2e42" }}>{selectedCake.flavor}</p>
                  </div>
                  <div style={{ flex: 1, background: "rgba(216,159,200,0.1)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(216,159,200,0.3)" }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>Size</p>
                    <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: "#4a2e42" }}>{selectedCake.size}</p>
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>Discount</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {([["none", "No Discount"], ["senior", "Senior (20%)"], ["pwd", "PWD (20%)"]] as [DiscountType, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setDiscountType(val)}
                        style={{
                          flex: 1, padding: "9px 4px", borderRadius: 10, border: `1.5px solid ${discountType === val ? "#c77db3" : "rgba(216,159,200,0.35)"}`,
                          background: discountType === val ? "rgba(199,125,179,0.1)" : "#fff",
                          color: discountType === val ? "#c77db3" : "#8b6f84",
                          fontSize: 11, fontWeight: discountType === val ? 700 : 500, cursor: "pointer",
                          fontFamily: "system-ui, sans-serif", transition: "all 0.15s",
                        }}
                      >{label}</button>
                    ))}
                  </div>

                  {/* ID upload when discount selected */}
                  {discountType !== "none" && (
                    <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(216,159,200,0.06)", borderRadius: 12, border: "1px dashed rgba(216,159,200,0.4)" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 11, color: "#8b6f84" }}>Upload photos for verification:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { id: "id-photo-rm", label: "1. Picture of ID", file: idPhotoFile, setter: setIdPhotoFile },
                          { id: "id-hold-rm", label: "2. Holding ID Photo", file: idHoldingPhotoFile, setter: setIdHoldingPhotoFile },
                        ].map(({ id, label, file, setter }) => (
                          <div key={id}>
                            <input type="file" id={id} style={{ display: "none" }} accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setter(f); }} />
                            <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1.5px dashed rgba(216,159,200,0.5)", borderRadius: 10, cursor: "pointer", background: file ? "rgba(34,197,94,0.06)" : "#fff" }}>
                              {file ? <span style={{ fontSize: 12, color: "#15803d" }}>✓ {file.name}</span> : <><Upload size={13} color="#c77db3" /><span style={{ fontSize: 12, color: "#8b6f84" }}>{label}</span></>}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div style={{ borderTop: "1px solid rgba(216,159,200,0.2)", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#8b6f84" }}>Base price</span>
                    <span style={{ fontSize: 13, color: discountAmount > 0 ? "#8b6f84" : "#4a2e42", fontWeight: 600, textDecoration: discountAmount > 0 ? "line-through" : "none" }}>₱{selectedCake.price.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#15803d" }}>Discount (20%)</span>
                      <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>−₱{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,rgba(216,159,200,0.15),rgba(199,125,179,0.1))", borderRadius: 14, padding: "12px 16px", marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#4a2e42" }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#c77db3", fontFamily: "Georgia, serif" }}>₱{finalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "10px 14px", background: "rgba(251,191,36,0.08)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.25)" }}>
                    <span style={{ fontSize: 12, color: "#92400e" }}>50% deposit due now</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>₱{Math.round(finalPrice * 0.5).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                {(() => {
                  const discountProofRequired = discountType !== "none" && (!idPhotoFile || !idHoldingPhotoFile);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
                      {discountProofRequired && (
                        <p style={{ margin: 0, fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontFamily: "system-ui, sans-serif" }}>
                          ⚠️ Please upload both ID photos to apply the discount.
                        </p>
                      )}
                      <button
                        onClick={discountProofRequired ? undefined : handleAddToCart}
                        disabled={discountProofRequired}
                        style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: discountProofRequired ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(199,125,179,0.4)", fontFamily: "system-ui, sans-serif", opacity: discountProofRequired ? 0.45 : 1 }}
                        onMouseEnter={e => { if (!discountProofRequired) e.currentTarget.style.opacity = "0.9"; }}
                        onMouseLeave={e => { if (!discountProofRequired) e.currentTarget.style.opacity = "1"; }}
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Payment Dialog */}
      <Dialog open={showQRPayment} onOpenChange={setShowQRPayment}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {paymentType === "deposit" ? "50% Deposit Payment" : "Full Payment"}
            </DialogTitle>
            <DialogDescription className="text-center space-y-1">
              <span className="block">
                Scan QR code to pay ₱{paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString()}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Payment Type Selector */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#4a2e42" }}>Choose Payment Option:</p>
              <RadioGroup value={paymentType} onValueChange={(value: "deposit" | "full") => setPaymentType(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentType === "deposit"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="deposit" id="deposit" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">50% Deposit</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay ₱{(finalPrice * 0.5).toLocaleString()} now
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: ₱{(finalPrice * 0.5).toLocaleString()}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentType === "full"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="full" id="full" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Pay in Full</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay ₱{finalPrice.toLocaleString()} now
                      </p>
                      <p className="text-xs text-green-600">
                        No balance remaining
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

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
                <p><span className="font-semibold">Amount:</span> ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</p>
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
                <p><span className="font-semibold">Amount:</span> ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</p>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-2">
              <p className="font-semibold">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Scan the QR code using your preferred payment app</li>
                <li>Enter the exact deposit amount: ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</li>
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