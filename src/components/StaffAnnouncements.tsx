import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, Megaphone, Calendar } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  targetAudience: string;
  date: string;
  postedBy: string;
}

export function StaffAnnouncements() {
  // In a real app, this would be fetched from a backend/database
  const [announcements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Holiday Schedule Update",
      message: "The bakery will be closed on December 25th for Christmas. Please plan your orders accordingly.",
      priority: "important",
      targetAudience: "All Staff",
      date: "Dec 1, 2025",
      postedBy: "Admin",
    },
    {
      id: 2,
      title: "New Equipment Training",
      message: "Mandatory training session for the new industrial oven will be held on Dec 15th at 9:00 AM.",
      priority: "urgent",
      targetAudience: "Bakers",
      date: "Nov 28, 2025",
      postedBy: "Admin",
    },
    {
      id: 3,
      title: "Customer Feedback Reminder",
      message: "Please remember to ask customers for feedback after each order completion. This helps us improve our service.",
      priority: "normal",
      targetAudience: "Customer Service",
      date: "Nov 25, 2025",
      postedBy: "Admin",
    },
  ]);

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
