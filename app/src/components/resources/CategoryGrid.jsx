import { motion } from "framer-motion";
import { ShieldAlert, HeartHandshake, Home, Scale, MessageCircle, LifeBuoy, Baby } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const CATS = [
  { key: "vsu",                label: "VSU Units",          desc: "Victim support desks",      icon: ShieldAlert,    color: "#3b82f6" },
  { key: "osc",                label: "One-Stop Centers",   desc: "Integrated GBV support",    icon: HeartHandshake, color: "#a855f7" },
  { key: "shelter",            label: "Shelters",           desc: "Safe temporary refuge",     icon: Home,           color: "#22c55e" },
  { key: "child_protection",   label: "Child Protection",   desc: "Child safety support",      icon: Baby,           color: "#ec4899" },
  { key: "counseling",         label: "Counseling",         desc: "Trauma support",            icon: MessageCircle,  color: "#14b8a6" },
  { key: "legal_aid",          label: "Legal Aid",          desc: "Rights & case support",     icon: Scale,          color: "#f97316" },
  { key: "emergency_response", label: "Emergency Response", desc: "24/7 urgent help",          icon: LifeBuoy,       color: "#ef4444" },
];

// Convert "#rrggbb" → "rgba(r,g,b,alpha)"
function tint(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CategoryGrid({ active, counts, onSelect }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-3">
      {CATS.map((c, i) => {
        const Icon = c.icon;
        const isActive = active === c.key;
        return (
          <motion.button
            key={c.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(c.key)}
            className="relative text-left transition-all"
            style={{
              padding: 16,
              borderRadius: 16,
              minHeight: 120,
              background: isActive ? "rgba(232,75,29,0.05)" : "#ffffff",
              border: `1px solid ${isActive ? "#E84B1D" : "#e5e5e5"}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: tint(c.color, 0.1),
                    color: c.color,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {counts?.[c.key] != null && counts[c.key] > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      background: "#f0f0f0",
                      color: "#555",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {counts[c.key]}
                  </span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.25 }}>{c.label}</p>
                <p style={{ fontSize: 12, color: "#888", marginTop: 2, lineHeight: 1.35 }}>{c.desc}</p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}