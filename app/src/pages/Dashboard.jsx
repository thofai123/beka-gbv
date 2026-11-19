import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2, AlertTriangle, MapPin } from "lucide-react";
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
{ text: "Tamwena bene.", lang: "Kaonde" }];


export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [pressing, setPressing] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [panicPhase, setPanicPhase] = useState("idle"); // idle | sending
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  usePanicAlerts({ status: "triggered" }, { sort: "-created_date", limit: 5 });
  const { data: destinations = [] } = useEmergencyContacts({}, { sort: "priority", limit: 7 });

  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"], ["cases"]]);
  useLiveEntityInvalidation(EmergencyContactService, [["emergencyContacts"]]);

  useEffect(() => {
    const tagTimer = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, 3000);

    return () => {
      clearInterval(tagTimer);
    };
  }, []);

  const handlePanic = async () => {
    if (panicPhase !== "idle") return;
    haptic.panic();
    setPanicPhase("sending");

    // 1. Get location
    let loc = { lat: null, lng: null };
    try {
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      });
      loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {/* ignore */}

    const customTitle = (user?.emergency_title || "").trim() || "Emergency";
    const locationText = (loc.lat != null && loc.lng != null)
      ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
      : "Location not available — allow locations";

    // 2. Fire panic alert (existing flow)
    const chosenIds = getSelectedContactIds(destinations);
    submitPanic({ location_lat: loc.lat, location_lng: loc.lng, is_silent: false, selected_contact_ids: chosenIds });

    // 3. Show one toast per saved destination, plus the master alert
    toast({
      title: customTitle,
      description: locationText,
    });

    destinations.filter((d) => chosenIds.includes(d.id)).forEach((d, i) => {
      setTimeout(() => {
        toast({
          title: `${customTitle} → ${d.name}`,
          description: `${d.phone || "—"} · ${locationText}`,
        });
      }, (i + 1) * 350);
    });

    setPanicPhase("idle");
  };

  // Wait until we know who the user is — prevents the survivor panic button
  // from flashing for admins while auth.me() resolves.
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

  // Admins get a completely separate monitoring dashboard — no panic button.
  // Unless ?preview=user is set (lets admins preview the survivor view in a new tab).
  const previewAsUser = new URLSearchParams(window.location.search).get("preview") === "user";
  if (user?.role === "admin" && !previewAsUser) {
    return <AdminDashboard user={user} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-between pb-24 lg:pb-8"
      style={{
        minHeight: "100%",
        background: "#0a0200",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
      
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
          "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(251,146,60,0.08) 0%, transparent 70%)"
        }} />
      

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
          "linear-gradient(rgba(251,146,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)"
        }} />
      

      {/* Top section — survivors only */}
      {user?.role !== "admin" && (
      <div className="w-full max-w-sm px-6 pt-6 text-center z-10">
        <CriticalEscalationBanner user={user} />

        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-4">
          

          
          
          
          
        </div>

        {/* Rotating tagline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={taglineIndex}
            initial={{ opacity: 0, y: 14, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center">

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="block text-sm font-medium tracking-widest"
              style={{ color: "rgba(253,186,116,0.95)" }}>
              {TAGLINES[taglineIndex].text}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="block text-[11px] tracking-widest uppercase mt-1 font-semibold"
              style={{ color: "rgba(251,146,60,0.75)" }}>
              — {TAGLINES[taglineIndex].lang} —
            </motion.span>
          </motion.div>
        </AnimatePresence>

        {/* Active alert banner */}
        <AnimatePresence>
          
















          
        </AnimatePresence>
      </div>
      )}

      {/* Hero panic button — survivors only */}
      {user?.role !== "admin" && (
      <div className="flex flex-col items-center gap-5 flex-1 justify-center z-10 py-4">
        







        

        {/* Button container */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          {/* Animated pulse rings */}
          {[0, 1, 2].map((i) =>
          <motion.div
            key={i} className="bg-[hsl(var(--primary))] rounded-full absolute"

            style={{ border: "1px solid rgba(251,146,60,0.4)" }}
            initial={{ width: 200, height: 200, opacity: 0.6 }}
            animate={{ width: 280, height: 280, opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.6, ease: "easeOut", repeat: Infinity, repeatDelay: 1.8 - i * 0.6 }} />

          )}

          {/* Static glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
              boxShadow: "0 0 80px 20px rgba(251,146,60,0.18)"
            }} />
          

          {/* Outer ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 210,
              height: 210,
              border: "2px solid rgba(251,146,60,0.35)",
              boxShadow: "0 0 20px rgba(251,146,60,0.2)"
            }} />
          

          {/* The button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            disabled={panicPhase !== "idle"}
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => {setPressing(false);handlePanic();}}
            onMouseLeave={() => setPressing(false)}
            onTouchStart={() => setPressing(true)}
            onTouchEnd={() => {setPressing(false);handlePanic();}} className="bg-[hsl(var(--primary))] rounded-full relative z-10 flex flex-col items-center justify-center select-none focus:outline-none disabled:cursor-default"

            style={{
              width: 180,
              height: 180,
              background: pressing ?
              "radial-gradient(circle at 40% 35%, #fb923c, #c2410c)" :
              "radial-gradient(circle at 40% 35%, #fb923c, #ea580c)",
              boxShadow: pressing ?
              "0 0 0 4px rgba(251,146,60,0.85), 0 0 60px rgba(251,146,60,0.7), inset 0 2px 8px rgba(255,255,255,0.2)" :
              "0 0 0 3px rgba(251,146,60,0.6), 0 0 40px rgba(251,146,60,0.45), inset 0 2px 8px rgba(255,255,255,0.15)",
              transition: "box-shadow 0.15s, background 0.15s"
            }}>
            
            {panicPhase === "sending" ?
            <>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#000" }} />
                <span className="text-[10px] tracking-widest uppercase mt-2 font-semibold" style={{ color: "rgba(0,0,0,0.75)" }}>
                  {t("sending")}
                </span>
              </> :

            <>
                <span
                className="text-[10px] tracking-widest uppercase mb-1.5 font-semibold"
                style={{ color: "rgba(0,0,0,0.75)" }}>
                
                  {t("pressToGet")}
                </span>
                <span
                className="font-bold text-3xl tracking-wide"
                style={{ color: "#000" }}>
                
                  {t("help")}
                </span>
                <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }} className="mt-2 w-2 h-2 rounded-full hidden"

                style={{ background: "#fb923c" }} />
              
              </>
            }
          </motion.button>
        </div>

      </div>
      )}

      {/* Live indicator only — quick actions now live in footer */}
      <div className="w-full max-w-sm px-6 z-10 flex flex-col items-center hidden">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}>
          
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#fb923c" }} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(251,146,60,0.6)" }}>
            {t("liveNetwork")}
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#fb923c" }} />
        </motion.div>
      </div>
    </div>);

}