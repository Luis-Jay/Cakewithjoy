import React, { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../config/firebase";
import { Check, Plus, Trash2 } from "lucide-react";

// ── Default pricing (mirrors CakeCustomization hardcoded values) ──────────────
export const DEFAULT_PRICING = {
  tiers: {
    Fondant: [
      { id: "1-tier-6x4",  label: '1-Tier (6"x4")',                          price: 3200  },
      { id: "1-tier-8x6",  label: '1-Tier (8"x6")',                          price: 5400  },
      { id: "2-tier",      label: '2-Tier (8"x4" + 6"x4")',                  price: 5800  },
      { id: "3-tier",      label: '3-Tier (10"x6" + 8"x6" + 6"x6")',        price: 11000 },
    ],
    Naked: [
      { id: "1-tier-8x4",  label: '1-Tier (8"x4")',                          price: 3500  },
      { id: "2-tier",      label: '2-Tier (8"x4" + 6"x4")',                  price: 6500  },
      { id: "3-tier",      label: '3-Tier (10"x4" + 8"x4" + 6"x4")',        price: 10000 },
    ],
    Number: [
      { id: "standard",      label: 'Standard (10" x 7" x 3")',              price: 2000  },
      { id: "with-toppers",  label: 'With Toppers (10" x 7" x 3")',          price: 2500  },
    ],
    Bento: [
      { id: "small",   label: '4"x2"', price: 500  },
      { id: "medium",  label: '6"x3"', price: 1700 },
    ],
  } as Record<string, { id: string; label: string; price: number }[]>,
  addons: [
    { id: "acrylic-topper",    label: "Custom Acrylic Topper",               price: 150 },
  ],
  bundles: [
    { id: "cupcakes",  name: "Cupcakes (Box of 12)",   price: 850 },
    { id: "cakepops",  name: "Cakepops (12 pcs)",       price: 840 },
    { id: "cookies",   name: "Sugar Cookies (12 pcs)",  price: 960 },
  ],
  flavors: ["Chocolate", "Vanilla", "Red Velvet", "Strawberry", "Ube", "Lemon", "Carrot", "Cookies & Cream"],
};

type Pricing = typeof DEFAULT_PRICING;
type CakeType = keyof typeof DEFAULT_PRICING.tiers;
const CAKE_TYPES: CakeType[] = ["Fondant", "Naked", "Number", "Bento"];

const s: Record<string, React.CSSProperties> = {
  root:   { minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif", padding: "32px 24px 64px" },
  inner:  { maxWidth: 860, margin: "0 auto" },
  card:   { background: "#fff", borderRadius: 24, border: "1px solid rgba(216,159,200,0.3)", boxShadow: "0 4px 32px rgba(216,159,200,0.1)", padding: "24px 28px", marginBottom: 20 },
  label:  { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 7, display: "block" },
  input:  { padding: "9px 14px", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 12, fontSize: 13, color: "#4a2e42", fontFamily: "system-ui, sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" as const },
  saveBtn: { padding: "11px 22px", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "system-ui, sans-serif", boxShadow: "0 4px 14px rgba(199,125,179,0.4)" },
  addBtn: { padding: "8px 14px", background: "none", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 10, fontSize: 12, color: "#c77db3", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif" },
  delBtn: { background: "none", border: "none", cursor: "pointer", color: "#d89fc8", padding: 4, display: "flex", alignItems: "center", transition: "color 0.15s" },
  row:    { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  tab:    (active: boolean): React.CSSProperties => ({ padding: "7px 18px", borderRadius: 100, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", border: "none", fontFamily: "system-ui, sans-serif", background: active ? "linear-gradient(135deg,#d89fc8,#c77db3)" : "rgba(216,159,200,0.12)", color: active ? "#fff" : "#8b6f84", transition: "all 0.15s" }),
};

export function PricingManagement() {
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeType, setActiveType] = useState<CakeType>("Fondant");
  const [newFlavor, setNewFlavor] = useState("");

  useEffect(() => {
    const unsub = onValue(ref(db, "cakePricing"), (snap) => {
      const raw = snap.val();
      if (raw) {
        // Firebase RTDB converts arrays to numeric-keyed objects — normalize back
        const normalized: Pricing = {
          tiers: Object.fromEntries(
            Object.entries(raw.tiers || {}).map(([k, v]) => [k, Object.values(v as object)])
          ) as Pricing["tiers"],
          addons: Object.values(raw.addons || {}) as Pricing["addons"],
          bundles: Object.values(raw.bundles || {}) as Pricing["bundles"],
          flavors: Object.values(raw.flavors || {}) as string[],
        };
        setPricing(normalized);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      await set(ref(db, "cakePricing"), pricing);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  // Tier helpers
  const setTierPrice = (type: CakeType, idx: number, price: number) => {
    setPricing((p) => {
      const tiers = p.tiers[type].map((t, i) => i === idx ? { ...t, price } : t);
      return { ...p, tiers: { ...p.tiers, [type]: tiers } };
    });
  };

  // Addon helpers
  const setAddonPrice = (idx: number, price: number) => {
    setPricing((p) => ({ ...p, addons: p.addons.map((a, i) => i === idx ? { ...a, price } : a) }));
  };
  const setAddonLabel = (idx: number, label: string) => {
    setPricing((p) => ({ ...p, addons: p.addons.map((a, i) => i === idx ? { ...a, label } : a) }));
  };
  const addAddon = () => {
    setPricing((p) => ({ ...p, addons: [...p.addons, { id: `addon-${Date.now()}`, label: "New Add-on", price: 0 }] }));
  };
  const removeAddon = (idx: number) => {
    setPricing((p) => ({ ...p, addons: p.addons.filter((_, i) => i !== idx) }));
  };

  // Bundle helpers
  const setBundlePrice = (idx: number, price: number) => {
    setPricing((p) => ({ ...p, bundles: p.bundles.map((b, i) => i === idx ? { ...b, price } : b) }));
  };
  const setBundleName = (idx: number, name: string) => {
    setPricing((p) => ({ ...p, bundles: p.bundles.map((b, i) => i === idx ? { ...b, name } : b) }));
  };
  const addBundle = () => {
    setPricing((p) => ({ ...p, bundles: [...p.bundles, { id: `bundle-${Date.now()}`, name: "New Bundle", price: 0 }] }));
  };
  const removeBundle = (idx: number) => {
    setPricing((p) => ({ ...p, bundles: p.bundles.filter((_, i) => i !== idx) }));
  };

  // Flavor helpers
  const addFlavor = () => {
    const f = newFlavor.trim();
    if (!f || pricing.flavors.includes(f)) return;
    setPricing((p) => ({ ...p, flavors: [...p.flavors, f] }));
    setNewFlavor("");
  };
  const removeFlavor = (idx: number) => {
    setPricing((p) => ({ ...p, flavors: p.flavors.filter((_, i) => i !== idx) }));
  };

  if (loading) return (
    <div style={{ background: "#F4E9F2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b6f84", fontSize: 14 }}>
      Loading pricing…
    </div>
  );

  return (
    <div style={s.root}>
      <div style={s.inner}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>Cake Pricing</h1>
            <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>Edit prices — customers see changes instantly in the Customize page</p>
          </div>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={saveAll} disabled={saving}>
            {saved ? <><Check size={14} /> All Saved!</> : saving ? "Saving…" : <><Check size={14} /> Save All Changes</>}
          </button>
        </div>

        {/* ── Tier Prices ── */}
        <div style={s.card}>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>🎂 Cake Tier Prices</p>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: "#8b6f84" }}>Base price for each size/tier combination</p>

          {/* Type tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {CAKE_TYPES.map((t) => (
              <button key={t} style={s.tab(activeType === t)} onClick={() => setActiveType(t)}>{t}</button>
            ))}
          </div>

          {/* Tier rows */}
          <div>
            {(pricing.tiers[activeType] ?? []).map((tier, idx) => (
              <div key={tier.id} style={s.row}>
                <div style={{ flex: 1, fontSize: 13, color: "#4a2e42", fontWeight: 500 }}>{tier.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: "#8b6f84" }}>₱</span>
                  <input
                    style={{ ...s.input, width: 110, textAlign: "right" as const }}
                    type="number"
                    min={0}
                    value={tier.price}
                    onChange={(e) => setTierPrice(activeType, idx, Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Add-ons ── */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>✨ Design Add-ons</p>
              <p style={{ margin: 0, fontSize: 12, color: "#8b6f84" }}>Priced add-ons customers can select (₱0 = included free)</p>
            </div>
            <button style={s.addBtn} onClick={addAddon}><Plus size={13} /> Add</button>
          </div>

          {pricing.addons.map((addon, idx) => (
            <div key={addon.id} style={s.row}>
              <input
                style={{ ...s.input, flex: 1 }}
                value={addon.label}
                onChange={(e) => setAddonLabel(idx, e.target.value)}
                placeholder="Add-on name"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: "#8b6f84" }}>₱</span>
                <input
                  style={{ ...s.input, width: 100, textAlign: "right" as const }}
                  type="number"
                  min={0}
                  value={addon.price}
                  onChange={(e) => setAddonPrice(idx, Number(e.target.value))}
                />
              </div>
              <button
                style={s.delBtn}
                onClick={() => removeAddon(idx)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#d89fc8")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {pricing.addons.length === 0 && (
            <p style={{ fontSize: 12, color: "#8b6f84", textAlign: "center", padding: "16px 0" }}>No paid add-ons. Click "+ Add" to create one.</p>
          )}
        </div>

        {/* ── Dessert Bundles ── */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>🧁 Dessert Bundles</p>
              <p style={{ margin: 0, fontSize: 12, color: "#8b6f84" }}>Add-on dessert packages shown in the Customize page</p>
            </div>
            <button style={s.addBtn} onClick={addBundle}><Plus size={13} /> Add</button>
          </div>

          {pricing.bundles.map((bundle, idx) => (
            <div key={bundle.id} style={s.row}>
              <input
                style={{ ...s.input, flex: 1 }}
                value={bundle.name}
                onChange={(e) => setBundleName(idx, e.target.value)}
                placeholder="Bundle name"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: "#8b6f84" }}>₱</span>
                <input
                  style={{ ...s.input, width: 100, textAlign: "right" as const }}
                  type="number"
                  min={0}
                  value={bundle.price}
                  onChange={(e) => setBundlePrice(idx, Number(e.target.value))}
                />
              </div>
              <button
                style={s.delBtn}
                onClick={() => removeBundle(idx)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#d89fc8")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {pricing.bundles.length === 0 && (
            <p style={{ fontSize: 12, color: "#8b6f84", textAlign: "center", padding: "16px 0" }}>No bundles yet.</p>
          )}
        </div>

        {/* ── Flavors ── */}
        <div style={s.card}>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>🍓 Available Flavors</p>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: "#8b6f84" }}>Flavors shown in the cake customization dropdown</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {pricing.flavors.map((flavor, idx) => (
              <div
                key={flavor}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(216,159,200,0.12)", border: "1px solid rgba(216,159,200,0.3)", borderRadius: 100, padding: "5px 12px 5px 14px" }}
              >
                <span style={{ fontSize: 13, color: "#4a2e42", fontWeight: 500 }}>{flavor}</span>
                <button
                  style={{ ...s.delBtn, padding: 0 }}
                  onClick={() => removeFlavor(idx)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#d89fc8")}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={newFlavor}
              onChange={(e) => setNewFlavor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFlavor()}
              placeholder="New flavor name (press Enter)"
            />
            <button style={s.addBtn} onClick={addFlavor}><Plus size={13} /> Add</button>
          </div>
        </div>

        {/* Bottom save */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={saveAll} disabled={saving}>
            {saved ? <><Check size={14} /> All Saved!</> : saving ? "Saving…" : <><Check size={14} /> Save All Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
}
