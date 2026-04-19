import { useEffect, useMemo, useRef, useState } from "react";
import { get, push, ref, set } from "firebase/database";
import { db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Headset, Package, Send } from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved";
type TicketCategory = "order" | "payment" | "design" | "pickup" | "account" | "other";
type SenderRole = "customer" | "admin";

interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: TicketCategory;
  orderId?: string;
  status: TicketStatus;
  priority: "normal" | "high";
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: SenderRole;
}

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  message: string;
  createdAt: string;
}

interface CustomerOrderOption {
  id: string;
  label: string;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: "Order Issue",
  payment: "Payment",
  design: "Cake Design",
  pickup: "Pickup / Delivery",
  account: "Account",
  other: "Other",
};

const formatTimestamp = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export function SupportCenter() {
  const user = useAuthStore((state) => state.user);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [orders, setOrders] = useState<CustomerOrderOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [form, setForm] = useState({
    subject: "",
    category: "order" as TicketCategory,
    orderId: "",
    message: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadTicketsAndOrders = async () => {
      try {
        const ticketsSnapshot = await get(ref(db, "supportTickets"));
        const ticketsData = ticketsSnapshot.val();
        if (!ticketsData) {
          setTickets([]);
          setSelectedTicketId("");
        } else {
          const list = Object.entries(ticketsData)
            .map(([id, value]: [string, any]) => ({ id, ...value } as SupportTicket))
            .filter((ticket) => ticket.customerId === user.uid)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          setTickets(list);
          setSelectedTicketId((current) => current || list[0]?.id || "");
        }
      } catch (error) {
        console.error("Failed to read support tickets", error);
        setTickets([]);
        setSelectedTicketId("");
      }

      try {
        const ordersSnapshot = await get(ref(db, `orders/${user.uid}`));
        const ordersData = ordersSnapshot.val();
        if (!ordersData) {
          setOrders([]);
        } else {
          const list = Object.entries(ordersData)
            .map(([id, value]: [string, any]) => {
              const firstItem = Array.isArray(value.items) ? value.items[0] : null;
              const cakeName = firstItem?.name ?? value.cakeType ?? "Custom Cake";
              const pickupDate = value.pickupDate ?? "No pickup date";
              return {
                id,
                label: `${id.slice(0, 8)} • ${cakeName} • ${pickupDate}`,
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

          setOrders(list);
        }
      } catch (error) {
        console.error("Failed to read customer orders for support", error);
        setOrders([]);
      }
    };

    void loadTicketsAndOrders();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const snapshot = await get(ref(db, `supportMessages/${selectedTicketId}`));
        const data = snapshot.val();
        if (!data) {
          setMessages([]);
          return;
        }

        const list = Object.entries(data)
          .map(([id, value]: [string, any]) => ({ id, ...value } as SupportMessage))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        setMessages(list);
      } catch (error) {
        console.error("Failed to read support messages", error);
        setMessages([]);
      }
    };

    void loadMessages();
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const submitTicket = async () => {
    if (!user) return;

    const subject = form.subject.trim();
    const message = form.message.trim();
    if (!subject || !message) {
      toast.error("Please add both a subject and message.");
      return;
    }

    setSubmitting(true);
    try {
      const createdAt = new Date().toISOString();
      const ticketRef = push(ref(db, "supportTickets"));
      const ticketId = ticketRef.key;
      if (!ticketId) throw new Error("Could not create support ticket id.");

      const ticketPayload: Omit<SupportTicket, "id"> = {
        customerId: user.uid,
        customerName: user.displayName ?? "Customer",
        customerEmail: user.email ?? "",
        subject,
        category: form.category,
        orderId: form.orderId || "",
        status: "open",
        priority: form.category === "payment" || form.category === "order" ? "high" : "normal",
        createdAt,
        updatedAt: createdAt,
        lastMessage: message,
        lastMessageAt: createdAt,
        lastSenderRole: "customer",
      };

      await set(ticketRef, ticketPayload);

      const firstMessageRef = push(ref(db, `supportMessages/${ticketId}`));
      await set(firstMessageRef, {
        senderId: user.uid,
        senderName: user.displayName ?? "Customer",
        senderRole: "customer",
        message,
        createdAt,
      });

      setForm({ subject: "", category: "order", orderId: "", message: "" });
      setSelectedTicketId(ticketId);
      setTickets((prev) => [
        { id: ticketId, ...ticketPayload },
        ...prev,
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setMessages([
        {
          id: firstMessageRef.key ?? createdAt,
          senderId: user.uid,
          senderName: user.displayName ?? "Customer",
          senderRole: "customer",
          message,
          createdAt,
        },
      ]);
      toast.success("Support ticket sent.");
    } catch (error) {
      console.error("Failed to submit support ticket", error);
      toast.error("Could not send your support request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!user || !selectedTicket) return;

    const message = newReply.trim();
    if (!message) return;

    setReplying(true);
    try {
      const createdAt = new Date().toISOString();
      const messageRef = push(ref(db, `supportMessages/${selectedTicket.id}`));
      await set(messageRef, {
        senderId: user.uid,
        senderName: user.displayName ?? "Customer",
        senderRole: "customer",
        message,
        createdAt,
      });

      await set(ref(db, `supportTickets/${selectedTicket.id}`), {
        ...selectedTicket,
        status: selectedTicket.status === "resolved" ? "open" : selectedTicket.status,
        updatedAt: createdAt,
        lastMessage: message,
        lastMessageAt: createdAt,
        lastSenderRole: "customer",
      });

      setNewReply("");
      setMessages((prev) => [
        ...prev,
        {
          id: messageRef.key ?? createdAt,
          senderId: user.uid,
          senderName: user.displayName ?? "Customer",
          senderRole: "customer",
          message,
          createdAt,
        },
      ]);
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicket.id
            ? {
                ...ticket,
                status: selectedTicket.status === "resolved" ? "open" : selectedTicket.status,
                updatedAt: createdAt,
                lastMessage: message,
                lastMessageAt: createdAt,
                lastSenderRole: "customer",
              }
            : ticket
        )
      );
      toast.success("Reply sent.");
    } catch (error) {
      console.error("Failed to send support reply", error);
      toast.error("Could not send reply. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Contact Support</h1>
        <p className="text-muted-foreground">
          Reach our team about orders, payments, cake designs, or anything else you need help with.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headset className="w-5 h-5" />
              New Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="What do you need help with?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.category}
                onValueChange={(value: TicketCategory) => setForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Related Order</label>
              <Select
                value={form.orderId || "none"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, orderId: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional order reference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked order</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Tell us what happened and how we can help."
              />
            </div>

            <Button className="w-full gap-2" onClick={submitTicket} disabled={submitting}>
              <Send className="w-4 h-4" />
              {submitting ? "Sending…" : "Send Support Request"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven’t opened any tickets yet.</p>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      selectedTicketId === ticket.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-medium">{ticket.subject}</p>
                      <Badge className={STATUS_STYLES[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mb-1 text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.lastMessage}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(ticket.updatedAt)}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat panel */}
          <Card className="flex flex-col overflow-hidden" style={{ height: 580 }}>
            {/* Chat header */}
            <CardHeader className="shrink-0 border-b border-border pb-3 pt-4 px-4">
              {selectedTicket ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm leading-tight">{selectedTicket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[selectedTicket.category]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTicket.orderId && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Package className="w-3 h-3" />
                        {selectedTicket.orderId.slice(0, 8)}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${STATUS_STYLES[selectedTicket.status]}`}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="font-semibold text-sm text-muted-foreground">Conversation</p>
              )}
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
              {!selectedTicket ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a ticket to view the conversation.
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No messages yet.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === "customer";
                  const initials = (msg.senderName ?? "")
                    .split(" ")
                    .map((word) => word[0] ?? "")
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar */}
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {initials || "?"}
                      </div>
                      {/* Bubble */}
                      <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-white text-foreground border border-border rounded-bl-sm"
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {msg.senderName} · {formatTimestamp(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input bar */}
            {selectedTicket && (
              <div className="shrink-0 border-t border-border bg-white px-3 py-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    rows={2}
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    className="flex-1 resize-none text-sm min-h-[56px]"
                    disabled={replying}
                  />
                  <Button
                    size="icon"
                    onClick={sendReply}
                    disabled={replying || !newReply.trim()}
                    className="h-10 w-10 shrink-0 rounded-full"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
