import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import {
  Search,
  User,
  Phone,
  Calendar,
  DollarSign,
  Package,
  ChefHat,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Percent,
  Printer,
  Share2,
  Circle,
  ArrowUpDown,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type UserRole = "baker" | "sales" | "admin";
type OrderStatus = "pending" | "confirmed" | "baking" | "quality_check" | "ready" | "completed" | "declined";
type PaymentType = "downpayment" | "deposit" | "full";

type SalesAction = "confirm_initial_payment" | "verify_remaining_balance" | "complete_fully_paid_order" | "none";

type SalesFlowStep = {
  title: string;
  description: string;
  state: "complete" | "current" | "pending";
};

type ProductionAction = "start_baking" | "move_to_quality_check" | "mark_ready_for_pickup" | "none";

type ProductionScheduleState = {
  productionDate: string;
  timeSlot: string;
  estimatedCompletion: string;
};

const SALES_REJECTABLE_STATUSES: OrderStatus[] = ["pending", "confirmed", "ready"];

const PRODUCTION_TIME_SLOTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const normalizePaymentType = (order: any): PaymentType => {
  if (order.paymentType === "full") return "full";
  if (order.paymentType === "deposit") return "deposit";
  if (order.paymentType === "downpayment") return "downpayment";
  if ((order.amountDue ?? 0) >= (order.pricing?.finalPrice ?? order.total ?? 0)) return "full";
  return "downpayment";
};

const getRemainingBalance = (order: any) => {
  if (normalizePaymentType(order) === "full") return 0;
  const total = Number(order.pricing?.finalPrice ?? order.total ?? 0);
  const downpayment = Number(order.downpayment ?? order.amountDue ?? 0);
  return Math.max(total - downpayment, 0);
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getOrderShareText = (order: any) => [
  `Order: ${order.id}`,
  `Customer: ${order.customer.name || "Unknown Customer"}`,
  `Cake: ${order.cakeDetails.name || "Custom Cake"}`,
  `Pickup: ${order.pickupDate || "—"} ${order.pickupTime ? `at ${order.pickupTime}` : ""}`.trim(),
  `Status: ${order.status}`,
  `Total: P${Number(order.pricing?.finalPrice ?? order.total ?? 0).toLocaleString()}`,
].join("\n");

const formatPeso = (value: unknown) => `P${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatReceiptDateTime = (value: unknown) => {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const printOrderSummary = (order: any) => {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Print window was blocked. Please allow pop-ups and try again.");
    return;
  }
  const safeCustomerName = escapeHtml(order.customer.name || "—");
  const safeCustomerPhone = escapeHtml(order.customer.phone || "—");
  const safeCakeName = escapeHtml(order.cakeDetails.name || "Custom Cake");
  const safeStatus = escapeHtml(order.status || "—");
  const safeOrderId = escapeHtml(order.id || "—");
  const safePickupDate = escapeHtml(order.pickupDate || "—");
  const safePickupTime = escapeHtml(order.pickupTime || "—");
  const safePaymentType = escapeHtml(normalizePaymentType(order).replace("_", " "));
  const safeReference = escapeHtml(order.paymentReference || order.paymentRef || "N/A");
  const createdAtLabel = escapeHtml(formatReceiptDateTime(order.createdAt));
  const printedAtLabel = escapeHtml(formatReceiptDateTime(new Date().toISOString()));
  const businessName = "Cake with Joy";
  const businessPhone = "09XX XXX XXXX";
  const businessAddress = "Bakery Management System";
  const subtotal = Number(order.subtotal ?? order.total ?? 0);
  const rushFee = Number(order.rushFee ?? 0);
  const total = Number(order.pricing?.finalPrice ?? order.total ?? 0);
  const amountPaid = normalizePaymentType(order) === "full"
    ? total
    : Number(order.downpayment ?? order.amountDue ?? 0);
  const remainingBalance = Math.max(total - amountPaid, 0);
  const lineItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map((item: any) => {
        const quantity = Number(item?.quantity ?? 1);
        const unitPrice = Number(item?.price ?? 0);
        const lineTotal = quantity * unitPrice;
        const details = [
          item?.size ? `Size: ${escapeHtml(item.size)}` : "",
          item?.flavor ? `Flavor: ${escapeHtml(item.flavor)}` : "",
          item?.icing ? `Icing: ${escapeHtml(item.icing)}` : "",
        ].filter(Boolean).join(" | ");
        return `
          <div class="item">
            <div class="item-row">
              <span>${escapeHtml(item?.name || safeCakeName)}</span>
              <span>${formatPeso(lineTotal)}</span>
            </div>
            <div class="item-meta">${quantity} x ${formatPeso(unitPrice)}</div>
            ${details ? `<div class="item-meta">${details}</div>` : ""}
          </div>
        `;
      }).join("")
    : `
      <div class="item">
        <div class="item-row">
          <span>${safeCakeName}</span>
          <span>${formatPeso(total)}</span>
        </div>
      </div>
    `;

  win.document.write(`<html><head><title>Receipt ${safeOrderId}</title><style>
    @page{size:80mm auto;margin:6mm}
    body{font-family:"Courier New",monospace;background:#fff;color:#000;margin:0;padding:0}
    .receipt{width:72mm;margin:0 auto;padding:4mm 0;font-size:11px;line-height:1.35}
    .center{text-align:center}
    .muted{color:#444}
    .strong{font-weight:700}
    .section{margin-top:8px}
    .divider{border-top:1px dashed #000;margin:8px 0}
    .item{margin-bottom:6px}
    .item-row,.summary-row{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .item-row span:last-child,.summary-row span:last-child{text-align:right;white-space:nowrap}
    .item-meta{font-size:10px;color:#333}
    .summary-row.total{font-weight:700;font-size:12px}
    .caps{text-transform:uppercase;letter-spacing:0.08em}
    .button-row{margin-top:12px;display:flex;justify-content:center}
    .button-row button{padding:8px 14px;border:1px solid #000;background:#fff;cursor:pointer;font-family:"Courier New",monospace}
    @media print{.no-print{display:none}.receipt{width:auto;margin:0}}
  </style></head><body>
    <div class="receipt">
      <div class="center">
        <div class="strong" style="font-size:16px">${businessName}</div>
        <div>${businessAddress}</div>
        <div>${businessPhone}</div>
        <div class="caps" style="margin-top:4px">Sales Receipt</div>
      </div>

      <div class="divider"></div>

      <div class="summary-row"><span>Receipt No</span><span>${safeOrderId}</span></div>
      <div class="summary-row"><span>Date</span><span>${createdAtLabel}</span></div>
      <div class="summary-row"><span>Printed</span><span>${printedAtLabel}</span></div>
      <div class="summary-row"><span>Customer</span><span>${safeCustomerName}</span></div>
      <div class="summary-row"><span>Phone</span><span>${safeCustomerPhone}</span></div>
      <div class="summary-row"><span>Status</span><span>${safeStatus}</span></div>
      <div class="summary-row"><span>Pickup</span><span>${safePickupDate}</span></div>
      <div class="summary-row"><span>Time</span><span>${safePickupTime}</span></div>
      <div class="summary-row"><span>Payment</span><span>${safePaymentType}</span></div>
      <div class="summary-row"><span>Reference</span><span>${safeReference}</span></div>

      <div class="divider"></div>
      <div class="caps strong">Items</div>
      <div class="section">${lineItems}</div>

      <div class="divider"></div>
      <div class="summary-row"><span>Subtotal</span><span>${formatPeso(subtotal)}</span></div>
      ${rushFee > 0 ? `<div class="summary-row"><span>Rush Fee</span><span>${formatPeso(rushFee)}</span></div>` : ""}
      <div class="summary-row total"><span>Total</span><span>${formatPeso(total)}</span></div>
      <div class="summary-row"><span>Paid</span><span>${formatPeso(amountPaid)}</span></div>
      <div class="summary-row"><span>Balance</span><span>${formatPeso(remainingBalance)}</span></div>

      <div class="divider"></div>
      <div class="center muted">
        <div>Thank you for your order!</div>
        <div>Please bring this receipt upon pickup.</div>
      </div>

      <div class="button-row no-print">
        <button onclick="window.print()">Print Receipt</button>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
};

const shareOrderSummary = async (order: any) => {
  const shareText = getOrderShareText(order);
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Order ${order.id}`,
        text: shareText,
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Order summary copied to clipboard.");
  } catch (error) {
    console.error("Failed to share order summary", error);
    toast.error("Could not share this order summary.");
  }
};

export function OrderSummaryCards() {
  const authUser = useAuthStore((s) => s.user);

  // Map system role → view role. Admin can switch freely; others are locked.
  const systemRole = authUser?.role ?? "admin";
  const defaultViewRole: UserRole =
    systemRole === "production" ? "baker" :
    systemRole === "sales" ? "sales" :
    "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(defaultViewRole);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<any | "all-completed" | "all-declined" | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [salesUpdateTarget, setSalesUpdateTarget] = useState<any | null>(null);
  const [salesUpdating, setSalesUpdating] = useState(false);
  const [salesRejecting, setSalesRejecting] = useState(false);
  const [productionUpdateTarget, setProductionUpdateTarget] = useState<any | null>(null);
  const [productionUpdating, setProductionUpdating] = useState(false);
  const [productionSchedule, setProductionSchedule] = useState<ProductionScheduleState>({
    productionDate: "",
    timeSlot: "morning",
    estimatedCompletion: "",
  });
  const [pickupSort, setPickupSort] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeInput, setPageSizeInput] = useState("6");

  useEffect(() => {
    const unsub = onValue(ref(db, "allOrders"), (snap) => {
      const data = snap.val();
      if (!data) { setOrders([]); setLoading(false); return; }
      const list = Object.entries(data).map(([key, val]: [string, any]) => {
        const items = Array.isArray(val.items) ? val.items : val.items ? Object.values(val.items) : [];
        const firstItem = items[0] ?? {};
        const description = typeof firstItem.description === "string" ? firstItem.description : "";
        return {
          id: key,
          customer: {
            name: val.customerName ?? "",
            email: val.customerEmail ?? "",
            phone: val.customerPhone ?? "",
          },
          cakeDetails: {
            name: firstItem.name ?? val.cakeType ?? "",
            flavor: firstItem.flavor ?? val.flavor ?? "",
            size: firstItem.size ?? val.size ?? "",
            icing: firstItem.icing ?? val.icing ?? "",
            message: val.cakeMessage ?? firstItem.message ?? "",
            description,
            servings: val.servings ?? "",
            image: firstItem.cakeImage ?? val.cakeImage ?? firstItem.image ?? "",
          },
          ingredients: val.ingredients ?? [],
          items,
          subtotal: val.subtotal ?? 0,
          rushFee: val.rushFee ?? 0,
          downpayment: val.downpayment ?? 0,
          amountDue: val.amountDue ?? 0,
          paymentType: val.paymentType ?? null,
          paymentProof: val.paymentProof ?? "",
          remainingBalanceProof: val.remainingBalanceProof ?? "",
          remainingBalanceVerified: !!val.remainingBalanceVerified,
          assignedStaffId: val.assignedStaffId ?? "",
          assignedStaffName: val.assignedStaffName ?? "",
          paymentReference: val.paymentReference ?? val.paymentRef ?? "",
          productionDate: val.productionDate ?? "",
          timeSlot: val.timeSlot ?? "morning",
          estimatedCompletion: val.estimatedCompletion ?? "",
          total: val.total ?? val.subtotal ?? 0,
          pricing: {
            ingredientCost: val.ingredientCost ?? 0,
            laborCost: val.laborCost ?? 0,
            overheadCost: val.overheadCost ?? 0,
            totalCost: val.subtotal ?? val.total ?? 0,
            sellingPrice: val.subtotal ?? val.total ?? 0,
            discountType: val.discountType ?? null,
            discountAmount: val.rushFee ?? 0,
            finalPrice: val.total ?? 0,
            profit: 0,
            profitMargin: "0%",
          },
          status: (val.status ?? "pending") as OrderStatus,
          customerId: val.customerId ?? "",
          clearedByAdmin: !!val.clearedByAdmin,
          date: val.createdAt
            ? new Date(val.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
          pickupDate: val.pickupDate ?? "",
          pickupTime: val.pickupTime ?? "",
        };
      });
      setOrders(list);
      setLoading(false);
    }, () => { setOrders([]); setLoading(false); });
    return () => unsub();
  }, []);

  const activeOrders = orders.filter((order) => !order.clearedByAdmin);
  const archivedOrders = orders.filter((order) => order.clearedByAdmin);
  const completedOrders = activeOrders.filter((order) => order.status === "completed");
  const declinedOrders = activeOrders.filter((order) => order.status === "declined");

  const syncOrderUpdate = async (order: any, payload: Record<string, unknown>) => {
    await update(ref(db, `allOrders/${order.id}`), payload);
    if (order.customerId) {
      update(ref(db, `orders/${order.customerId}/${order.id}`), payload).catch(() => {});
    }
  };

  const getSalesAction = (order: any): SalesAction => {
    const paymentType = normalizePaymentType(order);

    if (order.status === "pending" && order.paymentProof) {
      return "confirm_initial_payment";
    }

    if (order.status === "ready") {
      if (paymentType === "full") {
        return "complete_fully_paid_order";
      }

      if (order.remainingBalanceProof && !order.remainingBalanceVerified) {
        return "verify_remaining_balance";
      }
    }

    return "none";
  };

  const getSalesFlowSteps = (order: any): SalesFlowStep[] => {
    const paymentType = normalizePaymentType(order);

    if (order.status === "pending") {
      return [
        {
          title: "Validate Order",
          description: order.paymentProof ? "Payment proof is available for review." : "Waiting for the customer to submit payment proof.",
          state: order.paymentProof ? "complete" : "current",
        },
        {
          title: "Process Payment",
          description: order.paymentProof ? "Sales can now verify and process the initial payment." : "Initial payment cannot be processed yet.",
          state: order.paymentProof ? "current" : "pending",
        },
        {
          title: "Confirm Order",
          description: order.paymentProof ? "Confirm the order to move it into production." : "Order confirmation unlocks after payment validation.",
          state: order.paymentProof ? "pending" : "pending",
        },
      ];
    }

    if (order.status === "ready" && paymentType !== "full") {
      return [
        {
          title: "Validate Order",
          description: "Order is already prepared and ready for pickup.",
          state: "complete",
        },
        {
          title: "Process Payment",
          description: order.remainingBalanceProof
            ? "Remaining balance proof has been submitted for verification."
            : "Waiting for the customer to pay and upload the remaining balance proof.",
          state: order.remainingBalanceProof ? "current" : "current",
        },
        {
          title: "Confirm Order",
          description: order.remainingBalanceProof
            ? "Verify the balance and complete the order."
            : "Completion is blocked until the remaining balance is submitted.",
          state: order.remainingBalanceProof ? "pending" : "pending",
        },
      ];
    }

    if (order.status === "ready" && paymentType === "full") {
      return [
        {
          title: "Validate Order",
          description: "Initial payment is already settled in full.",
          state: "complete",
        },
        {
          title: "Process Payment",
          description: "No remaining balance is required for this order.",
          state: "complete",
        },
        {
          title: "Confirm Order",
          description: "Sales can complete the order upon successful pickup handoff.",
          state: "current",
        },
      ];
    }

    return [
      {
        title: "Validate Order",
        description: "This order has already passed the sales payment stage.",
        state: "complete",
      },
      {
        title: "Process Payment",
        description: "No sales-side payment action is currently needed.",
        state: "complete",
      },
      {
        title: "Confirm Order",
        description: "Production or admin handles the next workflow step from here.",
        state: "complete",
      },
    ];
  };

  const getSalesUpdateMeta = (order: any) => {
    const paymentType = normalizePaymentType(order);
    const remainingBalance = getRemainingBalance(order);
    const action = getSalesAction(order);

    switch (action) {
      case "confirm_initial_payment":
        return {
          action,
          title: "Update Payment Status",
          description: "Review the submitted payment proof, process the initial payment, and confirm the order for production.",
          actionLabel: "Confirm Payment & Order",
          disabled: false,
          disabledReason: "",
          summary: `Initial payment of ₱${Number(order.amountDue ?? order.downpayment ?? 0).toLocaleString()} is ready for validation.`,
        };
      case "verify_remaining_balance":
        return {
          action,
          title: "Update Payment Status",
          description: "The customer submitted the remaining balance proof. Verify it to complete the order.",
          actionLabel: "Verify Balance & Complete",
          disabled: false,
          disabledReason: "",
          summary: `Remaining balance due: ₱${remainingBalance.toLocaleString()}.`,
        };
      case "complete_fully_paid_order":
        return {
          action,
          title: "Complete Fully Paid Order",
          description: "This order is fully paid and ready for pickup. Sales can mark it completed after handoff.",
          actionLabel: "Mark Order Completed",
          disabled: false,
          disabledReason: "",
          summary: "No remaining balance is due for this order.",
        };
      default:
        return {
          action,
          title: "Sales Update",
          description:
            order.status === "pending"
              ? "This order is still waiting for customer payment proof before sales can process it."
              : order.status === "confirmed" || order.status === "baking" || order.status === "quality_check"
                ? "No sales-side payment action is needed right now. The order is already moving through production."
                : order.status === "ready" && paymentType !== "full"
                  ? "This order needs the customer's remaining balance proof before sales can complete it."
                  : "No sales update is available for this order right now.",
          actionLabel: "No Action Available",
          disabled: true,
          disabledReason:
            order.status === "pending"
              ? "Awaiting customer payment proof."
              : order.status === "ready" && paymentType !== "full"
                ? "Awaiting remaining balance proof."
                : "Handled by another workflow stage.",
          summary:
            paymentType === "full"
              ? "Payment mode: full payment."
              : `Payment mode: deposit. Remaining balance: ₱${remainingBalance.toLocaleString()}.`,
        };
    }
  };

  const handleSalesUpdate = async () => {
    if (!salesUpdateTarget) return;

    const meta = getSalesUpdateMeta(salesUpdateTarget);
    if (meta.disabled) return;

    setSalesUpdating(true);
    try {
      const now = new Date().toISOString();
      if (meta.action === "confirm_initial_payment") {
        await syncOrderUpdate(salesUpdateTarget, { status: "confirmed" });
        toast.success("Payment validated and order confirmed.");
      } else if (meta.action === "verify_remaining_balance") {
        await syncOrderUpdate(salesUpdateTarget, {
          status: "completed",
          remainingBalanceVerified: true,
          completedAt: now,
        });
        toast.success("Remaining balance verified and order completed.");
      } else if (meta.action === "complete_fully_paid_order") {
        await syncOrderUpdate(salesUpdateTarget, {
          status: "completed",
          completedAt: now,
        });
        toast.success("Fully paid order marked as completed.");
      }
      setSalesUpdateTarget(null);
    } catch (error) {
      console.error("Failed to update sales payment flow", error);
      toast.error("Could not update this order. Please try again.");
    } finally {
      setSalesUpdating(false);
    }
  };

  const handleSalesReject = async () => {
    if (!salesUpdateTarget) return;

    setSalesRejecting(true);
    try {
      await syncOrderUpdate(salesUpdateTarget, {
        status: "declined",
        declineReason: "Rejected by sales",
      });
      toast.success("Order rejected by sales.");
      setSalesUpdateTarget(null);
    } catch (error) {
      console.error("Failed to reject order", error);
      toast.error("Could not reject this order. Please try again.");
    } finally {
      setSalesRejecting(false);
    }
  };

  const openProductionUpdate = (order: any) => {
    setProductionSchedule({
      productionDate: order.productionDate || order.pickupDate || "",
      timeSlot: order.timeSlot || "morning",
      estimatedCompletion: order.estimatedCompletion || order.pickupDate || "",
    });
    setProductionUpdateTarget(order);
  };

  const getProductionAction = (order: any): ProductionAction => {
    if (order.status === "confirmed") return "start_baking";
    if (order.status === "baking") return "move_to_quality_check";
    if (order.status === "quality_check") return "mark_ready_for_pickup";
    return "none";
  };

  const getProductionFlowSteps = (order: any) => {
    const current = order.status as OrderStatus;
    const rank: Record<string, number> = {
      confirmed: 0,
      baking: 1,
      quality_check: 2,
      ready: 3,
      completed: 4,
    };
    const currentRank = rank[current] ?? 0;

    return [
      {
        title: "View Assigned Order",
        description: order.assignedStaffName
          ? `Assigned to ${order.assignedStaffName}.`
          : "Review the order details and assign it to the active production owner.",
        state: currentRank >= 0 ? "complete" : "current",
      },
      {
        title: "Manage Production Schedule",
        description: order.productionDate
          ? `Scheduled on ${order.productionDate}${order.timeSlot ? ` (${order.timeSlot})` : ""}.`
          : "Set the production date, time slot, and estimated completion before or during baking.",
        state: current === "confirmed" ? "current" : currentRank >= 1 ? "complete" : "pending",
      },
      {
        title: "Update Production Status",
        description:
          current === "confirmed"
            ? "Move the order into baking once prep and schedule are ready."
            : current === "baking"
              ? "Advance the order to quality check after baking is done."
              : current === "quality_check"
                ? "Mark the order ready for pickup after final inspection."
                : "This order already passed the production update stage.",
        state:
          current === "confirmed" || current === "baking" || current === "quality_check"
            ? "current"
            : currentRank >= 3
              ? "complete"
              : "pending",
      },
    ] as SalesFlowStep[];
  };

  const getProductionUpdateMeta = (order: any) => {
    const action = getProductionAction(order);

    switch (action) {
      case "start_baking":
        return {
          action,
          title: "Production Workflow",
          description: "Assign the order, set its schedule, and start baking when production is ready.",
          actionLabel: "Save & Start Baking",
          nextStatus: "baking" as OrderStatus,
          disabled: false,
          disabledReason: "",
        };
      case "move_to_quality_check":
        return {
          action,
          title: "Production Workflow",
          description: "Update the schedule if needed, then move the order into quality check.",
          actionLabel: "Save & Move to Quality Check",
          nextStatus: "quality_check" as OrderStatus,
          disabled: false,
          disabledReason: "",
        };
      case "mark_ready_for_pickup":
        return {
          action,
          title: "Production Workflow",
          description: "Finalize the production details and mark the cake ready for pickup.",
          actionLabel: "Save & Mark Ready",
          nextStatus: "ready" as OrderStatus,
          disabled: false,
          disabledReason: "",
        };
      default:
        return {
          action,
          title: "Production Workflow",
          description:
            order.status === "pending"
              ? "Sales must confirm the order before production can start."
              : order.status === "ready"
                ? "Production is already finished for this order."
                : order.status === "completed"
                  ? "This order is already completed."
                  : "No production update is available for this order right now.",
          actionLabel: "No Action Available",
          nextStatus: null,
          disabled: true,
          disabledReason:
            order.status === "pending"
              ? "Waiting for sales confirmation."
              : "Handled by another workflow stage.",
        };
    }
  };

  const handleProductionUpdate = async () => {
    if (!productionUpdateTarget) return;

    const meta = getProductionUpdateMeta(productionUpdateTarget);
    const trimmedProductionDate = productionSchedule.productionDate.trim();
    const trimmedEstimatedCompletion = productionSchedule.estimatedCompletion.trim();

    if (meta.disabled) return;
    if (!trimmedProductionDate) {
      toast.error("Please set the production date first.");
      return;
    }
    if (!trimmedEstimatedCompletion) {
      toast.error("Please set the estimated completion date first.");
      return;
    }

    setProductionUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        assignedStaffId: authUser?.uid ?? productionUpdateTarget.assignedStaffId ?? "",
        assignedStaffName:
          authUser?.displayName ??
          authUser?.email ??
          productionUpdateTarget.assignedStaffName ??
          "Production Staff",
        productionDate: trimmedProductionDate,
        timeSlot: productionSchedule.timeSlot,
        estimatedCompletion: trimmedEstimatedCompletion,
      };

      if (meta.nextStatus) {
        payload.status = meta.nextStatus;
      }

      await syncOrderUpdate(productionUpdateTarget, payload);

      if (meta.nextStatus === "baking") {
        toast.success("Production schedule saved and order moved to baking.");
      } else if (meta.nextStatus === "quality_check") {
        toast.success("Order moved to quality check.");
      } else if (meta.nextStatus === "ready") {
        toast.success("Order marked ready for pickup.");
      } else {
        toast.success("Production details saved.");
      }

      setProductionUpdateTarget(null);
    } catch (error) {
      console.error("Failed to update production workflow", error);
      toast.error("Could not update this production order. Please try again.");
    } finally {
      setProductionUpdating(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      if (archiveTarget === "all-completed") {
        await Promise.all(
          completedOrders.map((order) => update(ref(db, `allOrders/${order.id}`), { clearedByAdmin: true }))
        );
      } else if (archiveTarget === "all-declined") {
        await Promise.all(
          declinedOrders.map((order) => update(ref(db, `allOrders/${order.id}`), { clearedByAdmin: true }))
        );
      } else {
        await update(ref(db, `allOrders/${archiveTarget.id}`), { clearedByAdmin: true });
      }
      setArchiveTarget(null);
    } catch (error) {
      console.error("Failed to archive order(s)", error);
    } finally {
      setArchiving(false);
    }
  };

  const unarchiveOrder = async (order: any) => {
    try {
      await update(ref(db, `allOrders/${order.id}`), { clearedByAdmin: false });
    } catch (error) {
      console.error("Failed to unarchive order", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
      baking: { label: "Baking", className: "bg-orange-100 text-orange-800 border-orange-300", icon: ChefHat },
      ready: { label: "Ready for Pick-up", className: "bg-green-100 text-green-800 border-green-300", icon: Package },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800 border-gray-300", icon: CheckCircle },
      declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle },
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.className} gap-1 border-2`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const filteredOrders = activeOrders
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.cakeDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const toMs = (date: string, time: string) => {
        if (!date) return Infinity;
        const base = new Date(`${date}T00:00:00`);
        if (!base.getTime()) return Infinity;
        if (time) {
          const t = new Date(`${date} ${time}`);
          if (!isNaN(t.getTime())) return t.getTime();
        }
        return base.getTime();
      };
      const da = toMs(a.pickupDate, a.pickupTime);
      const db2 = toMs(b.pickupDate, b.pickupTime);
      return pickupSort === "asc" ? da - db2 : db2 - da;
    });

  // Reset to page 1 whenever filters/sort change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, pickupSort, showArchived]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const applyPageSize = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) {
      setPageSize(n);
      setPageSizeInput(String(n));
      setCurrentPage(1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground text-lg">Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Order Summary Cards</h1>
        <p className="text-muted-foreground">
          Role-based order tracking with color-coded information for staff efficiency
        </p>
      </div>
      {/* Role Selector — admin only */}
      {systemRole === "admin" && <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">View as:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={userRole === "baker" ? "default" : "outline"}
            onClick={() => setUserRole("baker")}
            className={userRole === "baker" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Baker
          </Button>
          <Button
            variant={userRole === "sales" ? "default" : "outline"}
            onClick={() => setUserRole("sales")}
            className={userRole === "sales" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Sales Staff
          </Button>
          <Button
            variant={userRole === "admin" ? "default" : "outline"}
            onClick={() => setUserRole("admin")}
            className={userRole === "admin" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>}

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {systemRole === "admin" && !showArchived && (completedOrders.length > 0 || declinedOrders.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-white/70 p-3">
            <span className="text-sm font-medium text-muted-foreground">Admin archive:</span>
            {completedOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => setArchiveTarget("all-completed")}
                disabled={archiving}
              >
                <Archive className="w-4 h-4" />
                Archive {completedOrders.length} completed
              </Button>
            )}
            {declinedOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setArchiveTarget("all-declined")}
                disabled={archiving}
              >
                <Archive className="w-4 h-4" />
                Archive {declinedOrders.length} declined
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, or cakes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="baking">Baking</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {!showArchived && (
          <Button
            variant="outline"
            className="gap-2 whitespace-nowrap"
            onClick={() => setPickupSort((s) => (s === "asc" ? "desc" : "asc"))}
            title="Sort by pickup date"
          >
            <ArrowUpDown className="w-4 h-4" />
            Pickup: {pickupSort === "asc" ? "Earliest first" : "Latest first"}
          </Button>
        )}
        {systemRole === "admin" && (
          <Button
            variant={showArchived ? "default" : "outline"}
            className={`gap-2 whitespace-nowrap ${showArchived ? "bg-primary hover:bg-primary/90" : ""}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? "Active Orders" : `Archive (${archivedOrders.length})`}
          </Button>
        )}
        </div>
      </div>

      {/* Archived Orders View */}
      {showArchived && (
        <div>
          {archivedOrders.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-3">
                <Archive className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3>No Archived Orders</h3>
                <p className="text-muted-foreground">Archived orders will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                <Archive className="w-4 h-4" />
                <span>{archivedOrders.length} archived order{archivedOrders.length !== 1 ? "s" : ""} — all data preserved</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {archivedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden opacity-75 border-dashed">
                    <CardHeader className="pb-3 pt-4 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="mb-1 text-muted-foreground">{order.customer.name || "Unknown Customer"}</CardTitle>
                          <p className="text-sm text-muted-foreground">{order.cakeDetails.name || "Custom Order"}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2"><User className="w-3 h-3" />{order.customer.name}</div>
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{order.customer.phone}</div>
                        <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />Pickup: {order.pickupDate} at {order.pickupTime}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full mt-2"
                        onClick={() => unarchiveOrder(order)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Unarchive
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Cards Grid */}
      {!showArchived && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-secondary/20 to-primary/20 pb-3 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-1">{order.customer.name || "Unknown Customer"}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{order.cakeDetails.name || "Custom Order"}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    title="Print receipt"
                    onClick={() => printOrderSummary(order)}
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    title="Share summary card"
                    onClick={() => shareOrderSummary(order)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

              {/* BAKER VIEW - Orange Color-Coded */}
              {(userRole === "baker" || userRole === "admin") && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-orange-700">
                    <ChefHat className="w-4 h-4" />
                    Ingredients Needed
                  </h4>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-1 text-orange-900">
                      {order.ingredients.length > 0 ? order.ingredients.slice(0, 5).map((ingredient, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{ingredient.name}</span>
                          <span className="font-medium">{ingredient.quantity}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-orange-700">No ingredient breakdown saved for this order yet.</p>
                      )}
                      {order.ingredients.length > 5 && (
                        <p className="pt-1 text-center text-orange-600">
                          +{order.ingredients.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SALES VIEW - Green Color-Coded */}
              {(userRole === "sales" || userRole === "admin") && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-4 h-4" />
                    Pricing & Discounts
                  </h4>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <div className="space-y-2 text-green-900">
                      <div className="flex justify-between">
                        <span>Payment Mode:</span>
                        <span className="font-medium">{normalizePaymentType(order) === "full" ? "Full Payment" : "Deposit"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selling Price:</span>
                        <span className="font-medium">₱{order.pricing.sellingPrice.toFixed(2)}</span>
                      </div>
                      
                      {order.pricing.discountType && (
                        <>
                          <div className="flex justify-between items-center text-green-700">
                            <span className="flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              {order.pricing.discountType} Discount:
                            </span>
                            <span className="font-medium">-₱{order.pricing.discountAmount.toFixed(2)}</span>
                          </div>
                          <Separator className="bg-green-300" />
                        </>
                      )}
                      
                      <div className="flex justify-between items-center font-semibold">
                        <span>Final Price:</span>
                        <span className="text-lg text-green-700">₱{order.pricing.finalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining Balance:</span>
                        <span className={getRemainingBalance(order) > 0 ? "font-medium text-amber-700" : "font-medium text-green-700"}>
                          {getRemainingBalance(order) > 0 ? `₱${getRemainingBalance(order).toFixed(2)}` : "Paid in full"}
                        </span>
                      </div>
                      
                      {userRole === "admin" && (
                        <>
                          <Separator className="bg-green-300" />
                          <div className="flex justify-between text-sm">
                            <span>Profit:</span>
                            <span className={order.pricing.profit > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              ₱{order.pricing.profit.toFixed(2)} ({order.pricing.profitMargin})
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN-ONLY VIEW - Blue Color-Coded */}
              {userRole === "admin" && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                    Cost Breakdown (Admin Only)
                  </h4>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                    <div className="space-y-1 text-blue-900 text-sm">
                      <div className="flex justify-between">
                        <span>Ingredient Cost:</span>
                        <span>₱{order.pricing.ingredientCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span>₱{order.pricing.laborCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overhead Cost:</span>
                        <span>₱{order.pricing.overheadCost.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-blue-300 my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Total Cost:</span>
                        <span>₱{order.pricing.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Details - Visible to ALL */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Customer & Pickup Info
                </h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{order.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${order.customer.phone}`} className="hover:text-primary transition-colors">
                      {order.customer.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Pickup: {order.pickupDate} at {order.pickupTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <DialogTitle>Order {order.id} - Full Details</DialogTitle>
                          <DialogDescription>
                            Complete order information including all specifications and costs
                          </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => selectedOrder && printOrderSummary(selectedOrder)}>
                            <Printer className="w-4 h-4" />
                            Print Receipt
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => selectedOrder && shareOrderSummary(selectedOrder)}>
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                      {/* Order items */}
                      <div>
                        <h4 className="mb-2">Items Ordered</h4>
                        <div className="border border-border rounded-lg p-4 space-y-2">
                          {(selectedOrder?.items ?? []).map((item: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-muted-foreground">
                                <span>{item.name} <span className="text-primary font-semibold">×{item.quantity}</span></span>
                                <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          ))}
                          {selectedOrder?.rushFee > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>⚡ Rush Fee</span>
                              <span>+₱{selectedOrder.rushFee.toLocaleString()}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-primary">₱{selectedOrder?.pricing?.finalPrice?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="mb-2">Customer & Pickup</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <p>{selectedOrder?.customer?.name || "Unknown Customer"}</p>
                            {selectedOrder?.customer?.email && <p>{selectedOrder.customer.email}</p>}
                            {selectedOrder?.customer?.phone && <p>{selectedOrder.customer.phone}</p>}
                            <p className="pt-2">📅 Pickup: {selectedOrder?.pickupDate || "—"}</p>
                            <p>🕐 Time: {selectedOrder?.pickupTime || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2">Payment</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <p>Subtotal: ₱{selectedOrder?.subtotal?.toLocaleString() ?? "—"}</p>
                            <p>Paid Now: ₱{selectedOrder?.amountDue?.toLocaleString() ?? "—"}</p>
                            <p>Initial Deposit: ₱{selectedOrder?.downpayment?.toLocaleString() ?? "—"}</p>
                            <p>Remaining Balance: ₱{selectedOrder ? getRemainingBalance(selectedOrder).toLocaleString() : "—"}</p>
                            <p className="font-medium capitalize pt-1">
                              Type: {selectedOrder ? (normalizePaymentType(selectedOrder) === "full" ? "Full Payment" : "Deposit") : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(selectedOrder?.cakeDetails?.description || selectedOrder?.cakeDetails?.message || selectedOrder?.cakeDetails?.flavor || selectedOrder?.cakeDetails?.size || selectedOrder?.cakeDetails?.icing) && (
                        <div>
                          <h4 className="mb-2">Cake Details</h4>
                          <div className="border border-border rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                            {selectedOrder?.cakeDetails?.description && <p>{selectedOrder.cakeDetails.description}</p>}
                            {selectedOrder?.cakeDetails?.flavor && <p>Flavor: {selectedOrder.cakeDetails.flavor}</p>}
                            {selectedOrder?.cakeDetails?.size && <p>Size: {selectedOrder.cakeDetails.size}</p>}
                            {selectedOrder?.cakeDetails?.icing && <p>Icing: {selectedOrder.cakeDetails.icing}</p>}
                            {selectedOrder?.cakeDetails?.message && <p>Message on cake: {selectedOrder.cakeDetails.message}</p>}
                          </div>
                        </div>
                      )}

                      {selectedOrder?.cakeDetails?.image && (
                        <div>
                          <h4 className="mb-2">Customer Design Reference</h4>
                          <div className="border border-border rounded-lg p-4 bg-muted/20">
                            <img
                              src={selectedOrder.cakeDetails.image}
                              alt={`Design reference for ${selectedOrder.cakeDetails.name || "custom cake"}`}
                              className="max-h-[360px] w-full rounded-lg border bg-white object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {selectedOrder?.ingredients?.length > 0 && (
                        <div>
                          <h4 className="mb-2">Ingredients Needed</h4>
                          <div className="border border-border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                            {selectedOrder.ingredients.map((ingredient: any, index: number) => (
                              <div key={index} className="flex justify-between text-muted-foreground">
                                <span>{ingredient.name}</span>
                                <span>{ingredient.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {order.status !== "completed" && (
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      if (userRole === "baker") {
                        openProductionUpdate(order);
                        return;
                      }
                      setSalesUpdateTarget(order);
                    }}
                  >
                    Update
                  </Button>
                )}

                {systemRole === "admin" && (order.status === "completed" || order.status === "declined") && (
                  <Button
                    variant="outline"
                    className={`gap-2 ${
                      order.status === "declined"
                        ? "border-red-200 text-red-700 hover:bg-red-50"
                        : "border-violet-200 text-violet-700 hover:bg-violet-50"
                    }`}
                    onClick={() => setArchiveTarget(order)}
                    disabled={archiving}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {/* Pagination bar */}
      {!showArchived && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
          {/* Left: count + rows per page */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-2">
              <span>Cards per page:</span>
              <div className="flex items-center gap-1">
                {[4, 6, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setPageSize(n); setPageSizeInput(String(n)); setCurrentPage(1); }}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                      pageSize === n
                        ? "bg-primary text-white border-primary"
                        : "border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={pageSizeInput}
                  onChange={(e) => setPageSizeInput(e.target.value)}
                  onBlur={(e) => applyPageSize(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPageSize(pageSizeInput)}
                  className="w-16 h-7 text-xs text-center px-1"
                  placeholder="Custom"
                />
              </div>
            </div>
          </div>

          {/* Right: prev / page pills / next */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`h-8 w-8 rounded-md text-sm font-medium border transition-colors ${
                      safePage === p
                        ? "bg-primary text-white border-primary"
                        : "border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {!showArchived && filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3>No Orders Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && !archiving && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive order?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget === "all-completed" && "This will archive all completed orders. Data is preserved and can be restored from the Archive view."}
              {archiveTarget === "all-declined" && "This will archive all declined orders. Data is preserved and can be restored from the Archive view."}
              {archiveTarget && archiveTarget !== "all-completed" && archiveTarget !== "all-declined" && (
                <>This will archive this {archiveTarget.status} order. All data is preserved and can be restored from the Archive view.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} disabled={archiving}>
              {archiving ? "Archiving..." : "Yes, archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!salesUpdateTarget} onOpenChange={(open) => !open && !salesUpdating && !salesRejecting && setSalesUpdateTarget(null)}>
        <DialogContent className="max-w-2xl">
          {salesUpdateTarget && (() => {
            const meta = getSalesUpdateMeta(salesUpdateTarget);
            const steps = getSalesFlowSteps(salesUpdateTarget);
            const paymentType = normalizePaymentType(salesUpdateTarget);
            const remainingBalance = getRemainingBalance(salesUpdateTarget);
            const canReject = SALES_REJECTABLE_STATUSES.includes(salesUpdateTarget.status);

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{meta.title}</DialogTitle>
                  <DialogDescription>
                    {meta.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {salesUpdateTarget.customer.name || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {salesUpdateTarget.cakeDetails.name || "Custom Order"}
                        </p>
                      </div>
                      {getStatusBadge(salesUpdateTarget.status)}
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Payment mode: {paymentType === "full" ? "Full payment" : "Deposit"}</p>
                      <p>Paid now: ₱{Number(salesUpdateTarget.amountDue ?? salesUpdateTarget.downpayment ?? 0).toLocaleString()}</p>
                      <p>Final price: ₱{Number(salesUpdateTarget.pricing?.finalPrice ?? salesUpdateTarget.total ?? 0).toLocaleString()}</p>
                      <p>Remaining balance: {remainingBalance > 0 ? `₱${remainingBalance.toLocaleString()}` : "Paid in full"}</p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">{meta.summary}</p>
                  </div>

                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const iconClass =
                        step.state === "complete"
                          ? "text-green-600"
                          : step.state === "current"
                            ? "text-primary"
                            : "text-muted-foreground";
                      const rowClass =
                        step.state === "current"
                          ? "border-primary/40 bg-primary/5"
                          : step.state === "complete"
                            ? "border-green-200 bg-green-50/70"
                            : "border-border/60 bg-background";

                      return (
                        <div key={`${step.title}-${index}`} className={`flex gap-3 rounded-xl border p-4 ${rowClass}`}>
                          <div className={`mt-0.5 ${iconClass}`}>
                            {step.state === "complete" ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{step.title}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {salesUpdateTarget.paymentProof && (
                    <div className="rounded-xl border border-green-200 bg-green-50/60 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-green-700">
                        Payment Proof
                      </p>
                      <div className="overflow-hidden rounded-xl border border-green-200 bg-white">
                        <img
                          src={salesUpdateTarget.paymentProof}
                          alt="Payment proof"
                          className="max-h-[360px] w-full cursor-zoom-in object-contain bg-muted/20"
                          onClick={() => window.open(salesUpdateTarget.paymentProof, "_blank", "noopener,noreferrer")}
                        />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sales can review this submitted payment proof before confirming the order.
                      </p>
                    </div>
                  )}

                  {salesUpdateTarget.paymentProof && salesUpdateTarget.status === "pending" && (
                    <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">
                      <p className="text-sm font-semibold text-green-800">Initial payment proof received</p>
                      <p className="text-sm text-green-700">
                        Sales can now validate the payment and confirm the order.
                      </p>
                    </div>
                  )}

                  {salesUpdateTarget.status === "ready" && paymentType !== "full" && !salesUpdateTarget.remainingBalanceProof && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-sm font-semibold text-amber-800">Awaiting remaining balance</p>
                      <p className="text-sm text-amber-700">
                        The order cannot be completed until the customer uploads proof for the remaining balance.
                      </p>
                    </div>
                  )}

                  {salesUpdateTarget.status === "ready" && paymentType !== "full" && salesUpdateTarget.remainingBalanceProof && !salesUpdateTarget.remainingBalanceVerified && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                      <p className="text-sm font-semibold text-blue-800">Remaining balance proof received</p>
                      <p className="text-sm text-blue-700">
                        Verify the payment to complete the order and close the sales flow.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {canReject && (
                      <Button
                        variant="outline"
                        onClick={handleSalesReject}
                        disabled={salesUpdating || salesRejecting}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        {salesRejecting ? "Rejecting..." : "Reject Order"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSalesUpdateTarget(null)}
                      disabled={salesUpdating || salesRejecting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSalesUpdate}
                      disabled={meta.disabled || salesUpdating || salesRejecting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {salesUpdating ? "Updating..." : meta.actionLabel}
                    </Button>
                  </div>

                  {meta.disabled && (
                    <p className="text-right text-sm text-muted-foreground">
                      {meta.disabledReason}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!productionUpdateTarget} onOpenChange={(open) => !open && !productionUpdating && setProductionUpdateTarget(null)}>
        <DialogContent className="max-w-2xl">
          {productionUpdateTarget && (() => {
            const meta = getProductionUpdateMeta(productionUpdateTarget);
            const steps = getProductionFlowSteps(productionUpdateTarget);

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{meta.title}</DialogTitle>
                  <DialogDescription>{meta.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {productionUpdateTarget.customer.name || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {productionUpdateTarget.cakeDetails.name || "Custom Order"}
                        </p>
                      </div>
                      {getStatusBadge(productionUpdateTarget.status)}
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Pickup date: {productionUpdateTarget.pickupDate || "Not set"}</p>
                      <p>Pickup time: {productionUpdateTarget.pickupTime || "Not set"}</p>
                      <p>Assigned staff: {productionUpdateTarget.assignedStaffName || authUser?.displayName || authUser?.email || "Not assigned"}</p>
                      <p>Current slot: {productionUpdateTarget.timeSlot || "Not scheduled"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const iconClass =
                        step.state === "complete"
                          ? "text-green-600"
                          : step.state === "current"
                            ? "text-primary"
                            : "text-muted-foreground";
                      const rowClass =
                        step.state === "current"
                          ? "border-primary/40 bg-primary/5"
                          : step.state === "complete"
                            ? "border-green-200 bg-green-50/70"
                            : "border-border/60 bg-background";

                      return (
                        <div key={`${step.title}-${index}`} className={`flex gap-3 rounded-xl border p-4 ${rowClass}`}>
                          <div className={`mt-0.5 ${iconClass}`}>
                            {step.state === "complete" ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{step.title}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="production-date">Production date</Label>
                      <Input
                        id="production-date"
                        type="date"
                        value={productionSchedule.productionDate}
                        onChange={(e) =>
                          setProductionSchedule((current) => ({
                            ...current,
                            productionDate: e.target.value,
                          }))
                        }
                        disabled={productionUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="production-slot">Time slot</Label>
                      <Select
                        value={productionSchedule.timeSlot}
                        onValueChange={(value) =>
                          setProductionSchedule((current) => ({
                            ...current,
                            timeSlot: value,
                          }))
                        }
                        disabled={productionUpdating}
                      >
                        <SelectTrigger id="production-slot">
                          <SelectValue placeholder="Choose a slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCTION_TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="estimated-completion">Estimated completion date</Label>
                      <Input
                        id="estimated-completion"
                        type="date"
                        value={productionSchedule.estimatedCompletion}
                        onChange={(e) =>
                          setProductionSchedule((current) => ({
                            ...current,
                            estimatedCompletion: e.target.value,
                          }))
                        }
                        disabled={productionUpdating}
                      />
                    </div>
                  </div>

                  {productionUpdateTarget.status === "pending" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-sm font-semibold text-amber-800">Waiting for sales confirmation</p>
                      <p className="text-sm text-amber-700">
                        Production can review the order details now, but the order cannot start until sales confirms payment.
                      </p>
                    </div>
                  )}

                  {productionUpdateTarget.status === "ready" && (
                    <div className="rounded-xl border border-green-200 bg-green-50/80 p-4">
                      <p className="text-sm font-semibold text-green-800">Production already completed</p>
                      <p className="text-sm text-green-700">
                        The cake is already marked ready for pickup. Sales will handle the final payment and completion flow.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setProductionUpdateTarget(null)}
                      disabled={productionUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProductionUpdate}
                      disabled={meta.disabled || productionUpdating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {productionUpdating ? "Updating..." : meta.actionLabel}
                    </Button>
                  </div>

                  {meta.disabled && (
                    <p className="text-right text-sm text-muted-foreground">
                      {meta.disabledReason}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
