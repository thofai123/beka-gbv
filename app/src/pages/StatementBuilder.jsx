import { useState, useEffect } from "react";
import { IncidentLogService } from "@/services/IncidentLogService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Plus, Eye, Download, FileDown, Loader2, CheckCircle, Clock } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { motion } from "framer-motion";
import moment from "moment";
import { generateZpForm32Pdf } from "../lib/zpForm32Pdf";

const provinces = ["Lusaka", "Copperbelt", "Central", "Eastern", "Northern", "Luapula", "Western", "Southern", "North-Western", "Muchinga"];

const statusConfig = {
  draft: { label: "Draft", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  finalized: { label: "Finalized", color: "bg-green-500/10 text-green-700 border-green-200" },
  exported: { label: "Exported", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
};

function buildExportText(log) {
  const lines = [
    "═══════════════════════════════════════════════════",
    "       INCIDENT STATEMENT — SAFEGUARD ZAMBIA",
    "═══════════════════════════════════════════════════",
    `Date Generated: ${moment().format("D MMMM YYYY, h:mm A")}`,
    `Statement Status: ${log.status?.toUpperCase()}`,
    log.police_report_number ? `ZP Form 32 / Police Ref: ${log.police_report_number}` : "",
    "",
    "━━━ WHO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Alleged Perpetrator: ${log.who_perpetrator || "Not provided"}`,
    `Witnesses: ${log.who_witnesses || "None stated"}`,
    "",
    "━━━ WHAT HAPPENED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    log.what_happened || "Not provided",
    "",
    log.what_injuries ? `Injuries/Harm: ${log.what_injuries}` : "",
    "",
    "━━━ WHEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Date of Incident: ${log.when_date || "Not provided"}`,
    `Time: ${log.when_time || "Not provided"}`,
    "",
    "━━━ WHERE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Location: ${log.where_location || "Not provided"}`,
    log.where_province ? `Province: ${log.where_province}` : "",
    "",
    log.prior_incidents ? `Prior Incidents: ${log.prior_incidents}` : "",
    "",
    "═══════════════════════════════════════════════════",
    "This statement was recorded digitally via SafeGuard.",
    "It may be used to support a formal report under the",
    "Zambia Anti-GBV Act, Cap. 123 of the Laws of Zambia.",
    "═══════════════════════════════════════════════════",
  ].filter((l) => l !== null).join("\n");
  return lines;
}

export default function StatementBuilder() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    who_perpetrator: "", who_witnesses: "",
    what_happened: "", what_injuries: "",
    when_date: "", when_time: "",
    where_location: "", where_province: "",
    prior_incidents: "", police_report_number: "",
  });

  const steps = [
    { id: "who", label: "Who", emoji: "👤", desc: "Who was involved?" },
    { id: "what", label: "What", emoji: "📋", desc: "What happened?" },
    { id: "when", label: "When", emoji: "🕐", desc: "When did it occur?" },
    { id: "where", label: "Where", emoji: "📍", desc: "Where did it happen?" },
  ];

  useEffect(() => {
    IncidentLogService.list("-created_date", 100).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setForm({ who_perpetrator: "", who_witnesses: "", what_happened: "", what_injuries: "", when_date: "", when_time: "", where_location: "", where_province: "", prior_incidents: "", police_report_number: "" });
    setStep(0);
  };

  const handleSave = async (status = "draft") => {
    if (!form.what_happened || !form.when_date || !form.where_location) {
      toast({ title: "Please fill in What, When, and Where fields at minimum", variant: "destructive" });
      return;
    }
    setSaving(true);
    await IncidentLogService.create({ ...form, status });
    const updated = await IncidentLogService.list("-created_date", 100);
    setLogs(updated);
    setShowForm(false);
    resetForm();
    setSaving(false);
    toast({ title: status === "finalized" ? "Statement finalized" : "Draft saved", description: "Your statement has been saved securely." });
  };

  const handleExport = async (log) => {
    const text = buildExportText(log);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-statement-${moment().format("YYYY-MM-DD")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    await IncidentLogService.update(log.id, { status: "exported" });
    setLogs((prev) => prev.map((l) => l.id === log.id ? { ...l, status: "exported" } : l));
    if (viewLog?.id === log.id) setViewLog({ ...log, status: "exported" });
    toast({ title: "Statement exported", description: "Download your file and present it at the Victim Support Unit." });
  };

  const handleExportPdf = async (log) => {
    try {
      generateZpForm32Pdf(log, log.linked_case_id);
      await IncidentLogService.update(log.id, { status: "exported" });
      setLogs((prev) => prev.map((l) => l.id === log.id ? { ...l, status: "exported" } : l));
      if (viewLog?.id === log.id) setViewLog({ ...log, status: "exported" });
      toast({ title: "ZP Form 32 PDF generated", description: "Saved to your downloads. Take it to the nearest VSU." });
    } catch (e) {
      toast({ title: "PDF export failed", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statement Builder</h1>
            <p className="text-sm text-muted-foreground">Document your incident for the Anti-GBV Act legal process</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Statement
        </Button>
      </div>

      {/* Legal Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary mb-1">📜 Zambia Anti-GBV Act — Why this matters</p>
        <p className="text-xs text-foreground/70">
          Under the Zambia Anti-GBV Act (Cap. 123), documenting the "Who, What, When, and Where" of an incident while facts are fresh is critical for legal proceedings. Your statement can be exported and presented at the Victim Support Unit (VSU) or used when filing a ZP Form 32 police report.
        </p>
      </div>

      {/* Past Statements */}
      {logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No statements yet"
          description="Use the Statement Builder to document incidents while the facts are fresh. Your records are private and secure."
          action={<Button onClick={() => { resetForm(); setShowForm(true); }}>Start First Statement</Button>}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saved Statements</h2>
          {logs.map((log, i) => {
            const sc = statusConfig[log.status] || statusConfig.draft;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>{sc.label}</span>
                      {log.where_province && (
                        <span className="text-[10px] text-muted-foreground">{log.where_province} Province</span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {moment(log.created_date).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-2 line-clamp-2">{log.what_happened}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.when_date} · {log.where_location}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setViewLog(log)}>
                    <Eye className="w-3 h-3" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => handleExport(log)}>
                    <Download className="w-3 h-3" /> Export TXT
                  </Button>
                  <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => handleExportPdf(log)}>
                    <FileDown className="w-3 h-3" /> Export as PDF
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Statement Builder Drawer */}
      <Drawer open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New Incident Statement</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto max-h-[75vh]">
            <div className="flex gap-1 mb-2">
              {steps.map((s, i) => (
                <button key={s.id} onClick={() => setStep(i)} className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${step === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">{steps[step].desc}</p>
            <div className="space-y-4">
              {step === 0 && (
                <>
                  <div>
                    <Label>Who committed the act? *</Label>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Name, physical description, or relationship</p>
                    <Textarea value={form.who_perpetrator} onChange={(e) => setForm((f) => ({ ...f, who_perpetrator: e.target.value }))} placeholder="e.g. My husband, John M., age ~35, tall build..." rows={3} />
                  </div>
                  <div>
                    <Label>Were there any witnesses?</Label>
                    <Textarea value={form.who_witnesses} onChange={(e) => setForm((f) => ({ ...f, who_witnesses: e.target.value }))} placeholder="Names or descriptions of anyone who saw what happened..." rows={2} />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <div>
                    <Label>What happened? *</Label>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Describe the incident in as much detail as you can remember</p>
                    <Textarea value={form.what_happened} onChange={(e) => setForm((f) => ({ ...f, what_happened: e.target.value }))} placeholder="Describe what occurred step by step..." rows={5} />
                  </div>
                  <div>
                    <Label>Injuries or harm sustained</Label>
                    <Textarea value={form.what_injuries} onChange={(e) => setForm((f) => ({ ...f, what_injuries: e.target.value }))} placeholder="e.g. Bruising on left arm, cut on forehead, emotional distress..." rows={2} />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div><Label>Date of incident *</Label><Input type="date" value={form.when_date} onChange={(e) => setForm((f) => ({ ...f, when_date: e.target.value }))} /></div>
                  <div><Label>Approximate time</Label><Input type="time" value={form.when_time} onChange={(e) => setForm((f) => ({ ...f, when_time: e.target.value }))} /></div>
                  <div><Label>Has this happened before?</Label><Textarea value={form.prior_incidents} onChange={(e) => setForm((f) => ({ ...f, prior_incidents: e.target.value }))} placeholder="Describe any previous incidents if relevant..." rows={2} /></div>
                </>
              )}
              {step === 3 && (
                <>
                  <div><Label>Location of incident *</Label><Input value={form.where_location} onChange={(e) => setForm((f) => ({ ...f, where_location: e.target.value }))} placeholder="Address, area, or description of place" /></div>
                  <div>
                    <Label>Province</Label>
                    <Select value={form.where_province} onValueChange={(v) => setForm((f) => ({ ...f, where_province: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                      <SelectContent>{provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>ZP Form 32 / Police Reference Number</Label><Input value={form.police_report_number} onChange={(e) => setForm((f) => ({ ...f, police_report_number: e.target.value }))} placeholder="e.g. VSU/LSK/0042/2026" /></div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-6 gap-2">
              <div className="flex gap-2">
                {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Back</Button>}
                {step < steps.length - 1 && <Button size="sm" onClick={() => setStep(step + 1)}>Next</Button>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Save Draft
                </Button>
                {step === steps.length - 1 && (
                  <Button size="sm" onClick={() => handleSave("finalized")} disabled={saving}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Finalize
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* View Statement Drawer */}
      <Drawer open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Incident Statement</DrawerTitle>
          </DrawerHeader>
          {viewLog && (
            <div className="space-y-4 px-4 pb-8">
              <pre className="text-xs font-mono bg-muted rounded-lg p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-72">
                {buildExportText(viewLog)}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2" onClick={() => handleExport(viewLog)}>
                  <Download className="w-4 h-4" /> TXT
                </Button>
                <Button className="gap-2" onClick={() => handleExportPdf(viewLog)}>
                  <FileDown className="w-4 h-4" /> ZP Form 32 PDF
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}