import { useState } from "react";
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
  Bell,
  Printer,
} from "lucide-react";
import { ReportPreview } from "./ReportPreview";
import { toast } from "sonner@2.0.3";

interface Announcement {
  id: number;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  targetAudience: string;
  date: string;
  postedBy: string;
}

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
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
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    priority: "normal" as "normal" | "important" | "urgent",
    targetAudience: "all",
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Holiday Schedule Update",
      message: "The bakery will be closed on December 25th for Christmas. Please plan your orders accordingly.",
      priority: "important",
      targetAudience: "All Staff",
      date: "Dec 1, 2025",
      postedBy: "Admin",
    },
    {
      id: 2,
      title: "New Equipment Training",
      message: "Mandatory training session for the new industrial oven will be held on Dec 15th at 9:00 AM.",
      priority: "urgent",
      targetAudience: "Bakers",
      date: "Nov 28, 2025",
      postedBy: "Admin",
    },
    {
      id: 3,
      title: "Customer Feedback Reminder",
      message: "Please remember to ask customers for feedback after each order completion. This helps us improve our service.",
      priority: "normal",
      targetAudience: "Customer Service",
      date: "Nov 25, 2025",
      postedBy: "Admin",
    },
  ]);

  const stats = [
    { label: "Pending Orders", value: "8", icon: Package, color: "text-orange-500" },
    { label: "Completed Today", value: "12", icon: CheckCircle, color: "text-green-500" },
    { label: "Low Stock Items", value: "3", icon: AlertCircle, color: "text-red-500" },
    { label: "Today's Revenue", value: "₱69,720", icon: DollarSign, color: "text-primary" },
  ];

  const orders = [
    {
      id: "#12345",
      customer: "Sarah Johnson",
      status: "baking",
      date: "Nov 11, 2025",
      total: "₱2,570.00",
      paymentRef: "PAY-2025-001",
    },
    {
      id: "#12344",
      customer: "Mike Chen",
      status: "ready",
      date: "Nov 11, 2025",
      total: "₱7,000.00",
      paymentRef: "PAY-2025-002",
    },
    {
      id: "#12343",
      customer: "Emily Davis",
      status: "completed",
      date: "Nov 10, 2025",
      total: "₱2,180.00",
      paymentRef: "PAY-2025-003",
    },
    {
      id: "#12342",
      customer: "James Wilson",
      status: "pending",
      date: "Nov 11, 2025",
      total: "₱2,940.00",
      paymentRef: "PAY-2025-004",
    },
    {
      id: "#12341",
      customer: "Lisa Anderson",
      status: "baking",
      date: "Nov 11, 2025",
      total: "₱3,800.00",
      paymentRef: "PAY-2025-005",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      baking: { label: "Baking", className: "bg-blue-100 text-blue-800" },
      ready: { label: "Ready", className: "bg-green-100 text-green-800" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800" },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const handleGenerateReport = () => {
    // Simulate report generation
    console.log("Generating report:", {
      type: reportType,
      format: reportFormat,
      dateRange: { from: dateRange.from, to: dateRange.to },
      sections: selectedReportSections,
    });
    
    // Close configuration dialog and open report preview
    setIsReportDialogOpen(false);
    setIsReportPreviewOpen(true);
    
    // Show success toast
    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
  };

  const handleAddAnnouncement = () => {
    const newId = announcements.length > 0 ? announcements[announcements.length - 1].id + 1 : 1;
    const newAnnouncementWithId = {
      ...newAnnouncement,
      id: newId,
      date: new Date().toLocaleDateString(),
      postedBy: "Admin",
    };
    setAnnouncements([...announcements, newAnnouncementWithId]);
    setNewAnnouncement({
      title: "",
      message: "",
      priority: "normal" as "normal" | "important" | "urgent",
      targetAudience: "all",
    });
    setIsAnnouncementDialogOpen(false);
  };

  const handleEditAnnouncement = () => {
    if (selectedAnnouncement) {
      const updatedAnnouncements = announcements.map((ann) =>
        ann.id === selectedAnnouncement.id ? { ...ann, ...newAnnouncement } : ann
      );
      setAnnouncements(updatedAnnouncements);
      setIsEditAnnouncementOpen(false);
    }
  };

  const handleDeleteAnnouncement = (id: number) => {
    const updatedAnnouncements = announcements.filter((ann) => ann.id !== id);
    setAnnouncements(updatedAnnouncements);
  };

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
                    <Label>Select Date Range</Label>
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
                        {dateRange.to ? dateRange.to.toLocaleDateString() : "..."}
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
                <p>Nov 1, 2025</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Growth</p>
                <p className="text-green-600">+12.5%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-muted-foreground">Reports Generated</p>
                <p>24 this month</p>
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
                  <SelectItem value="baking">Baking</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableHead>Payment Ref</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{order.paymentRef}</span>
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
                ))}
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

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={newAnnouncement.message}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <Select
                value={newAnnouncement.priority}
                onValueChange={(value) =>
                  setNewAnnouncement({ ...newAnnouncement, priority: value as "normal" | "important" | "urgent" })
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
                  setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={handleAddAnnouncement}
              disabled={!newAnnouncement.title || !newAnnouncement.message}
            >
              <Plus className="w-4 h-4" />
              Add Announcement
            </Button>
          </DialogFooter>
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

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={newAnnouncement.message}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <Select
                value={newAnnouncement.priority}
                onValueChange={(value) =>
                  setNewAnnouncement({ ...newAnnouncement, priority: value as "normal" | "important" | "urgent" })
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
                  setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditAnnouncementOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={handleEditAnnouncement}
              disabled={!newAnnouncement.title || !newAnnouncement.message}
            >
              <Edit className="w-4 h-4" />
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog
        open={isReportPreviewOpen}
        onOpenChange={setIsReportPreviewOpen}
      >
        <DialogContent className="max-w-[98vw] w-full max-h-[98vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <DialogHeader>
              <DialogTitle className="text-lg">Report Preview</DialogTitle>
              <DialogDescription className="text-sm">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} report for {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4">
            <ReportPreview
              reportType={reportType}
              dateRange={dateRange}
              sections={selectedReportSections}
            />
          </div>

          <div className="sticky bottom-0 z-10 bg-background border-t px-4 py-3">
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Simulate printing
                  window.print();
                }}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Simulate download
                  toast.success(`Report downloaded as ${reportFormat.toUpperCase()}`);
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download {reportFormat.toUpperCase()}
              </Button>
              <Button
                onClick={() => setIsReportPreviewOpen(false)}
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