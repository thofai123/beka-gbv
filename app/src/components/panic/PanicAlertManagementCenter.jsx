import { useMemo, useState } from "react";
import { Phone, MapPin, Clock, ShieldAlert, UserCheck, Siren, CheckCircle2, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { usePanicAlerts, useResources, useUsers } from "@/hooks/useEntityQueries";
import { PanicAlertWorkflowService } from "@/services/PanicAlertWorkflowService.js";
import moment from "moment";

const tabs = [
  { key: "triggered", label: "Active Alerts" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "responded", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "escalated", label: "Escalated" },
];

const statusLabels = {
  triggered: "Active",
  acknowledged: "Acknowledged",
  responded: "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
};

function distanceKm(a, b) {
  if (!a?.location_lat || !a?.location_lng || !b?.location_lat || !b?.location_lng) return Infinity;
  const toRad = (n) => (n * Math.PI) / 180;
  const dLat = toRad(b.location_lat - a.location_lat);
  const dLng = toRad(b.location_lng - a.location_lng);
  const lat1 = toRad(a.location_lat);
  const lat2 = toRad(b.location_lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function PanicAlertManagementCenter({ currentUser }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("triggered");
  const [busyId, setBusyId] = useState(null);
  const { data: alerts = [], isLoading } = usePanicAlerts({}, { sort: "-created_date", limit: 200 });
  const { data: resources = [] } = useResources({ is_active: true }, { limit: 200 });
  const { data: staff = [] } = useUsers({ role: "responder" }, { limit: 100 });

  const filtered = useMemo(() => alerts.filter((a) => a.status === activeTab), [alerts, activeTab]);

  const nearestFor = (alert, typeOptions) => resources
    .filter((r) => typeOptions.includes(r.type) && r.location_lat && r.location_lng)
    .map((r) => ({ ...r, distance: distanceKm(alert, r) }))
    .sort((a, b) => a.distance - b.distance)[0];

  const runAction = async (alert, action, successText) => {
    setBusyId(`${alert.id}:${action}`);
    const assigned = staff[0]?.email || currentUser?.email;
    if (action === "resolve") {
      await PanicAlertWorkflowService.resolve(alert, "Resolved from Panic Alert Center");
    } else {
      await PanicAlertWorkflowService[action](alert, assigned);
    }
    setBusyId(null);
    toast({ title: successText });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Panic Alert Management Center</h2>
          <p className="text-sm text-muted-foreground">Activation-to-resolution emergency workflow</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const count = alerts.filter((a) => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">Loading alerts…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const gbv = nearestFor(alert, ["gbv_support", "ngo", "osc", "vsu", "shelter"]);
            const hospital = nearestFor(alert, ["hospital", "medical"]);
            const police = nearestFor(alert, ["police", "vsu"]);
            const phone = alert.phone || alert.user_phone || alert.survivor_contact;
            const name = alert.user_name || alert.responder_name || alert.created_by || "User";
            const loadingAction = (name) => busyId === `${alert.id}:${name}`;

            return (
              <div key={alert.id} className={`bg-card border rounded-2xl p-4 space-y-4 ${alert.status === "triggered" ? "border-red-300 shadow-lg shadow-red-500/10 ring-1 ring-red-500/20" : "border-border"}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={alert.status === "triggered" ? "bg-red-600 text-white" : "bg-muted text-foreground"}>{statusLabels[alert.status] || alert.status}</Badge>
                      <Badge variant="outline" className="border-red-200 text-red-700">Critical Priority</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {moment(alert.created_date).format("D MMM YYYY, h:mm A")}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{phone || "Phone unavailable"}</p>
                    </div>
                  </div>
                  {phone && (
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <a href={`tel:${phone}`}><Phone className="w-3 h-3" /> Contact User</a>
                    </Button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
                    {alert.location_lat ? (
                      <a className="text-blue-600 hover:underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`}>
                        {alert.location_lat.toFixed(5)}, {alert.location_lng.toFixed(5)}
                      </a>
                    ) : <p className="text-muted-foreground">Location unavailable</p>}
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="font-semibold flex items-center gap-1"><Navigation className="w-3 h-3" /> Recommendations</p>
                    <p className="text-muted-foreground">GBV: {gbv ? `${gbv.name} (${gbv.distance.toFixed(1)}km)` : "No mapped unit"}</p>
                    <p className="text-muted-foreground">Hospital: {hospital ? `${hospital.name} (${hospital.distance.toFixed(1)}km)` : "No mapped hospital"}</p>
                    <p className="text-muted-foreground">Police: {police ? `${police.name} (${police.distance.toFixed(1)}km)` : "No mapped station"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {alert.status === "triggered" && <Button size="sm" onClick={() => runAction(alert, "acknowledge", "Alert acknowledged")} disabled={!!busyId}>{loadingAction("acknowledge") ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Acknowledge</Button>}
                  {["triggered", "acknowledged"].includes(alert.status) && <Button size="sm" variant="outline" onClick={() => runAction(alert, "startResponse", "Response started")} disabled={!!busyId}>{loadingAction("startResponse") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} Assign Response</Button>}
                  {alert.status !== "resolved" && <Button size="sm" variant="outline" className="text-orange-700 border-orange-200" onClick={() => runAction(alert, "escalate", "Alert escalated")} disabled={!!busyId}>{loadingAction("escalate") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Siren className="w-3 h-3" />} Escalate</Button>}
                  {alert.status !== "resolved" && <Button size="sm" variant="outline" className="text-green-700 border-green-200" onClick={() => runAction(alert, "resolve", "Alert resolved")} disabled={!!busyId}>{loadingAction("resolve") ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Resolve</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}