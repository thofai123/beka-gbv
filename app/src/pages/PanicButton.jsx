// 1-tap panic button with selective emergency contact alerting.

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiClient } from "@/api/client";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  CircleAlert,
  MapPin,
  Shield,
  CheckCircle,
  Loader2,
  WifiOff,
  Clock,
  Users,
  ChevronRight,
  CheckSquare,
  Square,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";
import {
  submitPanic,
  pendingCount,
  drainQueue,
  getSelectedContactIds,
  setSelectedContactIds,
} from "@/lib/emergencyQueue";

export default function PanicButton() {
  const { toast } = useToast();
  const routerLocation = useLocation();
  const [silentMode, setSilentMode] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | sending | success | queued
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);
  const [queued, setQueued] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const watchId = useRef(null);

  useEffect(() => {
    pendingCount().then(setQueued);
    EmergencyContactService.list("priority")
      .then((items) => {
        const list = Array.isArray(items) ? items : [];
        setContacts(list);
        setSelectedIds(getSelectedContactIds(list));
      })
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem("safeguard_emergency_contacts") || "[]");
          setContacts(cached);
          setSelectedIds(getSelectedContactIds(cached));
        } catch {
          setContacts([]);
          setSelectedIds([]);
        }
      })
      .finally(() => setLoadingContacts(false));

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

  const toggleContact = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setSelectedContactIds(next);
      return next;
    });
  };

  const selectAllContacts = () => {
    const all = contacts.map((c) => c.id);
    setSelectedIds(all);
    setSelectedContactIds(all);
  };

  // Auto-trigger when navigated from Dashboard HELP button
  useEffect(() => {
    if (routerLocation.state?.autoTrigger) {
      haptic.panic();
      execute();
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPanic = () => {
    haptic.panic();
    execute();
  };

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
      is_silent: silentMode,
      selected_contact_ids: selectedIds,
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
      if (!silentMode) {
        toast({
          title: res.response?.delivery?.channels_failed
            ? "Alert escalated to admins"
            : "Alert sent",
          description: `Case ${res.response?.case_ref}. ${selectedIds.length} selected contact(s) & responders notified.`,
        });
      }
    } else {
      setPhase("queued");
      pendingCount().then(setQueued);
      haptic.success();
      if (!silentMode) {
        toast({
          title: "Saved offline",
          description: "Will send automatically when connection is restored.",
        });
      }
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
                  : `Responders and ${selectedIds.length} selected contact(s) have been notified.`}
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
                Your alert is encrypted on this device and will send the moment you reconnect.
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
              Notifying responders & {selectedIds.length} selected contact(s)
            </p>
          </motion.div>
        )}

        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 w-full"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Emergency Alert</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                One tap notifies responders & your chosen contacts.
              </p>
            </div>

            <button
              onClick={startPanic}
              className="w-44 h-44 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-200 flex items-center justify-center mx-auto panic-pulse shadow-2xl shadow-red-500/30 group"
            >
              <div className="text-center">
                <CircleAlert className="w-14 h-14 text-white mx-auto group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold text-sm mt-2 block">PANIC</span>
              </div>
            </button>

            {/* Silent Mode Card */}
            <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Silent Mode</Label>
                </div>
                <Switch checked={silentMode} onCheckedChange={setSilentMode} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                No visible confirmation — sent discreetly.
              </p>
            </div>

            {/* Selective Emergency Contacts Card (Fixed /beka/contacts route + inline selection) */}
            <div className="max-w-xs mx-auto bg-card border border-border rounded-xl overflow-hidden text-left">
              <button
                type="button"
                onClick={() => setContactsExpanded((v) => !v)}
                className="w-full p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedIds.length > 0
                      ? "bg-green-500/15 text-green-500"
                      : "bg-orange-500/15 text-orange-500"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {loadingContacts
                      ? "Loading contacts..."
                      : contacts.length > 0
                      ? `${selectedIds.length} of ${contacts.length} contact${contacts.length > 1 ? "s" : ""} selected`
                      : "Contacts to be alerted"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {contacts.length > 0
                      ? "Tap to choose who gets alerted on SOS"
                      : "Add loved ones to notify with live location"}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                    contactsExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {contactsExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border space-y-2.5">
                  {contacts.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Select contacts to alert:</span>
                        {selectedIds.length < contacts.length && (
                          <button
                            type="button"
                            onClick={selectAllContacts}
                            className="text-primary hover:underline font-medium"
                          >
                            Select all
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {contacts.map((c) => {
                          const checked = selectedIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleContact(c.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                                checked
                                  ? "bg-primary/10 border-primary/40"
                                  : "bg-background/60 border-border opacity-70"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-semibold truncate">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {c.phone}
                                </p>
                              </div>
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No emergency contacts saved yet.
                    </p>
                  )}

                  <Link
                    to="/beka/contacts"
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {contacts.length > 0 ? "Manage / Add Contacts" : "Add Emergency Contacts"}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
