import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo } from "react";
import { useCurrentUser, useLiveEntityInvalidation, useNotifications } from "@/hooks/useEntityQueries";
import { NotificationService } from "@/services/NotificationService";
import { useNavigate } from "react-router-dom";

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: notifications = [] } = useNotifications(
    user?.email ? { recipient_email: user.email, is_read: false } : {},
    { sort: "-created_date", limit: 15, enabled: !!user?.email }
  );

  useLiveEntityInvalidation(NotificationService, [["notifications"]]);

  const unread = useMemo(() => notifications.slice(0, 15), [notifications]);

  const markAsRead = async (notif) => {
    await NotificationService.update(notif.id, { is_read: true });
    if (notif.related_case_id) {
      navigate(`/cases/${notif.related_case_id}`);
    }
  };

  const typeIcons = {
    panic_alert: "🚨",
    case_update: "📋",
    assignment: "👤",
    message: "💬",
    system: "ℹ️",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {unread.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            unread.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif)}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
              >
                <div className="flex gap-2">
                  <span className="text-base">{typeIcons[notif.type] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}