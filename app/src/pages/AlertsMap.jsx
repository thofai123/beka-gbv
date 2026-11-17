import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Radio, Clock, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCurrentUser, useLiveEntityInvalidation, usePanicAlerts } from "@/hooks/useEntityQueries";
import { PanicAlertService } from "@/services/PanicAlertService";
import { PanicAlertWorkflowService } from "@/services/PanicAlertWorkflowService.js";
import PanicAlertManagementCenter from "@/components/panic/PanicAlertManagementCenter";
import { ACTIVE_PANIC_ALERT_STATUSES } from "@/constants/appConstants";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const panicIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px #ef4444,0 0 12px rgba(239,68,68,0.7);animation:ping 1.5s ease-in-out infinite;"></div>
  <style>@keyframes ping{0%,100%{box-shadow:0 0 0 3px #ef4444,0 0 12px rgba(239,68,68,0.7)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0.3),0 0 20px rgba(239,68,68,0.4)}}</style>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

const resolvedIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #22c55e;"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
});

function FitBounds({ alerts }) {
  const map = useMap();
  useEffect(() => {
    const valid = alerts.filter((a) => a.location_lat && a.location_lng && a.location_lat >= -18.1 && a.location_lat <= -8.2 && a.location_lng >= 21.9 && a.location_lng <= 33.7);
    if (valid.length === 0) return;
    if (valid.length === 1) map.setView([valid[0].location_lat, valid[0].location_lng], 13);
    else map.fitBounds(L.latLngBounds(valid.map((a) => [a.location_lat, a.location_lng])), { padding: [60, 60] });
  }, [alerts, map]);
  return null;
}

const statusConfig = {
  triggered: { label: "ACTIVE", text: "text-red-600" },
  acknowledged: { label: "Acknowledged", text: "text-orange-600" },
  responded: { label: "In Progress", text: "text-blue-600" },
  resolved: { label: "Resolved", text: "text-green-600" },
  escalated: { label: "Escalated", text: "text-purple-600" },
};

export default function AlertsMap() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("active");
  const { data: alerts = [], isLoading: loadingAlerts } = usePanicAlerts({}, { sort: "-created_date", limit: 200 });
  const { data: user, isLoading: loadingUser } = useCurrentUser();

  const handleAlertEvent = useCallback((event) => {
    if (event.type === "create") {
      toast({ title: "🚨 New panic alert received!", description: "A new emergency alert has been triggered." });
    }
  }, [toast]);

  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"], ["cases"], ["caseUpdates"], ["notifications"]], handleAlertEvent);

  const filtered = useMemo(() => alerts.filter((a) =>
    filter === "active" ? ACTIVE_PANIC_ALERT_STATUSES.includes(a.status) : a.status === "resolved"
  ), [alerts, filter]);

  const mappable = filtered.filter((a) => a.location_lat && a.location_lng);
  const noLocationCount = filtered.length - mappable.length;
  const activeCount = alerts.filter((a) => ACTIVE_PANIC_ALERT_STATUSES.includes(a.status)).length;
  const canManage = user?.role === "admin" || user?.role === "responder";

  if (loadingAlerts || loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Radio className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Alert Map</h1>
            <p className="text-sm text-muted-foreground">Real-time panic alert locations</p>
          </div>
        </div>
        {activeCount > 0 && (
          <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex items-center gap-2 bg-red-500/10 border border-red-300 rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-red-700">{activeCount} Active Alert{activeCount > 1 ? "s" : ""}</span>
          </motion.div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter("active")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "active" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
          Active ({activeCount})
        </button>
        <button onClick={() => setFilter("resolved")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "resolved" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
          Resolved ({alerts.filter((a) => a.status === "resolved").length})
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border shadow-md" style={{ height: 420 }}>
        <MapContainer center={[-15.4167, 28.2833]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds alerts={mappable} />
          {mappable.map((alert) => (
            <Marker key={alert.id} position={[alert.location_lat, alert.location_lng]} icon={alert.status === "resolved" ? resolvedIcon : panicIcon}>
              <Popup maxWidth={260}>
                <div className="space-y-2 py-1">
                  <span className={`text-xs font-bold uppercase ${statusConfig[alert.status]?.text || "text-gray-600"}`}>● {statusConfig[alert.status]?.label || alert.status}</span>
                  <p className="text-xs text-gray-600"><Clock className="inline w-3 h-3 mr-1" />{moment(alert.created_date).format("D MMM YYYY, h:mm A")}<br /><span className="text-gray-400">{moment(alert.created_date).fromNow()}</span></p>
                  <p className="text-[11px] font-mono text-gray-500">{alert.location_lat?.toFixed(5)}, {alert.location_lng?.toFixed(5)}</p>
                  {alert.user_name && <p className="text-xs text-gray-600"><User className="inline w-3 h-3 mr-1" />{alert.user_name}</p>}
                  {canManage && alert.status === "triggered" && <button onClick={() => PanicAlertWorkflowService.acknowledge(alert)} className="w-full mt-1 bg-orange-500 text-white text-xs font-medium py-1.5 rounded hover:bg-orange-600 transition-colors">Acknowledge</button>}
                  <a href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-xs text-blue-600 underline mt-1">Open in Google Maps</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {noLocationCount > 0 && <p className="text-xs text-muted-foreground text-center"><MapPin className="inline w-3 h-3 mr-1" />{noLocationCount} alert{noLocationCount > 1 ? "s" : ""} without location data shown in the center below.</p>}

      <PanicAlertManagementCenter currentUser={user} />
    </div>
  );
}