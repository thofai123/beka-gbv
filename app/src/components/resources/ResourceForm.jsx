import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Loader2 } from "lucide-react";

const EMPTY = {
  name: "",
  type: "vsu",
  description: "",
  phone: "",
  website: "",
  map_url: "",
  document_url: "",
  district: "",
  is_active: true,
};

export default function ResourceForm({ open, initial, customCategories = [], onClose, onSave }) {
  const [customTabName, setCustomTabName] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm({ ...EMPTY, ...(initial || {}) }); setCustomTabName(""); }
  }, [open, initial]);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const canSubmit = !!form.name.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const payload = { ...form };
    if (payload.type === "__new__" && customTabName.trim()) {
      const slug = customTabName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      payload.type = slug || "custom_tab";
      payload.category_label = customTabName.trim();
    }
    await onSave(payload);
    setSaving(false);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{initial?.id ? "Edit Resource" : "Add Resource"}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-3 overflow-y-auto max-h-[75vh]">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={handle("name")} placeholder="e.g. Lusaka Central VSU" />
          </div>
          <div>
            <Label className="text-xs">Category *</Label>
            <Select value={form.type} onValueChange={handle("type")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vsu">Victim Support Unit</SelectItem>
                <SelectItem value="osc">GBV One-Stop Center</SelectItem>
                <SelectItem value="shelter">Women's Shelter</SelectItem>
                <SelectItem value="child_protection">Child Protection</SelectItem>
                <SelectItem value="counseling">Counseling Center</SelectItem>
                <SelectItem value="legal_aid">Legal Aid Support</SelectItem>
                <SelectItem value="emergency_response">Emergency Response</SelectItem>
                <SelectItem value="gbv_support">GBV Support Service</SelectItem>
                {customCategories.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Create New Resource Tab...</SelectItem>
              </SelectContent>
            </Select>
            {form.type === "__new__" && (
              <Input
                className="mt-2"
                value={customTabName}
                onChange={(e) => setCustomTabName(e.target.value)}
                placeholder="Enter new tab name (e.g. Medical Clinics)"
              />
            )}
          </div>
          <div>
            <Label className="text-xs">Short description</Label>
            <Textarea value={form.description} onChange={handle("description")} rows={2} />
          </div>
          <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
            ℹ️ Add an address or maps link so survivors can safely locate this support service.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={handle("phone")} placeholder="+260..." />
            </div>
            <div>
              <Label className="text-xs">District</Label>
              <Input value={form.district} onChange={handle("district")} placeholder="Lusaka" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Website URL</Label>
            <Input value={form.website} onChange={handle("website")} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs">Document / PDF URL</Label>
            <Input value={form.document_url} onChange={handle("document_url")} placeholder="https://..." />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={saving || !canSubmit} className="flex-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {initial?.id ? "Save Changes" : "Add Resource"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}