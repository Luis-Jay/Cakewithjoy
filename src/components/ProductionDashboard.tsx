import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Package,
  Clock,
  CheckCircle,
  User,
  Calendar,
  ChevronRight,
  Cake,
  MessageSquare,
} from "lucide-react";

interface Order {
  id: string;
  customer: string;
  salesAgent: string;
  cakeType: string;
  size: string;
  flavor: string;
  specialRequirements: string;
  deliveryDate: Date;
  total: string;
  orderDate: Date;
  theme?: string;
}

// Production stages - these ARE the statuses
type ProductionStage = "pending" | "in-production" | "quality-check" | "ready" | "completed";

interface OrderWithStage extends Order {
  stage: ProductionStage;
}

// Mock orders with production stages
const MOCK_PRODUCTION_ORDERS: OrderWithStage[] = [
  {
    id: "#12345",
    customer: "Sarah Johnson",
    salesAgent: "Sales 1",
    cakeType: "Fondant Wedding Cake",
    size: '3-Tier (10"x6" + 8"x6" + 6"x6")',
    flavor: "Vanilla with Raspberry Filling",
    specialRequirements: "White and gold color scheme, fresh flowers on top",
    deliveryDate: new Date(2026, 1, 15),
    total: "₱11,000",
    orderDate: new Date(2026, 1, 5),
    theme: "Wedding Elegance",
    stage: "pending",
  },
  {
    id: "#12346",
    customer: "Mike Chen",
    salesAgent: "Sales 2",
    cakeType: "Birthday Celebration",
    size: '8"x4"',
    flavor: "Chocolate Fudge",
    specialRequirements: "Happy Birthday message, number 7 candle",
    deliveryDate: new Date(2026, 1, 14),
    total: "₱1,800",
    orderDate: new Date(2026, 1, 7),
    theme: "Birthday",
    stage: "in-production",
  },
  {
    id: "#12347",
    customer: "Emily Davis",
    salesAgent: "Sales 1",
    cakeType: "Red Velvet Romance",
    size: '8"x4"',
    flavor: "Red Velvet with Cream Cheese",
    specialRequirements: "Heart-shaped decoration, rose petals",
    deliveryDate: new Date(2026, 1, 18),
    total: "₱2,000",
    orderDate: new Date(2026, 1, 10),
    stage: "in-production",
  },
  {
    id: "#12348",
    customer: "James Wilson",
    salesAgent: "Sales 3",
    cakeType: "Naked Cake",
    size: '2-Tier (8"x4" + 6"x4")',
    flavor: "Lemon with Blueberry",
    specialRequirements: "Minimal decoration, fresh berries",
    deliveryDate: new Date(2026, 1, 20),
    total: "₱6,500",
    orderDate: new Date(2026, 1, 8),
    stage: "quality-check",
  },
  {
    id: "#12349",
    customer: "Lisa Anderson",
    salesAgent: "Sales 2",
    cakeType: "Ube Delight",
    size: '8"x4"',
    flavor: "Ube with Coconut Cream",
    specialRequirements: "Purple gradient frosting",
    deliveryDate: new Date(2026, 1, 22),
    total: "₱1,900",
    orderDate: new Date(2026, 1, 12),
    stage: "quality-check",
  },
  {
    id: "#12350",
    customer: "David Brown",
    salesAgent: "Sales 1",
    cakeType: "Chocolate Dream",
    size: '6"x4"',
    flavor: "Triple Chocolate",
    specialRequirements: "Extra chocolate ganache",
    deliveryDate: new Date(2026, 1, 25),
    total: "₱1,700",
    orderDate: new Date(2026, 1, 15),
    stage: "ready",
  },
  {
    id: "#12351",
    customer: "Anna Martinez",
    salesAgent: "Sales 3",
    cakeType: "Fondant Birthday",
    size: '1-Tier (8"x6")',
    flavor: "Strawberry Shortcake",
    specialRequirements: "Princess theme with edible glitter",
    deliveryDate: new Date(2026, 1, 16),
    total: "₱5,400",
    orderDate: new Date(2026, 1, 6),
    theme: "Birthday",
    stage: "ready",
  },
  {
    id: "#12340",
    customer: "Robert Lee",
    salesAgent: "Sales 2",
    cakeType: "Naked Cake",
    size: '1-Tier (8"x4")',
    flavor: "Carrot Cake with Cream Cheese",
    specialRequirements: "Walnut topping",
    deliveryDate: new Date(2026, 1, 10),
    total: "₱3,500",
    orderDate: new Date(2026, 1, 1),
    stage: "completed",
  },
];

const STAGE_CONFIG = {
  pending: {
    title: "New Orders",
    color: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    icon: Package,
  },
  "in-production": {
    title: "In Production",
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  "quality-check": {
    title: "Quality Check",
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    icon: CheckCircle,
  },
  ready: {
    title: "Ready for Pickup",
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  completed: {
    title: "Completed",
    color: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
  },
};

export function ProductionDashboard() {
  const [orders, setOrders] = useState<OrderWithStage[]>(MOCK_PRODUCTION_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithStage | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const getOrdersByStage = (stage: ProductionStage) => {
    return orders.filter((order) => order.stage === stage);
  };

  const moveToNextStage = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const stages: ProductionStage[] = ["pending", "in-production", "quality-check", "ready", "completed"];
          const currentIndex = stages.indexOf(order.stage);
          const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : order.stage;
          return { ...order, stage: nextStage };
        }
        return order;
      })
    );
  };

  const handleCardClick = (order: OrderWithStage) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  // Calculate stats
  const stats = [
    {
      label: "New Orders",
      value: getOrdersByStage("pending").length,
      icon: Package,
      color: "text-yellow-600",
    },
    {
      label: "In Production",
      value: getOrdersByStage("in-production").length,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Quality Check",
      value: getOrdersByStage("quality-check").length,
      icon: CheckCircle,
      color: "text-purple-600",
    },
    {
      label: "Ready",
      value: getOrdersByStage("ready").length,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Production Dashboard</h1>
        <p className="text-muted-foreground">
          Track and manage cake production workflow
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {(["pending", "in-production", "quality-check", "ready", "completed"] as ProductionStage[]).map(
          (stage) => {
            const config = STAGE_CONFIG[stage];
            const stageOrders = getOrdersByStage(stage);
            const StageIcon = config.icon;

            return (
              <div key={stage} className="flex flex-col">
                {/* Column Header */}
                <Card className={`mb-4 ${config.color} border-2`}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="w-5 h-5" />
                        <CardTitle className="text-base">{config.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stageOrders.length}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Order Cards */}
                <div className="space-y-3 flex-1">
                  {stageOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                      onClick={() => handleCardClick(order)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Order Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-xs text-muted-foreground mb-1">
                              {order.id}
                            </p>
                            <p className="font-semibold">{order.customer}</p>
                          </div>
                          <Badge className={config.badge} variant="secondary">
                            {config.title.split(" ")[0]}
                          </Badge>
                        </div>

                        {/* Cake Details */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Cake className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium">{order.cakeType}</p>
                              <p className="text-xs text-muted-foreground">{order.size}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">{order.salesAgent}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              Due: {order.deliveryDate.toLocaleDateString()}
                            </span>
                          </div>

                          {order.specialRequirements && (
                            <div className="flex items-start gap-2 text-sm">
                              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {order.specialRequirements}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Total */}
                        <div className="pt-2 border-t flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">
                            {order.total}
                          </span>
                          {stage !== "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToNextStage(order.id);
                              }}
                              className="h-7 px-2"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {stageOrders.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">No orders</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Complete order information and production specifications
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={STAGE_CONFIG[selectedOrder.stage].badge} variant="secondary">
                  {STAGE_CONFIG[selectedOrder.stage].title}
                </Badge>
                {selectedOrder.stage !== "completed" && (
                  <Button
                    onClick={() => {
                      moveToNextStage(selectedOrder.id);
                      setShowOrderDialog(false);
                    }}
                    className="gap-2"
                  >
                    Move to Next Stage
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Customer & Sales Info */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-semibold">{selectedOrder.customer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sales Agent</p>
                      <p className="font-semibold">{selectedOrder.salesAgent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p>{selectedOrder.orderDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Date</p>
                      <p className="font-semibold text-primary">
                        {selectedOrder.deliveryDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cake Specifications */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Cake Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Cake Type</p>
                    <p className="font-semibold">{selectedOrder.cakeType}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p>{selectedOrder.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flavor</p>
                      <p>{selectedOrder.flavor}</p>
                    </div>
                  </div>
                  {selectedOrder.theme && (
                    <div>
                      <p className="text-sm text-muted-foreground">Theme</p>
                      <p>{selectedOrder.theme}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Special Requirements</p>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <p className="text-sm">{selectedOrder.specialRequirements}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-2 border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      {selectedOrder.total}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
