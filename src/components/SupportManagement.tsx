import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set } from "firebase/database";
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
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { Headset, Mail, MessageCircle, Package, Phone, Search, SendHorizonal } from "lucide-react";

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

export function SupportManagement() {
  const user = useAuthStore((state) => state.user);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "supportTickets"),
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setTickets([]);
          setSelectedTicketId("");
          return;
        }

        const list = Object.entries(data)
          .map(([id, value]: [string, any]) => ({ id, ...value } as SupportTicket))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        setTickets(list);
        setSelectedTicketId((current) => current || list[0]?.id || "");
      },
      (error) => {
        console.error("Failed to read support ticket inbox", error);
        setTickets([]);
        setSelectedTicketId("");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    const unsubscribe = onValue(
      ref(db, `supportMessages/${selectedTicketId}`),
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setMessages([]);
          return;
        }

        const list = Object.entries(data)
          .map(([id, value]: [string, any]) => ({ id, ...value } as SupportMessage))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        setMessages(list);
      },
      (error) => {
        console.error("Failed to read support conversation", error);
        setMessages([]);
      }
    );

    return () => unsubscribe();
  }, [selectedTicketId]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const haystack = [ticket.subject, ticket.customerName, ticket.customerEmail, ticket.lastMessage]
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchQuery.trim() === "" || haystack.includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const updateTicket = async (ticket: SupportTicket, patch: Partial<SupportTicket>) => {
    try {
      await set(ref(db, `supportTickets/${ticket.id}`), {
        ...ticket,
        ...patch,
      });
    } catch (error) {
      console.error("Failed to update support ticket", error);
      toast.error("Could not update ticket.");
    }
  };

  const sendReply = async () => {
    if (!user || !selectedTicket) return;

    const message = reply.trim();
    if (!message) return;

    setReplying(true);
    try {
      const createdAt = new Date().toISOString();
      const messageRef = push(ref(db, `supportMessages/${selectedTicket.id}`));
      await set(messageRef, {
        senderId: user.uid,
        senderName: user.displayName ?? "Admin",
        senderRole: "admin",
        message,
        createdAt,
      });

      await updateTicket(selectedTicket, {
        status: selectedTicket.status === "resolved" ? "in_progress" : selectedTicket.status,
        updatedAt: createdAt,
        lastMessage: message,
        lastMessageAt: createdAt,
        lastSenderRole: "admin",
      });

      setReply("");
      toast.success("Reply sent to customer.");
    } catch (error) {
      console.error("Failed to send support reply", error);
      toast.error("Could not send reply.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Support Management</h1>
        <p className="text-muted-foreground">
          Review customer concerns, reply from one place, and track each ticket through resolution.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headset className="w-5 h-5" />
              Ticket Inbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: TicketStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No support tickets match this filter.</p>
              ) : (
                filteredTickets.map((ticket) => (
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
                    <p className="text-sm text-muted-foreground">{ticket.customerName}</p>
                    <p className="mb-1 text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.lastMessage}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(ticket.updatedAt)}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedTicket ? selectedTicket.subject : "Ticket Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={STATUS_STYLES[selectedTicket.status]}>
                        {selectedTicket.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary">{CATEGORY_LABELS[selectedTicket.category]}</Badge>
                      <Badge variant={selectedTicket.priority === "high" ? "destructive" : "outline"}>
                        {selectedTicket.priority} priority
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedTicket.customerEmail || "No email"}
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {selectedTicket.customerName}
                      </p>
                      {selectedTicket.orderId && (
                        <p className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Linked order: {selectedTicket.orderId}
                        </p>
                      )}
                      <p>Opened {formatTimestamp(selectedTicket.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value: TicketStatus) =>
                          updateTicket(selectedTicket, { status: value, updatedAt: new Date().toISOString() })
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={(value: "normal" | "high") =>
                          updateTicket(selectedTicket, { priority: value, updatedAt: new Date().toISOString() })
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl p-4 ${
                        message.senderRole === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs opacity-80">
                        <span>{message.senderName}</span>
                        <span>{formatTimestamp(message.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Textarea
                    rows={5}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to the customer…"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button className="gap-2" onClick={sendReply} disabled={replying}>
                      <SendHorizonal className="w-4 h-4" />
                      {replying ? "Sending…" : "Send Reply"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateTicket(selectedTicket, { status: "resolved", updatedAt: new Date().toISOString() })}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choose a ticket from the inbox to start helping the customer.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
