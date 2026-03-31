import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { X, Check, XCircle } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "baking" | "ready" | "completed" | "declined";

interface IdDoc {
  itemName: string;
  discountType: string;
  idPhoto: string;
  idHoldingPhoto: string;
}

interface LiveOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  rushFee: number;
  total: number;
  downpayment: number;
  isRushOrder: boolean;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
  paymentProof?: string;
  idDocs?: IdDoc[] | null;
  declineReason?: string;
  createdAt: string;
}

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "baking", "ready", "completed"];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  pending:   { label: "Pending",          color: "#92400e", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.4)",  emoji: "⏳" },
  confirmed: { label: "Confirmed",        color: "#1d4ed8", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.4)",  emoji: "✅" },
  baking:    { label: "Baking",           color: "#c2410c", bg: "rgba(234,88,12,0.12)",   border: "rgba(234,88,12,0.4)",   emoji: "🔥" },
  ready:     { label: "Ready for Pickup", color: "#15803d", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.4)",   emoji: "🎂" },
  completed: { label: "Completed",        color: "#6d28d9", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.4)",  emoji: "🎉" },
  declined:  { label: "Declined",         color: "#b91c1c", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.35)",  emoji: "❌" },
};

const DECLINE_PRESETS = [
  "Fake or invalid ID submitted",
  "Fake payment proof submitted",
  "Suspicious account activity",
  "Discount not applicable",
  "Other reason",
];

export function OrderManagement() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [docsModal, setDocsModal] = useState<LiveOrder | null>(null);

  // Decline modal state
  const [declineTarget, setDeclineTarget] = useState<LiveOrder | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineCustom, setDeclineCustom] = useState("");
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    const ordersRef = ref(db, "allOrders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const list: LiveOrder[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        orderId: key,
        ...(val as Omit<LiveOrder, "orderId">),
      }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (order: LiveOrder, newStatus: OrderStatus) => {
    setUpdating(order.orderId);
    try {
      // allOrders is the source of truth — customer tracking reads from here
      await update(ref(db, `allOrders/${order.orderId}`), { status: newStatus });
      // Best-effort mirror write; ignore if Firebase rules block it
      update(ref(db, `orders/${order.customerId}/${order.orderId}`), { status: newStatus }).catch(() => {});
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setUpdating(null);
    }
  };

  const openDeclineModal = (order: LiveOrder) => {
    setDeclineTarget(order);
    setDeclineReason("");
    setDeclineCustom("");
  };

  const confirmDecline = async () => {
    if (!declineTarget) return;
    const finalReason = declineReason === "Other reason" ? declineCustom.trim() : declineReason;
    if (!finalReason) return;
    setDeclining(true);
    try {
      const payload = { status: "declined" as OrderStatus, declineReason: finalReason };
      // allOrders is the source of truth — customer tracking reads from here
      await update(ref(db, `allOrders/${declineTarget.orderId}`), payload);
      // Best-effort mirror write; ignore if Firebase rules block it
      update(ref(db, `orders/${declineTarget.customerId}/${declineTarget.orderId}`), payload).catch(() => {});
      setDeclineTarget(null);
    } catch (e) {
      console.error("Failed to decline order", e);
    } finally {
      setDeclining(false);
    }
  };

  const allStatuses: (OrderStatus | "all")[] = ["all", ...STATUS_FLOW, "declined"];

  const stats = [...STATUS_FLOW, "declined" as OrderStatus].reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) =>
      search === "" ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId.toLowerCase().includes(search.toLowerCase())
    );

  const canDecline = (status: OrderStatus) => status === "pending" || status === "confirmed";

  return (
    <div style={{ minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>
            Order Management
          </h1>
          <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>
            Update order statuses — customers see changes in real time
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
          {([...STATUS_FLOW, "declined"] as OrderStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = filter === s;
            return (
              <div
                key={s}
                onClick={() => setFilter(isActive ? "all" : s)}
                style={{
                  background: isActive ? cfg.bg : "#fff",
                  border: `1.5px solid ${isActive ? cfg.border : "rgba(216,159,200,0.25)"}`,
                  borderRadius: 16,
                  padding: "14px 12px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  boxShadow: isActive ? `0 4px 16px ${cfg.bg}` : "0 2px 8px rgba(216,159,200,0.08)",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{cfg.emoji}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color, fontFamily: "Georgia, serif" }}>
                  {stats[s] ?? 0}
                </div>
                <div style={{ fontSize: 10, color: "#8b6f84", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or order ID…"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "10px 16px",
              border: "1.5px solid rgba(216,159,200,0.4)",
              borderRadius: 12,
              fontSize: 13,
              color: "#4a2e42",
              fontFamily: "system-ui, sans-serif",
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Table */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          border: "1px solid rgba(216,159,200,0.3)",
          boxShadow: "0 4px 32px rgba(216,159,200,0.1)",
          overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#8b6f84", fontSize: 14 }}>
              Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: "#8b6f84", fontSize: 14, margin: 0 }}>
                {orders.length === 0 ? "No orders placed yet" : "No orders match this filter"}
              </p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.6fr 100px 120px 160px 1fr",
                padding: "12px 24px",
                background: "rgba(216,159,200,0.08)",
                borderBottom: "1px solid rgba(216,159,200,0.2)",
              }}>
                {["Customer", "Items", "Total", "Pickup", "Status", "Action"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>
                    {h}
                  </span>
                ))}
              </div>

              {filtered.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status];
                const isUpdating = updating === order.orderId;
                const nextIdx = STATUS_FLOW.indexOf(order.status) + 1;
                const nextStatus = nextIdx < STATUS_FLOW.length && order.status !== "declined" ? STATUS_FLOW[nextIdx] : null;
                const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;

                return (
                  <div
                    key={order.orderId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1.6fr 100px 120px 160px 1fr",
                      padding: "16px 24px",
                      borderBottom: idx < filtered.length - 1 ? "1px solid rgba(216,159,200,0.12)" : "none",
                      alignItems: "center",
                      transition: "background 0.15s",
                      background: order.status === "declined" ? "rgba(239,68,68,0.02)" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = order.status === "declined" ? "rgba(239,68,68,0.04)" : "rgba(216,159,200,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = order.status === "declined" ? "rgba(239,68,68,0.02)" : "transparent")}
                  >
                    {/* Customer */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#4a2e42" }}>
                        {order.customerName}
                      </div>
                      <div style={{ fontSize: 11, color: "#8b6f84", marginTop: 2 }}>
                        {order.customerPhone}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {order.isRushOrder && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#c77db3", background: "rgba(199,125,179,0.12)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.05em" }}>
                            ⚡ RUSH
                          </span>
                        )}
                        <span style={{ fontSize: 9, color: "#8b6f84", background: "rgba(216,159,200,0.1)", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace" }}>
                          {order.orderId.slice(0, 8)}
                        </span>
                        {(order.paymentProof || order.idDocs?.length) ? (
                          <button
                            onClick={() => setDocsModal(order)}
                            style={{ fontSize: 9, fontWeight: 700, color: "#6d28d9", background: "rgba(139,92,246,0.1)", borderRadius: 4, padding: "1px 6px", border: "none", cursor: "pointer", letterSpacing: "0.03em" }}
                          >
                            📋 DOCS{order.idDocs?.length ? ` +ID` : ""}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ fontSize: 12, color: "#4a2e42", lineHeight: 1.6 }}>
                      {(order.items ?? []).slice(0, 2).map((item, i) => (
                        <div key={i}>
                          {item.name}
                          <span style={{ color: "#c77db3", fontWeight: 700 }}> ×{item.quantity}</span>
                        </div>
                      ))}
                      {(order.items ?? []).length > 2 && (
                        <div style={{ color: "#8b6f84" }}>+{order.items.length - 2} more</div>
                      )}
                    </div>

                    {/* Total */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#4a2e42" }}>
                        ₱{order.total.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: "#8b6f84", marginTop: 2 }}>
                        ↓ ₱{order.downpayment.toLocaleString()}
                      </div>
                    </div>

                    {/* Pickup */}
                    <div style={{ fontSize: 12, color: "#4a2e42" }}>
                      <div style={{ fontWeight: 600 }}>{order.pickupDate}</div>
                      <div style={{ color: "#8b6f84", marginTop: 2 }}>{order.pickupTime}</div>
                    </div>

                    {/* Status badge */}
                    <div>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        color: cfg.color,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        whiteSpace: "nowrap",
                      }}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      {order.status === "declined" && order.declineReason && (
                        <div style={{ fontSize: 10, color: "#b91c1c", marginTop: 4, maxWidth: 140, lineHeight: 1.4 }}>
                          {order.declineReason}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {isUpdating ? (
                        <span style={{ fontSize: 12, color: "#8b6f84", fontStyle: "italic" }}>Saving…</span>
                      ) : order.status === "declined" ? (
                        <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>❌ Declined</span>
                      ) : order.status === "completed" ? (
                        <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>✓ Completed</span>
                      ) : (
                        <>
                          {/* Advance status button */}
                          {order.status === "pending" && order.paymentProof ? (
                            <button
                              onClick={() => updateStatus(order, "confirmed")}
                              style={{
                                padding: "7px 14px",
                                borderRadius: 10,
                                border: "1.5px solid rgba(34,197,94,0.5)",
                                background: "rgba(34,197,94,0.12)",
                                color: "#15803d",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "system-ui, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <Check size={13} strokeWidth={3} /> Confirm Payment
                            </button>
                          ) : nextStatus && nextCfg ? (
                            <button
                              onClick={() => updateStatus(order, nextStatus)}
                              style={{
                                padding: "7px 14px",
                                borderRadius: 10,
                                border: `1.5px solid ${nextCfg.border}`,
                                background: nextCfg.bg,
                                color: nextCfg.color,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "system-ui, sans-serif",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              {nextCfg.emoji} Mark {nextCfg.label.split(" ")[0]}
                            </button>
                          ) : null}

                          {/* Decline button — only for pending/confirmed */}
                          {canDecline(order.status) && (
                            <button
                              onClick={() => openDeclineModal(order)}
                              style={{
                                padding: "7px 14px",
                                borderRadius: 10,
                                border: "1.5px solid rgba(239,68,68,0.4)",
                                background: "rgba(239,68,68,0.06)",
                                color: "#b91c1c",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "system-ui, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "nowrap",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                            >
                              <XCircle size={13} /> Decline
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#8b6f84", marginTop: 16 }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} shown · Updates reflect instantly on the customer's tracking page
        </p>
      </div>

      {/* Documents viewer modal */}
      {docsModal && (
        <div
          onClick={() => setDocsModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", fontFamily: "system-ui, sans-serif" }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(216,159,200,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#4a2e42" }}>Customer Documents</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#8b6f84" }}>
                  {docsModal.customerName} · <span style={{ fontFamily: "monospace" }}>{docsModal.orderId.slice(0, 8)}</span>
                </p>
              </div>
              <button
                onClick={() => setDocsModal(null)}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(216,159,200,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} color="#8b6f84" />
              </button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Payment Proof */}
              {docsModal.paymentProof ? (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#15803d" }}>
                    💳 Payment Proof
                  </p>
                  <img
                    src={docsModal.paymentProof}
                    alt="Payment proof"
                    style={{ width: "100%", borderRadius: 14, border: "1.5px solid rgba(34,197,94,0.25)", objectFit: "contain", maxHeight: 320, background: "#f9f9f9" }}
                  />
                </div>
              ) : (
                <div style={{ padding: "16px", background: "rgba(251,191,36,0.08)", borderRadius: 12, border: "1px solid rgba(251,191,36,0.3)" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>⚠️ No payment proof submitted</p>
                </div>
              )}

              {/* ID Documents */}
              {docsModal.idDocs && docsModal.idDocs.length > 0 ? (
                <div>
                  <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6d28d9" }}>
                    🪪 Discount ID Verification
                  </p>
                  {docsModal.idDocs.map((doc, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#8b6f84" }}>
                        {doc.itemName} — <strong style={{ color: "#c77db3", textTransform: "capitalize" }}>{doc.discountType}</strong> discount
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#4a2e42" }}>ID Photo</p>
                          <img
                            src={doc.idPhoto}
                            alt="ID"
                            style={{ width: "100%", borderRadius: 10, border: "1.5px solid rgba(216,159,200,0.35)", objectFit: "cover", height: 160, background: "#f9f9f9", cursor: "pointer" }}
                            onClick={() => window.open(doc.idPhoto)}
                          />
                        </div>
                        <div>
                          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#4a2e42" }}>Holding ID Photo</p>
                          <img
                            src={doc.idHoldingPhoto}
                            alt="Holding ID"
                            style={{ width: "100%", borderRadius: 10, border: "1.5px solid rgba(216,159,200,0.35)", objectFit: "cover", height: 160, background: "#f9f9f9", cursor: "pointer" }}
                            onClick={() => window.open(doc.idHoldingPhoto)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "14px 16px", background: "rgba(216,159,200,0.06)", borderRadius: 12, border: "1px solid rgba(216,159,200,0.2)" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#8b6f84" }}>No discount ID documents for this order</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Decline reason modal */}
      {declineTarget && (
        <div
          onClick={() => !declining && setDeclineTarget(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(74,46,66,0.5)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 480, width: "100%", boxShadow: "0 24px 80px rgba(74,46,66,0.2)", fontFamily: "system-ui, sans-serif" }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={20} /> Decline Order
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#8b6f84" }}>
                  Order <span style={{ fontFamily: "monospace", background: "rgba(216,159,200,0.15)", padding: "1px 6px", borderRadius: 4 }}>{declineTarget.orderId.slice(0, 8)}</span> · {declineTarget.customerName}
                </p>
              </div>
              <button
                onClick={() => setDeclineTarget(null)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(216,159,200,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X size={16} color="#8b6f84" />
              </button>
            </div>

            {/* Preset reasons */}
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#4a2e42" }}>Select a reason:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {DECLINE_PRESETS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setDeclineReason(reason)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${declineReason === reason ? "rgba(239,68,68,0.5)" : "rgba(216,159,200,0.3)"}`,
                    background: declineReason === reason ? "rgba(239,68,68,0.08)" : "#fafafa",
                    color: declineReason === reason ? "#b91c1c" : "#4a2e42",
                    fontSize: 13,
                    fontWeight: declineReason === reason ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {declineReason === reason ? "● " : "○ "}{reason}
                </button>
              ))}
            </div>

            {/* Custom reason text area (shown when "Other reason" selected) */}
            {declineReason === "Other reason" && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#4a2e42" }}>Describe the reason:</p>
                <textarea
                  value={declineCustom}
                  onChange={(e) => setDeclineCustom(e.target.value)}
                  placeholder="Enter the specific reason for declining this order…"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid rgba(216,159,200,0.4)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "#4a2e42",
                    fontFamily: "system-ui, sans-serif",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    background: "#fafafa",
                  }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setDeclineTarget(null)}
                disabled={declining}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "1.5px solid rgba(216,159,200,0.4)",
                  background: "#fff",
                  color: "#8b6f84",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={declining || !declineReason || (declineReason === "Other reason" && !declineCustom.trim())}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: declining || !declineReason || (declineReason === "Other reason" && !declineCustom.trim())
                    ? "rgba(239,68,68,0.3)"
                    : "linear-gradient(135deg,#f87171,#dc2626)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: declining || !declineReason ? "not-allowed" : "pointer",
                  fontFamily: "system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <XCircle size={14} /> {declining ? "Declining…" : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
