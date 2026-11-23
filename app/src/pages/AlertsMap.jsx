import { resolveFileUrl } from "@/lib/file-url";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  MapPin,
  Radio,
  Clock,
  User,
  Phone,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  FileText,
  Camera
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import {
  useCases,
  useCurrentUser,
  useLiveEntityInvalidation,
  usePanicAlerts,
} from "@/hooks/useEntityQueries";
import { PanicAlertService } from "@/services/PanicAlertService";
import { PanicAlertWorkflowService } from "@/services/PanicAlertWorkflowService.js";
import { ACTIVE_PANIC_ALERT_STATUSES } from "@/constants/appConstants";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const panicIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(239,68,68,0.45);"></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

export default function AlertsMap() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("active"); // active | acknowledged | resolved
  const [selectedMapAlert, setSelectedMapAlert] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data: alerts = [], isLoading: loadingAlerts } = usePanicAlerts({}, { sort: "-created_date", limit: 300 });
  const { data: cases = [] } = useCases({}, { sort: "-created_date", limit: 300 });
  const { data: user, isLoading: loadingUser } = useCurrentUser();

  const handleAlertEvent = useCallback(
    (event) => {
      if (event.type === "create") {
        toast({
          title: "🚨 New Emergency Alert",
          description: "A new SOS alert has been logged in the queue.",
        });
      }
    },
    [toast]
  );

  useLiveEntityInvalidation(
    PanicAlertService,
    [["panicAlerts"], ["cases"], ["caseUpdates"], ["notifications"]],
    handleAlertEvent
  );

  // Map linked_case_id -> Case object so every alert displays its unique GBV-2026-XXXX ID
  const caseById = useMemo(() => {
    const map = new Map();
    for (const c of cases) {
      if (c.id) map.set(c.id, c);
    }
    return map;
  }, [cases]);

  const enrichedAlerts = useMemo(() => {
    return alerts.map((a) => {
      const linkedCase = a.linked_case_id ? caseById.get(a.linked_case_id) : null;
      return {
        ...a,
        linkedCase,
        displayCaseId: linkedCase?.case_id || `ALERT-${String(a.id || "").slice(0, 6).toUpperCase()}`,
      };
    });
  }, [alerts, caseById]);

  const filtered = useMemo(() => {
    return enrichedAlerts
      .filter((a) => {
        if (filter === "active") return a.status === "triggered" || a.status === "escalated";
        if (filter === "acknowledged") return a.status === "acknowledged" || a.status === "responded";
        return a.status === "resolved";
      })
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  }, [enrichedAlerts, filter]);

  const activeCount = enrichedAlerts.filter((a) => a.status === "triggered" || a.status === "escalated").length;
  const awaitingCount = enrichedAlerts.filter((a) => a.status === "acknowledged" || a.status === "responded").length;
  const resolvedCount = enrichedAlerts.filter((a) => a.status === "resolved").length;
  const canManage = user?.role === "admin" || user?.role === "responder";

  const handleAcknowledgeToReview = async (alert) => {
    setBusyId(alert.id);
    try {
      await PanicAlertWorkflowService.acknowledge(alert, user?.email);
      toast({
        title: `${alert.displayCaseId} Acknowledged`,
        description: "Moved to Awaiting Review.",
      });
      if (selectedMapAlert?.id === alert.id) {
        setSelectedMapAlert(null);
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loadingAlerts || loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Active Alerts Queue</h1>
            <p className="text-xs text-muted-foreground">
              Tap an alert to view its GPS map pin or Acknowledge → Awaiting Review
            </p>
          </div>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            filter === "active" ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          Active Alerts ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("acknowledged")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            filter === "acknowledged" ? "bg-amber-500 text-black" : "bg-muted text-muted-foreground"
          }`}
        >
          Awaiting Review ({awaitingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            filter === "resolved" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Chronological Unique Case Alert List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No alerts in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const hasCoords = alert.location_lat != null && alert.location_lng != null;
            const phone = alert.phone || alert.user_phone || alert.linkedCase?.survivor_contact;
            const sender = alert.user_name || alert.linkedCase?.survivor_name || alert.created_by || "Unknown User";
            const isBusy = busyId === alert.id;
            const alertPhotos = [
              ...(Array.isArray(alert.attachments) ? alert.attachments : []),
              ...(Array.isArray(alert.linkedCase?.attachments) ? alert.linkedCase.attachments : []),
            ].filter((u) => /^data:image\//i.test(String(u || "")) || /\.(png|jpe?g|gif|webp|heic)$/i.test(String(u || "")));

            return (
              <div
                key={alert.id}
                className={`bg-card border rounded-2xl p-4 space-y-3 transition-all ${
                  alert.status === "triggered"
                    ? "border-red-500/50 shadow-md shadow-red-500/10"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-bold text-foreground">
                        {alert.displayCaseId}
                      </span>
                      {alertPhotos.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                          <Camera className="w-3 h-3" /> {alertPhotos.length} evidence {alertPhotos.length === 1 ? "photo" : "photos"} attached
                        </span>
                      )}
                      <Badge
                        className={
                          alert.status === "triggered"
                            ? "bg-red-600 text-white text-[10px]"
                            : alert.status === "acknowledged"
                            ? "bg-amber-500 text-black text-[10px]"
                            : "bg-emerald-600 text-white text-[10px]"
                        }
                      >
                        {alert.status === "triggered"
                          ? "ACTIVE ALERT"
                          : alert.status === "acknowledged"
                          ? "AWAITING REVIEW"
                          : alert.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {sender}
                    </p>
                    {(phone || alert.created_by) && (
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {[phone, alert.created_by].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {moment(alert.created_date).format("MMM D, YYYY · HH:mm:ss")} ({moment(alert.created_date).fromNow()})
                    </p>
                    {(alert.linkedCase?.location_description || hasCoords) && (
                      <p className="text-xs text-orange-300 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <span>
                          {alert.linkedCase?.location_description || `GPS ${alert.location_lat.toFixed(5)}, ${alert.location_lng.toFixed(5)}`}
                        </span>
                      </p>
                    )}
                  </div>

                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 text-xs font-medium hover:bg-muted"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                    </a>
                  )}
                </div>

                {alertPhotos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {alertPhotos.slice(0, 3).map((photoUrl, idx) => (
                      <img
                        key={idx}
                        src={resolveFileUrl(photoUrl)}
                        alt={`Evidence photo ${idx + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border border-sky-500/30 bg-black/40"
                      />
                    ))}
                    <span className="text-[11px] text-sky-300/90 font-medium">
                      Evidence picture attached — open case to inspect full view
                    </span>
                  </div>
                )}

                {/* Action Row: Open Location on Map + Acknowledge -> Awaiting Review + Open Case */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedMapAlert(alert)}
                    className="gap-1.5 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {hasCoords
                      ? `Open Location on Map (${alert.location_lat.toFixed(4)}, ${alert.location_lng.toFixed(4)})`
                      : "Location Details"}
                  </Button>

                  {canManage && ACTIVE_PANIC_ALERT_STATUSES.includes(alert.status) && alert.status !== "acknowledged" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleAcknowledgeToReview(alert)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 text-xs"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Acknowledge → Awaiting Review
                    </Button>
                  )}

                  {alert.linked_case_id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/beka/cases/${alert.linked_case_id}`)}
                      className="gap-1 text-xs ml-auto"
                    >
                      <FileText className="w-3.5 h-3.5" /> Open Case
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Focused Per-Case Map Modal (opens only when administrator clicks a specific case) */}
      {selectedMapAlert && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMapAlert(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-orange-400 font-bold">
                  {selectedMapAlert.displayCaseId}
                </p>
                <h3 className="text-base font-bold">
                  {selectedMapAlert.user_name || selectedMapAlert.created_by || "Emergency Location"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Triggered: {moment(selectedMapAlert.created_date).format("MMM D, YYYY · HH:mm:ss")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMapAlert(null)}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedMapAlert.location_lat != null && selectedMapAlert.location_lng != null ? (
              <>
                <div className="rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
                  <MapContainer
                    key={selectedMapAlert.id}
                    center={[selectedMapAlert.location_lat, selectedMapAlert.location_lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[selectedMapAlert.location_lat, selectedMapAlert.location_lng]}
                      icon={panicIcon}
                    >
                      <Popup>
                        <strong>{selectedMapAlert.displayCaseId}</strong>
                        <br />
                        {selectedMapAlert.location_lat.toFixed(5)}, {selectedMapAlert.location_lng.toFixed(5)}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={`https://maps.google.com/?q=${selectedMapAlert.location_lat},${selectedMapAlert.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
                  </a>

                  {canManage && selectedMapAlert.status !== "acknowledged" && selectedMapAlert.status !== "resolved" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === selectedMapAlert.id}
                      onClick={() => handleAcknowledgeToReview(selectedMapAlert)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledge → Awaiting Review
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  GPS coordinates were not available from the sender&apos;s device when this alert fired.
                </p>
                {canManage && selectedMapAlert.status !== "acknowledged" && selectedMapAlert.status !== "resolved" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAcknowledgeToReview(selectedMapAlert)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledge → Awaiting Review
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
