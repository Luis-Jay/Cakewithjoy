import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../config/firebase";
import { Card } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  FileText,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportPreviewProps {
  reportType: string;
  dateRange: { from?: Date; to?: Date };
  sections: {
    summary: boolean;
    orders: boolean;
    revenue: boolean;
    inventory: boolean;
    staff: boolean;
  };
  generatedBy: string;
  generatedAt: Date;
  onDataReady?: (payload: {
    reportType: string;
    generatedBy: string;
    generatedAt: string;
    dateFrom: string;
    dateTo: string;
    summary: {
      totalOrders: number;
      activeOrders: number;
      completedOrders: number;
      declinedOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
    };
    orders: Array<{
      orderId: string;
      customerName: string;
      status: string;
      pickupDate: string;
      pickupTime: string;
      createdAt: string;
      paymentType: string;
      total: number;
      itemSummary: string;
    }>;
  }) => void;
}

type ReportStatus = "pending" | "confirmed" | "baking" | "ready" | "completed" | "declined";

interface ReportOrderItem {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}

interface ReportOrder {
  id: string;
  customerName: string;
  status: ReportStatus;
  createdAt: string;
  total: number;
  paymentType?: string;
  category?: string;
  pickupDate?: string;
  pickupTime?: string;
  assignedStaffName?: string;
  items: ReportOrderItem[];
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  lowStockThreshold: number;
  batches: Array<{ quantity: number; expirationDate?: string }>;
}

interface StaffMember {
  uid: string;
  name: string;
  role: string;
  isActive: boolean;
}

const COLORS = ["#FF6B9D", "#C084FC", "#60A5FA", "#34D399", "#F59E0B", "#F87171"];
type FirebaseRecord = Record<string, unknown>;

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  baking: "Baking",
  ready: "Ready",
  completed: "Completed",
  declined: "Declined",
};

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

const formatCurrency = (value: number) =>
  `₱${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const toDateOnly = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDateKey = (value: Date) =>
  value.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const isWithinRange = (value: string, from?: Date, to?: Date) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const current = toDateOnly(parsed);
  if (from && current < toDateOnly(from)) return false;
  if (to && current > toDateOnly(to)) return false;
  return true;
};

const inclusiveDates = (from?: Date, to?: Date) => {
  if (!from || !to) return [];
  const list: Date[] = [];
  const current = toDateOnly(from);
  const end = toDateOnly(to);
  while (current <= end) {
    list.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return list;
};

export function ReportPreview({ reportType, dateRange, sections, generatedBy, generatedAt, onDataReady }: ReportPreviewProps) {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  useEffect(() => {
    const unsubscribeOrders = onValue(ref(db, "allOrders"), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOrders([]);
        return;
      }

      const list = Object.entries(data as FirebaseRecord).map(([id, rawValue]) => {
        const value = (rawValue ?? {}) as FirebaseRecord;
        return {
          id,
          customerName: typeof value.customerName === "string" ? value.customerName : "Unknown Customer",
          status: (typeof value.status === "string" ? value.status : "pending") as ReportStatus,
          createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
          total: Number(value.total ?? value.subtotal ?? 0),
          paymentType: typeof value.paymentType === "string" ? value.paymentType : "",
          category: typeof value.category === "string" ? value.category : "",
          pickupDate: typeof value.pickupDate === "string" ? value.pickupDate : "",
          pickupTime: typeof value.pickupTime === "string" ? value.pickupTime : "",
          assignedStaffName:
            (typeof value.assignedStaffName === "string" && value.assignedStaffName) ||
            (typeof value.assignedStaff === "string" && value.assignedStaff) ||
            "",
          items: Array.isArray(value.items)
            ? (value.items as ReportOrderItem[])
            : value.items && typeof value.items === "object"
              ? (Object.values(value.items as FirebaseRecord) as ReportOrderItem[])
              : [],
        };
      });

      setOrders(list);
    });

    const unsubscribeInventory = onValue(ref(db, "inventory"), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setInventoryItems([]);
        return;
      }

      const list = Object.entries(data as FirebaseRecord).map(([id, rawValue]) => {
        const value = (rawValue ?? {}) as FirebaseRecord;
        return {
          id,
          name: typeof value.name === "string" ? value.name : id,
          unit: typeof value.unit === "string" ? value.unit : "",
          lowStockThreshold: Number(value.lowStockThreshold ?? 0),
          batches:
            value.batches && typeof value.batches === "object"
              ? Object.values(value.batches as FirebaseRecord).map((batch) => {
                  const batchRecord = (batch ?? {}) as FirebaseRecord;
                  return {
                    quantity: Number(batchRecord.quantity ?? 0),
                    expirationDate: typeof batchRecord.expirationDate === "string" ? batchRecord.expirationDate : "",
                  };
                })
              : [],
        };
      });

      setInventoryItems(list);
    });

    const unsubscribeStaff = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setStaffMembers([]);
        return;
      }

      const list = Object.entries(data as FirebaseRecord)
        .map(([uid, rawValue]) => {
          const value = (rawValue ?? {}) as FirebaseRecord;
          return {
            uid,
            name: typeof value.name === "string" ? value.name : "",
            role: typeof value.role === "string" ? value.role : "",
            isActive: value.isActive !== false,
          };
        })
        .filter((member) => member.isActive && ["production", "staff", "baker", "sales"].includes(member.role));

      setStaffMembers(list);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeInventory();
      unsubscribeStaff();
    };
  }, []);

  const reportTitle = reportType ? `${reportType.charAt(0).toUpperCase()}${reportType.slice(1)} Report` : "Business Report";
  const reportReference = [
    "cake-with-joy-report",
    reportType || "custom",
    dateRange.from ? dateRange.from.toISOString().slice(0, 10) : "na",
    dateRange.to ? dateRange.to.toISOString().slice(0, 10) : "na",
    generatedAt.toISOString(),
  ].join("|");
  const reportQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reportReference)}`;

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        isWithinRange(order.pickupDate || order.createdAt, dateRange.from, dateRange.to)
      ),
    [orders, dateRange.from, dateRange.to]
  );

  const activeOrders = filteredOrders.filter((order) => order.status !== "declined");
  const completedOrders = activeOrders.filter((order) => order.status === "completed");
  const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
  const completionRate = activeOrders.length > 0 ? (completedOrders.length / activeOrders.length) * 100 : 0;

  const dailySalesData = useMemo(() => {
    const map = new Map<string, { date: string; sales: number; orders: number }>();
    inclusiveDates(dateRange.from, dateRange.to).forEach((date) => {
      const key = getDateKey(date);
      map.set(key, { date: key, sales: 0, orders: 0 });
    });

    activeOrders.forEach((order) => {
      const parsed = new Date(order.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const key = getDateKey(parsed);
      const current = map.get(key) ?? { date: key, sales: 0, orders: 0 };
      current.sales += order.total;
      current.orders += 1;
      map.set(key, current);
    });

    return Array.from(map.values());
  }, [activeOrders, dateRange.from, dateRange.to]);

  const statusBreakdown = useMemo(() => {
    const totals = new Map<ReportStatus, { status: string; count: number; percentage: number; totalValue: number }>();

    filteredOrders.forEach((order) => {
      const current = totals.get(order.status) ?? {
        status: STATUS_LABELS[order.status],
        count: 0,
        percentage: 0,
        totalValue: 0,
      };
      current.count += 1;
      current.totalValue += order.total;
      totals.set(order.status, current);
    });

    return Array.from(totals.values()).map((entry) => ({
      ...entry,
      percentage: filteredOrders.length > 0 ? (entry.count / filteredOrders.length) * 100 : 0,
    }));
  }, [filteredOrders]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, { name: string; value: number; revenue: number }>();

    activeOrders.forEach((order) => {
      const categoryName = order.items[0]?.category ?? order.category ?? "Custom Cake";
      const current = totals.get(categoryName) ?? { name: categoryName, value: 0, revenue: 0 };
      current.value += 1;
      current.revenue += order.total;
      totals.set(categoryName, current);
    });

    return Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [activeOrders]);

  const topProducts = useMemo(() => {
    const totals = new Map<string, { name: string; sold: number; revenue: number }>();

    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.name ?? "Custom Cake";
        const sold = Number(item.quantity ?? 0);
        const revenue = Number(item.price ?? 0) * sold;
        const current = totals.get(name) ?? { name, sold: 0, revenue: 0 };
        current.sold += sold;
        current.revenue += revenue;
        totals.set(name, current);
      });
    });

    return Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [activeOrders]);

  const inventoryStatus = useMemo(() => {
    return inventoryItems
      .map((item) => {
        const totalStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
        const expiringSoon = item.batches.some((batch) => {
          if (!batch.expirationDate) return false;
          const parsed = new Date(batch.expirationDate);
          if (Number.isNaN(parsed.getTime())) return false;
          const today = new Date();
          const in30Days = new Date();
          in30Days.setDate(in30Days.getDate() + 30);
          return parsed >= today && parsed <= in30Days;
        });

        return {
          ingredient: item.name,
          currentStock: `${totalStock} ${item.unit || "units"}`,
          batchCount: item.batches.length,
          status: totalStock <= item.lowStockThreshold ? "Critical" : expiringSoon ? "Low" : "Good",
          threshold: item.lowStockThreshold,
        };
      })
      .sort((a, b) => {
        const rank = { Critical: 0, Low: 1, Good: 2 };
        return rank[a.status as keyof typeof rank] - rank[b.status as keyof typeof rank];
      });
  }, [inventoryItems]);

  const staffPerformance = useMemo(() => {
    const assignmentCount = new Map<string, number>();
    activeOrders.forEach((order) => {
      if (!order.assignedStaffName) return;
      assignmentCount.set(order.assignedStaffName, (assignmentCount.get(order.assignedStaffName) ?? 0) + 1);
    });

    const rows = staffMembers.map((staff) => {
      const ordersHandled = assignmentCount.get(staff.name) ?? 0;
      return {
        uid: staff.uid,
        name: staff.name,
        role: staff.role,
        ordersCompleted: ordersHandled,
        performance:
          ordersHandled >= 10 ? "Excellent" : ordersHandled >= 4 ? "Good" : ordersHandled > 0 ? "Active" : "No assignments",
      };
    });

    return rows.sort((a, b) => b.ordersCompleted - a.ordersCompleted).slice(0, 8);
  }, [staffMembers, activeOrders]);

  const highlights = useMemo(() => {
    const topDay = [...dailySalesData].sort((a, b) => b.sales - a.sales)[0];
    const topCategory = categoryBreakdown[0];
    const criticalStock = inventoryStatus.filter((item) => item.status === "Critical").length;

    const items = [
      `${activeOrders.length} active order(s) were created in the selected period.`,
      `Total revenue for the period is ${formatCurrency(totalRevenue)} with an average order value of ${formatCurrency(avgOrderValue)}.`,
    ];

    if (topDay && topDay.orders > 0) {
      items.push(`Highest sales day in range: ${topDay.date} with ${formatCurrency(topDay.sales)} from ${topDay.orders} order(s).`);
    }
    if (topCategory) {
      items.push(`Top-selling product group: ${topCategory.name} with ${formatCurrency(topCategory.revenue)} in revenue.`);
    }
    if (criticalStock > 0) {
      items.push(`${criticalStock} inventory item(s) are currently at or below low-stock threshold.`);
    }

    return items;
  }, [activeOrders.length, totalRevenue, avgOrderValue, dailySalesData, categoryBreakdown, inventoryStatus]);

  const selectedSectionCount = Object.values(sections).filter(Boolean).length;
  const totalPages = 1 + selectedSectionCount;
  let pageNumber = 1;

  useEffect(() => {
    if (!onDataReady) return;

    onDataReady({
      reportType: reportTitle,
      generatedBy,
      generatedAt: generatedAt.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateFrom: formatDate(dateRange.from),
      dateTo: formatDate(dateRange.to),
      summary: {
        totalOrders: filteredOrders.length,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        declinedOrders: filteredOrders.filter((order) => order.status === "declined").length,
        totalRevenue,
        averageOrderValue: avgOrderValue,
      },
      orders: filteredOrders.map((order) => ({
        orderId: order.id,
        customerName: order.customerName,
        status: STATUS_LABELS[order.status],
        pickupDate: order.pickupDate || "N/A",
        pickupTime: order.pickupTime || "N/A",
        createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A",
        paymentType: order.paymentType || "N/A",
        total: order.total,
        itemSummary: order.items.map((item) => `${item.name ?? "Item"} x${Number(item.quantity ?? 0)}`).join("; "),
      })),
    });
  }, [
    onDataReady,
    reportTitle,
    generatedBy,
    generatedAt,
    dateRange.from,
    dateRange.to,
    filteredOrders,
    activeOrders.length,
    completedOrders.length,
    totalRevenue,
    avgOrderValue,
  ]);

  const renderPage = (title: string, content: ReactNode, isLastPage = false) => {
    const currentPage = pageNumber++;
    const iscover = currentPage === 1;
    return (
      <section
        key={`${title}-${currentPage}`}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 794,
          margin: "0 auto",
          minHeight: 1056,
          background: "#fff",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          breakAfter: isLastPage ? "auto" : "page",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
        className="print:max-w-none print:shadow-none print:rounded-none"
      >
        {/* ── Letterhead header ── */}
        <div style={{ background: "#4a2e42", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {/* Top band */}
          <div style={{
            background: "linear-gradient(100deg,#4a2e42 55%,#7b4a6e 100%)",
            padding: "16px 32px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.01em", fontFamily: "Georgia, serif" }}>
                🎂 Cake with Joy
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3 }}>
                Bakery Management System &nbsp;·&nbsp; Business Report
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Prepared by</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 1 }}>{generatedBy}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                {generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>
          {/* Accent strip */}
          <div style={{
            background: "#c77db3",
            height: 4,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }} />
          {/* Sub-bar */}
          <div style={{
            background: "rgba(255,255,255,0.07)",
            padding: "7px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{reportTitle}</span>
              {!iscover && <><span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>|</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{title}</span></>}
            </div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>
              Period: {formatDate(dateRange.from)} – {formatDate(dateRange.to)}
            </span>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{ flex: 1, padding: "28px 32px 20px" }}>{content}</div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "2px solid #4a2e42",
          padding: "8px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fdf5fb",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          <span style={{ fontSize: 9, color: "#8b6f84", letterSpacing: "0.04em" }}>
            CONFIDENTIAL &nbsp;·&nbsp; {reportTitle} &nbsp;·&nbsp; Cake with Joy
          </span>
          <span style={{ fontSize: 9, color: "#8b6f84" }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </section>
    );
  };

  const pages: ReactNode[] = [];

  const metaCell = (label: string, value: string) => (
    <div style={{ borderBottom: "1px solid #f0dcea", paddingBottom: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#c77db3", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#4a2e42" }}>{value}</div>
    </div>
  );

  pages.push(
    renderPage(
      "Cover Page",
      <div>
        {/* Hero */}
        <div style={{
          textAlign: "center",
          padding: "48px 32px 36px",
          background: "linear-gradient(160deg,#fdf5fb 0%,#fff 60%)",
          border: "1.5px solid #e8d0e0",
          borderRadius: 16,
          marginBottom: 28,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 20 }}>🎂</div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#c77db3", marginBottom: 12 }}>
            Official Business Document
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif", lineHeight: 1.2, marginBottom: 16 }}>
            {reportTitle}
          </div>
          <div style={{ width: 60, height: 3, background: "linear-gradient(90deg,#c77db3,#d89fc8)", borderRadius: 2, margin: "0 auto 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <div style={{ fontSize: 12, color: "#8b6f84", letterSpacing: "0.06em" }}>
            Cake with Joy &nbsp;·&nbsp; Bakery Management System
          </div>
        </div>

        {/* Metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px", marginBottom: 28, padding: "20px 24px", border: "1px solid #e8d0e0", borderRadius: 12 }}>
          {metaCell("Report Type", reportTitle)}
          {metaCell("Date Range", `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`)}
          {metaCell("Prepared By", generatedBy)}
          {metaCell("Generated On", generatedAt.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }))}
        </div>

        {/* Sections included */}
        <div style={{ border: "1px solid #e8d0e0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "#4a2e42", padding: "10px 20px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#fff" }}>Included Sections</span>
          </div>
          <div style={{ padding: "12px 20px" }}>
            {[
              sections.summary && "Executive Summary",
              sections.orders && "Order Details & Statistics",
              sections.revenue && "Revenue & Financial Analysis",
              sections.inventory && "Inventory Usage & Stock Levels",
              sections.staff && "Staff Performance & Activity",
            ].filter(Boolean).map((sec, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < selectedSectionCount - 1 ? "1px solid #f0dcea" : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c77db3", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                <span style={{ fontSize: 12, color: "#4a2e42", fontWeight: 500 }}>{sec}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#c77db3", fontWeight: 700 }}>Page {2 + [sections.summary, sections.orders, sections.revenue, sections.inventory, sections.staff].slice(0, [sections.summary, sections.orders, sections.revenue, sections.inventory, sections.staff].indexOf(sec === "Executive Summary" ? sections.summary : sec === "Order Details & Statistics" ? sections.orders : sec === "Revenue & Financial Analysis" ? sections.revenue : sec === "Inventory Usage & Stock Levels" ? sections.inventory : sections.staff)).filter(Boolean).length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 28, padding: "12px 16px", background: "#fdf5fb", borderRadius: 8, border: "1px solid #e8d0e0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <p style={{ fontSize: 9, color: "#8b6f84", lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: "#4a2e42" }}>CONFIDENTIAL:</strong> This document is intended solely for internal use by authorized personnel of Cake with Joy.
            The information contained herein reflects data from the Bakery Management System for the specified reporting period.
            Unauthorized reproduction or distribution of this report is prohibited.
          </p>
        </div>
      </div>,
      selectedSectionCount === 0
    )
  );

  const kpiCard = (icon: ReactNode, label: string, value: string, accent: string, bg: string) => (
    <div style={{ border: `1.5px solid ${accent}`, borderRadius: 12, padding: "14px 16px", background: bg, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ borderRadius: 8, padding: 6, background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{icon}</div>
        <span style={{ fontSize: 11, color: "#6b5263", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>{value}</div>
    </div>
  );

  if (sections.summary) {
    pages.push(
      renderPage(
        "Executive Summary",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #4a2e42", paddingBottom: 10 }}>
            <FileText size={16} color="#4a2e42" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif", letterSpacing: "0.02em" }}>Executive Summary</span>
          </div>

          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {kpiCard(<ShoppingCart size={14} color="#fff" />, "Total Orders", String(activeOrders.length), "#3b82f6", "#eff6ff")}
            {kpiCard(<DollarSign size={14} color="#fff" />, "Total Revenue", formatCurrency(totalRevenue), "#16a34a", "#f0fdf4")}
            {kpiCard(<TrendingUp size={14} color="#fff" />, "Avg Order Value", formatCurrency(avgOrderValue), "#9333ea", "#faf5ff")}
            {kpiCard(<CheckCircle size={14} color="#fff" />, "Completion Rate", `${completionRate.toFixed(1)}%`, "#ea580c", "#fff7ed")}
          </div>

          {/* Key Highlights */}
          <div style={{ border: "1px solid #e8d0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#4a2e42", padding: "9px 20px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#fff" }}>Key Highlights</span>
            </div>
            <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {highlights.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 8, borderBottom: i < highlights.length - 1 ? "1px solid #f0dcea" : "none" }}>
                  <div style={{ marginTop: 5, width: 5, height: 5, borderRadius: "50%", background: "#c77db3", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  <span style={{ fontSize: 12, color: "#4a2e42", lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status summary table */}
          {statusBreakdown.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Status Distribution</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#4a2e42", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {["Status", "Orders", "Share", "Value"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "Value" ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statusBreakdown.map((row, i) => (
                    <tr key={row.status} style={{ background: i % 2 === 0 ? "#fff" : "#fdf5fb", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <td style={{ padding: "7px 12px", color: "#4a2e42", fontWeight: 600 }}>{row.status}</td>
                      <td style={{ padding: "7px 12px", color: "#4a2e42" }}>{row.count}</td>
                      <td style={{ padding: "7px 12px", color: "#8b6f84" }}>{row.percentage.toFixed(1)}%</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", color: "#4a2e42", fontWeight: 600 }}>{formatCurrency(row.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>,
        !sections.orders && !sections.revenue && !sections.inventory && !sections.staff
      )
    );
  }

  const th = (label: string, right = false) => (
    <th style={{ padding: "8px 12px", textAlign: right ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "#4a2e42", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{label}</th>
  );
  const td = (val: ReactNode, right = false, i = 0) => (
    <td style={{ padding: "7px 12px", textAlign: right ? "right" : "left", fontSize: 12, color: "#4a2e42", background: i % 2 === 0 ? "#fff" : "#fdf5fb", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{val}</td>
  );

  if (sections.orders) {
    pages.push(
      renderPage(
        "Order Details & Statistics",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #4a2e42", paddingBottom: 10 }}>
            <Package size={16} color="#4a2e42" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>Order Details &amp; Statistics</span>
          </div>

          <div style={{ border: "1px solid #e8d0e0", borderRadius: 12, padding: 16, overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Daily Order Trends</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0dcea" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#c77db3" name="Sales (₱)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#4a2e42" name="Orders" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Order Status Breakdown</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{th("Status")}{th("Count")}{th("Share")}{th("Value", true)}</tr></thead>
                <tbody>
                  {statusBreakdown.map((row, i) => (
                    <tr key={row.status}>
                      {td(<strong>{row.status}</strong>, false, i)}
                      {td(row.count, false, i)}
                      {td(`${row.percentage.toFixed(1)}%`, false, i)}
                      {td(formatCurrency(row.totalValue), true, i)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Top 5 Best-Selling Products</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{th("Product")}{th("Sold")}{th("Revenue", true)}</tr></thead>
                <tbody>
                  {topProducts.map((product, i) => (
                    <tr key={product.name}>
                      {td(product.name, false, i)}
                      {td(product.sold, false, i)}
                      {td(formatCurrency(product.revenue), true, i)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        !sections.revenue && !sections.inventory && !sections.staff
      )
    );
  }

  if (sections.revenue) {
    const lostValue = filteredOrders.filter((o) => o.status === "declined").reduce((s, o) => s + o.total, 0);
    pages.push(
      renderPage(
        "Revenue & Financial Analysis",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #4a2e42", paddingBottom: 10 }}>
            <DollarSign size={16} color="#4a2e42" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>Revenue &amp; Financial Analysis</span>
          </div>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${activeOrders.length} active orders`, accent: "#16a34a", bg: "#f0fdf4" },
              { label: "Declined / Lost Value", value: formatCurrency(lostValue), sub: "Orders that did not convert", accent: "#ea580c", bg: "#fff7ed" },
              { label: "Average Ticket Size", value: formatCurrency(avgOrderValue), sub: "Based on selected range", accent: "#2563eb", bg: "#eff6ff" },
            ].map(({ label, value, sub, accent, bg }) => (
              <div key={label} style={{ border: `1.5px solid ${accent}`, borderRadius: 12, padding: "14px 16px", background: bg, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>{value}</div>
                <div style={{ fontSize: 10, color: "#8b6f84", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #e8d0e0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Revenue by Product</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={85} dataKey="revenue">
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Revenue Breakdown</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{th("Category")}{th("Orders")}{th("Revenue", true)}</tr></thead>
                <tbody>
                  {categoryBreakdown.map((cat, i) => (
                    <tr key={cat.name}>
                      {td(<strong>{cat.name}</strong>, false, i)}
                      {td(cat.value, false, i)}
                      {td(formatCurrency(cat.revenue), true, i)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        !sections.inventory && !sections.staff
      )
    );
  }

  if (sections.inventory) {
    const critCount = inventoryStatus.filter((i) => i.status === "Critical").length;
    const lowCount = inventoryStatus.filter((i) => i.status === "Low").length;
    pages.push(
      renderPage(
        "Inventory Usage & Stock Levels",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #4a2e42", paddingBottom: 10 }}>
            <Package size={16} color="#4a2e42" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>Inventory Usage &amp; Stock Levels</span>
          </div>

          {/* Alert strip */}
          {(critCount > 0 || lowCount > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              <div style={{ border: "1.5px solid #dc2626", borderRadius: 10, padding: "12px 14px", background: "#fef2f2", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>Critical Stock</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#4a2e42" }}>{critCount}</div>
                <div style={{ fontSize: 10, color: "#8b6f84" }}>items at or below threshold</div>
              </div>
              <div style={{ border: "1.5px solid #ea580c", borderRadius: 10, padding: "12px 14px", background: "#fff7ed", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#ea580c", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>Expiring Soon</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#4a2e42" }}>{lowCount}</div>
                <div style={{ fontSize: 10, color: "#8b6f84" }}>items expiring within 30 days</div>
              </div>
              <div style={{ border: "1.5px solid #16a34a", borderRadius: 10, padding: "12px 14px", background: "#f0fdf4", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>Adequate Stock</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#4a2e42" }}>{inventoryStatus.length - critCount - lowCount}</div>
                <div style={{ fontSize: 10, color: "#8b6f84" }}>items in good standing</div>
              </div>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Ingredient", "Current Stock", "Batches", "Status", "Threshold"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: i === 4 ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase", background: "#4a2e42", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryStatus.map((item, i) => {
                const statusColor = item.status === "Critical" ? "#dc2626" : item.status === "Low" ? "#ea580c" : "#16a34a";
                return (
                  <tr key={item.ingredient} style={{ background: i % 2 === 0 ? "#fff" : "#fdf5fb", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <td style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#4a2e42" }}>{item.ingredient}</td>
                    <td style={{ padding: "7px 12px", fontSize: 12, color: "#4a2e42" }}>{item.currentStock}</td>
                    <td style={{ padding: "7px 12px", fontSize: 12, color: "#4a2e42" }}>{item.batchCount}</td>
                    <td style={{ padding: "7px 12px", fontSize: 11, fontWeight: 700, color: statusColor }}>
                      {item.status === "Critical" ? "⚠ Critical" : item.status === "Low" ? "⚠ Expiring Soon" : "✓ Good"}
                    </td>
                    <td style={{ padding: "7px 12px", fontSize: 12, color: "#4a2e42", textAlign: "right" }}>{item.threshold}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
        !sections.staff
      )
    );
  }

  if (sections.staff) {
    const perfColor = (p: string) => p === "Excellent" ? "#16a34a" : p === "Good" ? "#2563eb" : p === "Active" ? "#ea580c" : "#8b6f84";
    pages.push(
      renderPage(
        "Staff Performance & Activity",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #4a2e42", paddingBottom: 10 }}>
            <Users size={16} color="#4a2e42" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#4a2e42", fontFamily: "Georgia, serif" }}>Staff Performance &amp; Activity</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Performance Overview</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name", "Role", "Orders", "Rating"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase", background: "#4a2e42", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map((staff, i) => (
                    <tr key={`${staff.uid}-${staff.name}`} style={{ background: i % 2 === 0 ? "#fff" : "#fdf5fb", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 600, color: "#4a2e42" }}>{staff.name}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, color: "#8b6f84", textTransform: "capitalize" }}>{staff.role}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, color: "#4a2e42" }}>{staff.ordersCompleted}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, fontWeight: 700, color: perfColor(staff.performance) }}>{staff.performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ border: "1px solid #e8d0e0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b5263", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Orders by Staff</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0dcea" />
                  <XAxis dataKey="name" angle={-12} textAnchor="end" height={52} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="ordersCompleted" fill="#c77db3" name="Orders Assigned" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>,
        true
      )
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 print:max-w-none print:gap-0">
      {pages}
    </div>
  );
}
