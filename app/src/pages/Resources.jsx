import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ResourceService } from "@/services/ResourceService";
import { UserService } from "@/services/UserService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, LifeBuoy, X } from "lucide-react";
import CategoryGrid, { DEFAULT_RESOURCE_CATS } from "../components/resources/CategoryGrid";
import ResourceListCard from "../components/resources/ResourceListCard";
import ResourceForm from "../components/resources/ResourceForm";
import LanguageChips from "../components/resources/LanguageChips";
import GbvEmergencyBanner from "../components/resources/GbvEmergencyBanner";
import { BUILTIN_ZAMBIA_HELPLINES } from "@/data/zambiaHelplines";
import { useLanguage } from "@/lib/LanguageContext";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORY_KEYS = [
  "vsu",
  "osc",
  "shelter",
  "child_protection",
  "counseling",
  "legal_aid",
  "emergency_response",
];
const RESOURCES_CACHE_KEY = "safeguard_resources_cache_v7";

function normalizePhoneKey(num) {
  return String(num || "").replace(/[^0-9]/g, "");
}

function mergeWithBuiltins(apiItems = []) {
  const validApi = Array.isArray(apiItems) ? apiItems : [];
  const combined = [...BUILTIN_ZAMBIA_HELPLINES, ...validApi];
  const seenName = new Set();
  const seenPhoneByType = new Set();
  const result = [];

  for (const item of combined) {
    const type = item.type || "gbv_support";
    const nameKey = `${type}::${(item.name || "").trim().toLowerCase()}`;
    const primaryDigits = normalizePhoneKey(item.phone);
    const phoneKey = primaryDigits ? `${type}::${primaryDigits}` : "";

    if (seenName.has(nameKey)) continue;
    if (phoneKey && seenPhoneByType.has(phoneKey)) continue;

    seenName.add(nameKey);
    if (phoneKey) seenPhoneByType.add(phoneKey);
    result.push(item);
  }
  return result;
}

export default function Resources() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = requestedTab || "vsu";

  const [user, setUser] = useState(null);
  const [resources, setResources] = useState(() => BUILTIN_ZAMBIA_HELPLINES);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialTab);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeCategory) {
      setActiveCategory(tabParam);
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    const qParam = searchParams.get("q");
    if (qParam !== null && qParam !== search) {
      setSearch(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSelectCategory = (key) => {
    setActiveCategory(key);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", key);
      return next;
    });
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const isAdmin = user?.role === "admin";
  const isGbv = activeCategory === "gbv_support";

  const load = async () => {
    try {
      ["safeguard_resources_cache_v2", "safeguard_resources_cache_v3", "safeguard_resources_cache_v4"].forEach((k) =>
        localStorage.removeItem(k)
      );
      const cached = JSON.parse(localStorage.getItem(RESOURCES_CACHE_KEY) || "[]");
      if (cached.length) {
        setResources(mergeWithBuiltins(cached));
      }
    } catch {}

    try {
      const [me, items] = await Promise.all([
        UserService.me().catch(() => null),
        ResourceService.filter({ is_active: true }, "-created_date", 200),
      ]);
      setUser(me);
      const merged = mergeWithBuiltins(items);
      setResources(merged);
      try {
        localStorage.setItem(RESOURCES_CACHE_KEY, JSON.stringify(merged));
      } catch {}
    } catch {
      setResources((prev) => mergeWithBuiltins(prev));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const customCategories = useMemo(() => {
    const baseKeys = new Set(DEFAULT_RESOURCE_CATS.map((c) => c.key));
    const map = new Map();
    resources.forEach((r) => {
      if (r.type && !baseKeys.has(r.type) && !map.has(r.type)) {
        const label = r.category_label || r.type.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
        map.set(r.type, { key: r.type, label, desc: "Custom support resource", icon: LifeBuoy, color: "#e05028" });
      }
    });
    return Array.from(map.values());
  }, [resources]);

  const counts = useMemo(() => {
    const c = {};
    [...CATEGORY_KEYS, ...customCategories.map((x) => x.key)].forEach((k) => (c[k] = 0));
    resources.forEach((r) => {
      c[r.type] = (c[r.type] || 0) + 1;
    });
    return c;
  }, [resources, customCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources
      .filter((r) => r.type === activeCategory)
      .filter((r) => {
        if (!q) return true;
        return (
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.district?.toLowerCase().includes(q) ||
          r.phone?.toLowerCase().includes(q) ||
          r.secondary_phone?.toLowerCase().includes(q)
        );
      });
  }, [resources, activeCategory, search]);

  const handleSave = async (data) => {
    if (editing?.id && !editing?.is_builtin) {
      await ResourceService.update(editing.id, data);
      toast({ title: "Resource updated" });
    } else {
      await ResourceService.create(data);
      if (data.type) setActiveCategory(data.type);
      toast({ title: "Resource & tab saved" });
    }
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting || deleting.is_builtin) {
      setDeleting(null);
      return;
    }
    await ResourceService.delete(deleting.id);
    toast({ title: "Resource removed" });
    setDeleting(null);
    load();
  };

  return (
    <div style={{ background: "#f2f2f7", minHeight: "100%" }}>
      {/* Header */}
      <div
        style={{ background: "#ffffff", padding: 16 }}
        className="flex items-center justify-between gap-3 border-b border-[#e5e5e5]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(232,75,29,0.1)",
              color: "#E84B1D",
            }}
          >
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111" }} className="tracking-tight">
              {t("supportResources")}
            </h1>
            <p style={{ fontSize: 13, color: "#888" }}>{t("supportSubtitle")}</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            size="sm"
            className="gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> {t("add")}
          </Button>
        )}
      </div>

      <div className="max-w-3xl lg:max-w-6xl mx-auto space-y-5 lg:space-y-8 px-4 lg:px-6 pt-4 pb-6">
        {/* Categories */}
        <CategoryGrid active={activeCategory} counts={counts} customCategories={customCategories} onSelect={handleSelectCategory} />

        {/* GBV-only: language selector + emergency banner */}
        {isGbv && (
          <div className="space-y-3">
            <LanguageChips />
            <GbvEmergencyBanner />
          </div>
        )}

        {/* Search */}
        <div className="relative" ref={listRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 pr-9 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* List */}
        {loading && filtered.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title={t("noResources")}
            description={search ? t("tryDifferentSearch") : t("noResourcesYet")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-5">
            {filtered.map((r, i) => (
              <ResourceListCard
                key={r.id}
                resource={r}
                isAdmin={isAdmin && !r.is_builtin}
                index={i}
                onEdit={(res) => {
                  setEditing(res);
                  setFormOpen(true);
                }}
                onDelete={(res) => setDeleting(res)}
              />
            ))}
          </div>
        )}

        {/* Form drawer */}
        {isAdmin && (
          <ResourceForm
            open={formOpen}
            initial={editing}
            customCategories={customCategories}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        )}

        {/* Delete confirm */}
        <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteResource")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              "{deleting?.name}" {t("deleteConfirm")}
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                {t("cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t("delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
