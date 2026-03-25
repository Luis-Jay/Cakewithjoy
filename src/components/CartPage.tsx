import React from "react";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ChevronRight } from "lucide-react";
import { useCartStore } from "../store/cartStore";

interface CartPageProps {
  onBack?: () => void;
}

// Inline styles for the component — no Tailwind dependency
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#F4E9F2",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#4a2e42",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },

  // Back link
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#8b6f84",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginBottom: 40,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    fontFamily: "'Georgia', serif",
    transition: "color 0.2s",
  },

  // Header
  pageHeader: {
    marginBottom: 36,
    borderBottom: "1px solid rgba(216,159,200,0.3)",
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: "-0.02em",
    color: "#4a2e42",
    margin: 0,
    lineHeight: 1.1,
  },
  pageSub: {
    fontSize: 13,
    color: "#8b6f84",
    marginTop: 6,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  // Layout grid
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 32,
    alignItems: "start",
  },

  // Item card
  itemCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 12,
    border: "1px solid rgba(216,159,200,0.3)",
    boxShadow: "0 2px 20px rgba(216,159,200,0.1)",
    transition: "box-shadow 0.2s",
  },
  itemIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: "linear-gradient(135deg, #f5d5ed 0%, #f9f3f8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTag: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#c77db3",
    background: "rgba(216,159,200,0.15)",
    borderRadius: 4,
    padding: "2px 7px",
    marginBottom: 5,
    fontFamily: "system-ui, sans-serif",
  },
  itemName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#4a2e42",
    margin: 0,
    lineHeight: 1.3,
    fontFamily: "system-ui, sans-serif",
  },
  itemDesc: {
    fontSize: 12,
    color: "#8b6f84",
    margin: "3px 0 0",
    fontFamily: "system-ui, sans-serif",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 700,
    color: "#c77db3",
    marginTop: 6,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "-0.01em",
  },
  itemControls: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 12,
    flexShrink: 0,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#d89fc8",
    padding: 4,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s, background 0.2s",
  },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "#f9f3f8",
    border: "1px solid rgba(216,159,200,0.3)",
    borderRadius: 100,
    padding: "2px",
  },
  qtyBtn: {
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    borderRadius: "50%",
    color: "#8b6f84",
    transition: "background 0.15s, color 0.15s",
  },
  qtyNum: {
    width: 32,
    textAlign: "center" as const,
    fontSize: 14,
    fontWeight: 700,
    color: "#4a2e42",
    fontFamily: "system-ui, sans-serif",
  },

  // Summary panel
  summaryPanel: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 28,
    border: "1px solid rgba(216,159,200,0.3)",
    boxShadow: "0 4px 40px rgba(216,159,200,0.15)",
    position: "sticky" as const,
    top: 24,
  },
  summaryTitle: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#8b6f84",
    marginBottom: 20,
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },
  summaryLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  summaryItemName: {
    fontSize: 13,
    color: "#4a2e42",
    fontFamily: "system-ui, sans-serif",
    maxWidth: "65%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  summaryItemPrice: {
    fontSize: 13,
    color: "#4a2e42",
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(216,159,200,0.3)",
    margin: "16px 0",
  },
  subtotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#4a2e42",
    fontFamily: "system-ui, sans-serif",
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#4a2e42",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "-0.02em",
  },
  downpayCard: {
    background: "linear-gradient(135deg, #f5d5ed 0%, #f9f3f8 100%)",
    border: "1px solid rgba(216,159,200,0.3)",
    borderRadius: 14,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  downpayLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#c77db3",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.02em",
  },
  downpaySub: {
    fontSize: 11,
    color: "#8b6f84",
    marginTop: 2,
    fontFamily: "system-ui, sans-serif",
  },
  downpayAmount: {
    fontSize: 20,
    fontWeight: 800,
    color: "#c77db3",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "-0.02em",
  },
  checkoutBtn: {
    width: "100%",
    padding: "15px 0",
    background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.04em",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 20px rgba(216,159,200,0.45)",
    transition: "opacity 0.2s, transform 0.15s",
    marginBottom: 10,
  },
  continueBtn: {
    width: "100%",
    padding: "12px 0",
    background: "none",
    color: "#8b6f84",
    border: "1px solid rgba(216,159,200,0.3)",
    borderRadius: 14,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    transition: "background 0.2s, color 0.2s",
    letterSpacing: "0.02em",
  },

  // Empty state
  emptyWrap: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 0",
    gap: 16,
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "rgba(216,159,200,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 400,
    color: "#4a2e42",
    margin: 0,
  },
  emptySub: {
    fontSize: 14,
    color: "#8b6f84",
    marginTop: 4,
    fontFamily: "system-ui, sans-serif",
  },
};

function CakeEmoji({ style }: { style?: React.CSSProperties }) {
  return <span style={style}>🎂</span>;
}

export function CartPage({ onBack }: CartPageProps) {
  const { items, updateQty, removeItem } = useCartStore();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const downpayment = Math.round(subtotal * 0.5);
  const isEmpty = items.length === 0;

  return (
    <div style={styles.root}>
      <div style={styles.container}>

        {/* Back */}
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={14} />
          Back to Menu
        </button>

        {/* Header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>My Cart</h1>
          <p style={styles.pageSub}>
            {isEmpty ? "No items yet" : `${items.length} item${items.length !== 1 ? "s" : ""} · Ready to order`}
          </p>
        </div>

        {/* Grid */}
        <div style={styles.layout}>

          {isEmpty ? (
            <div style={styles.emptyWrap}>
              <div style={styles.emptyIcon}>
                <ShoppingBag size={32} color="#8b6f84" strokeWidth={1.5} />
              </div>
              <h2 style={styles.emptyTitle}>Your cart is empty</h2>
              <p style={styles.emptySub}>Browse our menu and add something delicious.</p>
              <button
                style={{ ...styles.checkoutBtn, width: "auto", padding: "14px 36px", marginTop: 8 }}
                onClick={onBack}
              >
                Browse Cakes
              </button>
            </div>
          ) : (
            <>
              {/* Left: Items */}
              <div>
                {items.map((item) => (
                  <div key={item.id} style={styles.itemCard}>
                    {/* Icon */}
                    <div style={styles.itemIconWrap}>
                      <CakeEmoji />
                    </div>

                    {/* Info */}
                    <div style={styles.itemInfo}>
                      <p style={styles.itemName}>{item.name}</p>
                      <p style={styles.itemDesc}>{item.description}</p>
                      <p style={styles.itemPrice}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    {/* Controls */}
                    <div style={styles.itemControls}>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#c77db3")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#d89fc8")}
                      >
                        <Trash2 size={15} />
                      </button>

                      <div style={styles.qtyRow}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => updateQty(item.id, -1)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,159,200,0.15)"; e.currentTarget.style.color = "#c77db3"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#8b6f84"; }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={styles.qtyNum}>{item.quantity}</span>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => updateQty(item.id, 1)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,159,200,0.15)"; e.currentTarget.style.color = "#c77db3"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#8b6f84"; }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Promo note */}
                <div style={{
                  marginTop: 8,
                  padding: "12px 16px",
                  background: "rgba(216,159,200,0.08)",
                  borderRadius: 12,
                  border: "1px dashed rgba(216,159,200,0.35)",
                  fontSize: 12,
                  color: "#8b6f84",
                  fontFamily: "system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span>🎁</span>
                  Free ribbon & personalized card included with every order.
                </div>
              </div>

              {/* Right: Summary */}
              <div style={styles.summaryPanel}>
                <p style={styles.summaryTitle}>Order Summary</p>

                {items.map((item) => (
                  <div key={item.id} style={styles.summaryLine}>
                    <span style={styles.summaryItemName}>
                      {item.name}
                      <span style={{ color: "#c77db3", marginLeft: 4, fontWeight: 700 }}>×{item.quantity}</span>
                    </span>
                    <span style={styles.summaryItemPrice}>
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}

                <hr style={styles.divider} />

                <div style={styles.subtotalRow}>
                  <span style={styles.subtotalLabel}>Subtotal</span>
                  <span style={styles.subtotalValue}>₱{subtotal.toLocaleString()}</span>
                </div>

                <div style={styles.downpayCard}>
                  <div>
                    <p style={styles.downpayLabel}>Downpayment Due</p>
                    <p style={styles.downpaySub}>50% required to confirm order</p>
                  </div>
                  <span style={styles.downpayAmount}>₱{downpayment.toLocaleString()}</span>
                </div>

                <button
                  style={styles.checkoutBtn}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
                >
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </button>

                <button
                  style={styles.continueBtn}
                  onClick={onBack}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,159,200,0.1)"; e.currentTarget.style.color = "#4a2e42"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#8b6f84"; }}
                >
                  Continue Shopping
                </button>

                {/* Trust badges */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(216,159,200,0.2)",
                }}>
                  {["🔒 Secure", "🎂 Fresh", "🚚 Delivered"].map((badge) => (
                    <span key={badge} style={{
                      fontSize: 11,
                      color: "#8b6f84",
                      fontFamily: "system-ui, sans-serif",
                      letterSpacing: "0.02em",
                    }}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartPage;