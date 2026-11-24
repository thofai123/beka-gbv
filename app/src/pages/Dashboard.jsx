import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, MessageSquare, Phone, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CriticalEscalationBanner from "../components/CriticalEscalationBanner";
import AdminDashboard from "./AdminDashboard";
import { useToast } from "@/components/ui/use-toast";
import { haptic } from "@/lib/haptics";
import { submitPanic, getSelectedContactIds } from "@/lib/emergencyQueue";
import { useLanguage } from "@/lib/LanguageContext";
import { useCurrentUser, useEmergencyContacts, useLiveEntityInvalidation, usePanicAlerts } from "@/hooks/useEntityQueries";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { PanicAlertService } from "@/services/PanicAlertService";

const TAGLINES = [
  { text: "Tapali ukwikalafye.", lang: "Bemba" },
  { text: "Simuli nokha.", lang: "Nyanja" },
  { text: "Tamuli yeka yeka.", lang: "Tonga" },
  { text: "Ha mu inzi mwanaa.", lang: "Lozi" },
  { text: "Tamwena bene.", lang: "Kaonde" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [pressing, setPressing] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [panicPhase, setPanicPhase] = useState("idle"); // idle | sending
  const [dispatchSummary, setDispatchSummary] = useState(null);
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  usePanicAlerts({ status: "triggered" }, { sort: "-created_date", limit: 5 });
  const { data: destinations = [] } = useEmergencyContacts({}, { sort: "priority", limit: 7 });

  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"], ["cases"]]);
  useLiveEntityInvalidation(EmergencyContactService, [["emergencyContacts"]]);

  useEffect(() => {
    const tagTimer = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(tagTimer);
  }, []);

  const handlePanic = async () => {
    if (panicPhase !== "idle") return;
    haptic.panic();
    setPanicPhase("sending");

    try {
      let loc = { lat: null, lng: null, captured_at: null };
      try {
        if (navigator.geolocation) {
          const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 10000,
            });
          });
          loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            captured_at: new Date().toISOString(),
          };
        }
      } catch {
        /* proceed without coordinates */
      }

      const customTitle = (user?.emergency_title || "").trim() || "Emergency Alert";
      const mapsLink =
        loc.lat != null && loc.lng != null
          ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
          : null;
      const locationText =
        loc.lat != null && loc.lng != null
          ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
          : "Location unavailable (enable GPS)";

      const chosenIds = getSelectedContactIds(destinations);
      const chosenContacts = destinations.filter((d) => chosenIds.includes(d.id));
      const result = await submitPanic({
        location_lat: loc.lat,
        location_lng: loc.lng,
        location_captured_at: loc.captured_at,
        is_silent: false,
        selected_contact_ids: chosenIds,
      });

      const resp = result?.response || {};
      const caseRef = resp.case_ref || "SOS-QUEUED";
      const resolvedContacts = resp.contacts?.length ? resp.contacts : chosenContacts;
      const smsDelivered = Number(resp.contacts_notified || 0);
      const fallbackMessage =
        resp.sms_message ||
        `BEKA EMERGENCY [${caseRef}]: ${user?.full_name || user?.email || "User"} needs urgent help!${mapsLink ? " Location: " + mapsLink : ""}`;

      haptic.success();
      toast({
        title: result?.sent ? `🚨 ${customTitle} Sent (${caseRef})` : "Alert Saved Offline",
        description: result?.sent
          ? (smsDelivered > 0
              ? `SMS automatically sent to ${smsDelivered} contact(s) · ${locationText}`
              : `Responders alerted · ${locationText}`)
          : "Will auto-send as soon as internet reconnects.",
      });

      setDispatchSummary({
        caseRef,
        sent: !!result?.sent,
        locationText,
        mapsLink,
        smsMessage: fallbackMessage,
        contacts: resolvedContacts,
        smsDelivered,
      });
    } catch (err) {
      toast({
        title: "Alert error",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPanicPhase("idle");
    }
  };

  if (loadingUser) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}
      >
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const previewAsUser = new URLSearchParams(window.location.search).get("preview") === "user";
  if (user?.role === "admin" && !previewAsUser) {
    return <AdminDashboard user={user} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-between pb-24 lg:pb-8 relative"
      style={{
        minHeight: "100%",
        background: "#0a0200",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(251,146,60,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(251,146,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      {/* Top section — survivors only */}
      {user?.role !== "admin" && (
        <div className="w-full max-w-sm px-6 pt-5 text-center z-10 space-y-3">
          <CriticalEscalationBanner user={user} />

          {/* Rotating tagline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 14, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <span
                className="block text-sm font-medium tracking-widest"
                style={{ color: "rgba(253,186,116,0.95)" }}
              >
                {TAGLINES[taglineIndex].text}
              </span>
              <span
                className="block text-[11px] tracking-widest uppercase mt-1 font-semibold"
                style={{ color: "rgba(251,146,60,0.75)" }}
              >
                — {TAGLINES[taglineIndex].lang} —
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Live Emergency Dispatch Confirmation & 1-Tap Device SMS / WhatsApp Fallback */}
          {dispatchSummary && (
            <div className="text-left rounded-2xl border border-emerald-500/40 bg-zinc-950/95 p-3.5 shadow-xl space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Alert Active · <span className="font-mono text-orange-400">{dispatchSummary.caseRef}</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-orange-400" /> {dispatchSummary.locationText}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchSummary(null)}
                  className="text-zinc-500 hover:text-white p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {dispatchSummary.contacts?.length > 0 ? (
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                      Automatic SMS Alerts ({dispatchSummary.smsDelivered}/{dispatchSummary.contacts.length}):
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      <MessageSquare className="w-3 h-3" /> {dispatchSummary.sent ? "Dispatched" : "Queued"}
                    </span>
                  </div>
                  {dispatchSummary.contacts.map((c, idx) => (
                    <div key={c.id || idx} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
                        <p className="text-[10px] font-mono text-zinc-400">{c.phone}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 flex-shrink-0">
                        {dispatchSummary.sent ? "SMS Sent" : "Queued"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="text-[11px] text-zinc-400">Admin &amp; VSU alerted in-app.</span>
                  <a
                    href="tel:991"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold"
                  >
                    <Phone className="w-3 h-3" /> Call 991
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hero panic button — survivors only */}
      {user?.role !== "admin" && (
        <div className="flex flex-col items-center gap-5 flex-1 justify-center z-10 py-4">
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-[hsl(var(--primary))] rounded-full absolute pointer-events-none"
                style={{ border: "1px solid rgba(251,146,60,0.4)" }}
                initial={{ width: 200, height: 200, opacity: 0.6 }}
                animate={{ width: 280, height: 280, opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.6, ease: "easeOut", repeat: Infinity, repeatDelay: 1.8 - i * 0.6 }}
              />
            ))}

            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 220,
                height: 220,
                background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
                boxShadow: "0 0 80px 20px rgba(251,146,60,0.18)",
              }}
            />

            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 210,
                height: 210,
                border: "2px solid rgba(251,146,60,0.35)",
                boxShadow: "0 0 20px rgba(251,146,60,0.2)",
              }}
            />

            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              disabled={panicPhase !== "idle"}
              onPointerDown={() => setPressing(true)}
              onPointerUp={() => setPressing(false)}
              onPointerLeave={() => setPressing(false)}
              onClick={handlePanic}
              className="bg-[hsl(var(--primary))] rounded-full relative z-10 flex flex-col items-center justify-center select-none focus:outline-none disabled:cursor-default"
              style={{
                width: 180,
                height: 180,
                background: pressing
                  ? "radial-gradient(circle at 40% 35%, #fb923c, #c2410c)"
                  : "radial-gradient(circle at 40% 35%, #fb923c, #ea580c)",
                boxShadow: pressing
                  ? "0 0 0 4px rgba(251,146,60,0.85), 0 0 60px rgba(251,146,60,0.7), inset 0 2px 8px rgba(255,255,255,0.2)"
                  : "0 0 0 3px rgba(251,146,60,0.6), 0 0 40px rgba(251,146,60,0.45), inset 0 2px 8px rgba(255,255,255,0.15)",
                transition: "box-shadow 0.15s, background 0.15s",
              }}
            >
              {panicPhase === "sending" ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#000" }} />
                  <span className="text-[10px] tracking-widest uppercase mt-2 font-semibold" style={{ color: "rgba(0,0,0,0.75)" }}>
                    {t("sending")}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="text-[10px] tracking-widest uppercase mb-1.5 font-semibold"
                    style={{ color: "rgba(0,0,0,0.75)" }}
                  >
                    {t("pressToGet")}
                  </span>
                  <span className="font-bold text-3xl tracking-wide" style={{ color: "#000" }}>
                    {t("help")}
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
