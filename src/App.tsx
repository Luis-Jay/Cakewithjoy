import React from "react";
import { Login } from "./components/Login";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CustomerHomepage } from "./components/CustomerHomepage";
import { CakeCustomization } from "./components/CakeCustomization";
import { ReadyMadeCakes } from "./components/ReadyMadeCakes";
import { OrderTracking } from "./components/OrderTracking";
import { SalesDashboard } from "./components/SalesDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
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
import { ProfilePage } from "./components/ProfilePage";
import { SupportCenter } from "./components/SupportCenter";
import { SupportManagement } from "./components/SupportManagement";
import { Spinner } from "./components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
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
  Headset,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { authService } from "./services/authService";
import { useCartStore } from "./store/cartStore";
import { useAuthStore } from "./store/authStore";
import { useCartSync } from "./hooks/useCartSync";

type CustomerView = "home" | "customize" | "menu" | "orders" | "cart" | "profile" | "support";
type StaffView = "staff-dashboard" | "order-summary" | "inventory" | "announcements" | "production-schedule";
type ProductionView = "production-dashboard" | "order-summary" | "inventory" | "announcements" | "production-schedule";
type SalesView = "sales-orders" | "announcements";
type AdminView = "admin" | "order-management" | "menu-management" | "store-settings" | "pricing-management" | "order-summary" | "inventory" | "staff-management" | "announcements" | "production-schedule" | "support-management";
type View = CustomerView | StaffView | ProductionView | SalesView | AdminView;

export default function App() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = React.useState<View>("home");
  const [autoOpenUpload, setAutoOpenUpload] = React.useState(false);
  const [menuCategory, setMenuCategory] = React.useState<string | undefined>(undefined);
  const [isGuest, setIsGuest] = React.useState(() => !useAuthStore.getState().user);
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
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
    setIsGuest(false);
    if (user.role === "admin") setCurrentView("admin");
    else if (user.role === "staff") setCurrentView("staff-dashboard");
    else if (user.role === "production") setCurrentView("production-dashboard");
    else if (user.role === "baker") setCurrentView("production-dashboard");
    else if (user.role === "sales") setCurrentView("sales-orders");
    else setCurrentView("home");
  }, [user?.role]);

  const handleLogout = async () => {
    clearCart();
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

  // Show login if not authenticated and not browsing as guest
  if (!user && !isGuest) {
    return <Login onGuestBrowse={() => { setIsGuest(true); setCurrentView("home"); }} />;
  }

  const role = user?.role ?? "guest";

  const renderView = () => {
    if (role === "admin") {
      switch (currentView) {
        case "admin": return <AdminDashboard />;
        case "order-management": return <OrderManagement />;
        case "menu-management": return <MenuManagement />;
        case "store-settings": return <StoreSettings />;
        case "pricing-management": return <PricingManagement />;
        case "inventory": return <InventoryManagement />;
        case "order-summary": return <OrderSummaryCards />;
        case "staff-management": return <StaffManagement />;
        case "announcements": return <AdminDashboard />;
        case "production-schedule": return <ProductionSchedule />;
        case "support-management": return <SupportManagement />;
        default: return <AdminDashboard />;
      }
    } else if (role === "staff") {
      switch (currentView) {
        case "staff-dashboard": return <ProductionDashboard />;
        case "order-summary": return <OrderSummaryCards />;
        case "inventory": return <InventoryManagement />;
        case "announcements": return <StaffAnnouncements />;
        case "production-schedule": return <ProductionSchedule />;
        default: return <ProductionDashboard />;
      }
    } else if (role === "production") {
      switch (currentView) {
        case "production-dashboard": return <ProductionDashboard />;
        case "order-summary": return <OrderSummaryCards />;
        case "inventory": return <InventoryManagement />;
        case "announcements": return <StaffAnnouncements />;
        case "production-schedule": return <ProductionSchedule />;
        default: return <ProductionDashboard />;
      }
    } else if (role === "baker") {
      switch (currentView) {
        case "production-dashboard": return <ProductionDashboard />;
        case "order-summary": return <OrderSummaryCards />;
        case "production-schedule": return <ProductionSchedule />;
        case "announcements": return <StaffAnnouncements />;
        default: return <ProductionDashboard />;
      }
    } else if (role === "sales") {
      switch (currentView) {
        case "sales-orders": return <OrderSummaryCards />;
        case "announcements": return <StaffAnnouncements />;
        default: return <OrderSummaryCards />;
      }
    } else {
      // customer or guest
      switch (currentView) {
        case "home": return <CustomerHomepage onNavigate={handleCustomerNavigate} isGuest={isGuest} />;
        case "customize": return <CakeCustomization onGoToCart={() => setCurrentView("cart")} autoOpenUpload={autoOpenUpload} isGuest={isGuest} onSignIn={() => setIsGuest(false)} />;
        case "menu": return <ReadyMadeCakes initialCategory={menuCategory} isGuest={isGuest} onSignIn={() => setIsGuest(false)} />;
        case "orders": return <OrderTracking />;
        case "cart": return <CartPage onBack={() => setCurrentView("home")} onOrderPlaced={() => setCurrentView("orders")} isGuest={isGuest} onSignIn={() => setIsGuest(false)} />;
        case "profile": return <ProfilePage onLogout={handleLogout} />;
        case "support": return <SupportCenter />;
        default: return <CustomerHomepage />;
      }
    }
  };

  const tabTriggerClass =
    "gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none";

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartCount={role === "customer" ? cartCount : 0}
        isAdmin={role === "admin" || role === "staff" || role === "production" || role === "sales" || role === "baker"}
        onLogout={isGuest ? undefined : handleLogout}
        onCartClick={() => setCurrentView("cart")}
        onProfileClick={() => setCurrentView("profile")}
        isGuest={isGuest}
        onSignIn={() => setIsGuest(false)}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-border">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="container mx-auto px-2 sm:px-4 min-w-max sm:min-w-0">
          {role === "admin" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
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
                <TabsTrigger value="support-management" className={tabTriggerClass}>
                  <Headset className="w-4 h-4" /> Support
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : role === "staff" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
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
          ) : role === "production" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
                <TabsTrigger value="production-dashboard" className={tabTriggerClass}>
                  <LayoutDashboard className="w-4 h-4" /> Kitchen Dashboard
                </TabsTrigger>
                <TabsTrigger value="order-summary" className={tabTriggerClass}>
                  <FileText className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="inventory" className={tabTriggerClass}>
                  <BoxIcon className="w-4 h-4" /> Inventory
                </TabsTrigger>
                <TabsTrigger value="production-schedule" className={tabTriggerClass}>
                  <CalendarClock className="w-4 h-4" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="announcements" className={tabTriggerClass}>
                  <Bell className="w-4 h-4" /> Announcements
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : role === "baker" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
                <TabsTrigger value="production-dashboard" className={tabTriggerClass}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="order-summary" className={tabTriggerClass}>
                  <FileText className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="production-schedule" className={tabTriggerClass}>
                  <CalendarClock className="w-4 h-4" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="announcements" className={tabTriggerClass}>
                  <Bell className="w-4 h-4" /> Announcements
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : role === "sales" ? (
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
                <TabsTrigger value="sales-orders" className={tabTriggerClass}>
                  <FileText className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="announcements" className={tabTriggerClass}>
                  <Bell className="w-4 h-4" /> Announcements
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            // customer or guest — guests don't see Cart / Track Order tabs
            <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as View)}>
              <TabsList className="bg-transparent border-b-0 h-12 w-max sm:w-auto">
                <TabsTrigger value="home" className={tabTriggerClass}>
                  <Home className="w-4 h-4" /> Home
                </TabsTrigger>
                <TabsTrigger value="customize" className={tabTriggerClass}>
                  <Cake className="w-4 h-4" /> Customize
                </TabsTrigger>
                <TabsTrigger value="menu" className={tabTriggerClass}>
                  <Cake className="w-4 h-4" /> Archive
                </TabsTrigger>
                {!isGuest && (
                  <TabsTrigger value="orders" className={tabTriggerClass}>
                    <Package className="w-4 h-4" /> Track Order
                  </TabsTrigger>
                )}
                {!isGuest && (
                  <TabsTrigger value="support" className={tabTriggerClass}>
                    <Headset className="w-4 h-4" /> Support
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-background">{renderView()}</main>

      {(role === "customer" || isGuest) && <Footer />}
      <Toaster />
    </div>
  );
}
