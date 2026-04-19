import { useEffect, useMemo, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Move,
  Package,
  Phone,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

interface StaffMember {
  uid: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface Order {
  id: string;
  customerId: string;
  readableCode: string;
  displayLabel: string;
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
  status: string;
  createdAt: string;
  pickupDate: string;
  pickupTime: string;
  priority: "high" | "medium" | "low";
  assignedStaffId?: string;
  assignedStaffName?: string;
  productionTime: number;
  productionDate: string;
  timeSlot: string;
}

interface DraggableOrderCardProps {
  order: Order;
  compact?: boolean;
  onOrderClick: (order: Order) => void;
}

interface TimeSlotProps {
  date: string;
  timeSlot: string;
  orders: Order[];
  onDrop: (order: Order, date: string, timeSlot: string) => void;
  onOrderClick: (order: Order) => void;
}

const ITEM_TYPE = "ORDER";

const TIME_SLOTS = [
  { id: "morning", label: "Morning", hours: "6:00 - 12:00" },
  { id: "afternoon", label: "Afternoon", hours: "12:00 - 18:00" },
  { id: "evening", label: "Evening", hours: "18:00 - 22:00" },
] as const;

const WORKLOAD_CLASSES = {
  empty: "border-dashed border-border bg-white",
  light: "border-emerald-200 bg-emerald-50/70",
  moderate: "border-amber-200 bg-amber-50/70",
  heavy: "border-rose-200 bg-rose-50/70",
} as const;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateKey: string) => {
  if (!dateKey) return "Unscheduled";
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateHeading = (dateKey: string) => {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: dateKey, sublabel: "" };
  }
  return {
    day: parsed.toLocaleDateString("en-US", { weekday: "short" }),
    sublabel: parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
};

const createReadableCode = (rawId: string) => {
  const normalized = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = normalized.slice(-6).padStart(6, "0");
  return `ORD-${suffix}`;
};

const buildDisplayLabel = (code: string, customerName: string, cakeName: string) =>
  [code, customerName || "Walk-in Customer", cakeName || "Custom Cake"]
    .filter(Boolean)
    .join(" • ");

const normalizePriority = (val: unknown, isRushOrder?: boolean): Order["priority"] => {
  if (isRushOrder) return "high";
  if (val === "high" || val === "medium" || val === "low") return val;
  return "low";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
    confirmed: "bg-indigo-100 border-indigo-300 text-indigo-800",
    baking: "bg-blue-100 border-blue-300 text-blue-800",
    ready: "bg-green-100 border-green-300 text-green-800",
    completed: "bg-gray-100 border-gray-300 text-gray-800",
    declined: "bg-red-100 border-red-300 text-red-800",
  };
  return colors[status] || colors.pending;
};

const getPriorityBadge = (priority: Order["priority"]) => {
  const variants = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-blue-100 text-blue-800",
  };
  return variants[priority];
};

const DraggableOrderCard = ({ order, compact = false, onOrderClick }: DraggableOrderCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: order,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [order]);

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.45 : 1 }}
      className={`cursor-move rounded-xl border transition-all hover:shadow-md ${
        compact
          ? `p-2 ${getStatusColor(order.status)}`
          : `p-3 border-l-4 ${getStatusColor(order.status)} bg-white`
      }`}
      onClick={() => onOrderClick(order)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Move className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.readableCode}</span>
          </div>
          <p className={`truncate font-semibold text-foreground ${compact ? "text-xs mt-1" : "text-sm mt-1"}`}>
            {order.cakeDetails.name || "Custom Cake"}
          </p>
          <p className={`truncate text-muted-foreground ${compact ? "text-[11px]" : "text-sm"}`}>
            {order.customer.name || "Walk-in Customer"}
          </p>
        </div>
        <Badge className={`${getPriorityBadge(order.priority)} text-[10px] uppercase`}>
          {order.priority}
        </Badge>
      </div>

      <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>
        <span>{order.pickupTime || "No pickup time"}</span>
        {order.assignedStaffName && <span>• {order.assignedStaffName}</span>}
        {order.productionTime > 0 && <span>• {order.productionTime}h</span>}
      </div>

      {!compact && (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">{order.displayLabel}</p>
      )}
    </div>
  );
};

const TimeSlot = ({ date, timeSlot, orders, onDrop, onOrderClick }: TimeSlotProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: Order) => onDrop(item, date, timeSlot),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [date, timeSlot, onDrop]);

  const totalHours = orders.reduce((sum, order) => sum + order.productionTime, 0);
  const workloadClass =
    totalHours === 0
      ? WORKLOAD_CLASSES.empty
      : totalHours <= 4
      ? WORKLOAD_CLASSES.light
      : totalHours <= 8
      ? WORKLOAD_CLASSES.moderate
      : WORKLOAD_CLASSES.heavy;

  return (
    <div
      ref={drop}
      className={`min-h-[150px] rounded-2xl border-2 p-3 transition-all ${
        isOver ? "border-primary bg-primary/5 shadow-sm" : workloadClass
      }`}
    >
      <div className="space-y-2">
        {orders.map((order) => (
          <DraggableOrderCard
            key={order.id}
            order={order}
            compact
            onOrderClick={onOrderClick}
          />
        ))}
      </div>
      {totalHours > 0 && (
        <div className="mt-3 border-t border-border/70 pt-2 text-xs text-muted-foreground">
          Total workload: {totalHours}h
        </div>
      )}
    </div>
  );
};

export function ProductionSchedule() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ProductionScheduleInner />
    </DndProvider>
  );
}

function ProductionScheduleInner() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStartDate, setWeekStartDate] = useState(() => formatDateKey(new Date()));
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [queuePage, setQueuePage] = useState(0);
  const QUEUE_PAGE_SIZE = 8;

  useEffect(() => {
    const unsub = onValue(ref(db, "allOrders"), (snap) => {
      const data = snap.val();
      if (!data) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const list: Order[] = Object.entries(data).map(([key, val]: [string, any]) => {
        const firstItem = Array.isArray(val.items) ? val.items[0] : null;
        const readableCode = val.orderNumber ?? createReadableCode(key);
        const customerName = val.customerName ?? "";
        const cakeName = firstItem?.name ?? val.cakeType ?? "Custom Cake";

        return {
          id: key,
          customerId: val.customerId ?? "",
          readableCode,
          displayLabel: val.adminLabel ?? buildDisplayLabel(readableCode, customerName, cakeName),
          customer: {
            name: customerName,
            email: val.customerEmail ?? "",
            phone: val.customerPhone ?? "",
          },
          cakeDetails: {
            name: cakeName,
            flavor: firstItem?.flavor ?? val.flavor ?? "",
            size: firstItem?.size ?? val.size ?? "",
            icing: firstItem?.icing ?? val.icing ?? "",
            message: val.cakeMessage ?? "",
            servings: val.servings ?? "",
            image: firstItem?.cakeImage ?? val.cakeImage ?? "",
          },
          status: val.status ?? "pending",
          createdAt: val.createdAt ?? "",
          pickupDate: val.pickupDate ?? "",
          pickupTime: val.pickupTime ?? "",
          priority: normalizePriority(val.priority, !!val.isRushOrder),
          assignedStaffId: val.assignedStaffId ?? "",
          assignedStaffName: val.assignedStaffName ?? val.assignedStaff ?? "",
          productionTime: Number(val.productionTime ?? val.estimatedHours ?? 0),
          productionDate: val.productionDate ?? "",
          timeSlot: val.timeSlot ?? "",
        };
      });

      setOrders(list);
      setLoading(false);
    }, () => {
      setOrders([]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      const data = snap.val();
      if (!data) {
        setStaffMembers([]);
        return;
      }

      const staff = Object.entries(data)
        .map(([uid, val]: [string, any]) => ({
          uid,
          name: val.name ?? "",
          role: val.role ?? "",
          isActive: val.isActive !== false,
        }))
        .filter((member) => member.isActive && ["production", "staff", "baker"].includes(member.role));

      setStaffMembers(staff);
    });

    return () => unsub();
  }, []);

  const displayedDates = useMemo(() => {
    const start = new Date(`${weekStartDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return [];

    return Array.from({ length: 5 }, (_, index) => {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      return formatDateKey(current);
    });
  }, [weekStartDate]);

  const persistOrderChanges = async (order: Order, payload: Record<string, unknown>) => {
    setSavingOrderId(order.id);
    try {
      await update(ref(db, `allOrders/${order.id}`), payload);
      if (order.customerId) {
        await update(ref(db, `orders/${order.customerId}/${order.id}`), payload);
      }
    } catch (error) {
      console.error("Failed to save production schedule", error);
      toast.error("Could not save the schedule change. Please try again.");
      throw error;
    } finally {
      setSavingOrderId(null);
    }
  };

  const updateLocalOrder = (orderId: string, payload: Partial<Order>) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, ...payload } : order))
    );
    setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, ...payload } : prev));
  };

  const handleDrop = async (order: Order, productionDate: string, timeSlot: string) => {
    if (order.productionDate === productionDate && order.timeSlot === timeSlot) return;

    const payload = { productionDate, timeSlot };
    updateLocalOrder(order.id, payload);

    try {
      await persistOrderChanges(order, payload);
      toast.success(`Scheduled ${order.readableCode} for ${formatDateLabel(productionDate)} (${timeSlot}).`);
    } catch {
      updateLocalOrder(order.id, {
        productionDate: order.productionDate,
        timeSlot: order.timeSlot,
      });
    }
  };

  const handleReturnToQueue = async (order: Order) => {
    if (!order.productionDate && !order.timeSlot) return;

    const payload = { productionDate: "", timeSlot: "" };
    updateLocalOrder(order.id, payload);

    try {
      await persistOrderChanges(order, payload);
      toast.success(`${order.readableCode} moved back to unscheduled.`);
    } catch {
      updateLocalOrder(order.id, {
        productionDate: order.productionDate,
        timeSlot: order.timeSlot,
      });
    }
  };

  const handleAssignStaff = async (order: Order, staffId: string) => {
    const normalizedStaffId = staffId === "unassigned" ? "" : staffId;
    const selectedStaff = staffMembers.find((member) => member.uid === normalizedStaffId);
    const payload = {
      assignedStaffId: normalizedStaffId,
      assignedStaffName: selectedStaff?.name ?? "",
      assignedStaff: selectedStaff?.name ?? "",
    };

    updateLocalOrder(order.id, payload);

    try {
      await persistOrderChanges(order, payload);
      if (selectedStaff) {
        toast.success(`${order.readableCode} assigned to ${selectedStaff.name}.`);
      }
    } catch {
      updateLocalOrder(order.id, {
        assignedStaffId: order.assignedStaffId,
        assignedStaffName: order.assignedStaffName,
      });
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
      const matchesStaff =
        staffFilter === "all" ||
        order.assignedStaffId === staffFilter ||
        order.assignedStaffName === staffFilter;

      const searchableText = [
        order.readableCode,
        order.displayLabel,
        order.customer.name,
        order.customer.email,
        order.cakeDetails.name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchQuery.trim() === "" || searchableText.includes(searchQuery.trim().toLowerCase());

      return matchesStatus && matchesPriority && matchesStaff && matchesSearch;
    })
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const unscheduledOrders = filteredOrders.filter((order) => !order.productionDate || !order.timeSlot);
  const scheduledOrders = filteredOrders.filter((order) => order.productionDate && order.timeSlot);

  const queueTotalPages = Math.max(1, Math.ceil(unscheduledOrders.length / QUEUE_PAGE_SIZE));
  const safeQueuePage = Math.min(queuePage, queueTotalPages - 1);
  const paginatedQueue = unscheduledOrders.slice(safeQueuePage * QUEUE_PAGE_SIZE, (safeQueuePage + 1) * QUEUE_PAGE_SIZE);

  const getOrdersForSlot = (date: string, timeSlot: string) =>
    scheduledOrders.filter((order) => order.productionDate === date && order.timeSlot === timeSlot);

  const totalOrders = filteredOrders.length;
  const pendingCount = filteredOrders.filter((order) => order.status === "pending" || order.status === "confirmed").length;
  const bakingCount = filteredOrders.filter((order) => order.status === "baking").length;
  const readyCount = filteredOrders.filter((order) => order.status === "ready").length;

  const groupedTimelineOrders = displayedDates.map((date) => ({
    date,
    slots: TIME_SLOTS.map((slot) => ({
      ...slot,
      orders: getOrdersForSlot(date, slot.id),
    })),
  }));

  const [{ isOverUnscheduled }, unscheduledDrop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: Order) => handleReturnToQueue(item),
    collect: (monitor) => ({
      isOverUnscheduled: monitor.isOver(),
    }),
  }), [orders]);

  const changeWeek = (offset: number) => {
    const current = new Date(`${weekStartDate}T00:00:00`);
    if (Number.isNaN(current.getTime())) return;
    current.setDate(current.getDate() + offset);
    setWeekStartDate(formatDateKey(current));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-lg">Loading production schedule…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">

        {/* ── Top bar ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Production Schedule</h1>
            <p className="text-sm text-muted-foreground">Drag orders onto the calendar to schedule them.</p>
          </div>
          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total", value: totalOrders, color: "bg-primary/10 text-primary" },
              { label: "Pending", value: pendingCount, color: "bg-yellow-100 text-yellow-700" },
              { label: "Baking", value: bakingCount, color: "bg-blue-100 text-blue-700" },
              { label: "Ready", value: readyCount, color: "bg-emerald-100 text-emerald-700" },
            ].map((s) => (
              <span key={s.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>
                {s.label} <span className="font-bold">{s.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">

          {/* ══ LEFT PANEL — Order Queue ══ */}
          <div className="flex flex-col gap-4">

            {/* Filters */}
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4" /> Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <Input
                  placeholder="Search order, customer, cake…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setQueuePage(0); }}
                  className="bg-white h-8 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setQueuePage(0); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="baking">In Production</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setQueuePage(0); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={staffFilter} onValueChange={(v) => { setStaffFilter(v); setQueuePage(0); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffMembers.map((s) => (
                      <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Unscheduled Queue */}
            <Card
              className={`border-primary/10 shadow-sm transition-all flex flex-col ${isOverUnscheduled ? "border-primary ring-1 ring-primary bg-primary/5" : ""}`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Unscheduled</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {unscheduledOrders.length} order{unscheduledOrders.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent ref={unscheduledDrop} className="px-4 pb-4 flex-1">
                {unscheduledOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">All orders are scheduled.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      {paginatedQueue.map((order) => (
                        <DraggableOrderCard key={order.id} order={order} onOrderClick={setSelectedOrder} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {queueTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={safeQueuePage === 0}
                          onClick={() => setQueuePage((p) => Math.max(0, p - 1))}
                        >
                          <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {safeQueuePage + 1} / {queueTotalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={safeQueuePage >= queueTotalPages - 1}
                          onClick={() => setQueuePage((p) => Math.min(queueTotalPages - 1, p + 1))}
                        >
                          Next <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ══ RIGHT PANEL — Production Board ══ */}
          <div className="flex flex-col gap-4">

            {/* Date navigation + view toggle */}
            <Card className="border-primary/10 shadow-sm">
              <CardContent className="py-3 px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => changeWeek(-5)} className="h-8 px-2">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Input
                      type="date"
                      value={weekStartDate}
                      onChange={(e) => setWeekStartDate(e.target.value)}
                      className="bg-white h-8 text-sm w-36"
                    />
                    <Button variant="outline" size="sm" onClick={() => setWeekStartDate(formatDateKey(new Date()))} className="h-8 text-xs">
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => changeWeek(5)} className="h-8 px-2">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Calendar
                    </button>
                    <button
                      onClick={() => setViewMode("timeline")}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${viewMode === "timeline" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Timeline
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Board */}
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4" />
                  {formatDateLabel(displayedDates[0] ?? "")}
                  {displayedDates[4] ? ` — ${formatDateLabel(displayedDates[4])}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {viewMode === "calendar" ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Header row */}
                      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "90px repeat(5, 1fr)" }}>
                        <div />
                        {displayedDates.map((date) => {
                          const label = formatDateHeading(date);
                          const isToday = date === formatDateKey(new Date());
                          return (
                            <div key={date} className={`rounded-xl p-2 text-center ${isToday ? "bg-primary/10 border border-primary/20" : "bg-muted/20"}`}>
                              <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}>{label.day}</p>
                              <p className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{label.sublabel}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Time slot rows */}
                      {TIME_SLOTS.map((slot) => (
                        <div key={slot.id} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "90px repeat(5, 1fr)" }}>
                          <div className="flex flex-col justify-center rounded-xl border border-border/60 bg-muted/20 p-2 text-center">
                            <p className="text-xs font-semibold">{slot.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{slot.hours}</p>
                          </div>
                          {displayedDates.map((date) => (
                            <TimeSlot
                              key={`${date}-${slot.id}`}
                              date={date}
                              timeSlot={slot.id}
                              orders={getOrdersForSlot(date, slot.id)}
                              onDrop={handleDrop}
                              onOrderClick={setSelectedOrder}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedTimelineOrders.map((day) => (
                      <div key={day.date} className="rounded-2xl border border-border bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{formatDateLabel(day.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.slots.reduce((sum, s) => sum + s.orders.length, 0)} order(s) scheduled
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-3">
                          {day.slots.map((slot) => (
                            <div key={slot.id} className="rounded-xl border border-border bg-muted/20 p-3">
                              <p className="font-medium text-xs mb-2">{slot.label} <span className="text-muted-foreground font-normal">· {slot.hours}</span></p>
                              <div className="space-y-2">
                                {slot.orders.length > 0
                                  ? slot.orders.map((order) => (
                                      <DraggableOrderCard key={order.id} order={order} compact onOrderClick={setSelectedOrder} />
                                    ))
                                  : <p className="text-xs text-muted-foreground">No orders.</p>
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span className="font-medium">Workload:</span>
                  {[
                    { color: "border-emerald-200 bg-emerald-50", label: "Light ≤4h" },
                    { color: "border-amber-200 bg-amber-50", label: "Moderate 5–8h" },
                    { color: "border-rose-200 bg-rose-50", label: "Heavy 8h+" },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded border ${l.color}`} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedOrder?.displayLabel}</DialogTitle>
              <DialogDescription>
                Review production details, assign staff, and confirm the production date.
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-5 pt-4">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                  <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                    <ImageWithFallback
                      src={selectedOrder.cakeDetails.image}
                      alt={selectedOrder.cakeDetails.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Order Reference</p>
                      <p className="font-semibold">{selectedOrder.readableCode}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Cake</p>
                      <p className="font-semibold">{selectedOrder.cakeDetails.name || "Custom Cake"}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.cakeDetails.size || "Size not set"}
                        {selectedOrder.cakeDetails.flavor ? ` • ${selectedOrder.cakeDetails.flavor}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
                      <p className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3" />
                        {selectedOrder.customer.name || "Walk-in Customer"}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {selectedOrder.customer.phone || "No phone"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</p>
                        <p className="text-sm font-medium">{selectedOrder.pickupDate || "No pickup date"}</p>
                        <p className="text-xs text-muted-foreground">{selectedOrder.pickupTime || "No pickup time"}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Production</p>
                        <p className="text-sm font-medium">
                          {selectedOrder.productionDate ? formatDateLabel(selectedOrder.productionDate) : "Unscheduled"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedOrder.timeSlot || "No time slot"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Assigned Staff</p>
                    <Select
                      value={selectedOrder.assignedStaffId || "unassigned"}
                      onValueChange={(value) => handleAssignStaff(selectedOrder, value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.uid} value={staff.uid}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Priority</p>
                    <Badge className={getPriorityBadge(selectedOrder.priority)}>{selectedOrder.priority}</Badge>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Estimated Workload</p>
                    <p className="font-semibold">{selectedOrder.productionTime || 0} hour(s)</p>
                  </div>
                </div>

                {selectedOrder.cakeDetails.message && (
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Cake Message</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.cakeDetails.message}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {savingOrderId === selectedOrder.id ? "Saving schedule changes…" : "Drag this order on the board to reschedule it."}
                  </div>
                  {selectedOrder.productionDate && selectedOrder.timeSlot && (
                    <Button variant="outline" onClick={() => handleReturnToQueue(selectedOrder)}>
                      Return to Unscheduled
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
