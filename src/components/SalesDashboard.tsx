import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Package,
  DollarSign,
  CheckCircle,
  Calendar as CalendarIcon,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface Order {
  id: string;
  customer: string;
  cakeType: string;
  size: string;
  total: number;
  salesAgent: string;
  status: "confirmed" | "pending" | "completed" | "baking" | "ready" | "declined" | "quality_check";
  orderDate: Date;
  deliveryDate: Date;
  paymentRef: string;
}

const SALES_AGENT_STORAGE_KEY = "sales-dashboard:selected-agent";
const SALES_MONTH_STORAGE_KEY = "sales-dashboard:selected-month";
const DEFAULT_AGENT = "All Sales";
type FirebaseRecord = Record<string, unknown>;

const getInitialMonth = () => {
  if (typeof window === "undefined") return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const saved = window.localStorage.getItem(SALES_MONTH_STORAGE_KEY);
  if (!saved) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const parsed = new Date(saved);
  if (Number.isNaN(parsed.getTime())) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
};

const getInitialAgent = () => {
  if (typeof window === "undefined") return DEFAULT_AGENT;
  return window.localStorage.getItem(SALES_AGENT_STORAGE_KEY) || DEFAULT_AGENT;
};

const getAgentName = (value: FirebaseRecord | null | undefined, fallback: string) =>
  (typeof value?.name === "string" && value.name.trim()) ||
  (typeof value?.fullName === "string" && value.fullName.trim()) ||
  (typeof value?.full_name === "string" && value.full_name.trim()) ||
  (typeof value?.email === "string" && value.email.trim()) ||
  fallback;

export function SalesDashboard() {
  const [currentDate, setCurrentDate] = useState(getInitialMonth);
  const [selectedSalesAgent, setSelectedSalesAgent] = useState(getInitialAgent);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<"sales" | "staff" | "inventory" | null>(null);

  // Real data from Firebase
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<{ uid: string; name: string; role: string; isActive: boolean }[]>([]);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; batches: { quantity: number; expirationDate: string }[]; lowStockThreshold: number; unit: string }[]>([]);

  useEffect(() => {
    const unsubStaff = onValue(ref(db, "users"), (snap) => {
      const data = snap.val();
      if (!data) { setStaffList([]); return; }
      setStaffList(
        Object.entries(data as FirebaseRecord)
          .map(([uid, rawValue]) => {
            const value = (rawValue ?? {}) as FirebaseRecord;
            return {
            uid,
            name: getAgentName(value, uid),
            role: typeof value.role === "string" ? value.role : "",
            isActive:
              typeof value.isActive === "boolean"
                ? value.isActive
                : typeof value.is_active === "boolean"
                  ? value.is_active
                  : true,
          };
          })
          .filter((staff) => staff.role === "sales")
      );
    });
    const unsubOrders = onValue(ref(db, "allOrders"), (snap) => {
      const data = snap.val();
      if (!data) {
        setOrders([]);
        setCompletedOrdersCount(0);
        return;
      }
      const list = Object.entries(data as FirebaseRecord).map(([id, rawValue]) => {
        const value = (rawValue ?? {}) as FirebaseRecord;
        const firstItem =
          Array.isArray(value.items) && value.items.length > 0 && typeof value.items[0] === "object"
            ? (value.items[0] as FirebaseRecord)
            : null;
        return {
          id,
          customer: typeof value.customerName === "string" ? value.customerName : "Unknown Customer",
          cakeType:
            (typeof value.cakeType === "string" && value.cakeType) ||
            (typeof firstItem?.name === "string" && firstItem.name) ||
            "Custom Cake",
          size:
            (typeof value.size === "string" && value.size) ||
            (typeof firstItem?.size === "string" && firstItem.size) ||
            "Custom",
          total: Number(value.total ?? value.subtotal ?? 0),
          salesAgent:
            typeof value.salesAgent === "string" && value.salesAgent.trim() ? value.salesAgent.trim() : "Unassigned",
          status: (typeof value.status === "string" ? value.status : "pending") as Order["status"],
          orderDate: typeof value.createdAt === "string" ? new Date(value.createdAt) : new Date(),
          deliveryDate: typeof value.pickupDate === "string" ? new Date(value.pickupDate) : new Date(),
          paymentRef:
            (typeof value.paymentRef === "string" && value.paymentRef) ||
            (typeof value.paymentReference === "string" && value.paymentReference) ||
            "N/A",
        };
      });
      setOrders(list);
      setCompletedOrdersCount(list.filter((order) => order.status === "completed").length);
    });
    const unsubInventory = onValue(ref(db, "inventory"), (snap) => {
      const data = snap.val();
      if (!data) { setInventoryItems([]); return; }
      setInventoryItems(
        Object.entries(data as FirebaseRecord).map(([id, rawValue]) => {
          const value = (rawValue ?? {}) as FirebaseRecord;
          return {
            id,
            name: typeof value.name === "string" ? value.name : "",
            batches:
              value.batches && typeof value.batches === "object"
                ? (Object.values(value.batches as FirebaseRecord) as { quantity: number; expirationDate: string }[])
                : [],
            lowStockThreshold: Number(value.lowStockThreshold ?? 0),
            unit: typeof value.unit === "string" ? value.unit : "",
          };
        })
      );
    });
    return () => { unsubStaff(); unsubOrders(); unsubInventory(); };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SALES_MONTH_STORAGE_KEY, currentDate.toISOString());
  }, [currentDate]);

  const salesAgentOptions = [
    DEFAULT_AGENT,
    ...Array.from(
      new Set([
        ...staffList.filter((staff) => staff.isActive).map((staff) => staff.name),
        ...orders
          .map((order) => order.salesAgent)
          .filter((agent) => agent && agent !== DEFAULT_AGENT),
      ])
    ),
  ];

  const activeSalesAgent = salesAgentOptions.includes(selectedSalesAgent)
    ? selectedSalesAgent
    : (salesAgentOptions[0] ?? DEFAULT_AGENT);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SALES_AGENT_STORAGE_KEY, activeSalesAgent);
  }, [activeSalesAgent]);

  // Filter orders by sales agent
  const getOrdersForSalesAgent = (agent: string) => {
    return orders.filter((order) => agent === DEFAULT_AGENT || order.salesAgent === agent);
  };

  // Get orders for a specific date
  const getOrdersForDate = (date: Date, agent: string) => {
    return orders.filter(
      (order) =>
        (agent === DEFAULT_AGENT || order.salesAgent === agent) &&
        order.orderDate.getDate() === date.getDate() &&
        order.orderDate.getMonth() === date.getMonth() &&
        order.orderDate.getFullYear() === date.getFullYear()
    );
  };

  // Get all confirmed orders for calendar display
  const getConfirmedOrdersForDate = (date: Date, agent: string) => {
    return orders.filter(
      (order) =>
        (agent === DEFAULT_AGENT || order.salesAgent === agent) &&
        order.status !== "declined" &&
        order.orderDate.getDate() === date.getDate() &&
        order.orderDate.getMonth() === date.getMonth() &&
        order.orderDate.getFullYear() === date.getFullYear()
    );
  };

  // Calculate weekly summaries
  const getWeeklySummary = (agent: string) => {
    const weeks = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weekStart = new Date(firstDay);
    let weekNum = 1;
    
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const ordersInWeek = orders.filter((order) => {
        return (
          (agent === DEFAULT_AGENT || order.salesAgent === agent) &&
          order.status !== "declined" &&
          order.orderDate >= weekStart &&
          order.orderDate <= weekEnd
        );
      });
      
      weeks.push({
        weekNum,
        start: new Date(weekStart),
        end: weekEnd > lastDay ? lastDay : weekEnd,
        orderCount: ordersInWeek.length,
        totalRevenue: ordersInWeek.reduce((sum, order) => sum + order.total, 0),
      });
      
      weekStart.setDate(weekStart.getDate() + 7);
      weekNum++;
    }
    
    return weeks;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowOrdersDialog(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const calendarDays = generateCalendarDays();
  const weeklySummaries = getWeeklySummary(activeSalesAgent);
  const agentOrders = getOrdersForSalesAgent(activeSalesAgent);
  
  // Calculate stats for current sales agent
  const confirmedOrders = agentOrders.filter((o) => o.status === "confirmed").length;
  const totalRevenue = agentOrders
    .filter((o) => o.status !== "declined")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          Track sales performance and manage orders by sales agent
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Total Orders</p>
                <h2>{agentOrders.length}</h2>
              </div>
              <div className="p-3 bg-muted rounded-lg text-orange-500">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Confirmed</p>
                <h2>{confirmedOrders}</h2>
              </div>
              <div className="p-3 bg-muted rounded-lg text-green-500">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Total Revenue</p>
                <h2>₱{totalRevenue.toLocaleString()}</h2>
              </div>
              <div className="p-3 bg-muted rounded-lg text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Active Agents</p>
                <h2>{salesAgentOptions.filter((agent) => agent !== DEFAULT_AGENT).length}</h2>
              </div>
              <div className="p-3 bg-muted rounded-lg text-blue-500">
                <User className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Reports Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generate Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Generate comprehensive PDF reports for sales, staff performance, and inventory tracking.
            <span className="text-orange-600 ml-1">(Placeholder - To be clarified with client)</span>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sales Report */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-1">Sales Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive sales performance and revenue analysis
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Monthly sales breakdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Sales agent performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Revenue trends & insights</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      setSelectedReportType("sales");
                      setShowReportPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => alert("PDF download placeholder - To be implemented")}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Staff Report */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-1">Staff Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Staff performance metrics and productivity analysis
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Staff attendance records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Task completion rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Performance evaluations</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      setSelectedReportType("staff");
                      setShowReportPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => alert("PDF download placeholder - To be implemented")}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Report */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-1">Inventory Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Stock levels, usage patterns, and restock alerts
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Current stock levels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Low stock alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Expiration tracking</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      setSelectedReportType("inventory");
                      setShowReportPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => alert("PDF download placeholder - To be implemented")}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Sales Agent Tabs */}
      <Tabs value={activeSalesAgent} onValueChange={setSelectedSalesAgent} className="space-y-6">
        <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${Math.max(salesAgentOptions.length, 1)}, minmax(0, 1fr))` }}>
          {salesAgentOptions.map((agent) => (
            <TabsTrigger key={agent} value={agent} className="gap-2">
              <User className="w-4 h-4" />
              {agent}
            </TabsTrigger>
          ))}
        </TabsList>

        {salesAgentOptions.map((agent) => (
          <TabsContent key={agent} value={agent} className="space-y-6">
            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Weekly Summary - {agent}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklySummaries.map((week) => (
                    <div
                      key={week.weekNum}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-primary">Week {week.weekNum}</p>
                          <p className="text-xs text-muted-foreground">
                            {week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                            {week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                          <p className="text-sm text-muted-foreground">Orders</p>
                          <p className="text-xl font-semibold">{week.orderCount}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-xl font-semibold text-primary">
                          ₱{week.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {weeklySummaries.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No confirmed orders this month
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Order Calendar - {monthName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousMonth}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMonth}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const ordersOnDate = getConfirmedOrdersForDate(date, agent);
                    const hasOrders = ordersOnDate.length > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => hasOrders && handleDateClick(date)}
                        className={`
                          aspect-square border rounded-lg p-2 text-left transition-all
                          ${hasOrders 
                            ? "border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer" 
                            : "border-border hover:bg-muted/50"
                          }
                        `}
                      >
                        <div className="text-sm font-semibold mb-1">
                          {date.getDate()}
                        </div>
                        {hasOrders && (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {ordersOnDate.length} order{ordersOnDate.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary bg-primary/10 rounded" />
                    <span>Has orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-border rounded" />
                    <span>No orders</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Orders - {agent}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Cake Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.cakeType}</TableCell>
                          <TableCell>{order.size}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                        <TableCell>
                          {order.orderDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">₱{order.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                      
                      {agentOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No orders found for {agent}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Orders for {selectedDate?.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </DialogTitle>
            <DialogDescription>
              Orders for {activeSalesAgent} on this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedDate &&
              getOrdersForDate(selectedDate, activeSalesAgent).map((order) => (
                <Card key={order.id} className="border-2">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-mono font-semibold">{order.id}</p>
                      </div>
                      <Badge
                        className={
                          order.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-semibold">{order.customer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sales Agent</p>
                        <p className="font-semibold">{order.salesAgent}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cake Type</p>
                        <p>{order.cakeType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p>{order.size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Date</p>
                        <p>{order.deliveryDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Reference</p>
                        <p className="font-mono text-sm">{order.paymentRef}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t flex items-center justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="text-xl font-semibold text-primary">₱{order.total.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {selectedDate && getOrdersForDate(selectedDate, activeSalesAgent).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No orders found for this date
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedReportType === "sales" && "Sales Report Preview"}
              {selectedReportType === "staff" && "Staff Report Preview"}
              {selectedReportType === "inventory" && "Inventory Report Preview"}
            </DialogTitle>
            <DialogDescription>
              Preview report layout before exporting to PDF
              <span className="text-orange-600 ml-2">(Placeholder - To be clarified with client)</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Report Header Placeholder */}
            <Card className="border-2 border-dashed">
              <CardContent className="p-8">
                <div className="text-center space-y-2">
                  <h2 className="text-primary">Cake with Joy Bakery</h2>
                  <h3>
                    {selectedReportType === "sales" && "Sales Performance Report"}
                    {selectedReportType === "staff" && "Staff Performance Report"}
                    {selectedReportType === "inventory" && "Inventory Status Report"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Report Period: {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated on: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Report Content Placeholder */}
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedReportType === "sales" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                        <p className="text-2xl font-semibold">{agentOrders.length}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Confirmed Orders</p>
                        <p className="text-2xl font-semibold">{confirmedOrders}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-2xl font-semibold">₱{totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Sales by Agent:</p>
                      <div className="space-y-2">
                        {salesAgentOptions.filter((agent) => agent !== DEFAULT_AGENT).map((agent) => {
                          const agentData = getOrdersForSalesAgent(agent);
                          const agentRevenue = agentData
                            .filter((o) => o.status !== "declined")
                            .reduce((sum, o) => sum + o.total, 0);
                          return (
                            <div key={agent} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                              <span className="font-medium">{agent}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">{agentData.length} orders</span>
                                <span className="font-semibold">₱{agentRevenue.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {selectedReportType === "staff" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
                        <p className="text-2xl font-semibold">{staffList.length}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Active Staff</p>
                        <p className="text-2xl font-semibold">{staffList.filter((s) => s.isActive).length}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Completed Orders</p>
                        <p className="text-2xl font-semibold">{completedOrdersCount}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Staff Members:</p>
                      {staffList.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No staff records found.</p>
                      ) : (
                        <div className="space-y-2">
                          {staffList.filter((s) => s.isActive).map((s) => (
                            <div key={s.uid} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                              <span className="font-medium">{s.name}</span>
                              <Badge className="bg-blue-100 text-blue-800 capitalize">{s.role}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedReportType === "inventory" && (() => {
                  const now = new Date();
                  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const lowStockItems = inventoryItems.filter((item) => {
                    const total = item.batches.reduce((s, b) => s + (b.quantity ?? 0), 0);
                    return total <= item.lowStockThreshold;
                  });
                  const expiringSoonItems = inventoryItems.filter((item) =>
                    item.batches.some((b) => {
                      if (!b.expirationDate) return false;
                      const expirationDate = new Date(b.expirationDate);
                      if (Number.isNaN(expirationDate.getTime())) return false;
                      return expirationDate <= in30Days && expirationDate >= now;
                    })
                  );
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                          <p className="text-2xl font-semibold">{inventoryItems.length}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Low Stock Items</p>
                          <p className={`text-2xl font-semibold ${lowStockItems.length > 0 ? "text-red-600" : ""}`}>{lowStockItems.length}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Expiring Soon</p>
                          <p className={`text-2xl font-semibold ${expiringSoonItems.length > 0 ? "text-orange-600" : ""}`}>{expiringSoonItems.length}</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Critical Items:</p>
                        {lowStockItems.length === 0 && expiringSoonItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">All items are well-stocked.</p>
                        ) : (
                          <div className="space-y-2">
                            {lowStockItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                                <span className="font-medium">{item.name}</span>
                                <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                              </div>
                            ))}
                            {expiringSoonItems
                              .filter((item) => !lowStockItems.find((l) => l.id === item.id))
                              .map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                                  <span className="font-medium">{item.name}</span>
                                  <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Report Footer Placeholder */}
            <Card className="border-2 border-dashed">
              <CardContent className="p-6">
                <div className="text-center text-sm text-muted-foreground">
                  <p>This is a preview of the report layout.</p>
                  <p>Actual implementation requires client approval and specifications.</p>
                  <p className="mt-2 font-medium text-orange-600">
                    Report generation features to be finalized with client requirements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowReportPreview(false)}
              >
                Close Preview
              </Button>
              <Button 
                className="gap-2"
                onClick={() => {
                  alert("PDF export placeholder - To be implemented");
                  setShowReportPreview(false);
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
