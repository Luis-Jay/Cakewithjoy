import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import {
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Search,
  MoreHorizontal,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Printer,
} from "lucide-react";
import { ReportPreview } from "./ReportPreview";
import { toast } from "sonner@2.0.3";
import { downloadReportCsv, downloadReportExcel, type ReportExportPayload } from "../utils/reportExport";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  targetAudience: string;
  date: string;
  postedBy: string;
}

type OrderStatus = "pending" | "confirmed" | "baking" | "ready" | "completed" | "declined";
type PaymentType = "downpayment" | "deposit" | "full";

interface DashboardOrder {
  id: string;
  customer: string;
  status: OrderStatus;
  date: string;
  total: number;
  paymentType: PaymentType;
  hasPaymentProof: boolean;
  createdAt: string;
  completedAt?: string;
  clearedByAdmin?: boolean;
}

const normalizePaymentType = (order: {
  paymentType?: PaymentType | null;
  amountDue?: number;
  total?: number;
}): PaymentType => {
  if (order.paymentType === "full") return "full";
  if (order.paymentType === "deposit") return "deposit";
  if (order.paymentType === "downpayment") return "downpayment";
  if ((order.amountDue ?? 0) >= (order.total ?? 0) && (order.total ?? 0) > 0) return "full";
  return "downpayment";
};

export function AdminDashboard() {
  const authUser = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const reportScrollRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState("");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [lastReportGeneratedAt, setLastReportGeneratedAt] = useState<Date | null>(null);
  const [reportExportData, setReportExportData] = useState<ReportExportPayload | null>(null);
  const [selectedReportSections, setSelectedReportSections] = useState({
    summary: true,
    orders: true,
    revenue: true,
    inventory: false,
    staff: false,
  });

  // Announcements state
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isEditAnnouncementOpen, setIsEditAnnouncementOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [editAnnouncementSaving, setEditAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [editAnnouncementError, setEditAnnouncementError] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    priority: "normal" as "normal" | "important" | "urgent",
    targetAudience: "all",
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [inventorySnapshot, setInventorySnapshot] = useState<Record<string, any>>({});
  const [staffSnapshot, setStaffSnapshot] = useState<Record<string, any>>({});

  const resetReportOptions = () => {
    setReportType("");
    setReportFormat("pdf");
    setDateRange({});
    setSelectedReportSections({
      summary: true,
      orders: true,
      revenue: true,
      inventory: false,
      staff: false,
    });
  };

  const resetDashboardFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  useEffect(() => {
    const unsub = onValue(ref(db, "announcements"), (snap) => {
      const data = snap.val();
      if (!data) { setAnnouncements([]); return; }
      const list: Announcement[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        title: val.title ?? "",
        message: val.message ?? "",
        priority: val.priority ?? "normal",
        targetAudience: val.targetAudience ?? "",
        date: val.date ?? "",
        postedBy: val.postedBy ?? "Admin",
      }));
      setAnnouncements(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "allOrders"), (snap) => {
      const data = snap.val();
      if (!data) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      const list: DashboardOrder[] = Object.entries(data)
        .map(([key, val]: [string, any]) => {
          const total = Number(val.total ?? val.subtotal ?? 0);
          return {
            id: key,
            customer: val.customerName ?? "Unknown Customer",
            status: (val.status ?? "pending") as OrderStatus,
            date: val.createdAt
              ? new Date(val.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "No date",
            total,
            paymentType: normalizePaymentType({
              paymentType: val.paymentType ?? null,
              amountDue: Number(val.amountDue ?? 0),
              total,
            }),
            hasPaymentProof: !!val.paymentProof,
            createdAt: val.createdAt ?? "",
            completedAt: val.completedAt ?? "",
            clearedByAdmin: !!val.clearedByAdmin,
          };
        })
        .filter((order) => !order.clearedByAdmin)
        .filter((order) => order.status !== "declined")
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setOrders(list);
      setOrdersLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubInventory = onValue(ref(db, "inventory"), (snap) => {
      setInventorySnapshot(snap.val() ?? {});
    });
    const unsubStaff = onValue(ref(db, "users"), (snap) => {
      setStaffSnapshot(snap.val() ?? {});
    });

    return () => {
      unsubInventory();
      unsubStaff();
    };
  }, []);

  const todayKey = new Date().toDateString();
  const pendingOrdersCount = orders.filter((order) => order.status === "pending").length;
  const hasCompletedAtData = orders.some((order) => !!order.completedAt);
  const completedTodayCount = orders.filter((order) => {
    if (order.status !== "completed") return false;
    const comparisonValue = hasCompletedAtData ? order.completedAt : order.createdAt;
    if (!comparisonValue) return false;
    return new Date(comparisonValue).toDateString() === todayKey;
  }).length;
  const lowStockItemsCount = Object.values(inventorySnapshot).filter((item: any) => {
    const batches = item?.batches && typeof item.batches === "object" ? Object.values(item.batches) : [];
    const totalStock = batches.reduce((sum: number, batch: any) => sum + Number(batch?.quantity ?? 0), 0);
    return totalStock <= Number(item?.lowStockThreshold ?? 0);
  }).length;
  const todaysRevenue = orders
    .filter((order) => new Date(order.createdAt).toDateString() === todayKey && order.status !== "declined")
    .reduce((sum, order) => sum + order.total, 0);

  const stats = [
    { label: "Pending Orders", value: String(pendingOrdersCount), icon: Package, color: "text-orange-500" },
    { label: hasCompletedAtData ? "Completed Today" : "Created & Completed Today", value: String(completedTodayCount), icon: CheckCircle, color: "text-green-500" },
    { label: "Low Stock Items", value: String(lowStockItemsCount), icon: AlertCircle, color: "text-red-500" },
    { label: "Today's Revenue", value: `₱${todaysRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmed", className: "bg-sky-100 text-sky-800" },
      baking: { label: "Baking", className: "bg-blue-100 text-blue-800" },
      ready: { label: "Ready", className: "bg-green-100 text-green-800" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800" },
      declined: { label: "Declined", className: "bg-red-100 text-red-800" },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const filteredOrders = orders
    .filter((order) => statusFilter === "all" || order.status === statusFilter)
    .filter((order) =>
      searchQuery.trim() === "" ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const handleGenerateReport = () => {
    setIsReportDialogOpen(false);
    setIsReportPreviewOpen(true);
    setLastReportGeneratedAt(new Date());
    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
    setTimeout(() => reportScrollRef.current?.focus(), 100);
  };

  const handlePrintReport = () => {
    const reportRoot = document.getElementById("report-preview-root");
    if (!reportRoot) {
      toast.error("Report preview is not ready yet.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast.error("Unable to open print preview.");
      return;
    }

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${reportExportData?.reportType ?? "Cake with Joy Report"}</title>
          ${styles}
          <style>
            body { margin: 0; background: white; }
          </style>
        </head>
        <body>
          ${reportRoot.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadReport = () => {
    if (!reportExportData) {
      toast.error("Report data is still loading.");
      return;
    }

    if (reportFormat === "csv") {
      downloadReportCsv(reportExportData);
      toast.success("CSV report downloaded.");
      return;
    }

    if (reportFormat === "excel") {
      downloadReportExcel(reportExportData);
      toast.success("Excel report downloaded.");
      return;
    }

    handlePrintReport();
    toast.success(reportFormat === "pdf" ? "Print dialog opened. Choose Save as PDF to export." : "Print dialog opened.");
  };

  const handleAddAnnouncement = async () => {
    const title = newAnnouncement.title.trim();
    const message = newAnnouncement.message.trim();
    if (!title || !message || announcementSaving) return;

    setAnnouncementError("");
    setAnnouncementSaving(true);
    const payload = {
      ...newAnnouncement,
      title,
      message,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      postedBy: "Admin",
    };
    try {
      await push(ref(db, "announcements"), payload);
      setNewAnnouncement({ title: "", message: "", priority: "normal" as "normal" | "important" | "urgent", targetAudience: "all" });
      setIsAnnouncementDialogOpen(false);
      toast.success("Announcement added successfully.");
    } catch (error) {
      console.error("Failed to add announcement", error);
      setAnnouncementError("Could not add announcement. Please check your Firebase permissions and try again.");
      toast.error("Could not add announcement. Please check your Firebase permissions and try again.");
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleEditAnnouncement = async () => {
    const title = newAnnouncement.title.trim();
    const message = newAnnouncement.message.trim();
    if (!selectedAnnouncement || !title || !message || editAnnouncementSaving) return;

    setEditAnnouncementError("");
    setEditAnnouncementSaving(true);
    try {
      await update(ref(db, `announcements/${selectedAnnouncement.id}`), { ...newAnnouncement, title, message });
      setIsEditAnnouncementOpen(false);
      toast.success("Announcement updated successfully.");
    } catch (error) {
      console.error("Failed to update announcement", error);
      setEditAnnouncementError("Could not update announcement. Please try again.");
      toast.error("Could not update announcement. Please try again.");
    } finally {
      setEditAnnouncementSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await remove(ref(db, `announcements/${id}`));
      toast.success("Announcement deleted.");
    } catch (error) {
      console.error("Failed to delete announcement", error);
      toast.error("Could not delete announcement. Please try again.");
    }
  };

  const canSubmitAnnouncement = newAnnouncement.title.trim().length > 0 && newAnnouncement.message.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage orders and monitor bakery operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">{stat.label}</p>
                    <h2>{stat.value}</h2>
                  </div>
                  <div className={`p-3 bg-muted rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate Report Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Reports & Analytics
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Generate comprehensive reports for business insights
              </p>
            </div>
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Business Report</DialogTitle>
                  <DialogDescription>
                    Configure and generate detailed reports for your bakery operations
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Report Type */}
                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                        <SelectItem value="quarterly">Quarterly Report</SelectItem>
                        <SelectItem value="yearly">Yearly Report</SelectItem>
                        <SelectItem value="custom">Custom Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Pickup Date Range</Label>
                    <CalendarComponent
                      mode="range"
                      selectedRange={dateRange}
                      onRangeSelect={(range) => setDateRange(range)}
                    />
                    {dateRange.from && dateRange.to && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm">
                          <span className="text-muted-foreground">From:</span>{" "}
                          {dateRange.from.toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">To:</span>{" "}
                          {dateRange.to.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {dateRange.from && !dateRange.to && (
                      <p className="text-sm text-muted-foreground">
                        Selected start date: {dateRange.from.toLocaleDateString()}. Click another date to complete the range.
                      </p>
                    )}
                  </div>

                  {/* Report Sections */}
                  <div className="space-y-3">
                    <Label>Include in Report</Label>
                    <div className="space-y-3 border border-border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="summary"
                          checked={selectedReportSections.summary}
                          onCheckedChange={(checked) =>
                            setSelectedReportSections({
                              ...selectedReportSections,
                              summary: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor="summary"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Executive Summary
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="orders"
                          checked={selectedReportSections.orders}
                          onCheckedChange={(checked) =>
                            setSelectedReportSections({
                              ...selectedReportSections,
                              orders: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor="orders"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Order Details & Statistics
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="revenue"
                          checked={selectedReportSections.revenue}
                          onCheckedChange={(checked) =>
                            setSelectedReportSections({
                              ...selectedReportSections,
                              revenue: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor="revenue"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Revenue & Financial Analysis
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="inventory"
                          checked={selectedReportSections.inventory}
                          onCheckedChange={(checked) =>
                            setSelectedReportSections({
                              ...selectedReportSections,
                              inventory: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor="inventory"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Inventory Usage & Stock Levels
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="staff"
                          checked={selectedReportSections.staff}
                          onCheckedChange={(checked) =>
                            setSelectedReportSections({
                              ...selectedReportSections,
                              staff: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor="staff"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Staff Performance & Activity
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Report Format */}
                  <div className="space-y-2">
                    <Label htmlFor="report-format">Export Format</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger id="report-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="print">Print Preview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Report Preview Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Report will include data from{" "}
                        {dateRange.from ? dateRange.from.toLocaleDateString() : "..."} to{" "}
                        {dateRange.to ? dateRange.to.toLocaleDateString() : "..."} based on pickup date
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>
                        {Object.values(selectedReportSections).filter(Boolean).length} sections selected
                      </span>
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetReportOptions}>
                    Reset
                  </Button>
                  <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 gap-2"
                    onClick={handleGenerateReport}
                    disabled={!reportType || !dateRange.from || !dateRange.to}
                  >
                    <Download className="w-4 h-4" />
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Last Report</p>
                <p>{lastReportGeneratedAt ? lastReportGeneratedAt.toLocaleDateString() : "Not generated yet"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Active Staff</p>
                <p className="text-green-600">
                  {Object.values(staffSnapshot).filter((staff: any) => staff?.isActive !== false).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Orders In System</p>
                <p>{orders.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Orders</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="baking">Baking</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetDashboardFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading live orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No orders match the current search or filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>₱{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm capitalize">{order.paymentType === "full" ? "Full payment" : "Deposit"}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.hasPaymentProof ? "Proof uploaded" : "No proof yet"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {order.status !== "completed" && (
                            <Button size="sm" variant="outline">
                              Update Status
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button size="sm" className="bg-primary hover:bg-primary/90">
                              Mark Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Announcements
            </CardTitle>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => setIsAnnouncementDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell>{ann.title}</TableCell>
                    <TableCell className="max-w-sm truncate">{ann.message}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ann.priority === "normal"
                            ? "bg-gray-100 text-gray-800"
                            : ann.priority === "important"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {ann.priority.charAt(0).toUpperCase() + ann.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{ann.targetAudience}</TableCell>
                    <TableCell>{ann.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAnnouncement(ann);
                            setNewAnnouncement({
                              title: ann.title,
                              message: ann.message,
                              priority: ann.priority,
                              targetAudience: ann.targetAudience,
                            });
                            setIsEditAnnouncementOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the announcement.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Announcement Dialog */}
      <Dialog
        open={isAnnouncementDialogOpen}
        onOpenChange={setIsAnnouncementDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Announcement</DialogTitle>
            <DialogDescription>
              Create a new announcement for your bakery staff or customers
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-6 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleAddAnnouncement();
            }}
          >
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={newAnnouncement.title}
                onChange={(e) => {
                  setAnnouncementError("");
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value });
                }}
                className="w-full"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={newAnnouncement.message}
                onChange={(e) => {
                  setAnnouncementError("");
                  setNewAnnouncement({ ...newAnnouncement, message: e.target.value });
                }}
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <Select
                value={newAnnouncement.priority}
                onValueChange={(value) =>
                  {
                    setAnnouncementError("");
                    setNewAnnouncement({ ...newAnnouncement, priority: value as "normal" | "important" | "urgent" });
                  }
                }
              >
                <SelectTrigger id="announcement-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="announcement-target-audience">Target Audience</Label>
              <Select
                value={newAnnouncement.targetAudience}
                onValueChange={(value) =>
                  {
                    setAnnouncementError("");
                    setNewAnnouncement({ ...newAnnouncement, targetAudience: value });
                  }
                }
              >
                <SelectTrigger id="announcement-target-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="bakers">Bakers</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {announcementError && (
              <p className="text-sm text-red-600">{announcementError}</p>
            )}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAnnouncementDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 gap-2"
                disabled={!canSubmitAnnouncement || announcementSaving}
              >
                <Plus className="w-4 h-4" />
                {announcementSaving ? "Adding..." : "Add Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog
        open={isEditAnnouncementOpen}
        onOpenChange={setIsEditAnnouncementOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the selected announcement
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-6 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleEditAnnouncement();
            }}
          >
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={newAnnouncement.title}
                onChange={(e) => {
                  setEditAnnouncementError("");
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value });
                }}
                className="w-full"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={newAnnouncement.message}
                onChange={(e) => {
                  setEditAnnouncementError("");
                  setNewAnnouncement({ ...newAnnouncement, message: e.target.value });
                }}
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <Select
                value={newAnnouncement.priority}
                onValueChange={(value) =>
                  {
                    setEditAnnouncementError("");
                    setNewAnnouncement({ ...newAnnouncement, priority: value as "normal" | "important" | "urgent" });
                  }
                }
              >
                <SelectTrigger id="announcement-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="announcement-target-audience">Target Audience</Label>
              <Select
                value={newAnnouncement.targetAudience}
                onValueChange={(value) =>
                  {
                    setEditAnnouncementError("");
                    setNewAnnouncement({ ...newAnnouncement, targetAudience: value });
                  }
                }
              >
                <SelectTrigger id="announcement-target-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="bakers">Bakers</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editAnnouncementError && (
              <p className="text-sm text-red-600">{editAnnouncementError}</p>
            )}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditAnnouncementOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 gap-2"
                disabled={!canSubmitAnnouncement || editAnnouncementSaving}
              >
                <Edit className="w-4 h-4" />
                {editAnnouncementSaving ? "Updating..." : "Update Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog
        open={isReportPreviewOpen}
        onOpenChange={(open) => {
          setIsReportPreviewOpen(open);
          if (open) setTimeout(() => reportScrollRef.current?.focus(), 120);
        }}
      >
        <DialogContent className="flex h-[min(92dvh,900px)] max-h-[calc(100dvh-2rem)] w-[min(1120px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
          <div className="flex-shrink-0 border-b bg-background/95 px-5 py-4 pr-12 backdrop-blur">
            <DialogHeader>
              <DialogTitle className="text-xl">Report Preview</DialogTitle>
              <DialogDescription className="text-sm">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} report for {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div
            ref={reportScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-4 [scrollbar-gutter:stable] sm:px-6 sm:py-6 outline-none"
            style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "auto" }}
            tabIndex={0}
          >
            <div id="report-preview-root">
              <ReportPreview
                reportType={reportType}
                dateRange={dateRange}
                sections={selectedReportSections}
                generatedBy={authUser?.displayName || authUser?.email || "Admin"}
                generatedAt={lastReportGeneratedAt ?? new Date()}
                onDataReady={setReportExportData}
              />
            </div>
          </div>

          <div className="flex-shrink-0 border-t bg-background/95 px-5 py-4 backdrop-blur">
            <DialogFooter className="gap-2 sm:items-center">
              <Button
                variant="outline"
                onClick={handlePrintReport}
                className="gap-2 sm:min-w-36"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadReport}
                className="gap-2 sm:min-w-44"
              >
                <Download className="w-4 h-4" />
                Download {reportFormat.toUpperCase()}
              </Button>
              <Button
                onClick={() => setIsReportPreviewOpen(false)}
                className="sm:min-w-24"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
