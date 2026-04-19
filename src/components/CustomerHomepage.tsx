import React, { useEffect, useRef, useState } from 'react';
import { ref as dbRef, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Cake, Package, Menu, Phone, Upload, ChevronRight, ChevronLeft, X } from "lucide-react";

type BannerType = "info" | "warning" | "festive";
const BANNER_STYLES: Record<BannerType, { color: string; bg: string; border: string; emoji: string }> = {
  info:    { color: "#1d4ed8", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  emoji: "ℹ️"  },
  warning: { color: "#92400e", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)",  emoji: "⚠️"  },
  festive: { color: "#6d28d9", bg: "rgba(199,125,179,0.12)", border: "rgba(199,125,179,0.35)", emoji: "🎉" },
};

interface CustomerHomepageProps {
  onNavigate?: (view: string, options?: { autoOpenUpload?: boolean; category?: string }) => void;
  isGuest?: boolean;
}

const normalizeBanner = (value: unknown): { message: string; type: BannerType; active: boolean } | null => {
  const raw = (value ?? {}) as Partial<{ message: string; type: BannerType; active: boolean }>;
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const type: BannerType =
    raw.type === "warning" || raw.type === "festive" || raw.type === "info"
      ? raw.type
      : "info";

  if (!message || !raw.active) {
    return null;
  }

  return { message, type, active: true };
};

const S = {
  root: { background: "#F4E9F2", minHeight: "100vh", fontFamily: "system-ui, sans-serif" } as React.CSSProperties,
  // Hero
  hero: { background: "linear-gradient(135deg, #f9eef7 0%, #edd5e8 40%, #e8c8e2 100%)", padding: "56px 24px 48px", position: "relative" as const, overflow: "hidden" },
  heroLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#c77db3", marginBottom: 10, display: "block" },
  heroTitle: { fontSize: 38, fontWeight: 400, color: "#4a2e42", margin: "0 0 12px", fontFamily: "Georgia, serif", lineHeight: 1.15 },
  heroSub: { fontSize: 15, color: "#8b6f84", margin: "0 0 28px", maxWidth: 480, lineHeight: 1.6 },
  heroCta: { display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)", color: "#fff", border: "none", borderRadius: 100, padding: "13px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 20px rgba(199,125,179,0.4)", letterSpacing: "0.02em", transition: "all 0.2s" },
  heroDeco: { position: "absolute" as const, right: -20, top: -20, width: 320, height: 320, borderRadius: "50%", background: "rgba(199,125,179,0.08)", pointerEvents: "none" as const },
  heroDeco2: { position: "absolute" as const, right: 120, bottom: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(199,125,179,0.06)", pointerEvents: "none" as const },
  // Section
  section: { padding: "0 24px", marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#4a2e42", margin: "0 0 16px", fontFamily: "Georgia, serif" },
  // Customize card
  customizeCard: { background: "#fff", borderRadius: 20, padding: "22px 24px", border: "1.5px solid rgba(216,159,200,0.3)", boxShadow: "0 2px 16px rgba(199,125,179,0.08)", cursor: "pointer", transition: "all 0.2s" },
  // Quick actions
  actionCard: { background: "#fff", borderRadius: 20, padding: "24px 20px", border: "1.5px solid rgba(216,159,200,0.2)", textAlign: "center" as const, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 12px rgba(199,125,179,0.06)" },
  actionIcon: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #f9eef7 0%, #f0d9ec 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  // Track order
  trackCard: { background: "#fff", borderRadius: 20, padding: "22px 24px", border: "1.5px solid rgba(216,159,200,0.25)", boxShadow: "0 2px 16px rgba(199,125,179,0.08)" },
  progressBar: { height: 6, background: "rgba(216,159,200,0.2)", borderRadius: 100, overflow: "hidden", margin: "10px 0 8px" },
  progressFill: { height: "100%", width: "60%", background: "linear-gradient(90deg, #d89fc8, #c77db3)", borderRadius: 100, transition: "width 0.5s ease" },
  // Outline btn
  outlineBtn: { background: "none", border: "1.5px solid rgba(216,159,200,0.5)", borderRadius: 100, padding: "9px 20px", fontSize: 13, color: "#8b6f84", cursor: "pointer", fontFamily: "system-ui, sans-serif", transition: "all 0.18s", fontWeight: 500 },
  // Cake cards
  cakeCard: { flexShrink: 0, width: 220, background: "#fff", borderRadius: 20, overflow: "hidden", border: "1.5px solid rgba(216,159,200,0.25)", boxShadow: "0 2px 12px rgba(199,125,179,0.08)", cursor: "pointer", transition: "all 0.2s" },
  scrollBtn: { width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1.5px solid rgba(216,159,200,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8b6f84", transition: "all 0.18s", flexShrink: 0 as const },
} as const;

type OrderStatus = "pending" | "confirmed" | "baking" | "ready" | "completed";
interface LatestOrder { orderId: string; status: OrderStatus; pickupDate: string; total: number; createdAt: string; }

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "⏳ Pending",
  confirmed: "✅ Confirmed",
  baking: "🔥 Baking",
  ready: "🎂 Ready for Pickup",
  completed: "🎉 Completed",
};
const STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 10, confirmed: 30, baking: 60, ready: 85, completed: 100,
};
const ORDER_STEPS = ["Received", "Confirmed", "Baking", "Ready", "Done"];
const STATUS_STEP_IDX: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, baking: 2, ready: 3, completed: 4,
};

export function CustomerHomepage({ onNavigate, isGuest = false }: CustomerHomepageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const [latestOrder, setLatestOrder] = useState<LatestOrder | null>(null);
  const [featuredCakes, setFeaturedCakes] = useState<{ id: string; name: string; category: string; image: string; price: string }[]>([]);

  // Load featured cakes: cross-reference featuredCakeIds with menuItems
  useEffect(() => {
    let menuItems: Record<string, any> = {};
    let featuredIds: string[] = [];

    const resolve = () => {
      if (Object.keys(menuItems).length === 0) return;
      if (featuredIds.length > 0) {
        const cakes = featuredIds
          .map((id) => menuItems[id])
          .filter((c: any) => c?.available)
          .map((c: any) => ({ id: c.id, name: c.name, category: c.category, image: c.image, price: `₱${c.price.toLocaleString()}` }));
        setFeaturedCakes(cakes);
      } else {
        // No featured picks yet — show first 6 available items as fallback
        const fallback = Object.values(menuItems)
          .filter((c: any) => c.available)
          .slice(0, 6)
          .map((c: any) => ({ id: c.id, name: c.name, category: c.category, image: c.image, price: `₱${c.price.toLocaleString()}` }));
        setFeaturedCakes(fallback);
      }
    };

    const u1 = onValue(dbRef(db, "menuItems"), (snap) => {
      const data = snap.val();
      menuItems = data
        ? Object.fromEntries(Object.entries(data).map(([k, v]: [string, any]) => [k, { id: k, ...v }]))
        : {};
      resolve();
    });
    const u2 = onValue(dbRef(db, "featuredCakeIds"), (snap) => {
      featuredIds = snap.val() ? Object.keys(snap.val()) : [];
      resolve();
    });
    return () => { u1(); u2(); };
  }, []);

  const [banner, setBanner] = useState<{ message: string; type: BannerType; active: boolean } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const unsub = onValue(dbRef(db, "announcementBanner"), (snapshot) => {
      const data = normalizeBanner(snapshot.val());
      if (data) {
        setBanner(data);
        setBannerDismissed(false); // re-show if admin changes the message
      } else {
        setBanner(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const ordersRef = dbRef(db, `orders/${user.uid}`);
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setLatestOrder(null); return; }
      const list = Object.entries(data).map(([key, val]: [string, any]) => ({
        orderId: key, ...(val as Omit<LatestOrder, "orderId">),
      }));
      // Show most recent non-completed order first, else most recent overall
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const active = list.find((o) => o.status !== "completed");
      setLatestOrder(active ?? list[0] ?? null);
    });
    return () => unsub();
  }, [user?.uid]);


  return (
    <div style={S.root}>

      {/* ── Announcement Banner ── */}
      {banner && !bannerDismissed && (() => {
        const bs = BANNER_STYLES[banner.type] ?? BANNER_STYLES.info;
        return (
          <div style={{
            background: bs.bg,
            borderBottom: `1.5px solid ${bs.border}`,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>{bs.emoji}</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: bs.color, flex: 1, textAlign: "center" as const }}>
              {banner.message}
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: bs.color, opacity: 0.6, padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}

      {/* ── Hero ── */}
      <div style={S.hero}>
        <div style={S.heroDeco} />
        <div style={S.heroDeco2} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <span style={S.heroLabel}>Welcome to Cake with Joy 🎂</span>
          <h1 style={S.heroTitle}>Your perfect cake<br />starts here</h1>
          <p style={S.heroSub}>
            Handcrafted cakes for every occasion. Upload your design or let our bakers create something special just for you.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              style={S.heroCta}
              onClick={() => onNavigate?.("customize")}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 28px rgba(199,125,179,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(199,125,179,0.4)"; }}
            >
              Start Customizing <ChevronRight size={16} />
            </button>
            <button
              style={{ ...S.outlineBtn, padding: "13px 24px", fontSize: 14 }}
              onClick={() => onNavigate?.("menu")}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(216,159,200,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#4a2e42"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#8b6f84"; }}
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Customize Shortcuts ── */}
        <div style={{ marginBottom: 32 }}>
          <p style={S.sectionTitle}>Customize Your Cake</p>
          <div
            style={{ ...S.customizeCard, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 12 }}
            onClick={() => onNavigate?.("customize")}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(199,125,179,0.15)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(199,125,179,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(199,125,179,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(216,159,200,0.3)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #f9eef7, #f0d9ec)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Cake size={22} color="#c77db3" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#4a2e42" }}>Design Your Cake</p>
                <p style={{ margin: 0, fontSize: 12, color: "#8b6f84", marginTop: 2 }}>Upload an image or build from scratch with our interactive tool</p>
              </div>
            </div>
            <ChevronRight size={18} color="#c77db3" style={{ flexShrink: 0 }} />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {[
              { label: "Upload Design", icon: <Upload size={14} />, action: () => onNavigate?.("customize", { autoOpenUpload: true }) },
              { label: "Choose Template", icon: <Menu size={14} />, action: () => onNavigate?.("menu") },
            ].map(btn => (
              <button
                key={btn.label}
                style={{ display: "flex", alignItems: "center", gap: 7, ...S.outlineBtn }}
                onClick={btn.action}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(216,159,200,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#c77db3"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#c77db3"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#8b6f84"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(216,159,200,0.5)"; }}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Track My Order ── */}
        {!isGuest && <div style={{ marginBottom: 32 }}>
          <p style={S.sectionTitle}>Track My Order</p>
          <div style={S.trackCard}>
            {latestOrder ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#4a2e42", fontFamily: "monospace" }}>
                    {latestOrder.orderId.slice(0, 12)}…
                  </p>
                  <span style={{ fontSize: 12, background: "rgba(216,159,200,0.15)", color: "#c77db3", padding: "3px 12px", borderRadius: 100, fontWeight: 600 }}>
                    {STATUS_LABELS[latestOrder.status]}
                  </span>
                </div>
                <div style={S.progressBar}>
                  <div style={{ ...S.progressFill, width: `${STATUS_PROGRESS[latestOrder.status]}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                  {ORDER_STEPS.map((step, i) => {
                    const stepIdx = STATUS_STEP_IDX[latestOrder.status];
                    return (
                      <div key={step} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: i <= stepIdx ? "#c77db3" : "rgba(216,159,200,0.3)", margin: "0 auto 4px" }} />
                        <p style={{ fontSize: 10, color: i <= stepIdx ? "#c77db3" : "#8b6f84", margin: 0, fontWeight: i === stepIdx ? 700 : 400 }}>{step}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
                <p style={{ fontSize: 24, margin: "0 0 6px" }}>🎂</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8b6f84" }}>No active orders yet — place one to track it here!</p>
              </div>
            )}
            <button
              style={{ width: "100%", ...S.outlineBtn, padding: "11px 0", textAlign: "center" as const }}
              onClick={() => onNavigate?.("orders")}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(216,159,200,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#4a2e42"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#8b6f84"; }}
            >
              {latestOrder ? "View Full Details" : "View All Orders"}
            </button>
          </div>
        </div>}

        {/* ── Featured Cakes ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={S.sectionTitle}>Featured Cakes</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.scrollBtn} onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}>
                <ChevronLeft size={16} />
              </button>
              <button style={S.scrollBtn} onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}
          >
            {featuredCakes.map(cake => (
              <div
                key={cake.id}
                style={S.cakeCard}
                onClick={() => onNavigate?.("menu", { category: cake.category })}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(199,125,179,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(199,125,179,0.08)"; }}
              >
                <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                  <ImageWithFallback
                    src={cake.image}
                    alt={cake.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                    className="group-hover:scale-105"
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 10px 8px", background: "linear-gradient(to top, rgba(74,46,66,0.65), transparent)" }}>
                    <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", color: "#fff", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.2)" }}>
                      {cake.category}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#4a2e42", marginBottom: 8, lineHeight: 1.3 }}>{cake.name}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#c77db3" }}>{cake.price}</span>
                    <button
                      style={{ fontSize: 11, fontWeight: 600, background: "linear-gradient(135deg, #d89fc8, #c77db3)", color: "#fff", border: "none", borderRadius: 100, padding: "5px 12px", cursor: "pointer" }}
                      onClick={e => { e.stopPropagation(); onNavigate?.("menu", { category: cake.category }); }}
                    >
                      Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
