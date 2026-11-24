import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, ShieldCheck, Lock, Loader2, Edit2, Check, X, BellRing, Contact } from "lucide-react";
import { getSelectedContactIds, setSelectedContactIds } from "@/lib/emergencyQueue";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

const MAX_CONTACTS = 5;
const CACHE_KEY = "safeguard_emergency_contacts";

const PRIORITY_LABELS = ["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary"];

export default function EmergencyContacts() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", relationship: "", notify_location: true });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const isValidPhone = (value) => /^\+?[0-9\s-]{8,18}$/.test(value.trim());
  const supportsDeviceContacts =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    typeof navigator.contacts?.select === "function";

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
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
        setContacts(cached);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickFromPhoneContacts = async () => {
    if (contacts.length >= MAX_CONTACTS) {
      toast({ title: `Max ${MAX_CONTACTS} contacts allowed`, variant: "destructive" });
      return;
    }

    if (!supportsDeviceContacts) {
      setEditingId(null);
      setAdding(true);
      toast({
        title: "Enter contact details below",
        description: "Direct phone contact picker is supported on mobile Android browsers. You can enter the name and phone number manually here.",
      });
      return;
    }

    try {
      const remainingSlots = MAX_CONTACTS - contacts.length;
      const picked = await navigator.contacts.select(["name", "tel"], {
        multiple: remainingSlots > 1,
      });

      if (!picked || picked.length === 0) return;

      // Single contact selected -> populate the form so user can review & set relationship
      if (picked.length === 1) {
        const rawName = (picked[0].name && picked[0].name[0]) || "";
        const rawPhone = (picked[0].tel && picked[0].tel[0]) || "";
        setEditingId(null);
        setDraft({
          name: rawName.trim(),
          phone: rawPhone.trim(),
          relationship: "",
          notify_location: true,
        });
        setAdding(true);
        toast({
          title: "Contact imported from phone",
          description: "Review details and tap Save contact.",
        });
        return;
      }

      // Multiple contacts selected -> save directly up to remainingSlots
      setSaving(true);
      let currentList = [...contacts];
      let currentSelected = [...selectedIds];
      let addedCount = 0;

      for (const item of picked.slice(0, remainingSlots)) {
        const rawName = ((item.name && item.name[0]) || "").trim();
        const rawPhone = ((item.tel && item.tel[0]) || "").trim();
        if (!rawName || !rawPhone) continue;

        const created = await EmergencyContactService.create({
          name: rawName,
          phone: rawPhone,
          relationship: "",
          priority: currentList.length + 1,
          notify_location: true,
          ...(currentUser?.email ? { created_by: currentUser.email } : {}),
          ...(currentUser?.id ? { user_id: currentUser.id } : {}),
        });
        currentList.push(created);
        currentSelected.push(created.id);
        addedCount += 1;
      }

      setContacts(currentList);
      setSelectedIds(currentSelected);
      setSelectedContactIds(currentSelected);
      cacheLocally(currentList); queryClient.invalidateQueries({ queryKey: ["emergencyContacts"] });
      setSaving(false);

      if (addedCount > 0) {
        toast({ title: `${addedCount} contact(s) imported from phone` });
      }
    } catch (err) {
      setSaving(false);
      if (err?.name !== "AbortError") {
        toast({
          title: "Could not open phone contacts",
          description: err?.message || "Please enter the contact manually.",
          variant: "destructive",
        });
        setAdding(true);
      }
    }
  };

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
        ...(currentUser?.email ? { created_by: currentUser.email } : {}),
        ...(currentUser?.id ? { user_id: currentUser.id } : {}),
      });
      const next = [...contacts, created];
      const nextSel = [...selectedIds, created.id];
      setSelectedIds(nextSel);
      setSelectedContactIds(nextSel);
      setContacts(next);
      cacheLocally(next); queryClient.invalidateQueries({ queryKey: ["emergencyContacts"] });
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
      cacheLocally(next); queryClient.invalidateQueries({ queryKey: ["emergencyContacts"] });
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
    cacheLocally(next); queryClient.invalidateQueries({ queryKey: ["emergencyContacts"] });
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
          Contacts use app access controls. When you trigger SOS, selected contacts receive your name and case reference, and may receive your location based on your settings.
        </p>
      </div>

      {/* Contact list */}
      {contacts.length === 0 && !adding ? (
        <EmptyState
          icon={ShieldCheck}
          title="No emergency contacts yet"
          description="Add up to 5 trusted people from your phone contacts or manually."
          action={
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={pickFromPhoneContacts} className="gap-2">
                <Contact className="w-4 h-4" /> Pick from Phone Contacts
              </Button>
              <Button variant="outline" onClick={() => setAdding(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Enter Manually
              </Button>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <Button onClick={pickFromPhoneContacts} disabled={saving} className="w-full gap-2">
                <Contact className="w-4 h-4" /> Pick from Phone ({contacts.length}/{MAX_CONTACTS})
              </Button>
              <Button variant="outline" onClick={() => setAdding(true)} disabled={saving} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Enter Manually
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">New emergency contact</h3>
              {supportsDeviceContacts && (
                <Button type="button" size="sm" variant="secondary" onClick={pickFromPhoneContacts} className="gap-1.5 h-8 text-xs">
                  <Contact className="w-3.5 h-3.5" /> From Phone Book
                </Button>
              )}
            </div>
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
