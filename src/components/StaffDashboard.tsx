import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Package,
  Clock,
  CheckCircle,
  Bell,
  TrendingUp,
  Calendar,
  Users,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";

export function StaffDashboard() {
  const [todayStats] = useState({
    assignedOrders: 5,
    completedOrders: 12,
    pendingTasks: 3,
    upcomingDeadlines: 2,
  });

  const [myOrders] = useState([
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
  ]);

  const [recentAnnouncements] = useState([
    {
      id: 1,
      title: "Holiday Schedule Update",
      priority: "important",
      date: "Dec 1, 2025",
    },
    {
      id: 2,
      title: "New Equipment Training",
      priority: "urgent",
      date: "Nov 28, 2025",
    },
  ]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      baking: { label: "Baking", className: "bg-blue-100 text-blue-800" },
      ready: { label: "Ready", className: "bg-green-100 text-green-800" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-800" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const stats = [
    {
      label: "Assigned Today",
      value: todayStats.assignedOrders.toString(),
      icon: Package,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      label: "Completed Today",
      value: todayStats.completedOrders.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Pending Tasks",
      value: todayStats.pendingTasks.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Urgent Deadlines",
      value: todayStats.upcomingDeadlines.toString(),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your overview for today
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
                  <div className={`p-3 ${stat.bgColor} rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                My Orders
              </CardTitle>
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
                    {myOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.total}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            {order.paymentRef}
                          </span>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm">{ann.title}</p>
                      <Badge
                        className={
                          ann.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {ann.priority === "urgent" ? "🔴" : "🟡"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ann.date}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm">Orders Completed</span>
                  </div>
                  <span>48</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm">Customers Served</span>
                  </div>
                  <span>35</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm">Performance</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">Team Meeting</p>
                    <p className="text-xs text-muted-foreground">9:00 AM - 9:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">Morning Batch</p>
                    <p className="text-xs text-muted-foreground">10:00 AM - 12:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">Afternoon Batch</p>
                    <p className="text-xs text-muted-foreground">2:00 PM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
