import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  ArrowRight,
  ShieldAlert,
  FileText,
  Lock,
  PhoneCall,
  Users,
  HeartHandshake,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api/client";

const QUICK_OVERVIEW_ITEMS = [
  {
    label: "Emergency Lines",
    description: "Police 991, 999, Fire 993, RTSA 983",
    route: "/beka/resources?tab=emergency_response",
    icon: PhoneCall,
    accent: "text-red-400 bg-red-500/15 border-red-500/30",
  },
  {
    label: "Counseling (933 / 116)",
    description: "Lifeline, Childline & MHUNZ NGO",
    route: "/beka/resources?tab=counseling",
    icon: HeartHandshake,
    accent: "text-teal-400 bg-teal-500/15 border-teal-500/30",
  },
  {
    label: "Safe Shelters",
    description: "YWCA, Social Welfare & 933 intake",
    route: "/beka/resources?tab=shelter",
    icon: ShieldAlert,
    accent: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  },
  {
    label: "Legal Aid Board",
    description: "Free/subsidized legal help (Mon–Fri)",
    route: "/beka/resources?tab=legal_aid",
    icon: FileText,
    accent: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  },
  {
    label: "Child Protection (116)",
    description: "24/7 youth abuse & online safety",
    route: "/beka/resources?tab=child_protection",
    icon: Users,
    accent: "text-pink-400 bg-pink-500/15 border-pink-500/30",
  },
  {
    label: "Evidence Vault",
    description: "Lock photos & harassment proof",
    route: "/beka/evidence",
    icon: Lock,
    accent: "text-purple-400 bg-purple-500/15 border-purple-500/30",
  },
];

const QUICK_PROMPTS = [
  "Emergency numbers",
  "Counseling 933 / 116",
  "Legal Aid Zambia",
  "Safe shelter",
  "Child protection",
];

export default function BekaAiAssistant() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const handleActionClick = (route) => {
    if (!route) return;
    if (route.startsWith("tel:") || route.startsWith("http")) {
      window.location.href = route;
    } else {
      navigate(route);
    }
  };

  const askGemini = async (customQuery) => {
    const q = (customQuery ?? input).trim();
    if (!q || loading) return;
    setLoading(true);
    if (!customQuery) setInput("");

    try {
      const res = await apiClient.integrations.Core.InvokeLLM({
        mode: "assistant",
        query: q,
      });
      setAiResponse(res);
    } catch {
      setAiResponse({
        urgent: false,
        reply: "Here are the quick-access helplines and safety tools available right now in BEKA:",
        actions: QUICK_OVERVIEW_ITEMS.slice(0, 4).map(({ label, description, route }) => ({
          label,
          description,
          route,
        })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-4 z-10 mt-2">
      <div className="rounded-2xl border border-orange-500/25 bg-zinc-950/90 backdrop-blur-md shadow-xl overflow-hidden">
        {/* Header Bar */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-500/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-orange-100 block leading-tight">
                BEKA Quick Guide AI
              </span>
              <span className="text-[10px] text-orange-300/70 block">
                Ask for helplines, shelter, legal aid, or safety tools
              </span>
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-orange-300/70" />
          ) : (
            <ChevronUp className="w-4 h-4 text-orange-300/70" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3.5 pb-3.5 space-y-3 border-t border-orange-500/15"
            >
              {aiResponse ? (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs space-y-2.5 ${
                    aiResponse.urgent
                      ? "bg-red-950/50 border-red-500/40 text-red-100"
                      : "bg-zinc-900/90 border-orange-500/20 text-zinc-200"
                  }`}
                >
                  <p className="leading-relaxed">{aiResponse.reply}</p>
                  <div className="space-y-1.5">
                    {(aiResponse.actions || []).map((act, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleActionClick(act.route)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-black/60 hover:bg-orange-500/15 border border-white/10 transition-colors text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-orange-200 text-xs truncate">
                            {act.label}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {act.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiResponse(null)}
                    className="text-[10px] text-orange-400/80 hover:text-orange-300 underline"
                  >
                    Show all shortcuts
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {QUICK_OVERVIEW_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => handleActionClick(item.route)}
                        className="flex flex-col items-start p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 transition-all text-left active:scale-[0.98]"
                      >
                        <div className={`p-1.5 rounded-lg border mb-1.5 ${item.accent}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-100 leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[9.5px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* One-tap Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={loading}
                    onClick={() => askGemini(chip)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border border-orange-500/25 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Ask Gemini Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askGemini();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for ambulance, legal aid, counseling..."
                  className="flex-1 bg-black/70 border border-orange-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Ask BEKA AI"
                  className="p-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-semibold transition-colors flex-shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
