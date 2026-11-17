import { useState, useEffect, useCallback } from "react";
import { ResponseUnitService } from "@/services/ResponseUnitService";
import { UserService } from "@/services/UserService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import ResponseUnitCard from "../components/responseUnits/ResponseUnitCard";
import ResponseUnitForm from "../components/responseUnits/ResponseUnitForm";

const PAGE_SIZE = 30;

export default function ResponseUnits() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const buildQuery = () => {
    const q = {};
    if (typeFilter !== "all") q.unit_type = typeFilter;
    if (statusFilter !== "all") q.on_call_status = statusFilter;
    return q;
  };

  const loadUnits = useCallback(async (reset = false, currentOffset = 0) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const query = buildQuery();
      const data = await ResponseUnitService.filter(query, "-created_date", PAGE_SIZE + 1, currentOffset);
      const hasNext = data.length > PAGE_SIZE;
      const page = hasNext ? data.slice(0, PAGE_SIZE) : data;
      setUnits(reset ? page : (prev) => {
        const ids = new Set(prev.map((u) => u.id));
        return [...prev, ...page.filter((u) => !ids.has(u.id))];
      });
      setHasMore(hasNext);
    } catch (e) {
      console.error(e);
    }
    if (reset) setLoading(false); else setLoadingMore(false);
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    UserService.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    loadUnits(true, 0);
  }, [typeFilter, statusFilter, loadUnits]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await ResponseUnitService.update(editing.id, data);
        toast({ title: "Unit updated" });
      } else {
        await ResponseUnitService.create(data);
        toast({ title: "Unit created" });
      }
      setShowForm(false);
      setEditing(null);
      await loadUnits(true, 0);
    } catch (e) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleEdit = (unit) => {
    setEditing(unit);
    setShowForm(true);
  };

  const filtered = search
    ? units.filter((u) => {
        const q = search.toLowerCase();
        return u.name?.toLowerCase().includes(q) ||
          u.district?.toLowerCase().includes(q) ||
          u.coverage_area?.toLowerCase().includes(q) ||
          u.contact_phone?.includes(q);
      })
    : units;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Response Units</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} unit{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Unit
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, district, phone..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="police">Police</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
            <SelectItem value="ngo">NGO</SelectItem>
            <SelectItem value="social_services">Social Services</SelectItem>
            <SelectItem value="shelter">Shelter</SelectItem>
            <SelectItem value="legal_aid">Legal Aid</SelectItem>
            <SelectItem value="vsu">VSU</SelectItem>
            <SelectItem value="osc">One-Stop Centre</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="off_duty">Off-duty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No response units"
          description={isAdmin ? "Create the first unit to start assigning cases." : "No units match your filters."}
          action={isAdmin ? <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Unit</Button> : null}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u, i) => (
            <ResponseUnitCard key={u.id} unit={u} index={i} onEdit={handleEdit} isAdmin={isAdmin} />
          ))}
          {hasMore && !search && (
            <button
              onClick={() => loadUnits(false, units.length)}
              disabled={loadingMore}
              className="w-full py-3 text-sm text-primary hover:underline disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Response Unit" : "New Response Unit"}</DialogTitle>
          </DialogHeader>
          <ResponseUnitForm
            unit={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}