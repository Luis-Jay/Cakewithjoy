import React, { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../config/firebase";
import { Check, Star } from "lucide-react";

type BannerType = "info" | "warning" | "festive";

interface Banner { message: string; type: BannerType; active: boolean; }
interface MenuItem { id: string; name: string; image: string; price: number; category: string; flavor: string; available: boolean; }

const BANNER_TYPES: { id: BannerType; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { id: "info",    label: "Info",    emoji: "ℹ️",  color: "#1d4ed8", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.35)"  },
  { id: "warning", label: "Warning", emoji: "⚠️",  color: "#92400e", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.4)"   },
  { id: "festive", label: "Festive", emoji: "🎉",  color: "#6d28d9", bg: "rgba(199,125,179,0.12)", border: "rgba(199,125,179,0.45)" },
];

const EXAMPLES = [
  "We're closed on Dec 25. Happy Holidays! 🎄",
  "Holiday flavors are now available! Try our Ube Pandan special 🎂",
  "Limited slots for Valentine's Week — book yours now! 💕",
  "New: Same-day pickup orders available before 10 AM 🕙",
];

const MAX_FEATURED = 10;

const s: Record<string, React.CSSProperties> = {
  root:       { minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif", padding: "32px 24px 64px" },
  inner:      { maxWidth: 760, margin: "0 auto" },
  card:       { background: "#fff", borderRadius: 24, border: "1px solid rgba(216,159,200,0.3)", boxShadow: "0 4px 32px rgba(216,159,200,0.1)", padding: "28px" },
  label:      { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 7, display: "block" },
  input:      { width: "100%", padding: "12px 16px", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 14, fontSize: 14, color: "#4a2e42", fontFamily: "system-ui, sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" as const, resize: "vertical" as const },
  primaryBtn: { padding: "12px 24px", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "system-ui, sans-serif", boxShadow: "0 4px 16px rgba(199,125,179,0.4)" },
  divider:    { border: "none", borderTop: "1px solid rgba(216,159,200,0.2)", margin: "28px 0" },
  toggle:     (on: boolean): React.CSSProperties => ({ width: 42, height: 24, borderRadius: 12, background: on ? "#c77db3" : "rgba(216,159,200,0.3)", position: "relative", transition: "background 0.2s", flexShrink: 0 }),
  knob:       (on: boolean): React.CSSProperties => ({ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }),
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ fontSize: 12, color: on ? "#c77db3" : "#8b6f84", fontWeight: 600 }}>{on ? "Active" : "Off"}</span>
      <div style={s.toggle(on)}><div style={s.knob(on)} /></div>
    </div>
  );
}

export function StoreSettings() {
  // Banner state
  const [banner, setBanner] = useState<Banner>({ message: "", type: "info", active: false });
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);

  // Featured cakes state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featuredSaving, setFeaturedSaving] = useState(false);
  const [featuredSaved, setFeaturedSaved] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let bannerLoaded = false, menuLoaded = false, featuredLoaded = false;
    const checkDone = () => { if (bannerLoaded && menuLoaded && featuredLoaded) setLoading(false); };

    const u1 = onValue(ref(db, "announcementBanner"), (snap) => {
      if (snap.val()) setBanner(snap.val() as Banner);
      bannerLoaded = true; checkDone();
    });
    const u2 = onValue(ref(db, "menuItems"), (snap) => {
      const data = snap.val();
      if (data) {
        const list: MenuItem[] = Object.entries(data).map(([key, val]: [string, any]) => ({ id: key, ...val }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setMenuItems(list);
      }
      menuLoaded = true; checkDone();
    });
    const u3 = onValue(ref(db, "featuredCakeIds"), (snap) => {
      const data = snap.val();
      setFeaturedIds(data ? new Set(Object.keys(data)) : new Set());
      featuredLoaded = true; checkDone();
    });

    return () => { u1(); u2(); u3(); };
  }, []);

  // Banner actions
  const saveBanner = async () => {
    setBannerSaving(true);
    try {
      await set(ref(db, "announcementBanner"), banner);
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 2500);
    } finally { setBannerSaving(false); }
  };

  // Featured cake actions
  const toggleFeatured = (id: string) => {
    setFeaturedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < MAX_FEATURED) { next.add(id); }
      return next;
    });
  };

  const saveFeatured = async () => {
    setFeaturedSaving(true);
    try {
      const obj: Record<string, true> = {};
      featuredIds.forEach((id) => { obj[id] = true; });
      await set(ref(db, "featuredCakeIds"), Object.keys(obj).length > 0 ? obj : null);
      setFeaturedSaved(true);
      setTimeout(() => setFeaturedSaved(false), 2500);
    } finally { setFeaturedSaving(false); }
  };

  const currentType = BANNER_TYPES.find((t) => t.id === banner.type)!;
  const availableItems = menuItems.filter((m) => m.available);

  return (
    <div style={s.root}>
      <div style={s.inner}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>Store Settings</h1>
          <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>Manage what customers see on the homepage</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8b6f84", fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* ── Banner Card ── */}
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>📢 Announcement Banner</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b6f84" }}>Dismissible notice shown at the top of the customer homepage</p>
                </div>
                <Toggle on={banner.active} onClick={() => setBanner((b) => ({ ...b, active: !b.active }))} />
              </div>

              {/* Preview */}
              {banner.message.trim() && (
                <div style={{ background: currentType.bg, border: `1.5px solid ${currentType.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: currentType.color, fontWeight: 500 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{currentType.emoji}</span>
                  <span style={{ flex: 1 }}>{banner.message}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Preview</span>
                </div>
              )}

              {/* Message */}
              <div style={{ marginBottom: 18 }}>
                <label style={s.label}>Message</label>
                <textarea style={{ ...s.input, minHeight: 72 }} value={banner.message} onChange={(e) => setBanner((b) => ({ ...b, message: e.target.value }))} placeholder="e.g. We're closed on Dec 25. Happy Holidays! 🎄" maxLength={200} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: "#8b6f84" }}>Max 200 characters</span>
                  <span style={{ fontSize: 11, color: banner.message.length > 180 ? "#c2410c" : "#8b6f84" }}>{banner.message.length}/200</span>
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Banner Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {BANNER_TYPES.map((t) => (
                    <button key={t.id} onClick={() => setBanner((b) => ({ ...b, type: t.id }))} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: `2px solid ${banner.type === t.id ? t.border : "rgba(216,159,200,0.25)"}`, background: banner.type === t.id ? t.bg : "#fff", cursor: "pointer", fontFamily: "system-ui, sans-serif", textAlign: "center", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{t.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: banner.type === t.id ? 700 : 500, color: banner.type === t.id ? t.color : "#8b6f84" }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div style={{ marginBottom: 24 }}>
                <label style={s.label}>Quick Examples</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {EXAMPLES.map((ex) => (
                    <button key={ex} onClick={() => setBanner((b) => ({ ...b, message: ex }))} style={{ padding: "9px 14px", background: "rgba(216,159,200,0.06)", border: "1px solid rgba(216,159,200,0.2)", borderRadius: 10, fontSize: 12, color: "#4a2e42", cursor: "pointer", textAlign: "left", fontFamily: "system-ui, sans-serif", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(216,159,200,0.14)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(216,159,200,0.06)")}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button style={{ ...s.primaryBtn, opacity: bannerSaving ? 0.7 : 1 }} onClick={saveBanner} disabled={bannerSaving}>
                {bannerSaved ? <><Check size={15} /> Saved!</> : bannerSaving ? "Saving…" : <><Check size={15} /> Save Banner</>}
              </button>
            </div>

            {/* ── Featured Cakes Card ── */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#4a2e42" }}>⭐ Featured Cakes</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b6f84" }}>
                    Pick up to {MAX_FEATURED} cakes to highlight on the homepage carousel
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: featuredIds.size >= MAX_FEATURED ? "#c2410c" : "#c77db3" }}>
                  {featuredIds.size} / {MAX_FEATURED} selected
                </span>
              </div>

              {availableItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#8b6f84", fontSize: 13 }}>
                  No available menu items yet. Add some in the Menu tab first.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {availableItems.map((item) => {
                    const selected = featuredIds.has(item.id);
                    const maxed = !selected && featuredIds.size >= MAX_FEATURED;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !maxed && toggleFeatured(item.id)}
                        style={{
                          borderRadius: 16,
                          overflow: "hidden",
                          border: `2px solid ${selected ? "#c77db3" : "rgba(216,159,200,0.25)"}`,
                          cursor: maxed ? "not-allowed" : "pointer",
                          opacity: maxed ? 0.45 : 1,
                          transition: "all 0.15s",
                          position: "relative",
                          background: "#fff",
                          boxShadow: selected ? "0 4px 20px rgba(199,125,179,0.25)" : "0 2px 8px rgba(216,159,200,0.08)",
                        }}
                        onMouseEnter={(e) => { if (!maxed) e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                      >
                        {/* Image */}
                        <div style={{ height: 100, overflow: "hidden", background: "#f9eef7", position: "relative" }}>
                          {item.image
                            ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎂</div>
                          }
                          {/* Selected overlay */}
                          {selected && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(199,125,179,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c77db3", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(199,125,179,0.5)" }}>
                                <Star size={14} color="#fff" fill="#fff" />
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: "10px 12px" }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: selected ? "#c77db3" : "#4a2e42", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                            {item.name}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8b6f84" }}>
                            ₱{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {featuredIds.size >= MAX_FEATURED && (
                <p style={{ fontSize: 12, color: "#c2410c", marginBottom: 16, background: "rgba(239,68,68,0.06)", padding: "8px 12px", borderRadius: 10 }}>
                  Maximum of {MAX_FEATURED} cakes reached. Deselect one to choose another.
                </p>
              )}

              <button style={{ ...s.primaryBtn, opacity: featuredSaving ? 0.7 : 1 }} onClick={saveFeatured} disabled={featuredSaving}>
                {featuredSaved ? <><Check size={15} /> Saved!</> : featuredSaving ? "Saving…" : <><Check size={15} /> Save Featured Cakes</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
