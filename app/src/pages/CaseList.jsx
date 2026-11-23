import { useState, useEffect, useCallback, useMemo } from "react";
import { cacheAll, getAll } from "../lib/offlineCache";
import OfflineBanner from "../components/OfflineBanner";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Download,
  Calendar,
  ArrowUpDown,
  Loader2,

  Camera
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import SkeletonCard from "../components/SkeletonCard";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import moment from "moment";

const RISK_BORDER = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-400",
  low: "bg-green-500",
};

const OPEN_STATUSES = new Set(["received", "dispatched"]);
const REVIEW_STATUSES = new Set(["acknowledged", "in_progress", "escalated"]);
const RESOLVED_STATUSES = new Set(["resolved", "closed"]);

function isSameDay(dateVal, ref = new Date()) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function isWithinPeriod(dateVal, period) {
  if (!dateVal || period === "all") return true;
  const d = moment(dateVal);
  const now = moment();
  if (period === "today") return d.isSame(now, "day");
  if (period === "week") return d.isSame(now, "week");
  if (period === "month") return d.isSame(now, "month");
  if (period === "year") return d.isSame(now, "year");
  return true;
}

export default function CaseList() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageTab, setStageTab] = useState(initialFilter); // all | open | awaiting_review | resolved
  const [archivePeriod, setArchivePeriod] = useState("today"); // today | week | month | year | all
  const [sortAsc, setSortAsc] = useState(false); // false = newest first, true = oldest first (chronological)
  const [busyCaseId, setBusyCaseId] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "responder";

  useEffect(() => {
    const paramFilter = searchParams.get("filter");
    if (paramFilter && paramFilter !== stageTab) {
      setStageTab(paramFilter);
      if (paramFilter === "resolved") setArchivePeriod("today");
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const data = await CaseService.filter({}, "-created_date", 500, 0);
        setCases(data || []);
        await cacheAll("cases", data || []);
      } else {
        const cached = await getAll("cases");
        setCases(cached || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    const unsubscribe = CaseService.subscribe(() => loadCases());
    return () => unsubscribe?.();
  }, [loadCases]);

  const changeStage = (nextStage) => {
    setStageTab(nextStage);
    if (nextStage === "resolved") setArchivePeriod("today");
    if (nextStage === "all") {
      searchParams.delete("filter");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ filter: nextStage });
    }
  };

  // 1-tap transition: Open Case -> Awaiting Review
  const moveToAwaitingReview = async (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    setBusyCaseId(c.id);
    try {
      await CaseService.update(c.id, {
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.email || "Admin",
      });
      await CaseUpdateService.create({
        case_id: c.id,
        update_type: "status_change",
        note: `Case ${c.case_id} placed under Awaiting Review by ${user?.full_name || user?.email || "Admin"}.`,
        old_value: c.status,
        new_value: "acknowledged",
        updated_by_name: user?.full_name || user?.email || "Admin",
      });
      toast({
        title: `${c.case_id} → Awaiting Review`,
        description: "Case moved into Awaiting Review queue.",
      });
      await loadCases();
    } finally {
      setBusyCaseId(null);
    }
  };

  // 1-tap transition: Awaiting Review -> Resolved Today
  const markResolved = async (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    setBusyCaseId(c.id);
    try {
      const resolvedAt = new Date().toISOString();
      await CaseService.update(c.id, {
        status: "resolved",
        resolved_at: resolvedAt,
      });
      await CaseUpdateService.create({
        case_id: c.id,
        update_type: "resolution",
        note: `Case ${c.case_id} resolved and archived in evidence log by ${user?.full_name || user?.email || "Admin"}.`,
        old_value: c.status,
        new_value: "resolved",
        updated_by_name: user?.full_name || user?.email || "Admin",
      });
      toast({
        title: `${c.case_id} → Resolved Today`,
        description: `Archived with timestamp ${moment(resolvedAt).format("MMM D, YYYY · HH:mm")}.`,
      });
      await loadCases();
    } finally {
      setBusyCaseId(null);
    }
  };

  const counts = useMemo(() => {
    const open = cases.filter((c) => OPEN_STATUSES.has(c.status)).length;
    const review = cases.filter((c) => REVIEW_STATUSES.has(c.status)).length;
    const resolvedToday = cases.filter(
      (c) => RESOLVED_STATUSES.has(c.status) && isSameDay(c.resolved_at || c.updated_date || c.created_date)
    ).length;
    return { all: cases.length, open, review, resolvedToday };
  }, [cases]);

  const filtered = useMemo(() => {
    let list = cases.filter((c) => {
      if (stageTab === "open") return OPEN_STATUSES.has(c.status);
      if (stageTab === "awaiting_review") return REVIEW_STATUSES.has(c.status);
      if (stageTab === "resolved") {
        if (!RESOLVED_STATUSES.has(c.status)) return false;
        const stamp = c.resolved_at || c.updated_date || c.created_date;
        return isWithinPeriod(stamp, archivePeriod);
      }
      return true;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.case_id?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.survivor_name?.toLowerCase().includes(q) ||
          c.reporter_email?.toLowerCase().includes(q) ||
          c.location_description?.toLowerCase().includes(q)
      );
    }

    // Chronological ordering
    return [...list].sort((a, b) => {
      const tA = new Date(
        stageTab === "resolved" ? a.resolved_at || a.updated_date || a.created_date : a.created_date
      ).getTime();
      const tB = new Date(
        stageTab === "resolved" ? b.resolved_at || b.updated_date || b.created_date : b.created_date
      ).getTime();
      return sortAsc ? tA - tB : tB - tA;
    });
  }, [cases, stageTab, archivePeriod, search, sortAsc]);

  const exportCSV = () => {
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, "\"\"");
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const headers = [
      "case_id",
      "incident_type",
      "status",
      "risk_level",
      "survivor_or_reporter",
      "location",
      "filed_at",
      "acknowledged_at",
      "resolved_at",
    ];
    const rows = filtered.map((c) =>
      [
        c.case_id,
        c.incident_type,
        c.status,
        c.risk_level,
        c.survivor_name || c.reporter_email || "Anonymous",
        c.location_description || (c.location_lat && c.location_lng ? `${c.location_lat},${c.location_lng}` : ""),
        c.created_date ? moment(c.created_date).format("YYYY-MM-DD HH:mm:ss") : "",
        c.acknowledged_at ? moment(c.acknowledged_at).format("YYYY-MM-DD HH:mm:ss") : "",
        c.resolved_at ? moment(c.resolved_at).format("YYYY-MM-DD HH:mm:ss") : "",
      ]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beka-evidence-${stageTab}-${archivePeriod}-${moment().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 py-2">
      <OfflineBanner isOffline={isOffline} />

      {/* 4-Stage Workflow Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => changeStage("open")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            stageTab === "open"
              ? "bg-orange-500 text-black"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Open Cases ({counts.open})
        </button>
        <button
          type="button"
          onClick={() => changeStage("awaiting_review")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            stageTab === "awaiting_review"
              ? "bg-amber-500 text-black"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Awaiting Review ({counts.review})
        </button>
        <button
          type="button"
          onClick={() => changeStage("resolved")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            stageTab === "resolved"
              ? "bg-emerald-500 text-black"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Resolved Today ({counts.resolvedToday})
        </button>
        <button
          type="button"
          onClick={() => changeStage("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            stageTab === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({counts.all})
        </button>
      </div>

      {/* Chronological Evidence Archive Filter Bar (Day / Week / Month / Year / All) when on Resolved */}
      {stageTab === "resolved" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Evidence Record Archive
            </span>
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { id: "today", label: "Resolved Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
              { id: "all", label: "All Records" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setArchivePeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  archivePeriod === p.id
                    ? "bg-emerald-500 text-black font-bold"
                    : "bg-black/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Chronological Order Toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Case ID (GBV-2026-...), name, or location..."
            className="pl-9 rounded-xl bg-muted border-0 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setSortAsc((v) => !v)}
          title="Toggle chronological sort order"
          className="px-3 rounded-xl bg-muted text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortAsc ? "Oldest" : "Newest"}
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <FileText className="w-8 h-8 opacity-40" />
          <p className="text-sm">No cases in this view</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const isOpen = OPEN_STATUSES.has(c.status);
            const isReview = REVIEW_STATUSES.has(c.status);
            const isResolved = RESOLVED_STATUSES.has(c.status);
            const isBusy = busyCaseId === c.id;
            const relevantStamp = isResolved
              ? c.resolved_at || c.updated_date || c.created_date
              : c.created_date;

            return (
              <Link key={c.id} to={`/beka/cases/${c.id}`} className="block">
                <div className="flex items-stretch bg-card border border-border rounded-xl overflow-hidden hover:border-orange-500/40 transition-colors">
                  <div className={`w-1.5 flex-shrink-0 ${RISK_BORDER[c.risk_level] || "bg-muted"}`} />
                  <div className="p-3.5 flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-bold text-foreground truncate">
                          {c.case_id || "Unnamed case"}
                        </p>
                        <p className="text-xs font-medium text-foreground/90 truncate mt-0.5">
                          {c.survivor_name || c.reporter_email || c.created_by || "Anonymous"}
                        </p>
                        {(c.survivor_contact || c.reporter_email) && (
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            {[c.survivor_contact, c.reporter_email].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}
                          </p>
                        )}
                        {(() => {
                          const photoCount = Array.isArray(c.attachments)
                            ? c.attachments.filter((u) => /^data:image\//i.test(String(u || "")) || /\.(png|jpe?g|gif|webp|heic)$/i.test(String(u || ""))).length
                            : 0;
                          if (photoCount <= 0) return null;
                          return (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                              <Camera className="w-3 h-3" /> {photoCount} evidence {photoCount === 1 ? "photo" : "photos"} attached
                            </span>
                          );
                        })()}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    )}

                    {(c.location_description || (c.location_lat != null && c.location_lng != null)) && (
                      <div className="flex items-center justify-between gap-2 text-[11px] text-orange-300/90 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1">
                        <span className="truncate">
                          📍 {c.location_description || `GPS ${Number(c.location_lat).toFixed(4)}, ${Number(c.location_lng).toFixed(4)}`}
                        </span>
                        {c.location_lat != null && c.location_lng != null && (
                          <a
                            href={`https://maps.google.com/?q=${c.location_lat},${c.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:underline font-semibold flex-shrink-0"
                          >
                            Map ↗
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relevantStamp ? moment(relevantStamp).format("MMM D, YYYY · HH:mm") : "—"}
                      </span>

                      {isStaff && isOpen && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={(e) => moveToAwaitingReview(e, c)}
                          className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1"
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Put Under Awaiting Review
                        </Button>
                      )}

                      {isStaff && isReview && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={(e) => markResolved(e, c)}
                          className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
