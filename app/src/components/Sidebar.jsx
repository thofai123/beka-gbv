import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, FileText, AlertTriangle, MessageSquare,
  BarChart3, Users, Settings, Shield, X, CircleAlert, LifeBuoy, Lock, BookOpen, MapPin, Building2, UserPlus, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const survivorNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/beka/" },
  { label: "Report Incident", icon: FileText, path: "/beka/report" },
  { label: "Evidence Vault", icon: Lock, path: "/beka/evidence" },
  { label: "Statement Builder", icon: BookOpen, path: "/beka/statement" },
  { label: "Panic Button", icon: CircleAlert, path: "/beka/panic" },
  { label: "Emergency Contacts", icon: UserPlus, path: "/beka/contacts" },
  { label: "Messages", icon: MessageSquare, path: "/beka/messages" },
  { label: "Resources", icon: LifeBuoy, path: "/beka/resources" },
  { label: "Settings", icon: Settings, path: "/beka/settings" },
];

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/beka/" },
  { label: "Cases", icon: Shield, path: "/beka/cases" },
  { label: "Live Alert Map", icon: MapPin, path: "/beka/alerts-map" },
  { label: "Response Units", icon: Building2, path: "/beka/response-units" },
  { label: "Analytics", icon: BarChart3, path: "/beka/analytics" },
  { label: "Team", icon: Users, path: "/beka/team" },
  { label: "Messages", icon: MessageSquare, path: "/beka/messages" },
  { label: "Resources", icon: LifeBuoy, path: "/beka/resources" },
  { label: "Settings", icon: Settings, path: "/beka/settings" },
  { label: "Security", icon: Shield, path: "/beka/security" },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminNav : survivorNav;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img
          src="/icon-192.png"
          alt="BEKA"
          className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
        />
        <div>
          <h1 className="font-inter font-bold text-lg text-sidebar-primary-foreground tracking-tight">BEKA</h1>
          <p className="text-xs text-sidebar-foreground/60">GBV Response System · Zambia</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
              {item.path === "/beka/panic" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 mb-3">
        {confirmingSignOut ? (
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/80 mb-2">Sign out of BEKA on this device?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { logout(false); window.location.href = "/beka/login"; }}
                className="flex-1 min-h-[44px] rounded-lg bg-red-600 text-white text-sm font-medium"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={() => setConfirmingSignOut(false)}
                className="flex-1 min-h-[44px] rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            className="flex w-full items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        )}
      </div>

      {/* Bottom section */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-sidebar-accent/50">
        <p className="text-xs text-sidebar-foreground/60 font-medium">Zambia Emergency Line</p>
        <p className="text-sm font-bold text-sidebar-primary mt-1">📞 116 / 911</p>
        <p className="text-xs text-sidebar-foreground/40 mt-1">VSU Hotline / Anti-GBV Act 24/7</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 border-r border-sidebar-border">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden"
            >
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="absolute top-2 right-2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground z-10"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}