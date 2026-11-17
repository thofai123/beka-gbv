// Public live-tracking page (no auth required) opened by emergency contacts from SMS link.
// Polls getLivePosition every 10 seconds. Shows a Leaflet map with the survivor's pin,
// case status, last-updated time, and a one-tap call-to-action for emergency services.

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "@/api/client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, RefreshCw, AlertCircle, CheckCircle, Phone, Shield } from "lucide-react";
import moment from "moment";

// Fix default marker icons (Leaflet+Vite quirk)
const survivorIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(251,146,60,0.35);animation:pulse 2s infinite"></div>
      <div style="position:absolute;inset:8px;border-radius:50%;background:#ea580c;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
    </div>
    <style>
      @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.6);opacity:0} }
    </style>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom() || 15, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LiveLocation() {
  const [params] = useSearchParams();
  const caseId = params.get("case_id");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const fetchPos = useCallback(async () => {
    if (!caseId) return;
    setRefreshing(true);
    try {
      const res = await apiClient.functions.invoke("getLivePosition", { case_id: caseId });
      setData(res.data);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load");
    }
    setRefreshing(false);
  }, [caseId]);

  useEffect(() => {
    fetchPos();
    intervalRef.current = setInterval(fetchPos, 10000); // 10s polling
    return () => clearInterval(intervalRef.current);
  }, [fetchPos]);

  if (!caseId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-sm text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-lg font-bold mt-3">Invalid link</h1>
          <p className="text-sm text-muted-foreground mt-1">No case reference provided.</p>
        </div>
      </div>
    );
  }

  const isResolved = data?.status === "resolved" || data?.status === "closed";
  const hasLoc = data && data.lat != null && data.lng != null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Zambia branding */}
      <div className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center gap-3"
           style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}>
        <img
          src="/icon-192.png"
          alt="BEKA"
          width="36"
          height="36"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-9 h-9 rounded-lg object-contain flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base text-sidebar-primary-foreground tracking-tight truncate">
            Live Emergency Tracker
          </h1>
          <p className="text-[11px] text-sidebar-foreground/60">SafeGuard Zambia · auto-refresh every 10s</p>
        </div>
        <button
          onClick={fetchPos}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-sidebar-accent active:scale-95 transition-transform"
          aria-label="Refresh now"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-3">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* Status bar */}
            <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Case</p>
                <p className="font-mono text-sm font-bold">{data.case_ref}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  isResolved
                    ? "bg-green-500/15 text-green-700 border border-green-500/30"
                    : "bg-orange-500/15 text-orange-700 border border-orange-500/40"
                }`}>
                  {(data.status || "active").replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Map */}
            {hasLoc ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2 text-sm font-semibold border-b border-border">
                  <MapPin className="w-4 h-4 text-primary" /> Latest position
                </div>
                <div className="h-72 sm:h-96 w-full relative">
                  <MapContainer
                    center={[data.lat, data.lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[data.lat, data.lng]} icon={survivorIcon}>
                      <Popup>{data.case_ref}</Popup>
                    </Marker>
                    <Recenter lat={data.lat} lng={data.lng} />
                  </MapContainer>
                </div>
                <div className="px-3 py-2 text-[11px] font-mono text-muted-foreground border-t border-border">
                  {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
                </div>
                <a
                  href={`https://maps.google.com/?q=${data.lat},${data.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-primary-foreground py-2.5 text-sm font-semibold active:opacity-80"
                >
                  Open in Google Maps
                </a>
              </div>
            ) : (
              <div className="bg-muted/40 rounded-xl p-6 text-sm text-muted-foreground text-center">
                Location not yet available. Refreshing every 10s…
              </div>
            )}

            {/* Resolved notice */}
            {isResolved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                The emergency has been marked {data.status}.
              </div>
            )}

            {/* Emergency CTAs */}
            {!isResolved && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  If you cannot reach them, call:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:991"
                    className="flex items-center justify-center gap-1.5 bg-red-500 text-white rounded-lg py-3 text-sm font-bold active:opacity-80"
                  >
                    <Phone className="w-4 h-4" /> 991 Police
                  </a>
                  <a
                    href="tel:116"
                    className="flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-3 text-sm font-bold active:opacity-80"
                  >
                    <Phone className="w-4 h-4" /> 116 VSU
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>Last refresh: {lastFetch ? moment(lastFetch).format("HH:mm:ss") : "—"}</span>
              <span>Updates every 10s</span>
            </div>
          </>
        )}

        {!data && !error && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}