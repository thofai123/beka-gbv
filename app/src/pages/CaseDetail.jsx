import { resolveFileUrl } from "@/lib/file-url";
import { useState, useEffect, useCallback } from "react";
import { cacheAll, getAll, queuePendingNote, getPendingNotes, clearPendingNote } from "../lib/offlineCache";
import OfflineBanner from "../components/OfflineBanner";
import { useParams, useNavigate } from "react-router-dom";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { EvidenceService } from "@/services/EvidenceService";
import { UserService } from "@/services/UserService";
import { NotificationManager } from "@/services/NotificationService";
import { AuditLogService } from "@/services/AuditLogService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin, User, Phone, Mail, MessageSquare, Loader2, X, FileText,
  Image, FileVideo, FileAudio, FileDown, Send
} from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import SkeletonCard from "../components/SkeletonCard";
import CaseTimeline from "../components/CaseTimeline";
import moment from "moment";
import AdminRespondPanel from "../components/cases/AdminRespondPanel";

const incidentLabels = {
  physical_violence: "Physical Violence",
  sexual_violence: "Sexual Violence",
  emotional_abuse: "Emotional Abuse",
  economic_abuse: "Economic Abuse",
  stalking: "Stalking",
  trafficking: "Trafficking",
  forced_marriage: "Forced Marriage",
  other: "Other Incident",
};

const cardClass = "bg-card border border-border rounded-2xl p-5";

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "Just now";
  return moment(dateStr).fromNow();
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function EvidenceIcon({ fileType, fileUrl }) {
  if (fileType === "photo" || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl || "")) return <Image className="w-4 h-4 text-muted-foreground" />;
  if (fileType === "audio" || /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl || "")) return <FileAudio className="w-4 h-4 text-muted-foreground" />;
  if (/\.(mp4|mov|webm|avi)$/i.test(fileUrl || "")) return <FileVideo className="w-4 h-4 text-muted-foreground" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

function EvidenceOverlay({ item, onClose }) {
  const isImage = item.file_type === "photo" || /^data:image\//i.test(item.file_url || "") || /\.(png|jpe?g|gif|webp|heic)$/i.test(item.file_url || "");
  const isAudio = item.file_type === "audio" || /\.(mp3|wav|ogg|m4a)$/i.test(item.file_url || "");
  const isVideo = /\.(mp4|mov|webm|avi)$/i.test(item.file_url || "");

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full flex flex-col items-center gap-4">
        {isImage && (
          <img src={resolveFileUrl(item.file_url)} alt={item.file_name} className="max-h-[80vh] object-contain rounded-lg" />
        )}
        {isVideo && (
          <video controls src={resolveFileUrl(item.file_url)} className="max-h-[80vh] rounded-lg" />
        )}
        {isAudio && (
          <audio controls src={resolveFileUrl(item.file_url)} />
        )}
        {!isImage && !isVideo && !isAudio && (
          <a
            href={resolveFileUrl(item.file_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 text-white"
          >
            <FileDown className="w-12 h-12 opacity-60" />
            <span className="text-sm">Download {item.file_name}</span>
          </a>
        )}
        <p className="text-white/50 text-xs">{item.file_name}</p>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [responders, setResponders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [previewItem, setPreviewItem] = useState(null);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCase = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const [me, caseResults, allUpdates, allEvidence] = await Promise.all([
          UserService.me(),
          CaseService.filter({ id }, "-created_date", 1),
          CaseUpdateService.filter({ case_id: id }, "-created_date", 50),
          EvidenceService.filter({ case_id: id }, "-created_date", 50),
        ]);
        setUser(me);
        const found = caseResults[0] || null;
        setCaseData(found);
        setUpdates(allUpdates);
        setEvidence(allEvidence || []);
        if (me?.role === "admin") {
          try {
            const users = await UserService.filter({ role: "responder" });
            setResponders(users);
          } catch { setResponders([]); }
        }
        if (found) setNewStatus(found.status);
        if (found) await cacheAll("cases", [found]);
        await cacheAll("caseUpdates", allUpdates);
      } else {
        const [allCases, allUpdates] = await Promise.all([
          getAll("cases"),
          getAll("caseUpdates"),
        ]);
        const found = allCases.find((c) => c.id === id);
        setCaseData(found);
        setUpdates(allUpdates.filter((u) => u.case_id === id));
        if (found) setNewStatus(found.status);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      const pending = await getPendingNotes();
      for (const n of pending) {
        try {
          await CaseUpdateService.create({
            case_id: n.case_id,
            update_type: "note",
            note: n.note,
            updated_by_name: n.updated_by_name,
          });
          await clearPendingNote(n.id);
        } catch {}
      }
      setPendingCount(0);
      loadCase();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadCase]);

  useEffect(() => {
    getPendingNotes().then((p) => setPendingCount(p.filter((n) => n.case_id === id).length));
    loadCase();
    const unsubEvidence = EvidenceService.subscribe((event) => {
      if (event.type === "create" && event.data.case_id === id) {
        setEvidence((prev) => [event.data, ...prev]);
        toast({ title: "📎 New evidence added to this case" });
      } else if (event.type === "delete") {
        setEvidence((prev) => prev.filter((e) => e.id !== event.id));
      }
    });
    return () => unsubEvidence?.();
  }, [id, loadCase, toast]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    if (!navigator.onLine) {
      await queuePendingNote({ case_id: id, note: newNote, updated_by_name: user?.full_name || "Unknown" });
      const pending = await getPendingNotes();
      setPendingCount(pending.filter((n) => n.case_id === id).length);
      setUpdates((prev) => [{
        id: `pending_${Date.now()}`,
        case_id: id,
        update_type: "note",
        note: newNote,
        updated_by_name: user?.full_name || "Unknown",
        created_date: new Date().toISOString(),
        _pending: true,
      }, ...prev]);
      setNewNote("");
      setSaving(false);
      toast({ title: "Note saved offline", description: "Will sync when you reconnect." });
      return;
    }
    await CaseUpdateService.create({
      case_id: id,
      update_type: "note",
      note: newNote,
      updated_by_name: user?.full_name || "Unknown",
    });
    setNewNote("");
    await loadCase();
    setSaving(false);
    toast({ title: "Note added" });
  };

  const updateStatus = async (status) => {
    setSaving(true);
    await CaseUpdateService.create({
      case_id: id,
      update_type: "status_change",
      note: `Status changed from ${caseData.status} to ${status}`,
      old_value: caseData.status,
      new_value: status,
      updated_by_name: user?.full_name || "Unknown",
    });
    const updateData = { status };
    if (status === "resolved") updateData.resolved_at = new Date().toISOString();
    await CaseService.update(id, updateData);
    await AuditLogService.create({
      actor_id: user?.id,
      actor_email: user?.email,
      actor_role: user?.role,
      action_type: status === "resolved" ? "case_resolved" : "status_update",
      entity_type: "Case",
      entity_id: id,
      related_case_id: id,
      previous_value: { status: caseData.status },
      new_value: { status },
    }).catch(() => {});
    setNewStatus(status);
    await loadCase();
    setSaving(false);
    toast({ title: `Status updated to ${status}` });
  };

  const assignResponder = async (email) => {
    const responder = responders.find((r) => r.email === email);
    setSaving(true);
    await CaseService.update(id, {
      assigned_responder: email,
      assigned_responder_name: responder?.full_name || email,
      status: caseData.status === "reported" ? "assigned" : caseData.status,
    });
    await CaseUpdateService.create({
      case_id: id,
      update_type: "assignment",
      note: `Assigned to ${responder?.full_name || email}`,
      new_value: responder?.full_name || email,
      updated_by_name: user?.full_name || "Unknown",
    });
    await NotificationManager.caseAssigned(email, { ...caseData, id });
    await AuditLogService.create({
      actor_id: user?.id,
      actor_email: user?.email,
      actor_role: user?.role,
      action_type: "assignment",
      entity_type: "Case",
      entity_id: id,
      related_case_id: id,
      new_value: { assigned_responder: email, assigned_responder_name: responder?.full_name || email },
    }).catch(() => {});
    await loadCase();
    setSaving(false);
    toast({ title: "Responder assigned" });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    await CaseUpdateService.create({
      case_id: id,
      update_type: "note",
      note: `[Message to survivor] ${messageText}`,
      updated_by_name: user?.full_name || "Unknown",
    });
    setMessageText("");
    setShowMessageBox(false);
    await loadCase();
    setSendingMessage(false);
    toast({ title: "Message sent" });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Case not found</p>
        <Button variant="ghost" onClick={() => navigate("/beka/cases")} className="mt-2">Go Back</Button>
      </div>
    );
  }


  const combinedEvidence = (() => {
    const seenUrls = new Set();
    const list = [];
    for (const ev of evidence) {
      if (ev?.file_url) seenUrls.add(ev.file_url);
      list.push(ev);
    }
    const rawAttachments = Array.isArray(caseData?.attachments) ? caseData.attachments : [];
    rawAttachments.forEach((url, idx) => {
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      const isImg = /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|heic)$/i.test(url);
      const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(url);
      list.push({
        id: `att-${idx}`,
        file_url: url,
        file_name: String(url).startsWith("data:") ? `Scene Photo ${idx + 1}.jpg` : decodeURIComponent(String(url).split("/").pop() || `Scene Photo ${idx + 1}`),
        file_type: isImg ? "photo" : isAudio ? "audio" : "document",
        created_date: caseData?.created_date,
      });
    });
    return list;
  })();

  const isAdmin = user?.role === "admin";
  const isStaff = isAdmin || user?.role === "responder";
  const statusActions = ["acknowledged", "in_progress", "resolved"];

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-3">
      <OfflineBanner isOffline={isOffline} pendingCount={pendingCount} />

      {/* Header */}
      <div>
        <p className="text-xs font-mono text-muted-foreground">{caseData.case_id}</p>
        <h1 className="text-xl font-bold mt-0.5">{incidentLabels[caseData.incident_type] || "Incident"}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge status={caseData.status} />
          <RiskBadge level={caseData.risk_level} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Filed: {caseData.created_date ? moment(caseData.created_date).format("MMM D, YYYY · HH:mm") : "—"} ({relativeTime(caseData.created_date)})
        </p>
        {caseData.resolved_at && (
          <p className="text-xs text-emerald-500 font-medium mt-0.5">
            Resolved: {moment(caseData.resolved_at).format("MMM D, YYYY · HH:mm")}
          </p>
        )}
      </div>

      {/* Admin Case Controls (Pending Review / Mark Resolved / Message Survivor) */}
      {isStaff && (
        <AdminRespondPanel
          caseData={caseData}
          user={user}
          onUpdate={loadCase}
          onOpenChat={() => setShowMessageBox((v) => !v)}
        />
      )}

      {isStaff && showMessageBox && (
        <div className={cardClass + " space-y-2.5"}>
          <SectionLabel>Message Survivor</SectionLabel>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write an update or message for the survivor..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowMessageBox(false)}>Cancel</Button>
            <Button size="sm" onClick={sendMessage} disabled={sendingMessage || !messageText.trim()} className="gap-1.5">
              {sendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Message
            </Button>
          </div>
        </div>
      )}

      {/* Incident Details */}
      <div className={cardClass}>
        <SectionLabel>Incident Details</SectionLabel>
        <p className="text-sm leading-relaxed">{caseData.description}</p>
        {(caseData.location_description || (caseData.location_lat != null && caseData.location_lng != null)) && (
          <div className="mt-3 space-y-1">
            <div className="flex items-start gap-2 text-sm text-foreground font-medium">
              <MapPin className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
              <span>
                {caseData.location_description || `GPS ${Number(caseData.location_lat).toFixed(5)}, ${Number(caseData.location_lng).toFixed(5)}`}
              </span>
            </div>
            {caseData.location_lat != null && caseData.location_lng != null && (
              <a
                href={`https://maps.google.com/?q=${caseData.location_lat},${caseData.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 ml-6 text-xs text-blue-400 hover:underline font-semibold"
              >
                Open Exact Location in Google Maps ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* Victim / Reporter Contact Card */}
      <div className={cardClass}>
        <SectionLabel>Victim / Reporter Details</SectionLabel>
        {caseData.is_anonymous && !caseData.survivor_name && !caseData.survivor_contact && !caseData.reporter_email ? (
          <p className="text-sm text-muted-foreground">Submitted anonymously</p>
        ) : (
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="w-4 h-4" /> Name
              </span>
              <span className="font-semibold text-foreground">
                {caseData.survivor_name || caseData.reporter_email || caseData.created_by || "Not provided"}
              </span>
            </div>

            {caseData.survivor_contact && !caseData.survivor_contact.includes("@") && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-4 h-4" /> Phone
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{caseData.survivor_contact}</span>
                  <a
                    href={`tel:${caseData.survivor_contact}`}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${caseData.survivor_contact}`}
                    className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[11px] font-bold"
                  >
                    SMS
                  </a>
                </div>
              </div>
            )}

            {(caseData.reporter_email || (caseData.survivor_contact && caseData.survivor_contact.includes("@")) || caseData.created_by) && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Email
                </span>
                <a
                  href={`mailto:${caseData.reporter_email || (caseData.survivor_contact?.includes("@") ? caseData.survivor_contact : caseData.created_by)}`}
                  className="text-xs font-mono text-blue-400 hover:underline truncate max-w-[210px]"
                >
                  {caseData.reporter_email || (caseData.survivor_contact?.includes("@") ? caseData.survivor_contact : caseData.created_by)}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assigned Responder */}
      <div className={cardClass}>
        <SectionLabel>Assigned Responder</SectionLabel>
        {caseData.assigned_responder_name ? (
          <p className="text-sm font-medium">{caseData.assigned_responder_name}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Unassigned</p>
        )}
        {isAdmin && responders.length > 0 && (
          <div className="mt-3">
            <Select value={caseData.assigned_responder || ""} onValueChange={assignResponder}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Assign a responder…" />
              </SelectTrigger>
              <SelectContent>
                {responders.map((r) => (
                  <SelectItem key={r.email} value={r.email}>
                    {r.full_name || r.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Admin Actions */}
      {isStaff && (
        <div className={cardClass}>
          <SectionLabel>Case Actions</SectionLabel>
          <div className="flex gap-2">
            {statusActions.map((s) => {
              const labels = { acknowledged: "Acknowledge", in_progress: "In Progress", resolved: "Resolve" };
              const active = caseData.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving}
                  className={`flex-1 rounded-lg border text-sm font-medium py-1.5 transition-colors disabled:opacity-50
                    ${active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted"
                    }`}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>


        </div>
      )}

      {/* Evidence & Scene Photos */}
      <div className={cardClass}>
        <SectionLabel>Scene Photos &amp; Evidence{combinedEvidence.length > 0 ? ` · ${combinedEvidence.length}` : ""}</SectionLabel>
        {combinedEvidence.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">No photos or evidence attached</p>
        ) : (
          <div className="space-y-3">
            {/* Image Thumbnail Grid */}
            {combinedEvidence.some((item) => item.file_type === "photo" || /^data:image\//i.test(item.file_url || "") || /\.(png|jpe?g|gif|webp|heic)$/i.test(item.file_url || "")) && (
              <div className="grid grid-cols-2 gap-2.5">
                {combinedEvidence
                  .filter((item) => item.file_type === "photo" || /^data:image\//i.test(item.file_url || "") || /\.(png|jpe?g|gif|webp|heic)$/i.test(item.file_url || ""))
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="group relative rounded-xl overflow-hidden border border-border bg-black/40 aspect-video focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <img
                        src={resolveFileUrl(item.file_url)}
                        alt={item.file_name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = "flex";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div style={{ display: "none" }} className="w-full h-full flex-col items-center justify-center p-2 text-center text-muted-foreground gap-1">
                        <Image className="w-5 h-5 opacity-60" />
                        <span className="text-[10px] leading-tight">Image unavailable (pre-deploy upload)</span>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-semibold">
                        Tap to view
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {/* Full Item List */}
            <div className="space-y-2">
              {combinedEvidence.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                  <EvidenceIcon fileType={item.file_type} fileUrl={item.file_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {relativeTime(item.created_date)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={() => setPreviewItem(item)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity / Timeline */}
      <div className={cardClass}>
        <SectionLabel>Activity</SectionLabel>
        <CaseTimeline updates={updates} />


      </div>

      {/* Evidence overlay */}
      {previewItem && (
        <EvidenceOverlay item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}