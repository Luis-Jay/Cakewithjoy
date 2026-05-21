import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { X, Check, XCircle, Archive, RotateCcw, StickyNote, Printer } from "lucide-react";
import { sendOrderStatusEmail } from "../utils/emailNotifications";

type OrderStatus = "pending" | "confirmed" | "baking" | "quality_check" | "ready" | "completed" | "declined";
type PaymentType = "downpayment" | "deposit" | "full";

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
  customerEmail?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; cakeImage?: string; description?: string }>;
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
  clearedByAdmin?: boolean;
  paymentType?: PaymentType;
  amountDue?: number;
  remainingBalanceProof?: string;
  remainingBalanceVerified?: boolean;
  internalNote?: string;
  estimatedCompletion?: string;
}

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "baking", "quality_check", "ready", "completed"];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  pending:       { label: "Pending",          color: "#92400e", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.4)",  emoji: "⏳" },
  confirmed:     { label: "Confirmed",        color: "#1d4ed8", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.4)",  emoji: "✅" },
  baking:        { label: "Baking",           color: "#c2410c", bg: "rgba(234,88,12,0.12)",   border: "rgba(234,88,12,0.4)",   emoji: "🔥" },
  quality_check: { label: "Quality Check",    color: "#7c3aed", bg: "rgba(124,58,237,0.10)",  border: "rgba(124,58,237,0.4)",  emoji: "🔍" },
  ready:         { label: "Ready for Pickup", color: "#15803d", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.4)",   emoji: "🎂" },
  completed:     { label: "Completed",        color: "#6d28d9", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.4)",  emoji: "🎉" },
  declined:      { label: "Declined",         color: "#b91c1c", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.35)",  emoji: "❌" },
};

const DECLINE_PRESETS = [
  "Fake or invalid ID submitted",
  "Fake payment proof submitted",
  "Suspicious account activity",
  "Discount not applicable",
  "Other reason",
];

const normalizePaymentType = (order: LiveOrder): PaymentType => {
  if (order.paymentType === "full") return "full";
  if (order.paymentType === "deposit") return "deposit";
  if (order.paymentType === "downpayment") return "downpayment";
  if ((order.amountDue ?? 0) >= order.total && order.total > 0) return "full";
  return "downpayment";
};

const getRemainingBalance = (order: LiveOrder) => {
  if (normalizePaymentType(order) === "full") return 0;
  const inferredDownpayment = order.downpayment > 0 ? order.downpayment : order.amountDue ?? 0;
  return Math.max(order.total - inferredDownpayment, 0);
};

const getDesignReferences = (order: LiveOrder) =>
  (order.items ?? []).filter((item) => !!item.cakeImage);

export function OrderManagement() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [docsModal, setDocsModal] = useState<LiveOrder | null>(null);
  const [noteModal, setNoteModal] = useState<LiveOrder | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Decline modal state
  const [declineTarget, setDeclineTarget] = useState<LiveOrder | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineCustom, setDeclineCustom] = useState("");
  const [declining, setDeclining] = useState(false);

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = useState<LiveOrder | "all-completed" | "all-declined" | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Receipt modal state
  const [receiptOrder, setReceiptOrder] = useState<LiveOrder | null>(null);

  useEffect(() => {
    const ordersRef = ref(db, "allOrders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const list: LiveOrder[] = Object.entries(data)
        .map(([key, val]: [string, any]) => {
          const v = val as any;
          // Firebase stores arrays as objects with numeric keys — convert back to array
          const idDocs = v.idDocs
            ? Array.isArray(v.idDocs)
              ? v.idDocs
              : Object.values(v.idDocs)
            : null;
          return { orderId: key, ...(v as Omit<LiveOrder, "orderId">), idDocs };
        })
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (order: LiveOrder, newStatus: OrderStatus) => {
    setUpdating(order.orderId);
    try {
      await update(ref(db, `allOrders/${order.orderId}`), { status: newStatus });
      update(ref(db, `orders/${order.customerId}/${order.orderId}`), { status: newStatus }).catch(() => {});
      if (order.customerEmail) {
        const remaining =
          order.paymentType !== "full"
            ? Math.max((order.total ?? 0) - (order.downpayment ?? 0), 0)
            : 0;
        sendOrderStatusEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          orderId: order.orderId,
          status: newStatus,
          pickupDate: order.pickupDate,
          pickupTime: order.pickupTime,
          total: order.total,
          downpayment: order.downpayment,
          remainingBalance: remaining > 0 ? remaining : undefined,
          items: order.items,
        });
      }
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
      await update(ref(db, `allOrders/${declineTarget.orderId}`), payload);
      update(ref(db, `orders/${declineTarget.customerId}/${declineTarget.orderId}`), payload).catch(() => {});
      if (declineTarget.customerEmail) {
        sendOrderStatusEmail({
          customerEmail: declineTarget.customerEmail,
          customerName: declineTarget.customerName,
          orderId: declineTarget.orderId,
          status: "declined",
          declineReason: finalReason,
          total: declineTarget.total,
          items: declineTarget.items,
        });
      }
      setDeclineTarget(null);
    } catch (e) {
      console.error("Failed to decline order", e);
    } finally {
      setDeclining(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      if (archiveTarget === "all-completed") {
        await Promise.all(
          activeOrders.filter((o) => o.status === "completed").map((o) => update(ref(db, `allOrders/${o.orderId}`), { clearedByAdmin: true }))
        );
      } else if (archiveTarget === "all-declined") {
        await Promise.all(
          activeOrders.filter((o) => o.status === "declined").map((o) => update(ref(db, `allOrders/${o.orderId}`), { clearedByAdmin: true }))
        );
      } else {
        await update(ref(db, `allOrders/${archiveTarget.orderId}`), { clearedByAdmin: true });
      }
      setArchiveTarget(null);
    } catch (e) {
      console.error("Failed to archive order(s)", e);
    } finally {
      setArchiving(false);
    }
  };

  const unarchiveOrder = async (order: LiveOrder) => {
    try {
      await update(ref(db, `allOrders/${order.orderId}`), { clearedByAdmin: false });
    } catch (e) {
      console.error("Failed to unarchive order", e);
    }
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setSavingNote(true);
    try {
      await update(ref(db, `allOrders/${noteModal.orderId}`), { internalNote: noteText.trim() });
      setNoteModal(null);
    } catch (e) {
      console.error("Failed to save note", e);
    } finally {
      setSavingNote(false);
    }
  };

  const confirmPaymentAndShowReceipt = async (order: LiveOrder) => {
    setUpdating(order.orderId);
    try {
      await update(ref(db, `allOrders/${order.orderId}`), { status: "confirmed" });
      update(ref(db, `orders/${order.customerId}/${order.orderId}`), { status: "confirmed" }).catch(() => {});
      setReceiptOrder({ ...order, status: "confirmed" });
      if (order.customerEmail) {
        const remaining =
          order.paymentType !== "full"
            ? Math.max((order.total ?? 0) - (order.downpayment ?? 0), 0)
            : 0;
        sendOrderStatusEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          orderId: order.orderId,
          status: "confirmed",
          pickupDate: order.pickupDate,
          pickupTime: order.pickupTime,
          total: order.total,
          downpayment: order.downpayment,
          remainingBalance: remaining > 0 ? remaining : undefined,
          items: order.items,
        });
      }
    } catch (e) {
      console.error("Failed to confirm order", e);
    } finally {
      setUpdating(null);
    }
  };

  const esc = (v: unknown) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const printConfirmationReceipt = (order: LiveOrder) => {
    const win = window.open("", "_blank", "width=720,height=960");
    if (!win) return;
    const confirmedAt = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const payType = normalizePaymentType(order);
    const remaining = getRemainingBalance(order);
    const amountPaid = payType === "full" ? order.total : (order.downpayment || order.amountDue || 0);
    const fmt = (n: number) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const itemsHtml = (order.items ?? []).map((item) =>
      `<tr><td>${esc(item.name)}</td><td>×${item.quantity}</td><td>${fmt(item.price * item.quantity)}</td></tr>`
    ).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Order Confirmation – ${order.orderId.slice(0, 8).toUpperCase()}</title><style>
      @page{size:A5 portrait;margin:15mm 18mm}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:12px}
      .r{width:100%}
      .hdr{text-align:center;padding-bottom:16px;margin-bottom:14px;border-bottom:2px solid #c77db3}
      .brand{font-size:22px;font-weight:900;color:#4a2e42}
      .brand-sub{font-size:9px;color:#8b6f84;letter-spacing:.2em;text-transform:uppercase;margin-top:3px}
      .badge{display:inline-block;margin-top:10px;background:#d1fae5;border:1px solid #6ee7b7;border-radius:100px;padding:4px 16px;font-size:10px;font-weight:800;color:#065f46;letter-spacing:.08em}
      .meta{display:flex;justify-content:space-between;font-size:10px;color:#6b5263;padding:8px 0;border-bottom:1px solid #f0dcea;margin-bottom:14px}
      .sec{margin-bottom:14px}
      .sec-t{font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#c77db3;margin-bottom:6px;padding-bottom:4px;border-bottom:.5px solid #f0dcea}
      .row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}
      .lbl{color:#6b5263}.val{font-weight:600;color:#1a1a2e}
      table{width:100%;border-collapse:collapse}
      th{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8b6f84;padding:0 0 5px;text-align:left;border-bottom:.5px solid #f0dcea}
      th:nth-child(2){text-align:center}th:last-child{text-align:right}
      td{padding:5px 0;border-bottom:.5px solid #f9eef7;vertical-align:top}
      td:nth-child(2){text-align:center;color:#c77db3;font-weight:700}
      td:last-child{text-align:right;font-weight:600}
      .tot-line{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
      .tot-total{display:flex;justify-content:space-between;font-size:15px;font-weight:900;color:#4a2e42;border-top:1.5px solid #c77db3;padding-top:7px;margin-top:5px}
      .bal-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px 12px;margin-top:10px}
      .bal-box .row{color:#92400e;font-weight:700;margin-bottom:2px}
      .bal-note{font-size:9px;color:#b45309;margin-top:3px}
      .pickup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .p-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px}
      .p-lbl{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#1d4ed8;margin-bottom:4px}
      .p-val{font-size:14px;font-weight:800;color:#1e3a8a}
      .ftr{text-align:center;margin-top:22px;padding-top:14px;border-top:1px dashed #d89fc8;font-size:10px;color:#8b6f84;line-height:1.9}
      .ftr strong{color:#4a2e42}
      .print-btn{display:block;width:100%;margin-top:20px;padding:12px;background:#c77db3;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer}
      @media print{.print-btn{display:none}}
    </style></head><body><div class="r">
      <div class="hdr">
        <div class="brand">🎂 Cake with Joy</div>
        <div class="brand-sub">Order Confirmation Receipt</div>
        <div class="badge">✓ Payment Confirmed</div>
      </div>
      <div class="meta">
        <span>Receipt No: <strong>${esc(order.orderId.slice(0, 8).toUpperCase())}</strong></span>
        <span>Confirmed: <strong>${esc(confirmedAt)}</strong></span>
      </div>
      <div class="sec">
        <div class="sec-t">Customer Information</div>
        <div class="row"><span class="lbl">Name</span><span class="val">${esc(order.customerName)}</span></div>
        <div class="row"><span class="lbl">Phone</span><span class="val">${esc(order.customerPhone)}</span></div>
      </div>
      <div class="sec">
        <div class="sec-t">Order Items</div>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      </div>
      <div class="sec">
        <div class="sec-t">Payment Summary</div>
        <div class="tot-line"><span class="lbl">Subtotal</span><span>${fmt(order.subtotal)}</span></div>
        ${order.rushFee > 0 ? `<div class="tot-line"><span class="lbl">⚡ Rush Fee</span><span>${fmt(order.rushFee)}</span></div>` : ""}
        <div class="tot-line"><span class="lbl">Amount Paid</span><span style="color:#15803d;font-weight:700">${fmt(amountPaid)}</span></div>
        <div class="tot-total"><span>Order Total</span><span>${fmt(order.total)}</span></div>
        ${remaining > 0 ? `<div class="bal-box"><div class="row"><span>⚠️ Remaining Balance</span><span>${fmt(remaining)}</span></div><div class="bal-note">Balance is due on or before pickup date.</div></div>` : `<div class="tot-line" style="margin-top:8px"><span class="lbl">Balance</span><span style="color:#065f46;font-weight:700">Fully Paid ✓</span></div>`}
      </div>
      <div class="sec">
        <div class="sec-t">Pickup Schedule</div>
        <div class="pickup-grid">
          <div class="p-box"><div class="p-lbl">Pickup Date</div><div class="p-val">${esc(order.pickupDate)}</div></div>
          <div class="p-box"><div class="p-lbl">Pickup Time</div><div class="p-val">${esc(order.pickupTime)}</div></div>
        </div>
      </div>
      <div class="ftr"><strong>Thank you for choosing Cake with Joy! 🎂</strong><br>Please present this receipt upon pickup.<br>Motorcycles are not recommended for cake pickup.</div>
      <button class="print-btn" onclick="window.print()">🖨️ Print This Receipt</button>
    </div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const activeOrders = orders.filter((o) => !o.clearedByAdmin);
  const archivedOrders = orders.filter((o) => o.clearedByAdmin);

  const allStatuses: (OrderStatus | "all")[] = ["all", ...STATUS_FLOW, "declined"];

  const stats = [...STATUS_FLOW, "declined" as OrderStatus].reduce((acc, s) => {
    acc[s] = activeOrders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const filtered = activeOrders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) =>
      search === "" ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const pickupDiff = new Date(a.pickupDate || a.createdAt).getTime() - new Date(b.pickupDate || b.createdAt).getTime();
      if (pickupDiff !== 0) return pickupDiff;
      return a.customerName.localeCompare(b.customerName);
    });

  const filteredArchived = archivedOrders
    .filter((o) =>
      search === "" ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canDecline = (status: OrderStatus) => status === "pending" || status === "confirmed";

  return (
    <div style={{ minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif" }} className="px-3 py-6 sm:px-6 sm:py-8">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>
            Order Management
          </h1>
          <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>
            Update order statuses — customers see changes in real time
          </p>
          <p style={{ fontSize: 12, color: "#8b6f84", marginTop: 4 }}>
            Orders are automatically sorted by pickup date.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }} className="sm:!grid-cols-6">
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

        {/* Search + bulk archive + archive toggle */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or order ID…"
            style={{
              flex: "1 1 240px",
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
          {!showArchived && activeOrders.filter((o) => o.status === "completed").length > 0 && (
            <button
              onClick={() => setArchiveTarget("all-completed")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 12,
                border: "1.5px solid rgba(139,92,246,0.35)",
                background: "rgba(139,92,246,0.08)",
                color: "#6d28d9", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              <Archive size={13} /> Archive all completed
            </button>
          )}
          {!showArchived && activeOrders.filter((o) => o.status === "declined").length > 0 && (
            <button
              onClick={() => setArchiveTarget("all-declined")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 12,
                border: "1.5px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.07)",
                color: "#b91c1c", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              <Archive size={13} /> Archive all declined
            </button>
          )}
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 12,
              border: `1.5px solid ${showArchived ? "rgba(199,125,179,0.6)" : "rgba(216,159,200,0.4)"}`,
              background: showArchived ? "rgba(199,125,179,0.12)" : "#fff",
              color: showArchived ? "#c77db3" : "#8b6f84", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            <Archive size={13} /> {showArchived ? `Active Orders` : `View Archive (${archivedOrders.length})`}
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          border: "1px solid rgba(216,159,200,0.3)",
          boxShadow: "0 4px 32px rgba(216,159,200,0.1)",
          overflowX: "auto",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#8b6f84", fontSize: 14 }}>
              Loading orders…
            </div>
          ) : showArchived ? (
            /* ── ARCHIVED VIEW ── */
            filteredArchived.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p style={{ color: "#8b6f84", fontSize: 14, margin: 0 }}>No archived orders yet</p>
              </div>
            ) : (
              <div style={{ minWidth: 680 }}>
                <div style={{ padding: "14px 24px", background: "rgba(199,125,179,0.06)", borderBottom: "1px solid rgba(216,159,200,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Archive size={14} color="#c77db3" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#c77db3", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Archived Orders — {filteredArchived.length} record{filteredArchived.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 100px 120px 160px 120px", padding: "12px 24px", background: "rgba(216,159,200,0.06)", borderBottom: "1px solid rgba(216,159,200,0.15)" }}>
                  {["Customer", "Items", "Total", "Pickup", "Status", "Action"].map((h) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>{h}</span>
                  ))}
                </div>
                {filteredArchived.map((order, idx) => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <div key={order.orderId} style={{
                      display: "grid", gridTemplateColumns: "1.4fr 1.6fr 100px 120px 160px 120px",
                      padding: "14px 24px", borderBottom: idx < filteredArchived.length - 1 ? "1px solid rgba(216,159,200,0.1)" : "none",
                      alignItems: "center", background: "rgba(216,159,200,0.02)",
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#6b5263" }}>{order.customerName}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{order.customerPhone}</div>
                        <div style={{ fontSize: 9, color: "#aaa", fontFamily: "monospace", marginTop: 3 }}>{order.orderId.slice(0, 8)}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b5263", lineHeight: 1.6 }}>
                        {(order.items ?? []).slice(0, 2).map((item, i) => (
                          <div key={i}>{item.name} <span style={{ color: "#c77db3", fontWeight: 700 }}>×{item.quantity}</span></div>
                        ))}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#6b5263" }}>₱{order.total.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: "#6b5263" }}>
                        <div>{order.pickupDate}</div>
                        <div style={{ color: "#aaa", marginTop: 2 }}>{order.pickupTime}</div>
                      </div>
                      <div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, opacity: 0.7 }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => unarchiveOrder(order)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 10,
                            border: "1.5px solid rgba(199,125,179,0.4)",
                            background: "rgba(199,125,179,0.07)",
                            color: "#c77db3", fontSize: 11, fontWeight: 700,
                            cursor: "pointer", fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          <RotateCcw size={11} /> Unarchive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: "#8b6f84", fontSize: 14, margin: 0 }}>
                {activeOrders.length === 0 ? "No orders placed yet" : "No orders match this filter"}
              </p>
            </div>
          ) : (
            <div style={{ minWidth: 680 }}>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.6fr 100px 120px 160px 1fr",
                padding: "12px 24px",
                background: "rgba(216,159,200,0.08)",
                borderBottom: "1px solid rgba(216,159,200,0.2)",
              }}>
                {(["Customer", "Items", "Total", "Pickup", "Status", "Action"] as const).map((h) => (
                  <span
                    key={h}
                    style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: h === "Pickup" ? "#c77db3" : "#8b6f84" }}
                  >
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
                const paymentType = normalizePaymentType(order);
                const remainingBalance = getRemainingBalance(order);
                const designReferences = getDesignReferences(order);

                // For downpayment orders at "ready": gate completion until balance is verified
                const awaitingBalance =
                  order.status === "ready" &&
                  paymentType !== "full" &&
                  !order.remainingBalanceProof;
                const canVerifyBalance =
                  order.status === "ready" &&
                  paymentType !== "full" &&
                  !!order.remainingBalanceProof &&
                  !order.remainingBalanceVerified;

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
                        {(order.paymentProof || order.idDocs?.length || designReferences.length > 0) ? (
                          <button
                            onClick={() => setDocsModal(order)}
                            style={{ fontSize: 9, fontWeight: 700, color: "#6d28d9", background: "rgba(139,92,246,0.1)", borderRadius: 4, padding: "1px 6px", border: "none", cursor: "pointer", letterSpacing: "0.03em" }}
                          >
                            📋 DOCS
                            {designReferences.length > 0 ? " +DESIGN" : ""}
                            {order.idDocs?.length ? " +ID" : ""}
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
                        <>
                          <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>❌ Declined</span>
                          <button
                            onClick={() => setArchiveTarget(order)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 10,
                              border: "1.5px solid rgba(239,68,68,0.3)",
                              background: "rgba(239,68,68,0.05)",
                              color: "#b91c1c", fontSize: 11, fontWeight: 700,
                              cursor: "pointer", fontFamily: "system-ui, sans-serif",
                            }}
                          >
                            <Archive size={11} /> Archive
                          </button>
                        </>
                      ) : order.status === "completed" ? (
                        <>
                          <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>✓ Completed</span>
                          <button
                            onClick={() => setArchiveTarget(order)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 10,
                              border: "1.5px solid rgba(139,92,246,0.3)",
                              background: "rgba(139,92,246,0.06)",
                              color: "#6d28d9", fontSize: 11, fontWeight: 700,
                              cursor: "pointer", fontFamily: "system-ui, sans-serif",
                            }}
                          >
                            <Archive size={11} /> Archive
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Advance status button */}
                          {order.status === "pending" && order.paymentProof ? (
                            <button
                              onClick={() => confirmPaymentAndShowReceipt(order)}
                              style={{
                                padding: "7px 14px", borderRadius: 10,
                                border: "1.5px solid rgba(34,197,94,0.5)", background: "rgba(34,197,94,0.12)",
                                color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <Check size={13} strokeWidth={3} /> Confirm Payment
                            </button>
                          ) : awaitingBalance ? (
                            /* Downpayment order — customer hasn't uploaded remaining balance yet */
                            <div style={{
                              padding: "7px 12px", borderRadius: 10,
                              border: "1.5px solid rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.08)",
                              fontSize: 11, fontWeight: 700, color: "#92400e",
                              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                            }}>
                              ⏳ Awaiting Balance Payment
                            </div>
                          ) : canVerifyBalance ? (
                            /* Customer uploaded proof — admin must verify then complete */
                            <button
                              onClick={async () => {
                                setUpdating(order.orderId);
                                try {
                                  await update(ref(db, `allOrders/${order.orderId}`), {
                                    status: "completed",
                                    remainingBalanceVerified: true,
                                  });
                                  update(ref(db, `orders/${order.customerId}/${order.orderId}`), { status: "completed", remainingBalanceVerified: true }).catch(() => {});
                                  if (order.customerEmail) {
                                    sendOrderStatusEmail({
                                      customerEmail: order.customerEmail,
                                      customerName: order.customerName,
                                      orderId: order.orderId,
                                      status: "completed",
                                      pickupDate: order.pickupDate,
                                      pickupTime: order.pickupTime,
                                      total: order.total,
                                      items: order.items,
                                    });
                                  }
                                } finally { setUpdating(null); }
                              }}
                              style={{
                                padding: "7px 14px", borderRadius: 10,
                                border: "1.5px solid rgba(34,197,94,0.5)", background: "rgba(34,197,94,0.12)",
                                color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <Check size={13} strokeWidth={3} /> Verify & Complete
                            </button>
                          ) : nextStatus && nextCfg ? (
                            <button
                              onClick={() => updateStatus(order, nextStatus)}
                              style={{
                                padding: "7px 14px", borderRadius: 10,
                                border: `1.5px solid ${nextCfg.border}`, background: nextCfg.bg,
                                color: nextCfg.color, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: "system-ui, sans-serif", transition: "all 0.15s",
                                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
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

                          {/* Internal note button */}
                          <button
                            onClick={() => { setNoteModal(order); setNoteText(order.internalNote ?? ""); }}
                            style={{
                              padding: "6px 12px", borderRadius: 10,
                              border: `1.5px solid ${order.internalNote ? "rgba(199,125,179,0.5)" : "rgba(216,159,200,0.35)"}`,
                              background: order.internalNote ? "rgba(199,125,179,0.08)" : "transparent",
                              color: order.internalNote ? "#c77db3" : "#8b6f84",
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                              fontFamily: "system-ui, sans-serif",
                              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                            }}
                          >
                            <StickyNote size={11} /> {order.internalNote ? "Edit Note" : "Add Note"}
                          </button>
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
          {showArchived ? `${filteredArchived.length} archived record${filteredArchived.length !== 1 ? "s" : ""}` : `${filtered.length} order${filtered.length !== 1 ? "s" : ""} shown`} · Updates reflect instantly on the customer's tracking page
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
              {/* Cake Design Reference */}
              {getDesignReferences(docsModal).length > 0 && (
                <div>
                  <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c77db3" }}>
                    🎨 Cake Design Reference
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {getDesignReferences(docsModal).map((item) => (
                      <div key={item.id} style={{ borderRadius: 14, border: "1.5px solid rgba(216,159,200,0.28)", overflow: "hidden", background: "#fff7fc" }}>
                        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(216,159,200,0.18)" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4a2e42" }}>{item.name}</p>
                          {item.description && (
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b6f84" }}>{item.description}</p>
                          )}
                        </div>
                        <img
                          src={item.cakeImage}
                          alt={`Design reference for ${item.name}`}
                          style={{ width: "100%", borderRadius: 0, objectFit: "contain", maxHeight: 360, background: "#f9f9f9", cursor: "pointer" }}
                          onClick={() => window.open(item.cakeImage)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {docsModal.paymentProof ? (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#15803d" }}>
                    💳 Downpayment Proof
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

              {/* Remaining Balance Proof */}
              {normalizePaymentType(docsModal) !== "full" && (
                docsModal.remainingBalanceProof ? (
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1d4ed8" }}>
                      💰 Remaining Balance Proof {docsModal.remainingBalanceVerified ? "✅ Verified" : "⏳ Pending Verification"}
                    </p>
                    <img
                      src={docsModal.remainingBalanceProof}
                      alt="Remaining balance proof"
                      style={{ width: "100%", borderRadius: 14, border: `1.5px solid ${docsModal.remainingBalanceVerified ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`, objectFit: "contain", maxHeight: 320, background: "#f9f9f9" }}
                    />
                    {getRemainingBalance(docsModal) > 0 && (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
                        Amount: <strong style={{ color: "#1d4ed8" }}>₱{getRemainingBalance(docsModal).toLocaleString()}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "16px", background: "rgba(251,191,36,0.08)", borderRadius: 12, border: "1px solid rgba(251,191,36,0.3)" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>⏳ Remaining balance of ₱{getRemainingBalance(docsModal).toLocaleString()} not yet paid</p>
                  </div>
                )
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

      {/* Internal note modal */}
      {noteModal && (
        <div onClick={() => setNoteModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#4a2e42" }}>Internal Note</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#8b6f84" }}>{noteModal.customerName} · {noteModal.orderId.slice(0, 8)}</p>
              </div>
              <button onClick={() => setNoteModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8b6f84", padding: 4 }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 11, color: "#8b6f84", marginBottom: 8 }}>Visible to staff only. Customers cannot see this note.</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note about this order…"
              rows={5}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 12, fontSize: 13, color: "#4a2e42", fontFamily: "system-ui, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={saveNote}
                disabled={savingNote}
                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
              >
                {savingNote ? "Saving…" : "Save Note"}
              </button>
              <button
                onClick={() => setNoteModal(null)}
                style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid rgba(216,159,200,0.4)", background: "none", color: "#8b6f84", fontSize: 13, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {archiveTarget && (
        <div
          onClick={() => !archiving && setArchiveTarget(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(74,46,66,0.5)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 420, width: "100%", boxShadow: "0 24px 80px rgba(74,46,66,0.2)", fontFamily: "system-ui, sans-serif" }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📦</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 700, color: "#4a2e42" }}>
                {archiveTarget === "all-completed" ? "Archive all completed orders?" :
                 archiveTarget === "all-declined" ? "Archive all declined orders?" :
                 "Archive this order?"}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#8b6f84", lineHeight: 1.6 }}>
                {archiveTarget === "all-completed"
                  ? `This will archive all ${activeOrders.filter(o => o.status === "completed").length} completed orders.`
                  : archiveTarget === "all-declined"
                  ? `This will archive all ${activeOrders.filter(o => o.status === "declined").length} declined orders.`
                  : `Order ${(archiveTarget as LiveOrder).orderId.slice(0, 8)} will be archived.`}
                <br />All data is preserved and can be restored from the Archive view.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid rgba(216,159,200,0.4)", background: "#fff",
                  color: "#8b6f84", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "system-ui, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={archiving}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                  background: archiving ? "rgba(199,125,179,0.3)" : "linear-gradient(135deg,#d89fc8,#c77db3)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: archiving ? "not-allowed" : "pointer",
                  fontFamily: "system-ui, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Archive size={14} /> {archiving ? "Archiving…" : "Yes, archive"}
              </button>
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

      {/* ── Order Confirmation Receipt Modal ── */}
      {receiptOrder && (
        <div
          onClick={() => setReceiptOrder(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 28, width: "100%", maxWidth: 460, boxShadow: "0 40px 120px rgba(0,0,0,0.45)", overflow: "hidden", fontFamily: "system-ui, sans-serif" }}
          >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #f9eef7 0%, #f0dcea 100%)", padding: "28px 28px 22px", textAlign: "center", borderBottom: "1px solid rgba(216,159,200,0.3)" }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>🎂</div>
              <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#4a2e42" }}>Order Confirmed!</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: 100, padding: "5px 16px" }}>
                <Check size={12} strokeWidth={3} color="#15803d" />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#15803d", letterSpacing: "0.07em" }}>PAYMENT ACCEPTED</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px" }}>
              {/* Meta */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b6f84", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(216,159,200,0.15)" }}>
                <span>Receipt No: <strong style={{ color: "#4a2e42", fontFamily: "monospace" }}>{receiptOrder.orderId.slice(0, 8).toUpperCase()}</strong></span>
                <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>

              {/* Customer */}
              <div style={{ background: "rgba(249,238,247,0.6)", border: "1px solid rgba(216,159,200,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#c77db3", marginBottom: 8 }}>Customer</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#4a2e42" }}>{receiptOrder.customerName}</div>
                <div style={{ fontSize: 12, color: "#8b6f84", marginTop: 3 }}>{receiptOrder.customerPhone}</div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 8 }}>Order Items</div>
                {(receiptOrder.items ?? []).map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < (receiptOrder.items?.length ?? 0) - 1 ? "1px solid rgba(216,159,200,0.1)" : "none" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#4a2e42" }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: "#c77db3", fontWeight: 700, marginLeft: 6 }}>×{item.quantity}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#4a2e42" }}>₱{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: "rgba(249,238,247,0.5)", border: "1px solid rgba(216,159,200,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
                {receiptOrder.subtotal !== receiptOrder.total && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5263", marginBottom: 5 }}>
                    <span>Subtotal</span><span>₱{receiptOrder.subtotal.toLocaleString()}</span>
                  </div>
                )}
                {receiptOrder.rushFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5263", marginBottom: 5 }}>
                    <span>⚡ Rush Fee</span><span>₱{receiptOrder.rushFee.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#4a2e42", borderTop: "1.5px solid rgba(199,125,179,0.3)", paddingTop: 8 }}>
                  <span>Order Total</span><span style={{ color: "#c77db3" }}>₱{receiptOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 8 }}>Payment</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5263", marginBottom: 4 }}>
                  <span>Amount Paid</span>
                  <span style={{ fontWeight: 700, color: "#15803d" }}>
                    ₱{(normalizePaymentType(receiptOrder) === "full" ? receiptOrder.total : (receiptOrder.downpayment || receiptOrder.amountDue || 0)).toLocaleString()}
                  </span>
                </div>
                {getRemainingBalance(receiptOrder) > 0 ? (
                  <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 10, padding: "9px 12px", marginTop: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#92400e", fontWeight: 700 }}>
                      <span>⚠️ Remaining Balance</span>
                      <span>₱{getRemainingBalance(receiptOrder).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#b45309", marginTop: 3 }}>Due on or before pickup</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, marginTop: 4 }}>✓ Fully Paid</div>
                )}
              </div>

              {/* Pickup */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Pickup Date", value: receiptOrder.pickupDate },
                  { label: "Pickup Time", value: receiptOrder.pickupTime },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#1d4ed8", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a8a" }}>{value || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => printConfirmationReceipt(receiptOrder)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 0", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui, sans-serif", boxShadow: "0 4px 16px rgba(199,125,179,0.35)" }}
                >
                  <Printer size={15} /> Print Receipt
                </button>
                <button
                  onClick={() => setReceiptOrder(null)}
                  style={{ padding: "13px 20px", borderRadius: 14, border: "1.5px solid rgba(216,159,200,0.4)", background: "#fff", color: "#8b6f84", fontSize: 13, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
