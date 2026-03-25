import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Calendar,
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  AlertCircle,
  Filter,
  Users,
  TrendingUp,
  Move,
  Eye,
  User,
  Phone,
} from "lucide-react";

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  cakeDetails: {
    name: string;
    flavor: string;
    size: string;
    icing: string;
    message: string;
    servings: string;
    image: string;
  };
  status: "pending" | "baking" | "ready" | "completed";
  date: string;
  pickupDate: string;
  pickupTime: string;
  priority: "high" | "medium" | "low";
  assignedStaff?: string;
  productionTime: number; // in hours
  timeSlot?: string;
}

interface DraggableOrderCardProps {
  order: Order;
  onOrderClick: (order: Order) => void;
}

interface TimeSlotProps {
  date: string;
  timeSlot: string;
  orders: Order[];
  onDrop: (order: Order, date: string, timeSlot: string) => void;
}

const DraggableOrderCard = ({ order, onOrderClick }: DraggableOrderCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ORDER",
    item: order,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
      baking: "bg-blue-100 border-blue-300 text-blue-800",
      ready: "bg-green-100 border-green-300 text-green-800",
      completed: "bg-gray-100 border-gray-300 text-gray-800",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-red-100 text-red-800",
      medium: "bg-orange-100 text-orange-800",
      low: "bg-blue-100 text-blue-800",
    };
    return variants[priority as keyof typeof variants] || variants.low;
  };

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${getStatusColor(
        order.status
      )}`}
      onClick={() => onOrderClick(order)}
    >
      <div className="flex items-start gap-2 mb-2">
        <Move className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{order.id}</p>
          <p className="text-sm truncate">{order.customer.name}</p>
        </div>
        <Badge className={`${getPriorityBadge(order.priority)} text-xs`}>
          {order.priority}
        </Badge>
      </div>
      <p className="text-sm truncate mb-1">{order.cakeDetails.name}</p>
      <div className="flex items-center gap-2 text-xs">
        <Clock className="w-3 h-3" />
        <span>{order.pickupTime}</span>
        {order.assignedStaff && (
          <>
            <span>•</span>
            <span>{order.assignedStaff}</span>
          </>
        )}
      </div>
    </div>
  );
};

const TimeSlot = ({ date, timeSlot, orders, onDrop }: TimeSlotProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ORDER",
    drop: (item: Order) => onDrop(item, date, timeSlot),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getWorkloadColor = () => {
    const totalHours = orders.reduce((sum, order) => sum + order.productionTime, 0);
    if (totalHours === 0) return "bg-white";
    if (totalHours <= 4) return "bg-green-50";
    if (totalHours <= 8) return "bg-yellow-50";
    return "bg-red-50";
  };

  const totalProductionTime = orders.reduce((sum, order) => sum + order.productionTime, 0);

  return (
    <div
      ref={drop}
      className={`min-h-[100px] p-2 rounded-lg border-2 border-dashed transition-all ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      } ${getWorkloadColor()}`}
    >
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="text-xs p-2 bg-white rounded border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{order.id}</span>
              <Badge
                className={`text-xs ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "baking"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "ready"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status}
              </Badge>
            </div>
            <p className="truncate text-muted-foreground">{order.customer.name}</p>
            <p className="text-xs text-muted-foreground">{order.productionTime}h</p>
          </div>
        ))}
      </div>
      {totalProductionTime > 0 && (
        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
          Total: {totalProductionTime}h
        </div>
      )}
    </div>
  );
};

export function ProductionSchedule() {
  const [selectedDate, setSelectedDate] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "#12345",
      customer: {
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phone: "(555) 123-4567",
      },
      cakeDetails: {
        name: "Custom Birthday Cake",
        flavor: "Vanilla",
        size: "Medium (8 inch)",
        icing: "Buttercream",
        message: "Happy Birthday Sarah!",
        servings: "12-15",
        image:
          "https://images.unsplash.com/photo-1741969494307-55394e3e4071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNha2UlMjBkZWNvcmF0ZWR8ZW58MXx8fHwxNzYyODI5ODQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      status: "baking",
      date: "Dec 2, 2025",
      pickupDate: "Dec 3, 2025",
      pickupTime: "2:00 PM",
      priority: "high",
      assignedStaff: "Maria",
      productionTime: 3,
      timeSlot: "morning",
    },
    {
      id: "#12344",
      customer: {
        name: "Mike Chen",
        email: "mike.chen@email.com",
        phone: "(555) 234-5678",
      },
      cakeDetails: {
        name: "Wedding Celebration Cake",
        flavor: "Red Velvet",
        size: "Large (10 inch)",
        icing: "Fondant",
        message: "Congratulations Mike & Lisa",
        servings: "20-25",
        image:
          "https://images.unsplash.com/photo-1584158531319-96912adae663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FrZSUyMGVsZWdhbnR8ZW58MXx8fHwxNzYyODIwMjM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      status: "ready",
      date: "Dec 1, 2025",
      pickupDate: "Dec 4, 2025",
      pickupTime: "4:00 PM",
      priority: "high",
      assignedStaff: "Carlos",
      productionTime: 6,
      timeSlot: "afternoon",
    },
    {
      id: "#12343",
      customer: {
        name: "Emily Davis",
        email: "emily.davis@email.com",
        phone: "(555) 345-6789",
      },
      cakeDetails: {
        name: "Chocolate Dream Cake",
        flavor: "Chocolate",
        size: "Small (6 inch)",
        icing: "Ganache",
        message: "Enjoy!",
        servings: "6-8",
        image:
          "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzYyODI5ODQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      status: "pending",
      date: "Dec 2, 2025",
      pickupDate: "Dec 2, 2025",
      pickupTime: "10:00 AM",
      priority: "medium",
      assignedStaff: "Anna",
      productionTime: 2,
    },
    {
      id: "#12342",
      customer: {
        name: "James Wilson",
        email: "james.wilson@email.com",
        phone: "(555) 456-7890",
      },
      cakeDetails: {
        name: "Strawberry Delight",
        flavor: "Strawberry",
        size: "Medium (8 inch)",
        icing: "Whipped Cream",
        message: "Happy Anniversary",
        servings: "12-15",
        image:
          "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZXxlbnwxfHx8fDE3NjI4MzA0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      status: "pending",
      date: "Dec 3, 2025",
      pickupDate: "Dec 5, 2025",
      pickupTime: "5:00 PM",
      priority: "low",
      assignedStaff: "Maria",
      productionTime: 3,
      timeSlot: "evening",
    },
  ]);

  const handleDrop = (order: Order, date: string, timeSlot: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === order.id ? { ...o, pickupDate: date, timeSlot } : o
      )
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    const matchesStaff = staffFilter === "all" || order.assignedStaff === staffFilter;
    return matchesStatus && matchesPriority && matchesStaff;
  });

  const dates = ["Dec 2, 2025", "Dec 3, 2025", "Dec 4, 2025", "Dec 5, 2025", "Dec 6, 2025"];
  const timeSlots = [
    { id: "morning", label: "Morning (6AM-12PM)", hours: "6:00 - 12:00" },
    { id: "afternoon", label: "Afternoon (12PM-6PM)", hours: "12:00 - 18:00" },
    { id: "evening", label: "Evening (6PM-10PM)", hours: "18:00 - 22:00" },
  ];

  const getOrdersForSlot = (date: string, timeSlot: string) => {
    return filteredOrders.filter(
      (order) => order.pickupDate === date && order.timeSlot === timeSlot
    );
  };

  const unscheduledOrders = filteredOrders.filter((order) => !order.timeSlot);

  const totalOrders = filteredOrders.length;
  const pendingCount = filteredOrders.filter((o) => o.status === "pending").length;
  const bakingCount = filteredOrders.filter((o) => o.status === "baking").length;
  const readyCount = filteredOrders.filter((o) => o.status === "ready").length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-2">Production & Scheduling</h1>
            <p className="text-muted-foreground">
              Manage production workflow with drag-and-drop scheduling
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">Total Orders</p>
                    <p className="text-primary">{totalOrders}</p>
                  </div>
                  <Package className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">Pending</p>
                    <p className="text-yellow-600">{pendingCount}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">In Production</p>
                    <p className="text-blue-600">{bakingCount}</p>
                  </div>
                  <ChefHat className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">Ready</p>
                    <p className="text-green-600">{readyCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="baking">In Production</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="Maria">Maria</SelectItem>
                    <SelectItem value="Carlos">Carlos</SelectItem>
                    <SelectItem value="Anna">Anna</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setViewMode("calendar")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setViewMode("timeline")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Timeline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Unscheduled Orders Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-secondary/20 to-primary/20">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Unscheduled
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag orders to schedule
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {unscheduledOrders.length > 0 ? (
                    unscheduledOrders.map((order) => (
                      <DraggableOrderCard
                        key={order.id}
                        order={order}
                        onOrderClick={setSelectedOrder}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>All orders scheduled!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Production Calendar */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="bg-gradient-to-r from-secondary/20 to-primary/20">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Production Schedule
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Workload visualization by date and time slot
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-6 gap-3 mb-3">
                        <div className="font-medium text-sm text-muted-foreground">
                          Time Slot
                        </div>
                        {dates.map((date) => (
                          <div key={date} className="text-center">
                            <p className="font-medium">{date.split(",")[0]}</p>
                            <p className="text-xs text-muted-foreground">
                              {date.split(",")[1]}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Time Slots */}
                      {timeSlots.map((slot) => (
                        <div key={slot.id} className="grid grid-cols-6 gap-3 mb-3">
                          <div className="flex flex-col justify-center">
                            <p className="font-medium text-sm">{slot.label.split("(")[0]}</p>
                            <p className="text-xs text-muted-foreground">{slot.hours}</p>
                          </div>
                          {dates.map((date) => (
                            <TimeSlot
                              key={`${date}-${slot.id}`}
                              date={date}
                              timeSlot={slot.id}
                              orders={getOrdersForSlot(date, slot.id)}
                              onDrop={handleDrop}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <Separator className="my-4" />
                  <div className="flex items-center gap-4 text-sm">
                    <p className="text-muted-foreground">Workload:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-50 border border-border rounded" />
                      <span>Light (≤4h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-50 border border-border rounded" />
                      <span>Moderate (5-8h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-50 border border-border rounded" />
                      <span>Heavy (8h+)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order {selectedOrder?.id} - Details</DialogTitle>
              <DialogDescription>
                Complete order information and production details
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 pt-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={selectedOrder.cakeDetails.image}
                    alt={selectedOrder.cakeDetails.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-2">Cake Details</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{selectedOrder.cakeDetails.name}</p>
                      <p>Flavor: {selectedOrder.cakeDetails.flavor}</p>
                      <p>Size: {selectedOrder.cakeDetails.size}</p>
                      <p>Icing: {selectedOrder.cakeDetails.icing}</p>
                      <p>Servings: {selectedOrder.cakeDetails.servings}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2">Customer & Schedule</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {selectedOrder.customer.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {selectedOrder.customer.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {selectedOrder.pickupDate}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {selectedOrder.pickupTime}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Production Time
                    </p>
                    <p className="text-primary">
                      {selectedOrder.productionTime} hours
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Assigned Staff
                    </p>
                    <p>{selectedOrder.assignedStaff || "Unassigned"}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <Badge
                      className={
                        selectedOrder.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : selectedOrder.priority === "medium"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {selectedOrder.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
