import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner({ isOffline, pendingCount = 0 }) {
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-orange-500/10 border border-orange-300 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <WifiOff className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-orange-800">You're offline — showing cached data</p>
            <p className="text-[11px] text-orange-700">
              {pendingCount > 0
                ? `${pendingCount} note${pendingCount > 1 ? "s" : ""} queued — will sync when connection is restored.`
                : "Notes you add will be saved and synced automatically when you reconnect."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}