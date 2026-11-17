import { useState, useEffect, useCallback } from "react";
import { cacheAll, getAll } from "../lib/offlineCache";
import OfflineBanner from "../components/OfflineBanner";
import { CaseService } from "@/services/CaseService";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import SkeletonCard from "../components/SkeletonCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatDistanceToNow } from "date-fns";

const RISK_BORDER = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-400",
  low: "bg-green-500",
};

const NEEDS_ATTENTION_STATUSES = new Set(["received", "dispatched", "escalated", "in_progress"]);
const NEEDS_ATTENTION_RISKS = new Set(["critical"]);

function isNeedsAttention(c) {
  return NEEDS_ATTENTION_STATUSES.has(c.status) || NEEDS_ATTENTION_RISKS.has(c.risk_level);
}

function CaseRow({ c }) {
  return (
    <Link to={`/cases/${c.id}`}>
      <div className="flex items-stretch bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
        {/* Risk color bar */}
        <div className={`w-1 flex-shrink-0 ${RISK_BORDER[c.risk_level] || "bg-muted"}`} />
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-1 min-w-0">
          {/* Left */}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{c.case_id || "Unnamed case"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {c.survivor_name || c.reporter_email || "Anonymous"}
            </p>
          </div>
          {/* Right */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={c.status} />
            <span className="text-[11px] text-muted-foreground">
              {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true }) : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionLabel({ label }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2 mt-4">
      {label}
    </p>
  );
}

const PAGE_SIZE = 30;

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const buildQuery = () => {
    const q = {};
    if (statusFilter !== "all") q.status = statusFilter;
    if (riskFilter !== "all") q.risk_level = riskFilter;
    return q;
  };

  const loadCases = useCallback(async (reset = false, currentOffset = 0) => {
    if (reset) { setLoading(true); setPage(0); } else setLoadingMore(true);

    try {
      if (navigator.onLine) {
        const query = buildQuery();
        const data = await CaseService.filter(query, "-created_date", PAGE_SIZE + 1, currentOffset);
        const hasNextPage = data.length > PAGE_SIZE;
        const pageData = hasNextPage ? data.slice(0, PAGE_SIZE) : data;
        setCases(reset ? pageData : (prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          return [...prev, ...pageData.filter((c) => !existingIds.has(c.id))];
        });
        setHasMore(hasNextPage);
        setPage(currentOffset + pageData.length);
        if (reset) await cacheAll("cases", pageData);
      } else {
        const cached = await getAll("cases");
        setCases(cached);
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    }
    if (reset) setLoading(false); else setLoadingMore(false);
  }, [statusFilter, riskFilter]);

  useEffect(() => {
    loadCases(true, 0);
  }, [statusFilter, riskFilter]);

  // Live sync — refresh the list whenever any case is created/updated/deleted
  useEffect(() => {
    const unsubscribe = CaseService.subscribe(() => loadCases(true, 0));
    return () => unsubscribe?.();
  }, [loadCases]);

  const filtered = search
    ? cases.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.case_id?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.survivor_name?.toLowerCase().includes(q) ||
          c.location_description?.toLowerCase().includes(q)
        );
      })
    : cases;

  const exportCSV = () => {
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const headers = ["case_id", "incident_type", "status", "location", "risk_level", "created_date"];
    const rows = filtered.map((c) => [
      c.case_id,
      c.incident_type,
      c.status,
      c.location_description || (c.location_lat && c.location_lng ? `${c.location_lat},${c.location_lng}` : ""),
      c.risk_level,
      c.created_date,
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cases-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
      </div>
    );
  }

  const needsAttention = filtered.filter(isNeedsAttention);
  const rest = filtered.filter((c) => !isNeedsAttention(c));

  return (
    <div className="space-y-2">
      <OfflineBanner isOffline={isOffline} />

      {/* Top bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="pl-9 rounded-xl bg-muted border-0"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl bg-muted border-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="received">Open</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <FileText className="w-8 h-8 opacity-40" />
          <p className="text-sm">No cases yet</p>
        </div>
      )}

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <>
          <SectionLabel label="Needs Attention" />
          <div className="space-y-2">
            {needsAttention.map((c) => <CaseRow key={c.id} c={c} />)}
          </div>
        </>
      )}

      {/* All Cases */}
      {rest.length > 0 && (
        <>
          <SectionLabel label="All Cases" />
          <div className="space-y-2">
            {rest.map((c) => <CaseRow key={c.id} c={c} />)}
          </div>
        </>
      )}

      {hasMore && !search && (
        <button
          onClick={() => loadCases(false, page)}
          disabled={loadingMore}
          className="w-full py-3 text-sm text-primary hover:underline disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}