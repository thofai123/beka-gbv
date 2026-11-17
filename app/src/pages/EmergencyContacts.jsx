import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, ShieldCheck, Lock, Loader2, Edit2, Check, X, BellRing } from "lucide-react";
import { getSelectedContactIds, setSelectedContactIds } from "@/lib/emergencyQueue";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

const MAX_CONTACTS = 5;
const CACHE_KEY = "safeguard_emergency_contacts";

const PRIORITY_LABELS = ["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary"];

export default function EmergencyContacts() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", relationship: "", notify_location: true });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const isValidPhone = (value) => /^\+?[0-9\s-]{8,18}$/.test(value.trim());

  const cacheLocally = (items) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch {}
  };

  const load = useCallback(async () => {
    try {
      const items = await EmergencyContactService.list("priority");
      setContacts(items);
      setSelectedIds(getSelectedContactIds(items));
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch (e) {
      if (!navigator.onLine) {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
        setContacts(cached);
      } else {
        setContacts([]);
        localStorage.removeItem(CACHE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContact = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (!isValidPhone(draft.phone)) {
      toast({ title: "Invalid phone number", description: "Use a valid number with country code, e.g. +260...", variant: "destructive" });
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      toast({ title: `Max ${MAX_CONTACTS} contacts allowed`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await EmergencyContactService.create({
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        relationship: draft.relationship.trim(),
        priority: contacts.length + 1,
        notify_location: draft.notify_location,
        created_by: currentUser.email,
        user_id: currentUser.id,
      });
      const next = [...contacts, created];
      const nextSel = [...selectedIds, created.id];
      setSelectedIds(nextSel);
      setSelectedContactIds(nextSel);
      setContacts(next);
      cacheLocally(next);
      setDraft({ name: "", phone: "", relationship: "", notify_location: true });
      setAdding(false);
      toast({ title: "Contact added" });
    } catch (e) {
      toast({ title: "Failed to add", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setDraft({
      name: contact.name || "",
      phone: contact.phone || "",
      relationship: contact.relationship || "",
      notify_location: contact.notify_location !== false,
    });
    setAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", phone: "", relationship: "", notify_location: true });
  };

  const updateContact = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (!isValidPhone(draft.phone)) {
      toast({ title: "Invalid phone number", description: "Use a valid number with country code, e.g. +260...", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        relationship: draft.relationship.trim(),
        notify_location: draft.notify_location,
      };
      await EmergencyContactService.update(editingId, updatedData);
      const next = contacts.map((c) => c.id === editingId ? { ...c, ...updatedData } : c);
      setContacts(next);
      cacheLocally(next);
      cancelEdit();
      toast({ title: "Contact updated" });
    } catch (e) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const removeContact = async (id) => {
    try {
      await EmergencyContactService.delete(id);
      const next = contacts
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, priority: i + 1 }));
      await Promise.all(
        next.map((c) =>
          EmergencyContactService.update(c.id, { priority: c.priority }).catch(() => {})
        )
      );
      setContacts(next);
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      toast({ title: "Contact removed" });
    } catch (e) {
      toast({ title: "Failed to remove", description: e.message, variant: "destructive" });
    }
  };

  const toggleAlertContact = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setSelectedContactIds(next);
      return next;
    });
  };

  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= contacts.length) return;
    const next = [...contacts];
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((c, i) => { c.priority = i + 1; });
    setContacts(next);
    cacheLocally(next);
    await Promise.all(next.map((c) => EmergencyContactService.update(c.id, { priority: c.priority }).catch(() => {})));
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Emergency Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          People to alert if you can't be reached. Notified <strong>only during escalation</strong> — never visible to responders.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-2">
        <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground/80">
          Encrypted at rest. Only you can view or edit these contacts. They receive a masked alert with case reference — no personal details.
        </p>
      </div>

      {/* Contact list */}
      {contacts.length === 0 && !adding ? (
        <EmptyState
          icon={ShieldCheck}
          title="No emergency contacts yet"
          description="Add up to 5 trusted people who will be notified only if responders fail to acknowledge or in critical emergencies."
          action={
            <Button onClick={() => setAdding(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add first contact
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {contacts.map((c, idx) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                      {PRIORITY_LABELS[idx] || `#${idx + 1}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{c.phone}</p>
                  {c.relationship && (
                    <p className="text-[11px] text-muted-foreground">{c.relationship}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAlertContact(c.id)}
                    className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                      selectedIds.includes(c.id)
                        ? "bg-green-500/15 text-green-500 border-green-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <BellRing className="w-3 h-3" />
                    {selectedIds.includes(c.id) ? "Alert on SOS: ON" : "Alert on SOS: OFF"}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  >↑</button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === contacts.length - 1}
                    className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  >↓</button>
                  <button
                    onClick={() => startEdit(c)}
                    className="text-muted-foreground hover:text-primary p-1 rounded"
                    aria-label="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeContact(c.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {contacts.length < MAX_CONTACTS && !adding && (
            <Button variant="outline" onClick={() => setAdding(true)} className="w-full gap-2 mt-2">
              <Plus className="w-4 h-4" /> Add contact ({contacts.length}/{MAX_CONTACTS})
            </Button>
          )}
        </div>
      )}

      {/* Edit form */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold">Edit emergency contact</h3>
            <div className="space-y-2"><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-xs">Phone (with country code)</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-xs">Relationship (optional)</Label><Input value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} /></div>
            <div className="flex items-center justify-between pt-1"><div><Label className="text-xs">Share location during escalation</Label><p className="text-[10px] text-muted-foreground">Includes a maps link only if you opt in.</p></div><Switch checked={draft.notify_location} onCheckedChange={(v) => setDraft({ ...draft, notify_location: v })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={updateContact} disabled={saving} className="flex-1 gap-1">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Save changes</Button>
              <Button variant="ghost" onClick={cancelEdit} className="gap-1"><X className="w-3 h-3" />Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {adding && !editingId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold">New emergency contact</h3>
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Mary Banda" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Phone (with country code)</Label>
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+260 9xxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Relationship (optional)</Label>
              <Input value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} placeholder="Mother, Sibling, Friend" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <Label className="text-xs">Share location during escalation</Label>
                <p className="text-[10px] text-muted-foreground">Includes a maps link only if you opt in.</p>
              </div>
              <Switch checked={draft.notify_location} onCheckedChange={(v) => setDraft({ ...draft, notify_location: v })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={addContact} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save contact
              </Button>
              <Button variant="ghost" onClick={() => { setAdding(false); setDraft({ name: "", phone: "", relationship: "", notify_location: true }); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}