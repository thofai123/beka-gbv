import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { UserService } from "@/services/UserService";
import { INCIDENT_TYPES } from "@/constants/appConstants";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FileText, MapPin, Upload, Loader2, Shield, ArrowLeft, ArrowRight } from "lucide-react";
import TfgbvScreenshotUpload from "@/components/evidence/TfgbvScreenshotUpload";
import { motion, AnimatePresence } from "framer-motion";
import StepProgress from "../components/report/StepProgress";

const STEPS = ["Incident Details", "Location & Evidence", "Reporter Information"];

const incidentTypes = [
  ...INCIDENT_TYPES.map((value) => ({
    value,
    label: value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
  }))
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    incident_type: "",
    description: "",
    is_anonymous: false,
    survivor_name: "",
    survivor_contact: "",
    location_lat: null,
    location_lng: null,
    location_captured_at: "",
    location_description: "",
    attachments: [],
    screenshots: [],
  });

  useEffect(() => {
    UserService.me().then(setUser).catch(() => {});
  }, []);

  const captureLocation = async () => {
    if (!navigator.geolocation) throw new Error("This device does not support GPS location.");
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
    const nextLocation = {
      location_lat: pos.coords.latitude,
      location_lng: pos.coords.longitude,
      location_captured_at: new Date().toISOString(),
    };
    setForm((f) => ({ ...f, ...nextLocation }));
    return nextLocation;
  };

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      await captureLocation();
      toast({ title: "Location captured", description: "Accurate GPS coordinates saved." });
    } catch (err) {
      toast({ title: "Location unavailable", description: err?.message || "Please allow location access and try again.", variant: "destructive" });
    }
    setGettingLocation(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    const urls = [];
    for (const file of files) {
      try {
        const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      } catch (err) {
        toast({ title: `Could not upload ${file.name}`, description: err?.message || "Use JPG, PNG, WebP, PDF or DOCX under 8 MB.", variant: "destructive" });
      }
    }
    if (urls.length > 0) {
      setForm((f) => ({ ...f, attachments: [...f.attachments, ...urls] }));
      toast({ title: `${urls.length} file(s) uploaded` });
    }
  };

  const assessRisk = async (description, incidentType) => {
    try {
      const result = await apiClient.integrations.Core.InvokeLLM({
        prompt: `You are a GBV risk assessment specialist. Analyze the following incident report and determine the risk level.
        
Incident Type: ${incidentType}
Description: ${description}

Classify the urgency as one of: low, medium, high, critical
Consider factors like: immediate physical danger, weapons mentioned, repeated pattern, vulnerable populations (children/elderly), threats of escalation.

Return a JSON with risk_level and a brief ai_summary (2-3 sentences explaining the assessment).`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
            ai_summary: { type: "string" },
          },
        },
      });
      return result;
    } catch {
      return { risk_level: "medium", ai_summary: "" };
    }
  };

  const goNext = () => {
    if (step === 0 && (!form.incident_type || !form.description)) {
      toast({ title: "Required information missing", description: "Please select an incident type and provide a description before continuing.", variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.incident_type || !form.description) {
      toast({ title: "Required information missing", description: "An incident type and description are required to submit this report.", variant: "destructive" });
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      let latestLocation = {};
      if (!form.location_lat || !form.location_lng) {
        try {
          latestLocation = await captureLocation();
        } catch (err) {
          toast({ title: "Location not captured", description: "You can submit without location, or go back and retry GPS access.", variant: "destructive" });
        }
      }
      const riskAssessment = await assessRisk(form.description, form.incident_type);

      // Use the hardened backend function — it assigns a response unit,
      // notifies admins/responders, and reliably persists the case server-side.
      const { data } = await apiClient.functions.invoke("submitReport", {
        incident_type: form.incident_type,
        description: form.description,
        risk_level: riskAssessment.risk_level,
        ai_summary: riskAssessment.ai_summary,
        is_anonymous: form.is_anonymous,
        reporter_email: user?.email || "",
        reporter_user_id: user?.id || "",
        survivor_name: form.is_anonymous ? "" : form.survivor_name || user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(" "),
        survivor_contact: form.is_anonymous ? "" : form.survivor_contact || user?.phone || "",
        location_lat: latestLocation.location_lat ?? form.location_lat,
        location_lng: latestLocation.location_lng ?? form.location_lng,
        location_captured_at: latestLocation.location_captured_at ?? form.location_captured_at,
        location_description: form.location_description,
        attachments: [...form.attachments, ...(form.incident_type === "tfgbv" ? form.screenshots.map((s) => s.url) : [])],
        channel: "app",
      });

      if (!data?.success) {
        throw new Error(data?.error || "Submission failed");
      }

      toast({
        title: "Report submitted securely",
        description: `Your case has been recorded as ${data.case_ref}. Authorised personnel have been notified.`,
      });
      navigate(`/cases/${data.case_id}`);
    } catch (err) {
      toast({ title: "Report could not be submitted", description: err.message || "Please check your connection and try again.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Confidential Incident Report</h1>
            <p className="text-sm text-muted-foreground">This report is private and handled with strict confidentiality by authorised personnel.</p>
          </div>
        </div>

        <StepProgress steps={STEPS} current={step} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1 — What happened */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-xl p-4 space-y-4"
              >
                <h3 className="font-semibold text-sm">Incident Details</h3>
                <div>
                  <Label>Type of Incident *</Label>
                  <Select value={form.incident_type} onValueChange={(v) => setForm((f) => ({ ...f, incident_type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Please describe what occurred. Include any details you feel comfortable sharing — dates, locations, and persons involved are helpful but not required."
                    rows={6}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Where & evidence */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-sm">Location of Incident</h3>
                  <p className="text-xs text-muted-foreground -mt-2">Optional. Providing a location helps responders assist you more quickly.</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={gettingLocation}>
                      {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MapPin className="w-4 h-4 mr-1" />}
                      Get GPS Location
                    </Button>
                    {form.location_lat && (
                      <span className="text-xs text-muted-foreground">
                        📍 {form.location_lat.toFixed(4)}, {form.location_lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <Input
                    value={form.location_description}
                    onChange={(e) => setForm((f) => ({ ...f, location_description: e.target.value }))}
                    placeholder="Describe the location (e.g., near the market, home address)"
                  />
                </div>

                {form.incident_type === "tfgbv" && (
                  <TfgbvScreenshotUpload items={form.screenshots} onChange={(screenshots) => setForm((f) => ({ ...f, screenshots }))} />
                )}
                <div className={`bg-card border border-border rounded-xl p-4 space-y-4 ${form.incident_type === "tfgbv" ? "hidden" : ""}`}>
                  <h3 className="font-semibold text-sm">Evidence / Attachments</h3>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload files (photos, documents)</span>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                  </label>
                  {form.attachments.length > 0 && (
                    <p className="text-xs text-muted-foreground">{form.attachments.length} file(s) attached</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Your details */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="font-medium">Report Anonymously</Label>
                        <p className="text-xs text-muted-foreground">Your name and contact details will not be shared with administrators</p>
                      </div>
                    </div>
                    <Switch
                      checked={form.is_anonymous}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_anonymous: v }))}
                    />
                  </div>
                </div>

                {!form.is_anonymous && (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                    <h3 className="font-semibold text-sm">Reporter Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={form.survivor_name}
                          onChange={(e) => setForm((f) => ({ ...f, survivor_name: e.target.value }))}
                          placeholder={user?.full_name || "Enter name"}
                        />
                      </div>
                      <div>
                        <Label>Phone / Email</Label>
                        <Input
                          value={form.survivor_contact}
                          onChange={(e) => setForm((f) => ({ ...f, survivor_contact: e.target.value }))}
                          placeholder="Contact info"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you consent to this information being used to provide assistance. All data is encrypted and treated confidentially.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button type="button" variant="outline" className="h-12 flex-1" onClick={goBack} disabled={submitting}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" className="h-12 flex-1 text-base" onClick={goNext}>
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" className="h-12 flex-1 text-base" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}