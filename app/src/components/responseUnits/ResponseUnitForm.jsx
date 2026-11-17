import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const PROVINCES = ["Lusaka", "Copperbelt", "Central", "Eastern", "Northern", "Luapula", "Western", "Southern", "North-Western", "Muchinga"];
const UNIT_TYPES = [
  ["police", "Police"],
  ["hospital", "Hospital"],
  ["ngo", "NGO"],
  ["social_services", "Social Services"],
  ["shelter", "Shelter"],
  ["legal_aid", "Legal Aid"],
  ["vsu", "Victim Support Unit"],
  ["osc", "One-Stop Centre"],
  ["other", "Other"],
];

const empty = {
  name: "",
  unit_type: "police",
  description: "",
  contact_phone: "",
  contact_email: "",
  whatsapp: "",
  address: "",
  district: "",
  province: "Lusaka",
  coverage_area: "",
  on_call_status: "available",
  operating_hours: "",
  lead_contact_name: "",
  lead_contact_email: "",
  is_active: true,
  notes: "",
};

export default function ResponseUnitForm({ unit, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(unit ? { ...empty, ...unit } : empty);
  }, [unit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Lusaka Central VSU" />
        </div>
        <div>
          <Label>Unit Type *</Label>
          <Select value={form.unit_type} onValueChange={(v) => set("unit_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIT_TYPES.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>On-Call Status</Label>
          <Select value={form.on_call_status} onValueChange={(v) => set("on_call_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="off_duty">Off-duty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Services offered..." />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+260..." />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+260..." />
        </div>
        <div>
          <Label>Operating Hours</Label>
          <Input value={form.operating_hours} onChange={(e) => set("operating_hours", e.target.value)} placeholder="e.g. 24/7" />
        </div>
        <div>
          <Label>District</Label>
          <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
        </div>
        <div>
          <Label>Province</Label>
          <Select value={form.province} onValueChange={(v) => set("province", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Coverage Area</Label>
          <Input value={form.coverage_area} onChange={(e) => set("coverage_area", e.target.value)} placeholder="e.g. Lusaka & surrounding districts" />
        </div>
        <div>
          <Label>Lead Contact Name</Label>
          <Input value={form.lead_contact_name} onChange={(e) => set("lead_contact_name", e.target.value)} />
        </div>
        <div>
          <Label>Lead Contact Email</Label>
          <Input type="email" value={form.lead_contact_email} onChange={(e) => set("lead_contact_email", e.target.value)} placeholder="Links to a User account" />
        </div>
        <div className="sm:col-span-2">
          <Label>Internal Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </div>
        <div className="sm:col-span-2 flex items-center justify-between bg-muted/40 px-3 py-2 rounded-lg">
          <div>
            <Label className="text-sm">Active</Label>
            <p className="text-xs text-muted-foreground">Inactive units don't appear in assignment lists</p>
          </div>
          <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          {unit ? "Save Changes" : "Create Unit"}
        </Button>
      </div>
    </form>
  );
}