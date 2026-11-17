import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import { useRef, useCallback, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import QuickExitButton from "./QuickExitButton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

const SUB_PAGES = ["/beka/cases/", "/beka/report", "/beka/evidence", "/beka/statement", "/beka/analytics", "/beka/team", "/beka/settings", "/beka/panic", "/beka/messages"];

const PAGE_TITLES = {
  "/beka/": "Home",
  "/beka/resources": "Resources",
  "/beka/settings": "Settings",
  "/beka/report": "Report",
  "/beka/cases": "Cases",
  "/beka/messages": "Messages",
  "/beka/analytics": "Analytics",
  "/beka/team": "Team",
  "/beka/evidence": "Evidence",
  "/beka/statement": "Statement",
  "/beka/panic": "Help",
  "/beka/alerts-map": "Alerts",
  "/beka/security": "Security",
  "/beka/response-units": "Response Units",
  "/beka/contacts": "Contacts",
  "/admin": "Admin",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match longest known prefix
  const match = Object.keys(PAGE_TITLES)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "";
}

export default function Layout({ children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isSubPage = location.pathname !== "/beka/" && location.pathname !== "/" && location.pathname !== "/admin";
  const queryClient = useQueryClient();
  const touchStartY = useRef(0);
  const mainRef = useRef(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleTouchStart = useCallback((e) => {
    if (mainRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current) return;
    const delta = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setPullDistance(Math.min(delta * 0.4, 60));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= 55) {
      setRefreshing(true);
      await queryClient.invalidateQueries();
      setTimeout(() => setRefreshing(false), 600);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, queryClient]);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-black justify-center">
      {/* Phone-width column — fills full screen on mobile, max-w-md on desktop */}
      <div className="flex flex-col w-full max-w-full sm:max-w-md h-full overflow-hidden relative bg-black">
        {/* Universal app header — sticky native-style */}
        <div
          className="flex items-center justify-between gap-3 px-4 bg-sidebar/95 backdrop-blur-md text-sidebar-foreground border-b border-sidebar-border flex-shrink-0 z-30"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)", paddingBottom: "0.5rem" }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {isSubPage && (
              <button
                onClick={() => {
                  if (window.history.length > 1) navigate(-1);
                  else navigate("/beka/");
                }}
                aria-label="Back"
                className="flex items-center gap-1 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground active:scale-90 transition-transform min-h-[40px] min-w-[40px] -ml-2 px-2 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-base font-semibold tracking-tight truncate">
              {pageTitle}
            </h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 text-[9px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
          <QuickExitButton />
        </div>
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || refreshing) &&
        <div className="flex justify-center py-2 transition-all" style={{ height: refreshing ? 40 : pullDistance * 0.67 }}>
            <div className={`w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full ${refreshing ? 'animate-spin' : ''}`} style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 4}deg)` }} />
          </div>
        }
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden w-full pb-20"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          
          {children || <Outlet />}
        </main>
        <BottomTabBar />
      </div>
    </div>);

}