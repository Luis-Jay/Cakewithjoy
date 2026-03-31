import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { Package, Clock, CheckCircle, Flame, MapPin } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "baking" | "ready" | "completed" | "declined";

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
  isRushOrder: boolean;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
  declineReason?: string;
  createdAt: string;
}

const STEPS: { key: OrderStatus; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "pending",   label: "Order Received",    icon: Package,     desc: "We've received your order and are reviewing it." },
  { key: "confirmed", label: "Confirmed",          icon: CheckCircle, desc: "Your order is confirmed! Downpayment acknowledged." },
  { key: "baking",    label: "Baking",             icon: Flame,       desc: "Your cake is in the oven — the magic is happening!" },
  { key: "ready",     label: "Ready for Pickup",   icon: MapPin,      desc: "Your cake is ready! Please come pick it up." },
  { key: "completed", label: "Completed",          icon: CheckCircle, desc: "Order complete. Thank you for choosing Cake with Joy! 🎂" },
];

const STATUS_COLORS: Record<OrderStatus, { color: string; bg: string; border: string }> = {
  pending:   { color: "#92400e", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)" },
  confirmed: { color: "#1d4ed8", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)" },
  baking:    { color: "#c2410c", bg: "rgba(234,88,12,0.12)",   border: "rgba(234,88,12,0.35)"  },
  ready:     { color: "#15803d", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)"  },
  completed: { color: "#6d28d9", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.35)" },
  declined:  { color: "#b91c1c", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.35)"  },
};

function getStepIndex(status: OrderStatus): number {
  return STEPS.findIndex((s) => s.key === status);
}

function getProgress(status: OrderStatus): number {
  const idx = getStepIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

function OrderCard({ order }: { order: Order }) {
  const isDeclined = order.status === "declined";
  const stepIdx = isDeclined ? -1 : getStepIndex(order.status);
  const progress = isDeclined ? 0 : getProgress(order.status);
  const sc = STATUS_COLORS[order.status];
  const currentStep = STEPS[stepIdx] ?? null;

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
              marginBottom: 20,
              fontSize: 13,
              color: sc.color,
              fontWeight: 500,
              fontFamily: "system-ui, sans-serif",
            }}>
              {currentStep?.desc}
            </div>
          </>
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
                <div style={{ fontSize: 12, color: "#c77db3", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
                  Downpayment Due
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#c77db3", fontFamily: "system-ui, sans-serif" }}>
                  ₱{order.downpayment.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}>
                  50% of total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderTracking() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Read from allOrders (single source of truth) and filter by this customer's UID
    // This ensures admin status updates are reflected in real time
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
        .filter((o) => o.customerId === user.uid);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
                  .map((order) => <OrderCard key={order.orderId} order={order} />)}
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
                  .map((order) => <OrderCard key={order.orderId} order={order} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
