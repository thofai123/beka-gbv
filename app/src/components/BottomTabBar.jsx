import { useLocation, useNavigate } from "react-router-dom";
import { Home, UserPlus, LifeBuoy, Settings, Sparkles, FileText, Users } from "lucide-react";
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
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

  const adminTabs = [
    { label: t("home"), icon: Home, path: "/beka/" },
    { label: "Cases", icon: FileText, path: "/beka/cases" },
    { label: t("resources"), icon: LifeBuoy, path: "/beka/resources" },
    { label: "Team", icon: Users, path: "/beka/team" },
    { label: t("settings"), icon: Settings, path: "/beka/settings" },
  ];

  const survivorLeftTabs = [
    { label: t("home"), icon: Home, path: "/beka/" },
    { label: t("resources"), icon: LifeBuoy, path: "/beka/resources" },
  ];

  const survivorRightTabs = [
    { label: t("emergencyContacts"), icon: UserPlus, path: "/beka/contacts" },
    { label: t("settings"), icon: Settings, path: "/beka/settings" },
  ];

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
      tabHistory.current[tab.path] = tab.path;
      navigate(tab.path, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const saved = tabHistory.current[tab.path];
      navigate(saved || tab.path);
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="flex-shrink-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {isAdmin ? (
        <div className="max-w-2xl mx-auto grid grid-cols-5 items-center h-[62px] px-2 gap-1">
          {adminTabs.map((tab) => (
            <TabItem key={tab.path} tab={tab} active={isTabActive(tab)} onPress={press} />
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto relative flex items-end h-[60px] px-2">
          <div className="flex-1 flex gap-1">
            {survivorLeftTabs.map((tab) => (
              <TabItem key={tab.path} tab={tab} active={isTabActive(tab)} onPress={press} />
            ))}
          </div>

          <div className="w-20 flex-shrink-0 flex justify-center">
            <button
              onClick={() => { haptic.medium(); navigate("/beka/panic"); }}
              aria-label="AI Help"
              className="relative -mt-5 w-14 h-14 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/40 flex flex-col items-center justify-center active:scale-90 transition-transform border-4 border-sidebar"
              style={{ transition: "transform 0.2s, scale 0.15s" }}
            >
              <Sparkles className="w-5 h-5 text-black" />
              <span className="text-[8px] font-bold text-black tracking-tight mt-0.5">AI Help</span>
              <span
                className="absolute inset-0 rounded-full bg-orange-300/50 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
            </button>
          </div>

          <div className="flex-1 flex gap-1">
            {survivorRightTabs.map((tab) => (
              <TabItem key={tab.path} tab={tab} active={isTabActive(tab)} onPress={press} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function TabItem({ tab, active, onPress }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onPress(tab)}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={`w-full flex-1 flex flex-col items-center justify-center py-2 px-1 gap-1 min-h-[46px] rounded-xl transition-colors active:scale-95 relative ${
        active
          ? "text-sidebar-primary bg-sidebar-primary/10"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5"
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[11px] leading-none truncate max-w-full ${active ? "font-semibold" : "font-medium"}`}>
        {tab.label}
      </span>
      {active && (
        <motion.span
          layoutId="tab-dot"
          className="absolute bottom-1 w-1 h-1 rounded-full bg-sidebar-primary"
        />
      )}
    </button>
  );
}
