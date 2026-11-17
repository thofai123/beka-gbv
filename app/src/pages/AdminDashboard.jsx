// Dedicated admin dashboard — operational command center, NO panic button.
// Simplified home: summary cards → cases requiring attention → active panic alerts → recent activity.
// Detailed views (incident map, evidence vault, accountability log, staff channel) remain
// fully accessible via the navigation — they are just not crowded onto the home screen.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Eye } from "lucide-react";
import AdminOperationsOverview from "../components/dashboard/AdminOperationsOverview";
import AdminCasesRequiringAttention from "../components/dashboard/AdminCasesRequiringAttention";
import AdminLiveAlertsFeed from "../components/dashboard/AdminLiveAlertsFeed";
import AdminRecentActivity from "../components/dashboard/AdminRecentActivity";

export default function AdminDashboard({ user }) {
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="flex flex-col items-center pb-24 lg:pb-8 w-full"
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "radial-gradient(ellipse at 50% 10%, #0a1228 0%, #050810 60%, #000 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(96,165,250,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 100%)",
        }}
      />

      {/* Welcome strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm px-6 pt-6 z-10"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] tracking-widest uppercase font-semibold text-orange-400/80">
            Admin Console
          </span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Welcome, {user?.full_name?.split(" ")[0] || "Admin"}
        </h1>
        <p className="text-[11px] text-white/50 mt-0.5">
          {now.toLocaleString("en-ZA", { weekday: "long", hour: "2-digit", minute: "2-digit" })} · Monitoring live
        </p>
        <a
          href="/beka/?preview=user"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-400/30 bg-orange-500/10 text-orange-300 text-[11px] font-semibold uppercase tracking-wider hover:bg-orange-500/20 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Preview user view
        </a>
      </motion.div>

      {/* Summary cards: Open Cases · Active Alerts · Awaiting Review · Resolved Today */}
      <AdminOperationsOverview />

      {/* Cases requiring attention */}
      <AdminCasesRequiringAttention tick={tick} />

      {/* Active panic alerts (realtime) */}
      <div className="w-full max-w-sm px-6 pb-4 z-10">
        <AdminLiveAlertsFeed user={user} tick={tick} />
      </div>

      {/* Recent activity */}
      <AdminRecentActivity tick={tick} />
    </div>
  );
}