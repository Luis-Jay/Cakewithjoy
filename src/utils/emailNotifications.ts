import emailjs from "@emailjs/browser";
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from "../config/emailjs";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "baking"
  | "quality_check"
  | "ready"
  | "completed"
  | "declined";

interface EmailOrderPayload {
  customerEmail: string;
  customerName: string;
  orderId: string;
  status: OrderStatus;
  pickupDate?: string;
  pickupTime?: string;
  total?: number;
  downpayment?: number;
  remainingBalance?: number;
  declineReason?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

const STATUS_CONTENT: Record<
  OrderStatus,
  { subject: string; headline: string; body: string; emoji: string }
> = {
  pending: {
    emoji: "📦",
    subject: "We received your order – Cake with Joy",
    headline: "Order Received!",
    body: "Thank you for placing your order with Cake with Joy! We have received it and our team is currently reviewing your payment. We will confirm your order shortly.",
  },
  confirmed: {
    emoji: "✅",
    subject: "Your payment is accepted – Cake with Joy",
    headline: "Payment Accepted & Order Confirmed!",
    body: "Great news! Your downpayment has been received and verified. Your order is now officially confirmed and has been queued for production. We'll keep you updated as we progress.",
  },
  baking: {
    emoji: "🔥",
    subject: "Your cake is being baked! – Cake with Joy",
    headline: "Your Cake is in the Oven!",
    body: "The magic is happening! Our bakers have started working on your cake. We'll notify you once it passes quality check and is ready for pickup.",
  },
  quality_check: {
    emoji: "🔍",
    subject: "Quality check in progress – Cake with Joy",
    headline: "Almost There — Quality Check!",
    body: "Your cake is almost done! Our team is currently doing a final quality inspection to make sure everything looks and tastes perfect before it reaches you.",
  },
  ready: {
    emoji: "🎂",
    subject: "Your cake is ready for pickup! – Cake with Joy",
    headline: "Your Cake is Ready for Pickup!",
    body: "Exciting news — your cake is ready! Please come pick it up at your scheduled time. If you have a remaining balance, kindly prepare your payment before arrival.",
  },
  completed: {
    emoji: "🎉",
    subject: "Order complete – Thank you! – Cake with Joy",
    headline: "Order Complete — Thank You!",
    body: "Your order has been marked as completed. Thank you so much for choosing Cake with Joy! We hope you love every bite. We'd love to serve you again soon! 🎂",
  },
  declined: {
    emoji: "❌",
    subject: "Order update – Cake with Joy",
    headline: "Order Could Not Be Processed",
    body: "We regret to inform you that we were unable to process your order at this time. Please see the reason below. Feel free to contact us or place a new order if you'd like to try again.",
  },
};

function buildItemsHtml(items?: Array<{ name: string; quantity: number; price: number }>) {
  if (!items || items.length === 0) return "";
  const rows = items
    .map(
      (it) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f0d8ea;">${it.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0d8ea;text-align:center;">x${it.quantity}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0d8ea;text-align:right;">₱${(it.price * it.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
      <thead>
        <tr style="background:#4a2e42;">
          <th style="padding:8px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Item</th>
          <th style="padding:8px 12px;color:#fff;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Qty</th>
          <th style="padding:8px 12px;color:#fff;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildEmailHtml(payload: EmailOrderPayload): string {
  const content = STATUS_CONTENT[payload.status];
  const itemsHtml = buildItemsHtml(payload.items);
  const shortId = payload.orderId.slice(0, 10);

  const pickupBlock =
    payload.pickupDate && payload.status !== "declined"
      ? `<div style="background:#fdf5fb;border:1px solid #f0d8ea;border-radius:10px;padding:14px 18px;margin:14px 0;display:flex;gap:20px;flex-wrap:wrap;">
          <div><div style="font-size:10px;color:#8b6f84;margin-bottom:2px;text-transform:uppercase;letter-spacing:.07em;">Pickup Date</div>
          <div style="font-size:14px;font-weight:700;color:#4a2e42;">📅 ${payload.pickupDate}</div></div>
          ${payload.pickupTime ? `<div><div style="font-size:10px;color:#8b6f84;margin-bottom:2px;text-transform:uppercase;letter-spacing:.07em;">Pickup Time</div>
          <div style="font-size:14px;font-weight:700;color:#4a2e42;">🕐 ${payload.pickupTime}</div></div>` : ""}
        </div>`
      : "";

  const totalBlock =
    payload.total
      ? `<div style="background:#f9f0f7;border-radius:10px;padding:14px 18px;margin:14px 0;">
          ${payload.downpayment ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#4a2e42;margin-bottom:6px;"><span>Downpayment Paid</span><span style="font-weight:600;">₱${payload.downpayment.toLocaleString()}</span></div>` : ""}
          ${payload.remainingBalance ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#c77db3;margin-bottom:6px;"><span>Remaining Balance (due on pickup)</span><span style="font-weight:600;">₱${payload.remainingBalance.toLocaleString()}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#4a2e42;border-top:1.5px solid #d89fc8;padding-top:8px;margin-top:4px;"><span>Order Total</span><span>₱${payload.total.toLocaleString()}</span></div>
        </div>`
      : "";

  const declineBlock =
    payload.declineReason
      ? `<div style="background:rgba(239,68,68,0.06);border:1.5px solid rgba(239,68,68,0.25);border-radius:10px;padding:14px 18px;margin:14px 0;">
          <div style="font-size:12px;color:#b91c1c;font-weight:700;margin-bottom:4px;">Reason for Decline:</div>
          <div style="font-size:13px;color:#7f1d1d;">${payload.declineReason}</div>
        </div>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4e9f2;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4a2e42 0%,#7c3f6c 100%);padding:28px 32px 22px;">
      <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:.01em;">🎂 Cake with Joy</div>
      <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px;">Bakery Management System</div>
    </div>
    <!-- Pink accent strip -->
    <div style="height:4px;background:linear-gradient(90deg,#c77db3,#e8a8d8);"></div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <div style="font-size:28px;margin-bottom:8px;">${content.emoji}</div>
      <h1 style="margin:0 0 8px;font-size:22px;color:#4a2e42;font-family:Georgia,serif;">${content.headline}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:#5a3d52;line-height:1.7;">Hi <strong>${payload.customerName}</strong>,</p>
      <p style="margin:0 0 18px;font-size:14px;color:#5a3d52;line-height:1.7;">${content.body}</p>

      <!-- Order ID badge -->
      <div style="display:inline-block;background:rgba(199,125,179,.12);border:1px solid rgba(199,125,179,.3);border-radius:8px;padding:6px 14px;font-size:12px;color:#8b6f84;font-family:monospace;margin-bottom:18px;">
        Order ID: <strong style="color:#4a2e42;">${shortId}…</strong>
      </div>

      ${declineBlock}
      ${itemsHtml}
      ${totalBlock}
      ${pickupBlock}

      <p style="margin:20px 0 0;font-size:13px;color:#8b6f84;line-height:1.7;">
        You can view your full order status anytime by visiting
        <a href="https://cakewjoy.vercel.app" style="color:#c77db3;font-weight:600;">cakewjoy.vercel.app</a>
        and going to <strong>Track Order</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#4a2e42;padding:18px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,.65);line-height:1.8;">
        Cake with Joy | Bakery Management System<br>
        This is an automated email — please do not reply directly.<br>
        For questions, use the <strong style="color:#e8a8d8;">Support</strong> tab on our website.
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendOrderStatusEmail(payload: EmailOrderPayload): Promise<void> {
  if (
    EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
    EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
    EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
  ) {
    console.warn("[EmailJS] Credentials not configured. Skipping email notification.");
    return;
  }

  const content = STATUS_CONTENT[payload.status];
  const htmlBody = buildEmailHtml(payload);

  const templateParams = {
    to_email:      payload.customerEmail,
    to_name:       payload.customerName,
    subject:       content.subject,
    order_id:      payload.orderId.slice(0, 10) + "…",
    status_emoji:  content.emoji,
    status_title:  content.headline,
    message_body:  content.body,
    html_body:     htmlBody,
    pickup_date:   payload.pickupDate ?? "—",
    pickup_time:   payload.pickupTime ?? "—",
    total:         payload.total ? `₱${payload.total.toLocaleString()}` : "—",
    decline_reason: payload.declineReason ?? "",
    app_url:       "https://cakewjoy.vercel.app",
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log(`[EmailJS] Email sent to ${payload.customerEmail} — status: ${payload.status}`);
  } catch (err) {
    // Non-fatal — log but don't break the order flow
    console.error("[EmailJS] Failed to send email:", err);
  }
}
