import React from "react";
import { Login } from "./components/Login";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CustomerHomepage } from "./components/CustomerHomepage";
import { CakeCustomization } from "./components/CakeCustomization";
import { ReadyMadeCakes } from "./components/ReadyMadeCakes";
import { OrderTracking } from "./components/OrderTracking";
import { SalesDashboard } from "./components/SalesDashboard";
import { InventoryManagement } from "./components/InventoryManagement";
import { OrderSummaryCards } from "./components/OrderSummaryCards";
import { StaffManagement } from "./components/StaffManagement";
import { StaffAnnouncements } from "./components/StaffAnnouncements";
import { ProductionDashboard } from "./components/ProductionDashboard";
import { ProductionSchedule } from "./components/ProductionSchedule";
import { CartPage } from "./components/CartPage";
import { OrderManagement } from "./components/OrderManagement";
import { MenuManagement } from "./components/MenuManagement";
import { StoreSettings } from "./components/StoreSettings";
import { PricingManagement } from "./components/PricingManagement";
import { Spinner } from "./components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  LayoutDashboard,
  Home,
  Cake,
  Package,
  BoxIcon,
  FileText,
  UserCog,
  Bell,
  CalendarClock,
  ClipboardList,
  Settings,
  DollarSign,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { authService } from "./services/authService";
import { useCartStore } from "./store/cartStore";
import { useCartSync } from "./hooks/useCartSync";

type CustomerView = "home" | "customize" | "menu" | "orders" | "cart";
type StaffView = "staff-dashboard" | "order-summary" | "inventory" | "announcements" | "production-schedule";
type AdminView = "admin" | "order-management" | "menu-management" | "store-settings" | "pricing-management" | "order-summary" | "inventory" | "staff-management" | "announcements" | "production-schedule";
type View = CustomerView | StaffView | AdminView;

export default function App() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = React.useState<View>("home");
  const [autoOpenUpload, setAutoOpenUpload] = React.useState(false);
  const [menuCategory, setMenuCategory] = React.useState<string | undefined>(undefined);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  useCartSync(user?.uid);

  const handleCustomerNavigate = (view: string, options?: { autoOpenUpload?: boolean; category?: string }) => {
    setAutoOpenUpload(options?.autoOpenUpload ?? false);
    setMenuCategory(options?.category);
    setCurrentView(view as View);
  };

  // Reset view when user role changes
  React.useEffect(() => {
    if (!user) return;
    if (user.role === "admin") setCurrentView("admin");
    else if (user.role === "staff") setCurrentView("staff-dashboard");
    else setCurrentView("home");
  }, [user?.role]);

  const handleLogout = async () => {
    await authService.logout();
  };

  // Show full-screen loading while Firebase resolves session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Inactive staff/admin — blocked screen
  if (user && user.isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Account Deactivated</h2>
          <p className="text-muted-foreground text-sm">
            Your account has been deactivated. Please contact your administrator to regain access.
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 px-6 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    if (user.role === "admin") {
      switch (currentView) {
        case "admin": return <SalesDashboard />;
        case "order-management": return <OrderManagement />;
        case "menu-management": return <MenuManagement />;
        case "store-settings": return <StoreSettings />;
        case "pricing-management": return <PricingManagement />;
        case "inventory": return <InventoryManagement />;
        case "order-summary": return <OrderSummaryCards />;
        case "staff-management": return <StaffManagement />;
        case "announcements": return <StaffAnnouncements />;
        case "production-schedule": return <ProductionSchedule />;
        default: return <SalesDashboard />;
      }
    } else if (user.role === "staff") {
      switch (currentView) {
        case "staff-dashboard": return <ProductionDashboard />;
        case "order-summary": return <OrderSummaryCards />;
        case "inventory": return <InventoryManagement />;
        case "announcements": return <StaffAnnouncements />;
        case "production-schedule": return <ProductionSchedule />;
        default: return <ProductionDashboard />;
      }
    } else {
      switch (currentView) {
        case "home": return <CustomerHomepage onNavigate={handleCustomerNavigate} />;
        case "customize": return <CakeCustomization onGoToCart={() => setCurrentView("cart")} autoOpenUpload={autoOpenUpload} />;
        case "menu": return <ReadyMadeCakes initialCategory={menuCategory} />;
        case "orders": return <OrderTracking />;
        case "cart": return <CartPage onBack={() => setCurrentView("home")} onOrderPlaced={() => setCurrentView("orders")} />;
        default: return <CustomerHomepage />;
      }
    }
  };

  const tabTriggerClass =
    "gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none";

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartCount={user.role === "customer" ? cartCount : 0}
        isAdmin={user.role !== "customer"}
        onLogout={handleLogout}
        onCartClick={() => setCurrentView("cart")}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4">
          {user.role === "admin" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12">
                <TabsTrigger value="admin" className={tabTriggerClass}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="order-management" className={tabTriggerClass}>
                  <ClipboardList className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="menu-management" className={tabTriggerClass}>
                  <Cake className="w-4 h-4" /> Menu
                </TabsTrigger>
                <TabsTrigger value="store-settings" className={tabTriggerClass}>
                  <Settings className="w-4 h-4" /> Settings
                </TabsTrigger>
                <TabsTrigger value="pricing-management" className={tabTriggerClass}>
                  <DollarSign className="w-4 h-4" /> Pricing
                </TabsTrigger>
                <TabsTrigger value="order-summary" className={tabTriggerClass}>
                  <FileText className="w-4 h-4" /> Order Summary
                </TabsTrigger>
                <TabsTrigger value="inventory" className={tabTriggerClass}>
                  <BoxIcon className="w-4 h-4" /> Inventory
                </TabsTrigger>
                <TabsTrigger value="staff-management" className={tabTriggerClass}>
                  <UserCog className="w-4 h-4" /> Staff
                </TabsTrigger>
                <TabsTrigger value="announcements" className={tabTriggerClass}>
                  <Bell className="w-4 h-4" /> Announcements
                </TabsTrigger>
                <TabsTrigger value="production-schedule" className={tabTriggerClass}>
                  <CalendarClock className="w-4 h-4" /> Production Schedule
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : user.role === "staff" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12">
                <TabsTrigger value="staff-dashboard" className={tabTriggerClass}>
                  <UserCog className="w-4 h-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="order-summary" className={tabTriggerClass}>
                  <FileText className="w-4 h-4" /> Order Summary
                </TabsTrigger>
                <TabsTrigger value="inventory" className={tabTriggerClass}>
                  <BoxIcon className="w-4 h-4" /> Inventory
                </TabsTrigger>
                <TabsTrigger value="announcements" className={tabTriggerClass}>
                  <Bell className="w-4 h-4" /> Announcements
                </TabsTrigger>
                <TabsTrigger value="production-schedule" className={tabTriggerClass}>
                  <CalendarClock className="w-4 h-4" /> Production Schedule
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12">
                <TabsTrigger value="home" className={tabTriggerClass}>
                  <Home className="w-4 h-4" /> Home
                </TabsTrigger>
                <TabsTrigger value="customize" className={tabTriggerClass}>
                  <Cake className="w-4 h-4" /> Customize
                </TabsTrigger>
                <TabsTrigger value="menu" className={tabTriggerClass}>
                  <Cake className="w-4 h-4" /> Menu
                </TabsTrigger>
                <TabsTrigger value="orders" className={tabTriggerClass}>
                  <Package className="w-4 h-4" /> Track Order
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-background">{renderView()}</main>

      {user.role === "customer" && <Footer />}
    </div>
  );
}
