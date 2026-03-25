import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { CheckCircle2, Clock, Package, Truck, MapPin } from "lucide-react";

export function OrderTracking() {
  const order = {
    id: "#12345",
    date: "Nov 10, 2025",
    status: "baking",
    progress: 60,
    items: [
      { name: "Custom Birthday Cake", flavor: "Vanilla", size: "Medium (8 inch)", quantity: 1 },
    ],
    total: "₱2,450.00",
    paid: "₱1,225.00",
    balance: "₱1,225.00",
    pickupDate: "Nov 12, 2025",
    pickupTime: "2:00 PM",
  };

  const statusSteps = [
    { id: "received", label: "Order Received", icon: CheckCircle2, completed: true },
    { id: "baking", label: "Baking", icon: Clock, completed: true },
    { id: "ready", label: "Ready for Pickup", icon: Package, completed: false },
    { id: "completed", label: "Completed", icon: CheckCircle2, completed: false },
  ];

  const updates = [
    { time: "10:30 AM", message: "Your cake is now baking in our ovens" },
    { time: "9:15 AM", message: "Order confirmed and being prepared" },
    { time: "9:00 AM", message: "Order received" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Monitor the progress of your custom cake order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order {order.id}</CardTitle>
                <Badge className="bg-secondary text-secondary-foreground">In Progress</Badge>
              </div>
              <p className="text-muted-foreground">Placed on {order.date}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <h4>{item.name}</h4>
                    <p className="text-muted-foreground">Flavor: {item.flavor}</p>
                    <p className="text-muted-foreground">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{order.total}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span>Paid</span>
                <span className="text-primary">{order.paid}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span>Balance</span>
                <span className="text-primary">{order.balance}</span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Progress value={order.progress} className="h-3" />
                <p className="text-center text-muted-foreground">
                  {order.progress}% Complete
                </p>
              </div>

              {/* Status Steps */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`text-center space-y-2 ${
                        step.completed ? "opacity-100" : "opacity-40"
                      }`}
                    >
                      <div
                        className={`inline-flex p-3 rounded-full ${
                          step.completed
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={step.completed ? "" : "text-muted-foreground"}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {index < updates.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className="text-muted-foreground mb-1">{update.time}</p>
                      <p>{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pickup Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="mb-1">Cake with Joy</p>
                    <p className="text-muted-foreground">123 Bakery Lane</p>
                    <p className="text-muted-foreground">New York, NY 10001</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="mb-1">Scheduled Pickup</p>
                    <p className="text-muted-foreground">{order.pickupDate}</p>
                    <p className="text-muted-foreground">{order.pickupTime}</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Get Directions
              </Button>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Have questions about your order? Our team is here to help.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full">
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}