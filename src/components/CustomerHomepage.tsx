import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Cake,
  Package,
  Menu,
  Phone,
  Upload,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { useRef } from "react";

interface CustomerHomepageProps {
  onNavigate?: (view: string, options?: { autoOpenUpload?: boolean }) => void;
}

export function CustomerHomepage({ onNavigate }: CustomerHomepageProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const featuredCakes = [
    {
      id: 1,
      name: "Birthday Celebration",
      image: "https://images.unsplash.com/photo-1741969494307-55394e3e4071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNha2UlMjBkZWNvcmF0ZWR8ZW58MXx8fHwxNzYyODI5ODQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,200",
    },
    {
      id: 2,
      name: "Chocolate Dream",
      image: "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzYyODI5ODQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,500",
    },
    {
      id: 3,
      name: "Wedding Elegance",
      image: "https://images.unsplash.com/photo-1584158531319-96912adae663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2FrZSUyMGVsZWdhbnR8ZW58MXx8fHwxNzYyODIwMjM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱2,500",
    },
    {
      id: 4,
      name: "Cupcake Delights",
      image: "https://images.unsplash.com/photo-1680580735621-4371027734eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXBjYWtlcyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2Mjc4NTU3NXww&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱800",
    },
    {
      id: 5,
      name: "Strawberry Delight",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZXxlbnwxfHx8fDE3NjI4MzAyNTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,400",
    },
    {
      id: 6,
      name: "Red Velvet Romance",
      image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB2ZWx2ZXQlMjBjYWtlfGVufDF8fHx8MTc2MjgzMDI3MHww&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,600",
    },
    {
      id: 7,
      name: "Vanilla Classic",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YW5pbGxhJTIwY2FrZXxlbnwxfHx8fDE3NjI4MzAyODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,000",
    },
    {
      id: 8,
      name: "Carrot Cake Special",
      image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJyb3QlMjBjYWtlfGVufDF8fHx8MTc2MjgzMDMwMnww&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,300",
    },
    {
      id: 9,
      name: "Lemon Bliss",
      image: "https://images.unsplash.com/photo-1519915212116-7cfef71f1d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZW1vbiUyMGNha2V8ZW58MXx8fHwxNzYyODMwMzE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,100",
    },
    {
      id: 10,
      name: "Caramel Heaven",
      image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJhbWVsJTIwY2FrZXxlbnwxfHx8fDE3NjI4MzAzMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      price: "₱1,700",
    },
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary/20 to-primary/20 rounded-xl p-8 md:p-12">
        <div className="max-w-2xl">
          <h1 className="mb-4">Welcome to Cake with Joy</h1>
          <p className="text-muted-foreground mb-6">
            Create custom cakes for every occasion. Upload your design or let our bakers create
            something special just for you.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onNavigate?.("customize")}>
            Start Customizing <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Cake Customization Shortcut */}
      <section>
        <Card className="border-2 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate?.("customize")}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Cake className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>Customize Your Cake</CardTitle>
                <CardDescription>
                  Upload an image or design your own cake with our interactive tool
                </CardDescription>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigate?.("customize", { autoOpenUpload: true }); }}>
                <Upload className="w-4 h-4" />
                Upload Design
              </Button>
              <Button variant="outline" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigate?.("menu"); }}>Choose Template</Button>
              <Button variant="outline" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigate?.("customize"); }}>Build from Scratch</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Track My Order */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle>Track My Order</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Order #12345</span>
                <span className="text-muted-foreground">Baking in progress</span>
              </div>
              <Progress value={60} className="h-2" />
              <div className="flex justify-between text-muted-foreground">
                <span>Order Received</span>
                <span>Baking</span>
                <span>Ready</span>
                <span>Completed</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Full Details
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Promotions / Featured Cakes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>Featured Cakes</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={scrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={scrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredCakes.map((cake) => (
              <Card key={cake.id} className="flex-shrink-0 w-[280px] overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={cake.image}
                    alt={cake.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="mb-2">{cake.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-primary">{cake.price}</span>
                    <Button size="sm" variant="outline">
                      Order Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h4>Place Order</h4>
              <p className="text-muted-foreground">Browse our menu and place a new order</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Menu className="w-6 h-6 text-primary" />
              </div>
              <h4>View Menu</h4>
              <p className="text-muted-foreground">Explore our full range of delicious treats</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h4>Contact Bakery</h4>
              <p className="text-muted-foreground">Get in touch for special requests</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}