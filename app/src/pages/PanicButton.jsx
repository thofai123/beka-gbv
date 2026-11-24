// AI Help tab: BEKA Quick Guide AI & instant system/helpline navigation.

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BekaAiAssistant from "@/components/BekaAiAssistant";
import {
  MapPin,
  CheckCircle,
  Loader2,
  WifiOff,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";
import {
  submitPanic,
  pendingCount,
  drainQueue,
} from "@/lib/emergencyQueue";

export default function PanicButton() {
  const { toast } = useToast();
  const routerLocation = useLocation();
  const [phase, setPhase] = useState("idle"); // idle | sending | success | queued
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);
  const [queued, setQueued] = useState(0);
  const watchId = useRef(null);

  useEffect(() => {
    pendingCount().then(setQueued);
    const onOnline = async () => {
      const { drained } = await drainQueue();
      if (drained > 0) {
        toast({ title: `${drained} queued alert(s) sent`, description: "Connection restored." });
      }
      pendingCount().then(setQueued);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [toast]);

  useEffect(() => {
    if (routerLocation.state?.autoTrigger) {
      haptic.panic();
      execute();
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const execute = async () => {
    setPhase("sending");

    let loc = { lat: null, lng: null, captured_at: null };
    try {
      if (!navigator.geolocation) throw new Error("GPS is not supported on this device.");
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        captured_at: new Date().toISOString(),
      };
      setLocation(loc);
    } catch (err) {
      toast({
        title: "Location not captured",
        description: err?.message || "Please allow GPS access. The alert will still be sent without fake coordinates.",
        variant: "destructive",
      });
    }

    const res = await submitPanic({
      location_lat: loc.lat,
      location_lng: loc.lng,
      location_captured_at: loc.captured_at,
      is_silent: false,
    });

    if (res.sent) {
      setResult(res.response);
      setPhase("success");

      const caseId = res.response?.case_id;
      if (navigator.geolocation && caseId) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(newLoc);
            apiClient.functions
              .invoke("updateLiveLocation", {
                case_id: caseId,
                lat: newLoc.lat,
                lng: newLoc.lng,
              })
              .catch(() => {});
          },
          null,
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }
      haptic.success();
      toast({
        title: res.response?.delivery?.channels_failed
          ? "Alert escalated to admins"
          : "Alert sent",
        description: `Case ${res.response?.case_ref}. Responders and emergency contacts notified.`,
      });
    } else {
      setPhase("queued");
      pendingCount().then(setQueued);
      haptic.success();
      toast({
        title: "Saved offline",
        description: "Will send automatically when connection is restored.",
      });
    }
  };

  const reset = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setPhase("idle");
    setLocation(null);
    setResult(null);
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] px-4 py-4">
      {queued > 0 && phase === "idle" && (
        <div className="mb-4 text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> {queued} alert(s) waiting to send
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Alert Delivered</h2>
              <p className="text-muted-foreground mt-2">
                {result?.delivery?.channels_failed
                  ? "All channels failed — admins notified for manual dispatch."
                  : "Responders and your emergency contacts have been notified."}
              </p>
              {result?.case_ref && (
                <p className="text-xs font-mono text-muted-foreground mt-2">Case {result.case_ref}</p>
              )}
              {location?.lat && (
                <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={reset}>
              Done
            </Button>
          </motion.div>
        )}

        {phase === "queued" && (
          <motion.div
            key="queued"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <WifiOff className="w-12 h-12 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Saved Offline</h2>
              <p className="text-muted-foreground mt-2">
                Your alert is saved on this device and will send when you reconnect.
              </p>
            </div>
            <Button variant="outline" onClick={reset}>
              Done
            </Button>
          </motion.div>
        )}

        {phase === "sending" && (
          <motion.div
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center mx-auto panic-pulse">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold">Sending alert...</h2>
            <p className="text-muted-foreground text-sm">
              Notifying responders &amp; emergency contacts
            </p>
          </motion.div>
        )}

        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 w-full flex flex-col items-center"
          >
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">BEKA AI Help</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Instant access to helplines, legal aid, police VSU &amp; safety tools.
              </p>
            </div>

            <BekaAiAssistant />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
