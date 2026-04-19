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
    return (
      <section
        key={`${title}-${currentPage}`}
        className="flex min-h-[960px] flex-col bg-white"
        style={{ breakAfter: isLastPage ? "auto" : "page" }}
      >
        <div className="border-b border-primary/10 bg-gradient-to-r from-white via-secondary/10 to-primary/10 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="mb-1 text-pink-600">Cake with Joy</h2>
              <p className="text-sm text-muted-foreground">Bakery Management System</p>
              <h3 className="mt-4 text-primary">{reportTitle}</h3>
              <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Pickup period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Generated By</p>
              <p>{generatedBy}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Generated On</p>
              <p>
                {generatedAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8 px-6 py-6">{content}</div>

        <div className="border-t border-muted px-6 py-4 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Report reference: {reportReference}</p>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </section>
    );
  };

  const pages: ReactNode[] = [];

  pages.push(
    renderPage(
      "Report Cover",
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/10 bg-muted/30 p-5">
            <p className="text-sm font-semibold text-foreground">Report Overview</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Report Type</p>
                <p>{reportTitle}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup Date Range</p>
                <p>{formatDate(dateRange.from)} - {formatDate(dateRange.to)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Generated By</p>
                <p>{generatedBy}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Methodology</p>
                <p>V Methodology</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="mb-2 text-sm font-semibold">Included Sections</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {sections.summary && <li>• Executive Summary</li>}
              {sections.orders && <li>• Order Details & Statistics</li>}
              {sections.revenue && <li>• Revenue & Financial Analysis</li>}
              {sections.inventory && <li>• Inventory Usage & Stock Levels</li>}
              {sections.staff && <li>• Staff Performance & Activity</li>}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-white p-5 text-center">
          <p className="text-sm font-semibold text-foreground">QR Reference</p>
          <img src={reportQrUrl} alt="Report QR code" className="mx-auto mt-4 h-44 w-44 rounded-xl border border-border p-2" />
          <p className="mt-3 text-xs text-muted-foreground">
            Scan to reference this generated report record and page set.
          </p>
        </div>
      </div>,
      selectedSectionCount === 0
    )
  );

  if (sections.summary) {
    pages.push(
      renderPage(
        "Executive Summary",
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="text-primary">Executive Summary</h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-2xl font-semibold text-blue-600">{activeOrders.length}</p>
            </Card>

            <Card className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
            </Card>

            <Card className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-purple-100 p-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
              <p className="text-2xl font-semibold text-purple-600">{formatCurrency(avgOrderValue)}</p>
            </Card>

            <Card className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-orange-100 p-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <p className="text-2xl font-semibold text-orange-600">{completionRate.toFixed(1)}%</p>
            </Card>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="mb-2 text-sm font-semibold">Key Highlights</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {highlights.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>,
        !sections.orders && !sections.revenue && !sections.inventory && !sections.staff
      )
    );
  }

  if (sections.orders) {
    pages.push(
      renderPage(
        "Order Details & Statistics",
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h4 className="text-primary">Order Details & Statistics</h4>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="mb-3 text-sm">Daily Order Trends</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#FF6B9D" name="Sales (₱)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#60A5FA" name="Orders" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <p className="mb-2 text-sm">Order Status Breakdown</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Count</TableHead>
                    <TableHead className="text-xs">Percentage</TableHead>
                    <TableHead className="text-right text-xs">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusBreakdown.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell className="text-xs py-2">{row.status}</TableCell>
                      <TableCell className="text-xs py-2">{row.count}</TableCell>
                      <TableCell className="text-xs py-2">{row.percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-xs py-2">{formatCurrency(row.totalValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <p className="mb-2 text-sm">Top 5 Best-Selling Products</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product Name</TableHead>
                    <TableHead className="text-xs">Units Sold</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="text-xs py-2">{product.name}</TableCell>
                      <TableCell className="text-xs py-2">{product.sold}</TableCell>
                      <TableCell className="text-right text-xs py-2">{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>,
        !sections.revenue && !sections.inventory && !sections.staff
      )
    );
  }

  if (sections.revenue) {
    pages.push(
      renderPage(
        "Revenue & Financial Analysis",
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <h4 className="text-primary">Revenue & Financial Analysis</h4>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border p-4">
              <p className="mb-3 text-sm">Revenue by Product</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="revenue"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="mb-2 text-sm">Revenue Breakdown</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Orders</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell className="text-xs py-2">{cat.name}</TableCell>
                      <TableCell className="text-xs py-2">{cat.value}</TableCell>
                      <TableCell className="text-right text-xs py-2">{formatCurrency(cat.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-xl text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">From {activeOrders.length} active order(s)</p>
            </Card>
            <Card className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground mb-1">Declined / Lost Value</p>
              <p className="text-xl text-orange-600">
                {formatCurrency(filteredOrders.filter((order) => order.status === "declined").reduce((sum, order) => sum + order.total, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Orders that did not convert</p>
            </Card>
            <Card className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground mb-1">Average Ticket</p>
              <p className="text-xl text-blue-600">{formatCurrency(avgOrderValue)}</p>
              <p className="text-xs text-muted-foreground">Based on selected range</p>
            </Card>
          </div>
        </section>,
        !sections.inventory && !sections.staff
      )
    );
  }

  if (sections.inventory) {
    pages.push(
      renderPage(
        "Inventory Usage & Stock Levels",
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h4 className="text-primary">Inventory Usage & Stock Levels</h4>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Ingredient</TableHead>
                <TableHead className="text-xs">Current Stock</TableHead>
                <TableHead className="text-xs">Batches</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryStatus.map((item) => (
                <TableRow key={item.ingredient}>
                  <TableCell className="text-xs py-2">{item.ingredient}</TableCell>
                  <TableCell className="text-xs py-2">{item.currentStock}</TableCell>
                  <TableCell className="text-xs py-2">{item.batchCount}</TableCell>
                  <TableCell className="text-xs py-2">
                    {item.status === "Critical" && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        Critical
                      </span>
                    )}
                    {item.status === "Low" && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="w-3 h-3" />
                        Expiring Soon
                      </span>
                    )}
                    {item.status === "Good" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Good
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs py-2">{item.threshold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>,
        !sections.staff
      )
    );
  }

  if (sections.staff) {
    pages.push(
      renderPage(
        "Staff Performance & Activity",
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="text-primary">Staff Performance & Activity</h4>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Staff Name</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Orders Assigned</TableHead>
                    <TableHead className="text-xs">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance.map((staff) => (
                    <TableRow key={`${staff.uid}-${staff.name}`}>
                      <TableCell className="text-xs py-2">{staff.name}</TableCell>
                      <TableCell className="text-xs py-2 capitalize">{staff.role}</TableCell>
                      <TableCell className="text-xs py-2">{staff.ordersCompleted}</TableCell>
                      <TableCell className="text-xs py-2">{staff.performance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="mb-3 text-sm">Assigned Orders by Staff</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-12} textAnchor="end" height={52} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="ordersCompleted" fill="#FF6B9D" name="Orders Assigned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>,
        true
      )
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
      {pages}
    </div>
  );
}
