import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/LanguageContext";

export default function SettingsAccount({ user, form, setForm }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label>First Name</Label>
        <Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
      </div>
      <div>
        <Label>Last Name</Label>
        <Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
      </div>
      <div>
        <Label>{t("email")}</Label>
        <Input value={user?.email || ""} disabled className="bg-muted" />
      </div>
      <div>
        <Label>{t("role")}</Label>
        <Input value={user?.role || "survivor"} disabled className="bg-muted capitalize" />
      </div>
      <div>
        <Label>{t("phone")}</Label>
        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+260 9xxxxxxxx" />
      </div>
      <div>
        <Label>Profile Picture URL</Label>
        <Input value={form.profile_picture} onChange={(e) => setForm((f) => ({ ...f, profile_picture: e.target.value }))} placeholder="https://..." />
      </div>
    </div>
  );
}