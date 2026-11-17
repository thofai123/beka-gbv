import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationDropdown from "./NotificationDropdown";
import QuickExitButton from "./QuickExitButton";
import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";

export default function TopBar({ onMenuClick }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    apiClient.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <header className="hidden lg:flex h-16 border-b border-border bg-card/80 backdrop-blur-sm items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11" aria-label="Open menu" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cases, contacts..."
            className="border-0 bg-transparent h-7 w-64 text-sm focus-visible:ring-0 p-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <QuickExitButton />
        <NotificationDropdown />
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {user?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || "survivor"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}