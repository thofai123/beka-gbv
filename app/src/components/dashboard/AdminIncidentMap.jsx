// Live map of all active incident locations (panic alerts + open cases) for admins.
// Real-time updates via entity subscriptions. Helps dispatchers see where help is needed.

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Zambia centre as default view
const DEFAULT_CENTER = [-13.1339, 27.8493];

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 4px ${color}55,0 2px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const alertIcon = makeIcon("#ef4444");
const caseIcon = makeIcon("#f97316");

export default function AdminIncidentMap() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);

  const load = () => {
    Promise.all([
      apiClient.entities.PanicAlert.filter({ status: { $in: ["triggered", "acknowledged", "responded"] } }, "-created_date", 50),
      apiClient.entities.Case.filter({ status: { $in: ["received", "dispatched", "acknowledged", "in_progress", "escalated"] } }, "-created_date", 50),
    ]).then(([a, c]) => {
      setAlerts((a || []).filter((x) => x.location_lat != null && x.location_lng != null));
      setCases((c || []).filter((x) => x.location_lat != null && x.location_lng != null));
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const unsubA = apiClient.entities.PanicAlert.subscribe(load);
    const unsubC = apiClient.entities.Case.subscribe(load);
    return () => {
      unsubA?.();
      unsubC?.();
    };
  }, []);

  const points = [
    ...alerts.map((a) => ({ ...a, _kind: "alert" })),
    ...cases.map((c) => ({ ...c, _kind: "case" })),
  ];

  const center =
    points.length > 0 ? [points[0].location_lat, points[0].location_lng] : DEFAULT_CENTER;

  return (
    <div className="w-full max-w-sm px-6 pb-4 z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] tracking-widest uppercase font-semibold text-orange-400/80">
            Live Incident Map
          </span>
        </div>
        <span className="text-[10px] text-white/50">{points.length} active</span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg" style={{ height: 220 }}>
        <MapContainer
          center={center}
          zoom={points.length > 0 ? 11 : 6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {points.map((p) => (
            <Marker
              key={`${p._kind}-${p.id}`}
              position={[p.location_lat, p.location_lng]}
              icon={p._kind === "alert" ? alertIcon : caseIcon}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold mb-0.5">
                    {p._kind === "alert" ? "🚨 Panic Alert" : `Case ${p.case_id || ""}`}
                  </p>
                  <p className="capitalize text-gray-600">{(p.status || "").replace(/_/g, " ")}</p>
                  {p._kind === "case" && (
                    <button
                      onClick={() => navigate(`/cases/${p.id}`)}
                      className="mt-1 text-orange-600 font-semibold underline"
                    >
                      View case →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] text-white/60">Panic alerts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-[10px] text-white/60">Active cases</span>
        </div>
      </div>
    </div>
  );
}