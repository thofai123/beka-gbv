import { useLocation, useNavigate } from "react-router-dom";
import { Home, UserPlus, LifeBuoy, Settings, AlertTriangle, Phone, HeartHandshake, ShieldAlert, X, FileText, Users } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabHistory = useRef({});
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const leftTabs = isAdmin ?
  [
  { label: t("home"), icon: Home, path: "/beka/" },
  { label: "Cases", icon: FileText, path: "/beka/cases" }] :

  [
  { label: t("home"), icon: Home, path: "/beka/" },
  { label: t("resources"), icon: LifeBuoy, path: "/beka/resources" }];

  const rightTabs = isAdmin ?
  [
  { label: "Team", icon: Users, path: "/beka/team" },
  { label: t("settings"), icon: Settings, path: "/beka/settings" }] :

  [
  { label: t("emergencyContacts"), icon: UserPlus, path: "/beka/contacts" },
  { label: t("settings"), icon: Settings, path: "/beka/settings" }];


  // Determine which tab "owns" the current route, so we can remember
  // the deepest URL (path + search + hash) the user reached inside it.
  const ownerTabPath = (() => {
    const p = location.pathname;
    if (p === "/beka/" || p === "/beka") return "/beka/";
    if (p.startsWith("/beka/contacts")) return "/beka/contacts";
    if (p.startsWith("/beka/settings")) return "/beka/settings";
    if (p.startsWith("/beka/resources")) return "/beka/resources";
    if (p.startsWith("/beka/cases")) return "/beka/cases";
    if (p.startsWith("/beka/team")) return "/beka/team";
    return null;
  })();

  useEffect(() => {
    if (ownerTabPath) {
      tabHistory.current[ownerTabPath] =
      location.pathname + location.search + location.hash;
    }
  }, [ownerTabPath, location.pathname, location.search, location.hash]);

  const isTabActive = (tab) => tab.path === ownerTabPath;

  const press = (tab) => {
    haptic.light();
    if (isTabActive(tab)) {
      // Tap active tab → reset that tab's stack to its root
      tabHistory.current[tab.path] = tab.path;
      navigate(tab.path, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Switch tab → restore last-visited URL for that tab, or root
      const saved = tabHistory.current[tab.path];
      navigate(saved || tab.path);
    }
  };

  return (
    <>
      {/* Footer nav — primary navigation, always visible */}
      <nav
        aria-label="Primary"
        className="flex-shrink-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        
        <div className="relative flex items-end h-[60px]">
          <div className="flex-1 flex">
            {leftTabs.map((tab) =>
            <TabItem key={tab.path} tab={tab} active={isTabActive(tab)} onPress={press} />
            )}
          </div>

          {/* Center Help button — survivors only (admins are dispatchers, not in distress).
              For admins, render nothing here so the 4 tabs spread evenly with no gap. */}
          {!isAdmin &&
          <div className="w-20 flex-shrink-0 flex justify-center">
            <button
              onClick={() => { haptic.medium(); navigate("/beka/panic"); }}
              aria-label="Help"
              className="relative -mt-5 w-14 h-14 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/40 flex flex-col items-center justify-center active:scale-90 transition-transform border-4 border-sidebar"
              style={{ transition: "transform 0.2s, scale 0.15s" }}>
              
              <AlertTriangle className="w-5 h-5 text-black" />
              <span className="text-[8px] font-bold text-black tracking-wider mt-0.5">{t("help")}</span>
              <span
                className="absolute inset-0 rounded-full bg-orange-300/50 animate-ping"
                style={{ animationDuration: "2.5s" }} />
            </button>
          </div>
          }

          <div className="flex-1 flex">
            {rightTabs.map((tab) =>
            <TabItem key={tab.path} tab={tab} active={isTabActive(tab)} onPress={press} />
            )}
          </div>
        </div>
      </nav>
    </>);

}

function TabItem({ tab, active, onPress }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onPress(tab)}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[44px] transition-colors active:scale-95 relative ${
      active ? "text-sidebar-primary" : "text-sidebar-foreground/55"}`
      }>
      
      <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
      <span className={`text-xs leading-none ${active ? "font-semibold" : "font-medium"}`}>
        {tab.label}
      </span>
      {active &&
      <motion.span
        layoutId="tab-dot"
        className="absolute bottom-0.5 w-1 h-1 rounded-full bg-sidebar-primary" />

      }
    </button>);

}