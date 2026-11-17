import { useEffect, useState } from "react";
import { ChevronDown, AlertTriangle, MapPin, LifeBuoy, Mail, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/api/client";

const STEPS = [
  { icon: AlertTriangle, title: "1. Get Help Fast", text: "Tap the orange HELP button on the home screen. Your custom emergency title and current location are sent to responders and to each of your saved destinations." },
  { icon: MapPin, title: "2. Save Destinations", text: "Add up to 7 trusted contacts or places under Destinations. Each one gets its own alert when you press HELP." },
  { icon: LifeBuoy, title: "3. Find Resources", text: "Open Resources to find the nearest hospital, police station, or GBV support centre near you." },
];

const FAQS = [
  { q: "What does the HELP button do?", a: "It immediately sends an emergency alert with your custom title and current location to responders and to each of your saved destinations." },
  { q: "Why do I need to allow location access?", a: "Your location is included in every emergency alert so help can find you fast. If location is unavailable the alert will say 'Location not available — allow locations'." },
  { q: "Is my information private?", a: "Yes. Your location and reports are encrypted and only shared with assigned responders or your trusted contacts when you trigger help." },
  { q: "Does the app work offline?", a: "Yes — panic alerts are queued offline and sent automatically when your connection is restored." },
  { q: "Can I delete my account?", a: "Yes. Go to Settings → Account → Danger Zone to permanently delete your account and all data." },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium pr-3">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-xs text-muted-foreground pb-3 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SettingsHelp() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.auth.me().then((me) => {
      setTitle(me?.emergency_title || "");
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await apiClient.auth.updateMe({ emergency_title: title.trim() });
    setSaving(false);
    toast({ title: "Emergency title saved" });
  };

  return (
    <div className="space-y-5">
      {/* Emergency toast title — only customizable field */}
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <Label className="text-sm font-semibold">Emergency Toast Title</Label>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Shown at the top of every emergency alert. Defaults to <strong>"Emergency"</strong> if left empty.
        </p>
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Please Help, I need help, Emergency"
            disabled={loading}
            maxLength={60}
          />
          <Button onClick={save} disabled={saving || loading} size="icon" aria-label="Save">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Your current location is attached automatically.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How the panic system works</p>
        <div className="space-y-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">FAQ</p>
        <div className="rounded-lg border border-border px-3">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </div>

      <a
        href="mailto:support@safe4all.zm"
        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors min-w-0"
      >
        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Contact Support</p>
          <p className="text-[11px] text-muted-foreground break-all">support@safe4all.zm</p>
        </div>
      </a>
    </div>
  );
}