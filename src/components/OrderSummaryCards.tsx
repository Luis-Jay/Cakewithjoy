import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
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
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  ChefHat,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Percent,
} from "lucide-react";

type UserRole = "baker" | "sales" | "admin";

export function OrderSummaryCards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("admin");

  const orders = [
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
        image: "https://images.unsplash.com/photo-1741969494307-55394e3e4071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNha2UlMjBkZWNvcmF0ZWR8ZW58MXx8fHwxNzYyODI5ODQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      ingredients: [
        { name: "All-Purpose Flour", quantity: "2.5 cups", cost: 70.00 },
        { name: "Granulated Sugar", quantity: "2 cups", cost: 85.00 },
        { name: "Unsalted Butter", quantity: "1 cup", cost: 180.00 },
        { name: "Eggs (Large)", quantity: "4 eggs", cost: 110.00 },
        { name: "Vanilla Extract", quantity: "2 tsp", cost: 100.00 },
        { name: "Whole Milk", quantity: "1 cup", cost: 48.00 },
        { name: "Baking Powder", quantity: "2 tsp", cost: 22.00 },
        { name: "Powdered Sugar (icing)", quantity: "4 cups", cost: 110.00 },
        { name: "Heavy Cream", quantity: "1/2 cup", cost: 85.00 },
        { name: "Food Coloring (Pink)", quantity: "1 bottle", cost: 140.00 },
      ],
      pricing: {
        ingredientCost: 950.00,
        laborCost: 840.00,
        overheadCost: 500.00,
        totalCost: 2290.00,
        sellingPrice: 2570.00,
        discountType: null,
        discountAmount: 0,
        finalPrice: 2570.00,
        profit: 280.00,
        profitMargin: "10.9%",
      },
      status: "baking",
      date: "Nov 11, 2025",
      pickupDate: "Nov 12, 2025",
      pickupTime: "2:00 PM",
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
        image: "https://images.unsplash.com/photo-1584158531319-96912adae663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FrZSUyMGVsZWdhbnR8ZW58MXx8fHwxNzYyODIwMjM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      ingredients: [
        { name: "All-Purpose Flour", quantity: "3.5 cups", cost: 98.00 },
        { name: "Granulated Sugar", quantity: "3 cups", cost: 128.00 },
        { name: "Unsalted Butter", quantity: "1.5 cups", cost: 270.00 },
        { name: "Eggs (Large)", quantity: "6 eggs", cost: 165.00 },
        { name: "Cocoa Powder", quantity: "1/4 cup", cost: 67.00 },
        { name: "Red Food Coloring", quantity: "2 bottles", cost: 280.00 },
        { name: "Buttermilk", quantity: "1.5 cups", cost: 118.00 },
        { name: "Cream Cheese", quantity: "16 oz", cost: 252.00 },
        { name: "Fondant", quantity: "2 lbs", cost: 672.00 },
        { name: "Powdered Sugar", quantity: "6 cups", cost: 168.00 },
        { name: "Vanilla Extract", quantity: "1 tbsp", cost: 151.00 },
      ],
      pricing: {
        ingredientCost: 2369.00,
        laborCost: 1960.00,
        overheadCost: 1271.00,
        totalCost: 5600.00,
        sellingPrice: 7000.00,
        discountType: "Senior Citizen",
        discountAmount: 700.00,
        finalPrice: 6300.00,
        profit: 700.00,
        profitMargin: "11.1%",
      },
      status: "ready",
      date: "Nov 10, 2025",
      pickupDate: "Nov 13, 2025",
      pickupTime: "4:00 PM",
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
        image: "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzYyODI5ODQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      ingredients: [
        { name: "All-Purpose Flour", quantity: "1.5 cups", cost: 42.00 },
        { name: "Granulated Sugar", quantity: "1.5 cups", cost: 63.50 },
        { name: "Cocoa Powder", quantity: "3/4 cup", cost: 201.00 },
        { name: "Eggs (Large)", quantity: "3 eggs", cost: 83.00 },
        { name: "Vegetable Oil", quantity: "1/2 cup", cost: 45.00 },
        { name: "Whole Milk", quantity: "3/4 cup", cost: 36.00 },
        { name: "Baking Soda", quantity: "1.5 tsp", cost: 11.00 },
        { name: "Dark Chocolate", quantity: "8 oz", cost: 252.00 },
        { name: "Heavy Cream", quantity: "1 cup", cost: 168.00 },
      ],
      pricing: {
        ingredientCost: 901.50,
        laborCost: 672.00,
        overheadCost: 328.50,
        totalCost: 1902.00,
        sellingPrice: 2180.00,
        discountType: "PWD",
        discountAmount: 218.00,
        finalPrice: 1962.00,
        profit: 60.00,
        profitMargin: "3.1%",
      },
      status: "completed",
      date: "Nov 10, 2025",
      pickupDate: "Nov 11, 2025",
      pickupTime: "10:00 AM",
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
        image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZXxlbnwxfHx8fDE3NjI4MzA0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      ingredients: [
        { name: "All-Purpose Flour", quantity: "2.5 cups", cost: 70.00 },
        { name: "Granulated Sugar", quantity: "2 cups", cost: 85.00 },
        { name: "Unsalted Butter", quantity: "1 cup", cost: 180.00 },
        { name: "Eggs (Large)", quantity: "4 eggs", cost: 110.00 },
        { name: "Fresh Strawberries", quantity: "2 cups", cost: 280.00 },
        { name: "Strawberry Extract", quantity: "1 tsp", cost: 84.00 },
        { name: "Whole Milk", quantity: "1 cup", cost: 48.00 },
        { name: "Heavy Whipping Cream", quantity: "2 cups", cost: 336.00 },
        { name: "Powdered Sugar", quantity: "1/2 cup", cost: 28.00 },
      ],
      pricing: {
        ingredientCost: 1221.00,
        laborCost: 840.00,
        overheadCost: 599.00,
        totalCost: 2660.00,
        sellingPrice: 2940.00,
        discountType: null,
        discountAmount: 0,
        finalPrice: 2940.00,
        profit: 280.00,
        profitMargin: "9.5%",
      },
      status: "pending",
      date: "Nov 11, 2025",
      pickupDate: "Nov 14, 2025",
      pickupTime: "5:00 PM",
    },
    {
      id: "#12341",
      customer: {
        name: "Lisa Martinez",
        email: "lisa.martinez@email.com",
        phone: "(555) 567-8901",
      },
      cakeDetails: {
        name: "Anniversary Special",
        flavor: "Tiramisu",
        size: "Medium (8 inch)",
        icing: "Cream Cheese",
        message: "Happy 10th Anniversary",
        servings: "12-15",
        image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJyb3QlMjBjYWtlfGVufDF8fHx8MTc2MjgzMDMwMnww&ixlib=rb-4.1.0&q=80&w=1080",
      },
      ingredients: [
        { name: "All-Purpose Flour", quantity: "2 cups", cost: 56.00 },
        { name: "Granulated Sugar", quantity: "1.5 cups", cost: 64.00 },
        { name: "Mascarpone Cheese", quantity: "16 oz", cost: 420.00 },
        { name: "Eggs (Large)", quantity: "6 eggs", cost: 165.00 },
        { name: "Espresso Powder", quantity: "2 tbsp", cost: 112.00 },
        { name: "Heavy Cream", quantity: "2 cups", cost: 336.00 },
        { name: "Cocoa Powder", quantity: "1/4 cup", cost: 67.00 },
      ],
      pricing: {
        ingredientCost: 1220.00,
        laborCost: 980.00,
        overheadCost: 560.00,
        totalCost: 2760.00,
        sellingPrice: 3200.00,
        discountType: null,
        discountAmount: 0,
        finalPrice: 3200.00,
        profit: 440.00,
        profitMargin: "13.8%",
      },
      status: "picked-up",
      date: "Nov 9, 2025",
      pickupDate: "Nov 10, 2025",
      pickupTime: "3:00 PM",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      preparing: { label: "Preparing", className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      baking: { label: "Baking", className: "bg-orange-100 text-orange-800 border-orange-300", icon: ChefHat },
      ready: { label: "Ready for Pick-up", className: "bg-green-100 text-green-800 border-green-300", icon: Package },
      "picked-up": { label: "Picked-up", className: "bg-gray-100 text-gray-800 border-gray-300", icon: CheckCircle },
    };
    const variant = variants[status] || variants.preparing;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.className} gap-1 border-2`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.cakeDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Order Summary Cards</h1>
        <p className="text-muted-foreground">
          Role-based order tracking with color-coded information for staff efficiency
        </p>
      </div>

      {/* Role Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">View as:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={userRole === "baker" ? "default" : "outline"}
            onClick={() => setUserRole("baker")}
            className={userRole === "baker" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Baker
          </Button>
          <Button
            variant={userRole === "sales" ? "default" : "outline"}
            onClick={() => setUserRole("sales")}
            className={userRole === "sales" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Sales Staff
          </Button>
          <Button
            variant={userRole === "admin" ? "default" : "outline"}
            onClick={() => setUserRole("admin")}
            className={userRole === "admin" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, or cakes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-secondary/20 to-primary/20 pb-3 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-1">Order {order.id}</CardTitle>
                  <p className="text-muted-foreground">{order.date}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Cake Design & Details - Visible to ALL */}
              <div className="grid grid-cols-3 gap-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-purple-200">
                  <ImageWithFallback
                    src={order.cakeDetails.image}
                    alt={order.cakeDetails.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-2 space-y-1 text-muted-foreground">
                  <p className="mb-1">{order.cakeDetails.name}</p>
                  <p>{order.cakeDetails.flavor} • {order.cakeDetails.size}</p>
                  <p>{order.cakeDetails.icing} • Serves {order.cakeDetails.servings}</p>
                  {order.cakeDetails.message && (
                    <p className="text-muted-foreground italic">"{order.cakeDetails.message}"</p>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              {/* BAKER VIEW - Orange Color-Coded */}
              {(userRole === "baker" || userRole === "admin") && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-orange-700">
                    <ChefHat className="w-4 h-4" />
                    Ingredients Needed
                  </h4>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-1 text-orange-900">
                      {order.ingredients.slice(0, 5).map((ingredient, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{ingredient.name}</span>
                          <span className="font-medium">{ingredient.quantity}</span>
                        </div>
                      ))}
                      {order.ingredients.length > 5 && (
                        <p className="pt-1 text-center text-orange-600">
                          +{order.ingredients.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SALES VIEW - Green Color-Coded */}
              {(userRole === "sales" || userRole === "admin") && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-4 h-4" />
                    Pricing & Discounts
                  </h4>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <div className="space-y-2 text-green-900">
                      <div className="flex justify-between">
                        <span>Selling Price:</span>
                        <span className="font-medium">₱{order.pricing.sellingPrice.toFixed(2)}</span>
                      </div>
                      
                      {order.pricing.discountType && (
                        <>
                          <div className="flex justify-between items-center text-green-700">
                            <span className="flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              {order.pricing.discountType} Discount:
                            </span>
                            <span className="font-medium">-₱{order.pricing.discountAmount.toFixed(2)}</span>
                          </div>
                          <Separator className="bg-green-300" />
                        </>
                      )}
                      
                      <div className="flex justify-between items-center font-semibold">
                        <span>Final Price:</span>
                        <span className="text-lg text-green-700">₱{order.pricing.finalPrice.toFixed(2)}</span>
                      </div>
                      
                      {userRole === "admin" && (
                        <>
                          <Separator className="bg-green-300" />
                          <div className="flex justify-between text-sm">
                            <span>Profit:</span>
                            <span className={order.pricing.profit > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              ₱{order.pricing.profit.toFixed(2)} ({order.pricing.profitMargin})
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN-ONLY VIEW - Blue Color-Coded */}
              {userRole === "admin" && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                    Cost Breakdown (Admin Only)
                  </h4>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                    <div className="space-y-1 text-blue-900 text-sm">
                      <div className="flex justify-between">
                        <span>Ingredient Cost:</span>
                        <span>₱{order.pricing.ingredientCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span>₱{order.pricing.laborCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overhead Cost:</span>
                        <span>₱{order.pricing.overheadCost.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-blue-300 my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Total Cost:</span>
                        <span>₱{order.pricing.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Details - Visible to ALL */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Customer & Pickup Info
                </h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{order.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${order.customer.phone}`} className="hover:text-primary transition-colors">
                      {order.customer.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Pickup: {order.pickupDate} at {order.pickupTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Order {order.id} - Full Details</DialogTitle>
                      <DialogDescription>
                        Complete order information including all specifications and costs
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                      {/* Full details content */}
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <ImageWithFallback
                          src={order.cakeDetails.image}
                          alt={order.cakeDetails.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="mb-2">Cake Specifications</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <p>Name: {order.cakeDetails.name}</p>
                            <p>Flavor: {order.cakeDetails.flavor}</p>
                            <p>Size: {order.cakeDetails.size}</p>
                            <p>Icing: {order.cakeDetails.icing}</p>
                            <p>Servings: {order.cakeDetails.servings}</p>
                            {order.cakeDetails.message && (
                              <p className="pt-2 italic">Message: "{order.cakeDetails.message}"</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="mb-2">Customer & Pickup</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <p>{order.customer.name}</p>
                            <p>{order.customer.email}</p>
                            <p>{order.customer.phone}</p>
                            <p className="pt-2">Pickup: {order.pickupDate}</p>
                            <p>Time: {order.pickupTime}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="mb-2">Complete Ingredient List</h4>
                        <div className="border border-border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                          {order.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex justify-between text-muted-foreground">
                              <span>{ingredient.name}</span>
                              <div className="flex gap-4">
                                <span>{ingredient.quantity}</span>
                                <span className="w-16 text-right">₱{ingredient.cost.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="mb-2">Financial Breakdown</h4>
                        <div className="border border-border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Ingredient Cost:</span>
                            <span>₱{order.pricing.ingredientCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Labor Cost:</span>
                            <span>₱{order.pricing.laborCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Overhead Cost:</span>
                            <span>₱{order.pricing.overheadCost.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <span>₱{order.pricing.totalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Selling Price:</span>
                            <span className="text-primary">₱{order.pricing.sellingPrice.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span>Net Profit:</span>
                            <span className={order.pricing.profit > 0 ? "text-green-600" : "text-red-600"}>
                              ₱{order.pricing.profit.toFixed(2)} ({order.pricing.profitMargin})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {order.status !== "completed" && (
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    Update
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3>No Orders Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}