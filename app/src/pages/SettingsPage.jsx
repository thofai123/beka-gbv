import { useState, useEffect } from "react";
import { CaseService } from "@/services/CaseService";
import { EvidenceService } from "@/services/EvidenceService";
import { IncidentLogService } from "@/services/IncidentLogService";
import { UserService } from "@/services/UserService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Settings, User, Loader2, Trash2, ShieldCheck, Globe, HelpCircle, FileText, Lock, Upload, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsAccount from "../components/settings/SettingsAccount";
import SettingsHelp from "../components/settings/SettingsHelp";
import SettingsLegal from "../components/settings/SettingsLegal";

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { logout: authLogout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    profile_picture: "",
    specialization: "general",
    is_available: true,
    location_lat: null,
    location_lng: null,
    location_updated_at: "",
    two_fa_enabled: false,
    notify_in_app: true,
    notify_sms: true,
    notify_push: true,
    privacy_share_location: true,
    privacy_share_case: true,
    privacy_allow_followup: true,
  });

  const updatePreference = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    UserService.me()
      .then((me) => {
        setUser(me);
        setForm({
          first_name: me?.first_name || me?.full_name?.split(" ")?.[0] || "",
          last_name: me?.last_name || me?.full_name?.split(" ")?.slice(1).join(" ") || "",
          phone: me?.phone || "",
          profile_picture: me?.profile_picture || "",
          specialization: me?.specialization || "general",
          is_available: me?.is_available !== false,
          location_lat: me?.location_lat || null,
          location_lng: me?.location_lng || null,
          location_updated_at: me?.location_updated_at || "",
          two_fa_enabled: !!me?.two_fa_enabled,
          notify_in_app: me?.notify_in_app !== false,
          notify_sms: me?.notify_sms !== false,
          notify_push: me?.notify_push !== false,
          privacy_share_location: me?.privacy_share_location !== false,
          privacy_share_case: me?.privacy_share_case !== false,
          privacy_allow_followup: me?.privacy_allow_followup !== false,
        });
      })
      .catch(() => {
        // Auth failed (e.g. offline) — still render the page so user isn't stuck on a spinner.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location unavailable", description: "This device does not support GPS location.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          location_lat: pos.coords.latitude,
          location_lng: pos.coords.longitude,
          location_updated_at: new Date().toISOString(),
        }));
        toast({ title: "Location updated", description: "Accurate GPS coordinates were captured." });
      },
      () => toast({ title: "Location unavailable", description: "Please allow location access and try again.", variant: "destructive" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleDeleteAccount = async () => {
    try {
      const [cases, evidence, logs] = await Promise.all([
        CaseService.filter({ created_by: user.email }),
        EvidenceService.filter({ created_by: user.email }),
        IncidentLogService.filter({ created_by: user.email }),
      ]);
      await Promise.all([
        ...cases.map((c) => CaseService.delete(c.id)),
        ...evidence.map((e) => EvidenceService.delete(e.id)),
        ...logs.map((l) => IncidentLogService.delete(l.id)),
      ]);
    } catch {}
    setShowDeleteDialog(false);
    toast({ title: "Account data deleted", description: "Your data has been removed. Logging out now." });
    setTimeout(() => UserService.logout(), 1500);
  };

  const handleSave = async () => {
    if (form.phone && !/^\+?[0-9\s-]{8,18}$/.test(form.phone.trim())) {
      toast({ title: "Invalid phone number", description: "Please include a valid mobile number with country code.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await UserService.updateMe(form);
    const updated = await UserService.me().catch(() => null);
    if (updated) setUser(updated);
    setSaving(false);
    toast({ title: "Settings saved", description: "Your changes were saved successfully." });
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setTimeout(() => {
      authLogout(false);
      window.location.replace("/beka/login");
    }, 650);
  };

  if (loggingOut) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md text-white px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Logging out securely...</h2>
            <p className="text-xs text-zinc-400 mt-1">Clearing session data from this device</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isStaff = user?.role === "responder" || user?.role === "admin";
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("settingsTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("settingsSubtitle")}</p>
          </div>
        </div>

        {!isStaff && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold">Survivor Evidence Upload</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Upload photos or documents securely and link them to your case ID.
              </p>
              <Button asChild size="sm" className="mt-3 gap-2">
                <Link to="/beka/evidence">Open Evidence Upload</Link>
              </Button>
            </div>
          </div>
        )}

        {/* 1. Account */}
        <SettingsSection
          icon={User}
          title={t("profile")}
          subtitle="Your profile information"
          defaultOpen
        >
          <div className="pt-3 space-y-4">
            <SettingsAccount user={user} form={form} setForm={setForm} />

            {/* Two-factor (staff only) */}
            {isStaff && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Two-Factor Authentication
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <Label>Require SMS code at login</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adds an extra verification step using a 6-digit code sent to your phone.
                    </p>
                    {!form.phone && (
                      <p className="text-[11px] text-orange-600 mt-1">⚠ Add a phone number above first.</p>
                    )}
                  </div>
                  <Switch
                    checked={form.two_fa_enabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, two_fa_enabled: v }))}
                    disabled={!form.phone}
                  />
                </div>
              </div>
            )}

            {/* Responder settings */}
            {isStaff && (
              <div className="pt-2 border-t border-border space-y-3">
                <h4 className="text-sm font-semibold">Responder Settings</h4>
                <div>
                  <Label>Specialization</Label>
                  <Select value={form.specialization} onValueChange={(v) => setForm((f) => ({ ...f, specialization: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="counseling">Counseling</SelectItem>
                      <SelectItem value="legal">Legal Aid</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="shelter">Shelter Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Available for Assignment</Label>
                    <p className="text-xs text-muted-foreground">Toggle off if you're not available</p>
                  </div>
                  <Switch checked={form.is_available} onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))} />
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button type="button" variant="outline" size="sm" onClick={getLocation}>Update Location</Button>
                    {form.location_lat && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {form.location_lat.toFixed(4)}, {form.location_lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("saveSettings")}
            </Button>

            {/* Danger Zone */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4" /> Danger Zone
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                Delete My Account
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* 2. Data & Privacy */}
        <SettingsSection
          icon={Lock}
          title="Data & Privacy"
          subtitle="Control how your data is used"
        >
          <div className="pt-3 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>Share location with responders</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Your GPS location is shared when you trigger an emergency alert</p>
              </div>
              <Switch checked={form.privacy_share_location} onCheckedChange={(v) => updatePreference("privacy_share_location", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>Share case details with partner organisations</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allows referred organisations to view your case summary</p>
              </div>
              <Switch checked={form.privacy_share_case} onCheckedChange={(v) => updatePreference("privacy_share_case", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>Allow follow-up contact</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Responders may contact you after your case is closed</p>
              </div>
              <Switch checked={form.privacy_allow_followup} onCheckedChange={(v) => updatePreference("privacy_allow_followup", v)} />
            </div>
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <div className="flex items-center justify-between"><Label>In-app notifications</Label><Switch checked={form.notify_in_app} onCheckedChange={(v) => updatePreference("notify_in_app", v)} /></div>
              <div className="flex items-center justify-between"><Label>SMS notifications</Label><Switch checked={form.notify_sms} onCheckedChange={(v) => updatePreference("notify_sms", v)} /></div>
              <div className="flex items-center justify-between"><Label>Push notifications</Label><Switch checked={form.notify_push} onCheckedChange={(v) => updatePreference("notify_push", v)} /></div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Privacy & Notifications</Button>
          </div>
        </SettingsSection>

        {/* 3. Language */}
        <SettingsSection
          icon={Globe}
          title={t("language")}
          subtitle={t("languageHint")}
        >
          <div className="pt-3">
            <LanguageSwitcher variant="light" />
          </div>
        </SettingsSection>

        {/* 3. Help & Support */}
        <SettingsSection
          icon={HelpCircle}
          title="Help & Support"
          subtitle="How to use the app, FAQ, contact"
        >
          <div className="pt-3">
            <SettingsHelp />
          </div>
        </SettingsSection>

        {/* 4. Legal */}
        <SettingsSection
          icon={FileText}
          title="Legal"
          subtitle="Terms & Privacy Policy"
        >
          <div className="pt-3">
            <SettingsLegal />
          </div>
        </SettingsSection>

        {/* 5. Log Out */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Sign Out</h3>
            <p className="text-xs text-muted-foreground">Log out of your BEKA account on this device</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout} disabled={loggingOut}
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </motion.div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account and all your data. Type <strong>DELETE</strong> to confirm.
          </p>
          <Input
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirmText !== "DELETE"} onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}