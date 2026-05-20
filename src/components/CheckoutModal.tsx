import React, { useEffect, useState } from "react";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { X, ChevronRight, ChevronLeft, Check, Zap, Upload, ImageIcon } from "lucide-react";
import type { CartItem } from "../store/cartStore";

interface CheckoutModalProps {
  items: CartItem[];
  subtotal: number;
  rushFee: number;
  total: number;
  downpayment: number;
  amountDue: number;
  paymentType: "downpayment" | "full";
  isRushOrder: boolean;
  userId: string;
  userName: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const TC_TEXT = `1. A 50% downpayment is required to confirm your order.
2. The remaining balance must be paid in full before the cake is released.
3. Cancellations made less than 48 hours before the pickup date are non-refundable.
4. Cake with Joy is not responsible for damage that occurs after pickup.
5. Motorcycles are not allowed for cake pickup — please use a sedan or MPV.
6. Custom designs are subject to the baker's interpretation. Minor variations may occur.
7. Rush orders (20% fee) are subject to availability and baker capacity.
8. Photo ID is required for senior citizen and PWD discount verification.`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const s: Record<string, any> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(74,46,66,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#fff", borderRadius: 24, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(74,46,66,0.2)", fontFamily: "system-ui, sans-serif" },
  header: { padding: "24px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(216,159,200,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b6f84" },
  steps: { display: "flex", alignItems: "center", padding: "20px 24px 0", gap: 0 },
  stepDot: (active: boolean, done: boolean): React.CSSProperties => ({ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: done ? "#c77db3" : active ? "linear-gradient(135deg,#d89fc8,#c77db3)" : "rgba(216,159,200,0.15)", color: done || active ? "#fff" : "#8b6f84", boxShadow: active ? "0 4px 12px rgba(199,125,179,0.35)" : "none" }),
  stepLine: (done: boolean): React.CSSProperties => ({ flex: 1, height: 2, background: done ? "#c77db3" : "rgba(216,159,200,0.2)" }),
  stepLabel: (active: boolean): React.CSSProperties => ({ fontSize: 10, color: active ? "#c77db3" : "#8b6f84", fontWeight: active ? 700 : 400, textAlign: "center", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }),
  body: { padding: "20px 24px 24px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 12, fontSize: 14, color: "#4a2e42", fontFamily: "system-ui, sans-serif", outline: "none", boxSizing: "border-box" as const, background: "#fff" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#4a2e42", marginBottom: 12, marginTop: 0 },
  divider: { border: "none", borderTop: "1px solid rgba(216,159,200,0.2)", margin: "16px 0" },
  primaryBtn: { width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(199,125,179,0.4)", letterSpacing: "0.02em" },
  ghostBtn: { width: "100%", padding: "12px 0", background: "none", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 14, fontSize: 13, color: "#8b6f84", cursor: "pointer", fontFamily: "system-ui, sans-serif" },
  tcBox: { background: "#fdf8fc", border: "1.5px solid rgba(216,159,200,0.25)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "#8b6f84", lineHeight: 1.8, maxHeight: 200, overflowY: "auto" as const, whiteSpace: "pre-line" as const },
  checkRow: { display: "flex", alignItems: "flex-start", gap: 10, marginTop: 14, cursor: "pointer" },
  checkbox: (checked: boolean): React.CSSProperties => ({ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#c77db3" : "rgba(216,159,200,0.5)"}`, background: checked ? "#c77db3" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }),
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 },
  timeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 },
  timeBtn: (active: boolean): React.CSSProperties => ({ padding: "8px 0", borderRadius: 10, border: `1.5px solid ${active ? "#c77db3" : "rgba(216,159,200,0.35)"}`, background: active ? "rgba(199,125,179,0.08)" : "#fff", color: active ? "#c77db3" : "#8b6f84", fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }),
  successWrap: { padding: "40px 24px", textAlign: "center" as const },
};

export function CheckoutModal({ items, subtotal, rushFee, total, downpayment, amountDue, paymentType, isRushOrder, userId, userName, onClose, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState(1); // 1: details, 2: T&C, 3: payment
  const [name, setName] = useState(userName ?? "");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [agreedTC, setAgreedTC] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [gcashQR, setGcashQR] = useState("");
  const [bdoQR, setBdoQR] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [bdoAccount, setBdoAccount] = useState("");
  const [gcashLabel, setGcashLabel] = useState("GCash");
  const [bdoLabel, setBdoLabel] = useState("BDO Bank Transfer");
  const [gcashColor, setGcashColor] = useState("#1d4ed8");
  const [bdoColor, setBdoColor] = useState("#c2410c");
  const [lightboxSrc, setLightboxSrc] = useState("");

  useEffect(() => {
    const unsub = onValue(ref(db, "paymentQR"), (snap) => {
      const data = snap.val() ?? {};
      setGcashQR(data.gcashQR ?? "");
      setBdoQR(data.bdoQR ?? "");
      setGcashNumber(data.gcashNumber ?? "");
      setBdoAccount(data.bdoAccount ?? "");
      setGcashLabel(data.gcashLabel ?? "GCash");
      setBdoLabel(data.bdoLabel ?? "BDO Bank Transfer");
      setGcashColor(data.gcashColor ?? "#1d4ed8");
      setBdoColor(data.bdoColor ?? "#c2410c");
    });
    return () => unsub();
  }, []);

  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = dataUrl;
    });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];
  const maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const maxDateLabel = maxDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const remainingBalance = Math.max(total - downpayment, 0);

  const isPickupDateInRange =
    !!pickupDate && pickupDate >= minDateStr && pickupDate <= maxDateStr;
  const step1Valid = name.trim() && phone.trim() && isPickupDateInRange && pickupTime;

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError("");
    try {
      let proofData = paymentProof;
      if (proofData) proofData = await compressImage(proofData);

      // Collect ID photos from discounted items
      const idDocs = items
        .filter((i) => i.idPhoto && i.idHoldingPhoto)
        .map((i) => ({
          itemName: i.name,
          discountType: i.discountType ?? "discount",
          idPhoto: i.idPhoto!,
          idHoldingPhoto: i.idHoldingPhoto!,
        }));

      // Strip undefined fields from items — Firebase rejects undefined values
      const cleanItems = items.map((item) =>
        Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined))
      );

      const orderData = {
        customerId: userId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: cleanItems,
        subtotal,
        rushFee,
        total,
        downpayment,
        amountDue,
        paymentType,
        isRushOrder,
        pickupDate,
        pickupTime,
        status: "pending",
        paymentProof: proofData || "",
        idDocs: idDocs.length > 0 ? idDocs : null,
        createdAt: new Date().toISOString(),
      };
      const orderRef = await push(ref(db, `orders/${userId}`), orderData);
      const newOrderId = orderRef.key ?? "ORD-" + Date.now();
      await set(ref(db, `allOrders/${newOrderId}`), { ...orderData, orderId: newOrderId });
      setOrderId(newOrderId);
      setPlaced(true);
    } catch (e: any) {
      setPlaceError(e?.message ?? "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const STEPS = ["Details", "Terms", "Payment"];

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {placed ? (
          <div style={s.successWrap}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#d89fc8,#c77db3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(199,125,179,0.4)" }}>
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#4a2e42", margin: "0 0 8px" }}>Order Placed!</h2>
            <p style={{ fontSize: 13, color: "#8b6f84", marginBottom: 6 }}>Order ID: <strong style={{ color: "#c77db3" }}>{orderId}</strong></p>
            <p style={{ fontSize: 13, color: "#8b6f84", marginBottom: 4 }}>Pickup: <strong style={{ color: "#4a2e42" }}>{pickupDate} at {pickupTime}</strong></p>
            <p style={{ fontSize: 12, color: "#8b6f84", lineHeight: 1.6, margin: "12px 0 24px", background: "rgba(216,159,200,0.1)", borderRadius: 12, padding: "12px 16px" }}>
              {paymentType === "full"
                ? `Please send your full payment (₱${amountDue.toLocaleString()}) via GCash or BDO to confirm your order. We'll reach out shortly.`
                : `Please send your 50% deposit (₱${amountDue.toLocaleString()}) via GCash or BDO to confirm your order. The remaining balance is due on pickup.`}
            </p>
            <button style={s.primaryBtn} onClick={onSuccess}>
              Track My Order <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={s.header}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c77db3" }}>Checkout</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#4a2e42", fontFamily: "Georgia, serif" }}>{STEPS[step - 1]}</h3>
              </div>
              <button style={s.closeBtn} onClick={onClose}><X size={16} /></button>
            </div>

            {/* Step indicators */}
            <div style={{ padding: "16px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {STEPS.map((label, i) => (
                  <React.Fragment key={label}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={s.stepDot(step === i + 1, step > i + 1)}>
                        {step > i + 1 ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </div>
                      <span style={s.stepLabel(step === i + 1)}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ ...s.stepLine(step > i + 1), marginBottom: 16 }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={s.body}>

              {/* ── Step 1: Details ── */}
              {step === 1 && (
                <div>
                  {/* Order summary */}
                  <p style={s.sectionTitle}>Order Summary</p>
                  <div style={{ background: "#fdf8fc", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
                    {items.map(item => (
                      <div key={item.id} style={s.summaryRow}>
                        <span style={{ color: "#4a2e42" }}>{item.name} <span style={{ color: "#c77db3" }}>×{item.quantity}</span></span>
                        <span style={{ fontWeight: 600, color: "#4a2e42" }}>₱{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {isRushOrder && (
                      <div style={{ ...s.summaryRow, color: "#c77db3" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Zap size={12} /> Rush fee (20%)</span>
                        <span style={{ fontWeight: 600 }}>+₱{rushFee.toLocaleString()}</span>
                      </div>
                    )}
                    <hr style={s.divider} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#8b6f84" }}>Total</span>
                      <span style={{ fontWeight: 700, color: "#4a2e42" }}>₱{total.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(199,125,179,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                      <span style={{ fontSize: 13, color: "#c77db3", fontWeight: 600 }}>
                        {paymentType === "full" ? "Full Payment" : "Deposit (50%)"}
                      </span>
                      <span style={{ fontWeight: 800, color: "#c77db3", fontSize: 15 }}>₱{amountDue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <p style={s.sectionTitle}>Contact Details</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={s.label}>Full Name</label>
                    <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={s.label}>Phone Number</label>
                    <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XX XXX XXXX" type="tel" />
                  </div>

                  {/* Pickup */}
                  <p style={s.sectionTitle}>Pickup Schedule</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={s.label}>Pickup Date</label>
                    <input style={s.input} type="date" value={pickupDate} min={minDateStr} max={maxDateStr} onChange={e => setPickupDate(e.target.value)} />
                    <p style={{ fontSize: 11, color: "#8b6f84", marginTop: 5, lineHeight: 1.6 }}>
                      📅 Orders can be scheduled <strong>2 to 30 days</strong> from today — earliest available date is <strong>{minDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong> and the latest we can accept is <strong>{maxDateLabel}</strong>.
                    </p>
                  </div>
                  <div>
                    <label style={s.label}>Pickup Time</label>
                    <div style={s.timeGrid}>
                      {TIME_SLOTS.map(t => (
                        <button key={t} style={s.timeBtn(pickupTime === t)} onClick={() => setPickupTime(t)}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button style={{ ...s.primaryBtn, opacity: step1Valid ? 1 : 0.5, cursor: step1Valid ? "pointer" : "not-allowed" }} onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}>
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: T&C ── */}
              {step === 2 && (
                <div>
                  <p style={s.sectionTitle}>Terms & Conditions</p>
                  <div style={s.tcBox}>{TC_TEXT}</div>
                  <div style={s.checkRow} onClick={() => setAgreedTC(!agreedTC)}>
                    <div style={s.checkbox(agreedTC)}>
                      {agreedTC && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#4a2e42", lineHeight: 1.5 }}>
                      I have read and agree to the <strong>Terms and Conditions</strong> of Cake with Joy
                    </p>
                  </div>
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    <button style={{ ...s.primaryBtn, opacity: agreedTC ? 1 : 0.5, cursor: agreedTC ? "pointer" : "not-allowed" }} onClick={() => agreedTC && setStep(3)} disabled={!agreedTC}>
                      Continue <ChevronRight size={16} />
                    </button>
                    <button style={s.ghostBtn} onClick={() => setStep(1)}>
                      <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Payment ── */}
              {step === 3 && (
                <div>
                  <p style={s.sectionTitle}>{paymentType === "full" ? "Full Payment" : "Pay 50% Deposit"}</p>
                  <div style={{ background: "rgba(199,125,179,0.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#8b6f84" }}>
                      {paymentType === "full" ? "Total amount due" : "Amount due now (50% deposit)"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: "#c77db3", fontFamily: "Georgia, serif" }}>₱{amountDue.toLocaleString()}</p>
                    {paymentType === "downpayment" && (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8b6f84" }}>Remaining ₱{remainingBalance.toLocaleString()} due on pickup</p>
                    )}
                  </div>

                  {/* Lightbox */}
                  {lightboxSrc && (
                    <div
                      onClick={() => setLightboxSrc("")}
                      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
                    >
                      <img src={lightboxSrc} alt="QR Full" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 16, boxShadow: "0 8px 60px rgba(0,0,0,0.6)" }} />
                      <button onClick={() => setLightboxSrc("")} style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 20, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  )}

                  {[
                    { label: gcashLabel, color: gcashColor, qr: gcashQR, account: gcashNumber },
                    { label: bdoLabel,   color: bdoColor,   qr: bdoQR,   account: bdoAccount  },
                  ].map(({ label, color, qr, account }, i) => {
                    const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
                    const border = `rgba(${r},${g},${b},0.3)`;
                    const bg = `rgba(${r},${g},${b},0.04)`;
                    const bgLight = `rgba(${r},${g},${b},0.08)`;
                    return (
                      <div key={i} style={{ border: `1.5px solid ${border}`, borderRadius: 16, padding: "14px 16px", background: bg, marginBottom: i === 0 ? 12 : 20 }}>
                        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color }}>{label}</p>
                        {qr ? (
                          <div onClick={() => setLightboxSrc(qr)} style={{ background: "#fff", borderRadius: 12, padding: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, cursor: "zoom-in" }} title="Tap to enlarge">
                            <img src={qr} alt={`${label} QR`} style={{ width: 160, height: 160, objectFit: "contain", borderRadius: 8 }} />
                          </div>
                        ) : (
                          <div style={{ background: bgLight, borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color }}>QR code not yet configured.</p>
                          </div>
                        )}
                        {account && <p style={{ margin: 0, fontSize: 12, color }}><strong>Account:</strong> Cake with Joy · {account}</p>}
                      </div>
                    );
                  })}

                  {/* Payment proof upload */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#4a2e42" }}>
                      Upload Payment Screenshot <span style={{ fontWeight: 700, color: "#ef4444", fontSize: 12 }}>* Required</span>
                    </p>
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => setPaymentProof(reader.result as string);
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    {paymentProof ? (
                      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(199,125,179,0.4)" }}>
                        <img src={paymentProof} alt="Payment proof" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 8, gap: 6 }}>
                          <button
                            onClick={() => document.getElementById("proof-upload")?.click()}
                            style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(74,46,66,0.7)", border: "none", cursor: "pointer", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Upload size={11} /> Change
                          </button>
                          <button
                            onClick={() => setPaymentProof("")}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(74,46,66,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <X size={13} color="#fff" />
                          </button>
                        </div>
                        <div style={{ background: "rgba(34,197,94,0.9)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                          <Check size={13} color="#fff" strokeWidth={3} />
                          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Screenshot uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById("proof-upload")?.click()}
                        style={{ width: "100%", padding: "18px 0", border: "2px dashed rgba(199,125,179,0.45)", borderRadius: 12, background: "rgba(199,125,179,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "system-ui, sans-serif" }}
                      >
                        <ImageIcon size={22} color="#c77db3" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#4a2e42" }}>Tap to upload GCash / BDO screenshot</span>
                        <span style={{ fontSize: 11, color: "#8b6f84" }}>Helps us confirm your payment faster</span>
                      </button>
                    )}
                  </div>

                  {placeError && (
                    <p style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                      ⚠️ {placeError}
                    </p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {!paymentProof && (
                      <p style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 12px", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        ⚠️ Please upload your payment screenshot before placing your order.
                      </p>
                    )}
                    <button
                      style={{ ...s.primaryBtn, opacity: (!paymentProof || placing) ? 0.45 : 1, cursor: (!paymentProof || placing) ? "not-allowed" : "pointer" }}
                      onClick={placeOrder}
                      disabled={!paymentProof || placing}
                    >
                      {placing ? "Placing Order…" : "Confirm & Place Order"} {!placing && <Check size={16} />}
                    </button>
                    <button style={s.ghostBtn} onClick={() => setStep(2)}>
                      <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Back
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
