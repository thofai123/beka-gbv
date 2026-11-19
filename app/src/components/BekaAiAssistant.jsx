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
  Phone,
  UserPlus,
} from "lucide-react";
import { apiClient } from "@/api/client";

const QUICK_OVERVIEW_ITEMS = [
  {
    label: "VSU & Police (991)",
    description: "Victim Support Unit & Police lines",
    route: "/beka/resources?tab=vsu",
    icon: ShieldAlert,
    accent: "text-red-400 bg-red-500/15 border-red-500/30",
  },
  {
    label: "Legal Aid Board",
    description: "Free/subsidized legal help & Form 32",
    route: "/beka/resources?tab=legal_aid",
    icon: FileText,
    accent: "text-amber-400 bg-amber-500/15 border-amber-500/30",
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
    icon: PhoneCall,
    accent: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  },
  {
    label: "Emergency Contacts",
    description: "Manage & prioritize SOS contacts",
    route: "/beka/contacts",
    icon: UserPlus,
    accent: "text-blue-400 bg-blue-500/15 border-blue-500/30",
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
  "Police / VSU",
  "Legal aid",
  "Safe shelter",
  "Counseling 933",
  "Child protection",
  "Emergency contacts",
];

// Instant 0ms local resolver aligned with every current app route & Zambian helpline
function resolveInstantGuide(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return null;

  if (/\b(police|vsu|cop|officer|arrest|station|991|999)\b/.test(q)) {
    return {
      urgent: true,
      reply:
        "Zambia Police & Victim Support Unit (VSU) are available 24/7 on toll-free 991, 999, or 0211-220006. You can call immediately or generate a Form 32 police statement.",
      actions: [
        { label: "Call Police / VSU Now (991)", description: "24/7 toll-free emergency dispatch", route: "tel:991", isCall: true },
        { label: "Call Police Desk (0211-220006)", description: "Direct Lusaka / National landline", route: "tel:0211220006", isCall: true },
        { label: "Open VSU Units Tab", description: "View Victim Support Unit contacts", route: "/beka/resources?tab=vsu" },
        { label: "Statement Builder (Form 32)", description: "Prepare your official police statement", route: "/beka/statement" },
      ],
    };
  }

  if (/\b(legal|lawyer|law|court|rights|advocate|statement|form\s*32|256454)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "The Legal Aid Board of Zambia provides free or subsidized legal representation (Mon–Fri, 8:00 AM – 5:00 PM) on +260 211 256454 and +260 977 123456. You can also draft a Form 32 statement or lock evidence in BEKA.",
      actions: [
        { label: "Call Legal Aid Board (+260 211 256454)", description: "Office line (Mon–Fri 8:00 AM – 5:00 PM)", route: "tel:+260211256454", isCall: true },
        { label: "Call Legal Aid Hotline (+260 977 123456)", description: "Direct mobile helpline", route: "tel:+260977123456", isCall: true },
        { label: "Open Legal Aid Resources", description: "View Legal Aid Board details", route: "/beka/resources?tab=legal_aid" },
        { label: "Statement Builder (Form 32)", description: "Generate official legal/police statement", route: "/beka/statement" },
      ],
    };
  }

  if (/\b(shelter|safe\s*house|refuge|accommodation|homeless|flee|stay|ywca)\b/.test(q)) {
    return {
      urgent: true,
      reply:
        "Safe shelters and emergency refuge in Zambia are coordinated confidentially 24/7 through Lifeline (933), Childline (116), YWCA Zambia, and Social Welfare.",
      actions: [
        { label: "Call Shelter Intake (933)", description: "24/7 confidential screening & placement", route: "tel:933", isCall: true },
        { label: "Call Youth Shelter Line (116)", description: "24/7 toll-free Childline intake", route: "tel:116", isCall: true },
        { label: "Open Safe Shelters Tab", description: "View refuge coordination details", route: "/beka/resources?tab=shelter" },
      ],
    };
  }

  if (/\b(counsel|mental|depress|suicid|stress|grief|trauma|therapy|talk|933)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "Free, confidential 24/7 counseling is available via Lifeline Zambia (933) for adults, Childline Zambia (116) for youth, and Mental Health Users Network of Zambia (+260 21 123 7191).",
      actions: [
        { label: "Call Lifeline Zambia (933)", description: "24/7 toll-free adult counseling", route: "tel:933", isCall: true },
        { label: "Call MHUNZ (+260 21 123 7191)", description: "Mental health support NGO", route: "tel:+260211237191", isCall: true },
        { label: "Open Counseling Tab", description: "View all counseling lines", route: "/beka/resources?tab=counseling" },
      ],
    };
  }

  if (/\b(child|kid|youth|teen|minor|bully|marriage|116)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "Childline Zambia (116) provides free, 24/7 confidential counseling, rescue referrals, and online safety support for children and young people.",
      actions: [
        { label: "Call Childline Zambia (116)", description: "24/7 toll-free child & youth line", route: "tel:116", isCall: true },
        { label: "Open Child Protection Tab", description: "View child protection services", route: "/beka/resources?tab=child_protection" },
      ],
    };
  }

  if (/\b(ambulance|medical|hospital|hurt|injur|bleed|fire|accident|rtsa|993|983)\b/.test(q)) {
    return {
      urgent: true,
      reply:
        "For urgent medical/ambulance dispatch call 991 (or 0211-220180), Zambia Fire Brigade on 993, or RTSA Road Safety on 983.",
      actions: [
        { label: "Call Ambulance / Medical (991)", description: "24/7 toll-free emergency medical", route: "tel:991", isCall: true },
        { label: "Call Fire Brigade (993)", description: "24/7 toll-free fire & rescue", route: "tel:993", isCall: true },
        { label: "Open Emergency Response Tab", description: "All 991, 999, 993 & 983 lines", route: "/beka/resources?tab=emergency_response" },
      ],
    };
  }

  if (/\b(contact|trusted|family|friend|phone\s*book|sos|alert)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "You can add up to 5 trusted contacts directly from your phone's address book or manually, set their alert priority, and trigger an SOS alert from the Home screen.",
      actions: [
        { label: "Manage Emergency Contacts", description: "Pick from phone or set priority order", route: "/beka/contacts" },
        { label: "Go to Home SOS Button", description: "Send live GPS alert to contacts", route: "/beka/" },
      ],
    };
  }

  if (/\b(evidence|vault|photo|screenshot|proof|upload|record|report)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "Use the encrypted Evidence Vault to safely lock photos, screenshots, and documents, or submit a formal incident report.",
      actions: [
        { label: "Open Evidence Vault", description: "Upload & lock proof securely", route: "/beka/evidence" },
        { label: "Report an Incident", description: "Log a new GBV/TFGBV incident", route: "/beka/report" },
      ],
    };
  }

  if (/\b(logout|log\s*out|sign\s*out|setting|password|profile|language)\b/.test(q)) {
    return {
      urgent: false,
      reply:
        "You can manage your profile, privacy preferences, language, or log out from the Settings tab.",
      actions: [
        { label: "Open Settings", description: "Profile, privacy, language & Log Out", route: "/beka/settings" },
      ],
    };
  }

  return null;
}

export default function BekaAiAssistant() {
  const navigate = useNavigate();
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

  const askGuide = async (customQuery) => {
    const q = (customQuery ?? input).trim();
    if (!q || loading) return;
    if (!customQuery) setInput("");

    // 1. Instant 0ms local match for app tools & Zambian helplines
    const instant = resolveInstantGuide(q);
    if (instant) {
      setAiResponse(instant);
      return;
    }

    // 2. Fallback to Gemini backend for nuanced questions
    setLoading(true);
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
    <div className="w-full max-w-sm z-10">
      <div className="rounded-2xl border border-orange-500/25 bg-zinc-950/95 backdrop-blur-md shadow-xl overflow-hidden">
        {/* Static Header Bar (no dropdown collapse) */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-orange-500/15">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-orange-100 block leading-tight">
              BEKA Quick Guide AI
            </span>
            <span className="text-[10px] text-orange-300/70 block">
              Type &ldquo;Police&rdquo;, &ldquo;Legal&rdquo;, &ldquo;Shelter&rdquo;, or tap a shortcut
            </span>
          </div>
        </div>

        <div className="px-3.5 pb-3.5 space-y-3">
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
                {(aiResponse.actions || []).map((act, idx) => {
                  const isDirectCall = act.isCall || act.route?.startsWith("tel:");
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleActionClick(act.route)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors text-left ${
                        isDirectCall
                          ? "bg-[#E84B1D]/20 hover:bg-[#E84B1D]/30 border-[#E84B1D]/50"
                          : "bg-black/60 hover:bg-orange-500/15 border-white/10"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-orange-100 text-xs truncate">
                          {act.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {act.description}
                        </div>
                      </div>
                      {isDirectCall ? (
                        <Phone className="w-4 h-4 text-[#E84B1D] flex-shrink-0" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
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
                onClick={() => askGuide(chip)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border border-orange-500/25 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Ask AI Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askGuide();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type Police, Legal, Shelter, Evidence..."
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
        </div>
      </div>
    </div>
  );
}
