import React, { useEffect, useRef, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { Package, CheckCircle, Flame, MapPin, Upload, ImageIcon, Search, Calendar } from "lucide-react";
import { toast } from "sonner";

const compressImage = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });

const parseValidDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type OrderStatus = "pending" | "confirmed" | "baking" | "quality_check" | "ready" | "completed" | "declined";
type PaymentType = "downpayment" | "deposit" | "full";

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  rushFee: number;
  total: number;
  downpayment: number;
  amountDue: number;
  paymentType?: PaymentType;
  isRushOrder: boolean;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
  declineReason?: string;
  createdAt: string;
  clearedByCustomer?: boolean;
  remainingBalanceProof?: string;
  remainingBalanceVerified?: boolean;
  estimatedCompletion?: string;
  internalNote?: string;
}

const STEPS: { key: OrderStatus; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "pending",       label: "Order Received",    icon: Package,     desc: "We've received your order and are reviewing it." },
  { key: "confirmed",     label: "Confirmed",          icon: CheckCircle, desc: "Your order is confirmed! Downpayment acknowledged." },
  { key: "baking",        label: "Baking",             icon: Flame,       desc: "Your cake is in the oven — the magic is happening!" },
  { key: "quality_check", label: "Quality Check",      icon: Search,      desc: "Almost there! Our team is doing a final quality check." },
  { key: "ready",         label: "Ready for Pickup",   icon: MapPin,      desc: "Your cake is ready! Please come pick it up." },
  { key: "completed",     label: "Completed",          icon: CheckCircle, desc: "Order complete. Thank you for choosing Cake with Joy! 🎂" },
];

const STATUS_COLORS: Record<OrderStatus, { color: string; bg: string; border: string }> = {
  pending:       { color: "#92400e", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)" },
  confirmed:     { color: "#1d4ed8", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)" },
  baking:        { color: "#c2410c", bg: "rgba(234,88,12,0.12)",   border: "rgba(234,88,12,0.35)"  },
  quality_check: { color: "#6d28d9", bg: "rgba(124,58,237,0.10)",  border: "rgba(124,58,237,0.35)" },
  ready:         { color: "#15803d", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)"  },
  completed:     { color: "#6d28d9", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.35)" },
  declined:      { color: "#b91c1c", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.35)"  },
};

function getStepIndex(status: OrderStatus): number {
  return STEPS.findIndex((s) => s.key === status);
}

function getProgress(status: OrderStatus): number {
  const idx = getStepIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

function normalizePaymentType(order: Order): PaymentType {
  if (order.paymentType === "full") return "full";
  if (order.paymentType === "deposit") return "deposit";
  if (order.paymentType === "downpayment") return "downpayment";
  if (order.amountDue >= order.total && order.total > 0) return "full";
  return "downpayment";
}

function getRemainingBalance(order: Order): number {
  const paymentType = normalizePaymentType(order);
  if (paymentType === "full") return 0;
  const inferredDownpayment = order.downpayment > 0 ? order.downpayment : order.amountDue;
  return Math.max(order.total - inferredDownpayment, 0);
}

function OrderCard({ order, onClear }: { order: Order; onClear?: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [balanceProof, setBalanceProof] = useState("");
  const [uploadingBalance, setUploadingBalance] = useState(false);

  const paymentType = normalizePaymentType(order);
  const remainingBalance = getRemainingBalance(order);
  const needsRemainingPayment =
    order.status === "ready" &&
    paymentType !== "full" &&
    !order.remainingBalanceProof;

  const awaitingVerification =
    order.status === "ready" &&
    paymentType !== "full" &&
    !!order.remainingBalanceProof &&
    !order.remainingBalanceVerified;

  const handleBalanceUpload = async () => {
    if (!balanceProof) return;
    setUploadingBalance(true);
    try {
      const compressed = await compressImage(balanceProof);
      await update(ref(db, `allOrders/${order.orderId}`), { remainingBalanceProof: compressed });
      setBalanceProof("");
    } catch (e) {
      console.error("Failed to upload balance proof", e);
    } finally {
      setUploadingBalance(false);
    }
  };

  const isDeclined = order.status === "declined";
  const isClearable = order.status === "completed" || order.status === "declined";
  const stepIdx = isDeclined ? -1 : getStepIndex(order.status);
  const progress = isDeclined ? 0 : getProgress(order.status);
  const sc = STATUS_COLORS[order.status];
  const currentStep = STEPS[stepIdx] ?? null;
  const estimatedCompletionDate = parseValidDate(order.estimatedCompletion);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 24,
      border: "1px solid rgba(216,159,200,0.3)",
      boxShadow: "0 4px 32px rgba(216,159,200,0.1)",
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Card header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(216,159,200,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontFamily: "monospace", background: "rgba(216,159,200,0.15)", padding: "2px 8px", borderRadius: 6, color: "#8b6f84" }}>
              {order.orderId.slice(0, 10)}
            </span>
            {order.isRushOrder && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#c77db3", background: "rgba(199,125,179,0.12)", borderRadius: 4, padding: "2px 7px", letterSpacing: "0.05em" }}>
                ⚡ RUSH
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
            Placed {new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            color: sc.color,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
          }}>
            {isDeclined ? "❌ Declined" : currentStep?.label}
          </span>
          {isClearable && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                background: "transparent",
                border: "1px solid rgba(139,111,132,0.3)",
                borderRadius: 100,
                padding: "5px 13px",
                fontSize: 12,
                fontWeight: 600,
                color: "#8b6f84",
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Clear
            </button>
          )}
          {isClearable && confirmClear && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>Remove this order?</span>
              <button
                onClick={() => { onClear?.(); setConfirmClear(false); }}
                style={{
                  background: "#b91c1c",
                  border: "none",
                  borderRadius: 100,
                  padding: "5px 13px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(139,111,132,0.3)",
                  borderRadius: 100,
                  padding: "5px 13px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8b6f84",
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Declined banner */}
        {isDeclined ? (
          <div style={{
            background: "rgba(239,68,68,0.07)",
            border: "1.5px solid rgba(239,68,68,0.3)",
            borderRadius: 16,
            padding: "20px 20px",
            marginBottom: 20,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>❌</div>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#b91c1c", fontFamily: "system-ui, sans-serif" }}>
              Your order has been declined
            </p>
            {order.declineReason && (
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7f1d1d", fontFamily: "system-ui, sans-serif" }}>
                Reason: <strong>{order.declineReason}</strong>
              </p>
            )}
            <p style={{ margin: 0, fontSize: 12, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
              Please contact us if you believe this is a mistake, or place a new order.
            </p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ height: 8, background: "rgba(216,159,200,0.15)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #d89fc8, #c77db3)",
                  borderRadius: 100,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <p style={{ fontSize: 11, color: "#8b6f84", marginTop: 6, fontFamily: "system-ui, sans-serif" }}>
                {progress}% complete
              </p>
            </div>

            {/* Step timeline */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
              {STEPS.map((step, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.key}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72, flex: 1 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: done || active
                          ? "linear-gradient(135deg, #d89fc8, #c77db3)"
                          : "rgba(216,159,200,0.12)",
                        border: active ? "2px solid #c77db3" : "2px solid transparent",
                        boxShadow: active ? "0 4px 12px rgba(199,125,179,0.4)" : "none",
                        transition: "all 0.3s",
                        flexShrink: 0,
                      }}>
                        <Icon size={15} color={done || active ? "#fff" : "#c4a1bb"} strokeWidth={2.5} />
                      </div>
                      <span style={{
                        fontSize: 10,
                        textAlign: "center",
                        marginTop: 6,
                        color: active ? "#c77db3" : done ? "#4a2e42" : "#c4a1bb",
                        fontWeight: active || done ? 700 : 400,
                        letterSpacing: "0.01em",
                        lineHeight: 1.3,
                        maxWidth: 64,
                        fontFamily: "system-ui, sans-serif",
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: 2,
                        background: i < stepIdx ? "#c77db3" : "rgba(216,159,200,0.2)",
                        marginTop: 17,
                        transition: "background 0.3s",
                        minWidth: 16,
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Current status message */}
            <div style={{
              background: sc.bg,
              border: `1px solid ${sc.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: estimatedCompletionDate ? 12 : 20,
              fontSize: 13,
              color: sc.color,
              fontWeight: 500,
              fontFamily: "system-ui, sans-serif",
            }}>
              {currentStep?.desc}
            </div>

            {/* Estimated completion date */}
            {estimatedCompletionDate && order.status !== "completed" && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(199,125,179,0.07)",
                border: "1px solid rgba(199,125,179,0.25)",
                borderRadius: 10,
                padding: "9px 14px",
                marginBottom: 20,
              }}>
                <Calendar size={14} color="#c77db3" />
                <span style={{ fontSize: 12, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
                  Estimated ready by{" "}
                  <strong style={{ color: "#4a2e42" }}>
                    {estimatedCompletionDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </strong>
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Remaining balance payment section ── */}
        {needsRemainingPayment && (
          <div style={{
            background: "rgba(251,191,36,0.07)",
            border: "1.5px solid rgba(251,191,36,0.45)",
            borderRadius: 16,
            padding: "20px",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>💳</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#92400e", fontFamily: "system-ui, sans-serif" }}>
                  Remaining Balance Due
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#78350f", fontFamily: "system-ui, sans-serif" }}>
                  Please pay before picking up your order
                </p>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 22, fontWeight: 800, color: "#92400e", fontFamily: "system-ui, sans-serif" }}>
                ₱{remainingBalance.toLocaleString()}
              </span>
            </div>

            {/* Upload area */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px dashed rgba(251,191,36,0.5)", padding: "14px", marginBottom: 10 }}>
              {balanceProof ? (
                <div style={{ textAlign: "center" }}>
                  <img src={balanceProof} alt="proof" style={{ maxHeight: 140, borderRadius: 8, objectFit: "contain", marginBottom: 8 }} />
                  <button
                    onClick={() => setBalanceProof("")}
                    style={{ fontSize: 11, color: "#b91c1c", background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <ImageIcon size={24} color="#c4a458" />
                  <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>
                    Upload payment screenshot
                  </span>
                  <span style={{ fontSize: 11, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>GCash, bank transfer, etc.</span>
                  <input
                    type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setBalanceProof(reader.result as string);
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleBalanceUpload}
              disabled={!balanceProof || uploadingBalance}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
                background: !balanceProof || uploadingBalance ? "rgba(251,191,36,0.3)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: !balanceProof || uploadingBalance ? "not-allowed" : "pointer",
                fontFamily: "system-ui, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              <Upload size={14} /> {uploadingBalance ? "Submitting…" : "Submit Payment Proof"}
            </button>
          </div>
        )}

        {awaitingVerification && (
          <div style={{
            background: "rgba(59,130,246,0.07)",
            border: "1.5px solid rgba(59,130,246,0.3)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🕐</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1d4ed8", fontFamily: "system-ui, sans-serif" }}>
                Payment proof submitted
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#1e40af", fontFamily: "system-ui, sans-serif" }}>
                We're verifying your remaining balance of ₱{remainingBalance.toLocaleString()}. We'll update your order shortly.
              </p>
            </div>
          </div>
        )}

        {/* Items + totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
              Items Ordered
            </p>
            {(order.items ?? []).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4a2e42", marginBottom: 5, fontFamily: "system-ui, sans-serif" }}>
                <span>{item.name} <span style={{ color: "#c77db3", fontWeight: 700 }}>×{item.quantity}</span></span>
                <span style={{ fontWeight: 600 }}>₱{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            {order.isRushOrder && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#c77db3", marginTop: 4, fontFamily: "system-ui, sans-serif" }}>
                <span>⚡ Rush fee</span>
                <span style={{ fontWeight: 600 }}>+₱{order.rushFee.toLocaleString()}</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid rgba(216,159,200,0.2)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#4a2e42", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
              <span>Total</span>
              <span>₱{order.total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
              Pickup Details
            </p>
            <div style={{ background: "rgba(216,159,200,0.08)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4a2e42", marginBottom: 4, fontFamily: "system-ui, sans-serif" }}>
                📅 {order.pickupDate}
              </div>
              <div style={{ fontSize: 13, color: "#8b6f84", marginBottom: 10, fontFamily: "system-ui, sans-serif" }}>
                🕐 {order.pickupTime}
              </div>
              <div style={{ borderTop: "1px solid rgba(216,159,200,0.2)", paddingTop: 8 }}>
                {paymentType === "full" ? (
                  <>
                    <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
                      ✅ Fully Paid
                    </div>
                    <div style={{ fontSize: 11, color: "#8b6f84", fontFamily: "system-ui, sans-serif", marginTop: 2 }}>
                      No remaining balance
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#c77db3", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
                      {order.remainingBalanceVerified ? "✅ Balance Paid" : "Remaining Balance"}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: order.remainingBalanceVerified ? "#15803d" : "#c77db3", fontFamily: "system-ui, sans-serif" }}>
                      {order.remainingBalanceVerified ? "Paid" : `₱${remainingBalance.toLocaleString()}`}
                    </div>
                    {!order.remainingBalanceVerified && (
                      <div style={{ fontSize: 11, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
                        Due on pickup
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_TOAST: Partial<Record<OrderStatus, { message: string; emoji: string }>> = {
  confirmed:     { emoji: "✅", message: "Your order has been confirmed!" },
  baking:        { emoji: "🔥", message: "Your cake is now being baked!" },
  quality_check: { emoji: "🔍", message: "Your cake is undergoing a quality check." },
  ready:         { emoji: "🎂", message: "Your cake is ready for pickup!" },
  completed:     { emoji: "🎉", message: "Order complete — thank you!" },
  declined:      { emoji: "❌", message: "Your order has been declined." },
};

export function OrderTracking() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevStatusMap = useRef<Record<string, OrderStatus>>({});

  const clearOrder = async (orderId: string) => {
    await update(ref(db, `allOrders/${orderId}`), { clearedByCustomer: true });
  };

  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(db, "allOrders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const list: Order[] = Object.entries(data)
        .map(([key, val]: [string, any]) => ({
          orderId: key,
          ...(val as Omit<Order, "orderId">),
        }))
        .filter((o) => o.customerId === user.uid && !o.clearedByCustomer);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Fire toast notifications for status changes (skip on first load)
      const isFirstLoad = Object.keys(prevStatusMap.current).length === 0;
      if (!isFirstLoad) {
        list.forEach((order) => {
          const prev = prevStatusMap.current[order.orderId];
          if (prev && prev !== order.status) {
            const t = STATUS_TOAST[order.status];
            if (t) {
              toast(t.message, {
                description: `Order ${order.orderId.slice(0, 10)}`,
                icon: t.emoji,
                duration: 6000,
              });
            }
          }
        });
      }

      // Update status map
      prevStatusMap.current = Object.fromEntries(list.map((o) => [o.orderId, o.status]));

      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <div style={{ minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif", padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>
            Track My Orders
          </h1>
          <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>
            Live status updates from our kitchen to you
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#8b6f84", fontSize: 14 }}>
            Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: "#fff",
            borderRadius: 24,
            border: "1px solid rgba(216,159,200,0.3)",
            padding: "80px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎂</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#4a2e42", margin: "0 0 8px" }}>
              No orders yet
            </h2>
            <p style={{ fontSize: 14, color: "#8b6f84", margin: 0 }}>
              Place your first order and track it here in real time!
            </p>
          </div>
        ) : (
          <>
            {/* Active orders */}
            {orders.filter((o) => o.status !== "completed" && o.status !== "declined").length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c77db3", marginBottom: 12 }}>
                  Active Orders
                </p>
                {orders
                  .filter((o) => o.status !== "completed" && o.status !== "declined")
                  .map((order) => <OrderCard key={order.orderId} order={order} />)}
              </div>
            )}

            {/* Declined orders */}
            {orders.filter((o) => o.status === "declined").length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b91c1c", marginBottom: 12, marginTop: 8 }}>
                  Declined Orders
                </p>
                {orders
                  .filter((o) => o.status === "declined")
                  .map((order) => <OrderCard key={order.orderId} order={order} onClear={() => clearOrder(order.orderId)} />)}
              </div>
            )}

            {/* Completed orders */}
            {orders.filter((o) => o.status === "completed").length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b6f84", marginBottom: 12, marginTop: 8 }}>
                  Past Orders
                </p>
                {orders
                  .filter((o) => o.status === "completed")
                  .map((order) => <OrderCard key={order.orderId} order={order} onClear={() => clearOrder(order.orderId)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
