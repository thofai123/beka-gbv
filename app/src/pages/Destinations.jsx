import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, MapPin, Loader2, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

const MAX = 7;
const CACHE_KEY = "safeguard_destinations";

export default function Destinations() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", relationship: "" });
  const [showForm, setShowForm] = useState(false);

  const cache = (data) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  };

  const load = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const data = await apiClient.entities.EmergencyContact.filter({}, "priority");
        setItems(data);
        cache(data);
      } else {
        setItems(JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"));
      }
    } catch {
      setItems(JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast({ title: "Name and phone/location are required", variant: "destructive" });
      return;
    }
    if (items.length >= MAX) {
      toast({ title: `Max ${MAX} entries allowed`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await apiClient.entities.EmergencyContact.create({
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        relationship: draft.relationship.trim(),
        priority: items.length + 1,
        notify_location: true,
      });
      const next = [...items, created];
      setItems(next);
      cache(next);
      setDraft({ name: "", phone: "", relationship: "" });
      setShowForm(false);
      toast({ title: "Saved" });
    } catch (e) {
      toast({ title: "Failed to add", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const remove = async (id) => {
    try {
      await apiClient.entities.EmergencyContact.delete(id);
      const next = items.filter((c) => c.id !== id).map((c, i) => ({ ...c, priority: i + 1 }));
      setItems(next);
      cache(next);
      await Promise.all(next.map((c) => apiClient.entities.EmergencyContact.update(c.id, { priority: c.priority }).catch(() => {})));
      toast({ title: "Removed" });
    } catch (e) {
      toast({ title: "Failed to remove", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
            <p className="text-sm text-muted-foreground">Trusted contacts and important places ({items.length}/{MAX})</p>
          </div>
        </div>
        {items.length < MAX && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        )}
      </div>

      {/* Inline form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold">New destination</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Mary Banda or Home"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone or location</Label>
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+260 9xxxxxxxx or address"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={draft.relationship}
                onChange={(e) => setDraft({ ...draft, relationship: e.target.value })}
                placeholder="Mother, Workplace, Safe house..."
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={add} disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                Save
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setDraft({ name: "", phone: "", relationship: "" }); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {items.length === 0 && !showForm ? (
        <EmptyState
          icon={MapPin}
          title="No destinations yet"
          description={`Save up to ${MAX} trusted contacts or important places. They'll be notified during emergencies.`}
          action={
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add first destination
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((c, idx) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{c.phone}</p>
                  {c.relationship && (
                    <p className="text-[11px] text-muted-foreground truncate">{c.relationship}</p>
                  )}
                </div>
                {c.phone?.startsWith("+") || /^\d/.test(c.phone) ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                    aria-label="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                ) : null}
                <button
                  onClick={() => remove(c.id)}
                  className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length < MAX && !showForm && (
            <Button variant="outline" onClick={() => setShowForm(true)} className="w-full gap-2 mt-2">
              <Plus className="w-4 h-4" /> Add destination ({items.length}/{MAX})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}