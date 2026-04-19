import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, Megaphone, Calendar } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  targetAudience: string;
  date: string;
  postedBy: string;
}

export function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onValue(ref(db, "announcements"), (snap) => {
      const data = snap.val();
      if (!data) { setAnnouncements([]); setLoading(false); return; }
      const list: Announcement[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: val.id ?? key,
        title: val.title ?? "",
        message: val.message ?? "",
        priority: val.priority ?? "normal",
        targetAudience: val.targetAudience ?? "",
        date: val.date ?? "",
        postedBy: val.postedBy ?? "",
      }));
      setAnnouncements(list);
      setLoading(false);
    }, () => { setAnnouncements([]); setLoading(false); });
    return () => unsub();
  }, []);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      normal: "bg-gray-100 text-gray-800",
      important: "bg-yellow-100 text-yellow-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "urgent") {
      return "🔴";
    } else if (priority === "important") {
      return "🟡";
    }
    return "🟢";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground text-lg">Loading announcements…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          Announcements
        </h1>
        <p className="text-muted-foreground">
          Important messages and updates from management
        </p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-3 bg-primary/10 rounded-lg mt-1">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl">
                        {getPriorityIcon(announcement.priority)} {announcement.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority.charAt(0).toUpperCase() +
                          announcement.priority.slice(1)}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {announcement.targetAudience}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <Calendar className="w-4 h-4" />
                  {announcement.date}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {announcement.message}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Posted by: {announcement.postedBy}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {announcements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">No Announcements</h3>
            <p className="text-muted-foreground">
              There are no announcements at this time. Check back later for updates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
