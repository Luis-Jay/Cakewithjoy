import { useState } from "react";
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
  total: string;
  salesAgent: string;
  status: "confirmed" | "pending" | "completed";
  orderDate: Date;
  deliveryDate: Date;
  paymentRef: string;
}

// Mock orders data
const MOCK_ORDERS: Order[] = [
  {
    id: "#12345",
    customer: "Sarah Johnson",
    cakeType: "Fondant Wedding Cake",
    size: '3-Tier',
    total: "₱11,000",
    salesAgent: "Sales 1",
    status: "confirmed",
    orderDate: new Date(2026, 1, 5),
    deliveryDate: new Date(2026, 1, 15),
    paymentRef: "PAY-2026-001",
  },
  {
    id: "#12346",
    customer: "Mike Chen",
    cakeType: "Birthday Celebration",
    size: '8"x4"',
    total: "₱1,800",
    salesAgent: "Sales 2",
    status: "confirmed",
    orderDate: new Date(2026, 1, 7),
    deliveryDate: new Date(2026, 1, 14),
    paymentRef: "PAY-2026-002",
  },
  {
    id: "#12347",
    customer: "Emily Davis",
    cakeType: "Chocolate Dream",
    size: '8"x4"',
    total: "₱2,000",
    salesAgent: "Sales 1",
    status: "confirmed",
    orderDate: new Date(2026, 1, 10),
    deliveryDate: new Date(2026, 1, 18),
    paymentRef: "PAY-2026-003",
  },
  {
    id: "#12348",
    customer: "James Wilson",
    cakeType: "Naked Cake",
    size: '2-Tier',
    total: "₱6,500",
    salesAgent: "Sales 3",
    status: "confirmed",
    orderDate: new Date(2026, 1, 8),
    deliveryDate: new Date(2026, 1, 20),
    paymentRef: "PAY-2026-004",
  },
  {
    id: "#12349",
    customer: "Lisa Anderson",
    cakeType: "Red Velvet Romance",
    size: '8"x4"',
    total: "₱1,900",
    salesAgent: "Sales 2",
    status: "confirmed",
    orderDate: new Date(2026, 1, 12),
    deliveryDate: new Date(2026, 1, 22),
    paymentRef: "PAY-2026-005",
  },
  {
    id: "#12350",
    customer: "David Brown",
    cakeType: "Ube Delight",
    size: '6"x4"',
    total: "₱1,700",
    salesAgent: "Sales 1",
    status: "confirmed",
    orderDate: new Date(2026, 1, 15),
    deliveryDate: new Date(2026, 1, 25),
    paymentRef: "PAY-2026-006",
  },
  {
    id: "#12351",
    customer: "Anna Martinez",
    cakeType: "Fondant Birthday",
    size: '1-Tier (8"x6")',
    total: "₱5,400",
    salesAgent: "Sales 3",
    status: "confirmed",
    orderDate: new Date(2026, 1, 6),
    deliveryDate: new Date(2026, 1, 16),
    paymentRef: "PAY-2026-007",
  },
];

export function SalesDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026
  const [selectedSalesAgent, setSelectedSalesAgent] = useState("Sales 1");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<"sales" | "staff" | "inventory" | null>(null);

  // Filter orders by sales agent
  const getOrdersForSalesAgent = (agent: string) => {
    return MOCK_ORDERS.filter((order) => order.salesAgent === agent);
  };

  // Get orders for a specific date
  const getOrdersForDate = (date: Date, agent: string) => {
    return MOCK_ORDERS.filter(
      (order) =>
        order.salesAgent === agent &&
        order.orderDate.getDate() === date.getDate() &&
        order.orderDate.getMonth() === date.getMonth() &&
        order.orderDate.getFullYear() === date.getFullYear()
    );
  };

  // Get all confirmed orders for calendar display
  const getConfirmedOrdersForDate = (date: Date, agent: string) => {
    return MOCK_ORDERS.filter(
      (order) =>
        order.salesAgent === agent &&
        order.status === "confirmed" &&
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
    
    let weekStart = new Date(firstDay);
    let weekNum = 1;
    
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const ordersInWeek = MOCK_ORDERS.filter((order) => {
        return (
          order.salesAgent === agent &&
          order.status === "confirmed" &&
          order.orderDate >= weekStart &&
          order.orderDate <= weekEnd
        );
      });
      
      weeks.push({
        weekNum,
        start: new Date(weekStart),
        end: weekEnd > lastDay ? lastDay : weekEnd,
        orderCount: ordersInWeek.length,
        totalRevenue: ordersInWeek.reduce((sum, order) => {
          return sum + parseFloat(order.total.replace(/[₱,]/g, ""));
        }, 0),
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
  const weeklySummaries = getWeeklySummary(selectedSalesAgent);
  const agentOrders = getOrdersForSalesAgent(selectedSalesAgent);
  
  // Calculate stats for current sales agent
  const confirmedOrders = agentOrders.filter((o) => o.status === "confirmed").length;
  const totalRevenue = agentOrders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, order) => sum + parseFloat(order.total.replace(/[₱,]/g, "")), 0);

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
                <h2>{MOCK_ORDERS.length}</h2>
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
                <h2>3</h2>
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
      <Tabs value={selectedSalesAgent} onValueChange={setSelectedSalesAgent} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Sales 1" className="gap-2">
            <User className="w-4 h-4" />
            Sales 1
          </TabsTrigger>
          <TabsTrigger value="Sales 2" className="gap-2">
            <User className="w-4 h-4" />
            Sales 2
          </TabsTrigger>
          <TabsTrigger value="Sales 3" className="gap-2">
            <User className="w-4 h-4" />
            Sales 3
          </TabsTrigger>
        </TabsList>

        {["Sales 1", "Sales 2", "Sales 3"].map((agent) => (
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
                          <p className="text-sm text-muted-foreground">Confirmed Orders</p>
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
                    <span>Has confirmed orders</span>
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
                          <TableCell className="font-semibold">{order.total}</TableCell>
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
              Confirmed orders for {selectedSalesAgent} on this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedDate &&
              getOrdersForDate(selectedDate, selectedSalesAgent).map((order) => (
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
                      <span className="text-xl font-semibold text-primary">{order.total}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {selectedDate && getOrdersForDate(selectedDate, selectedSalesAgent).length === 0 && (
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
                        <p className="text-2xl font-semibold">{MOCK_ORDERS.length}</p>
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
                        {["Sales 1", "Sales 2", "Sales 3"].map((agent) => {
                          const agentData = getOrdersForSalesAgent(agent);
                          const agentRevenue = agentData
                            .filter((o) => o.status === "confirmed")
                            .reduce((sum, o) => sum + parseFloat(o.total.replace(/[₱,]/g, "")), 0);
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
                        <p className="text-2xl font-semibold">12</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Avg. Attendance</p>
                        <p className="text-2xl font-semibold">95%</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
                        <p className="text-2xl font-semibold">248</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Top Performers:</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Maria Santos</span>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Juan Dela Cruz</span>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Anna Reyes</span>
                          <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedReportType === "inventory" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                        <p className="text-2xl font-semibold">45</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Low Stock Items</p>
                        <p className="text-2xl font-semibold text-red-600">8</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Expiring Soon</p>
                        <p className="text-2xl font-semibold text-orange-600">3</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Critical Items:</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Unsalted Butter</span>
                          <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Heavy Cream</span>
                          <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                          <span className="font-medium">Cocoa Powder</span>
                          <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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