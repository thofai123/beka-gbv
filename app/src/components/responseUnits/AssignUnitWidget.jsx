import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { useResponseUnits } from "@/hooks/useEntityQueries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UnitTypeBadge from "./UnitTypeBadge";

export default function AssignUnitWidget({ caseData, currentUser, onAssigned }) {
  const { data: units = [], isLoading: loading } = useResponseUnits({ is_active: true }, { sort: "name", limit: 100 });

  const assign = async (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;
    await CaseService.update(caseData.id, {
      assigned_unit_id: unit.id,
      assigned_unit_name: unit.name,
    });
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "assignment",
      note: `Assigned to response unit: ${unit.name}`,
      new_value: unit.name,
      updated_by_name: currentUser?.full_name || "Unknown",
    });
    onAssigned?.();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Response Unit</h3>
      {caseData.assigned_unit_name && (
        <div className="mb-3 p-2 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm font-medium">{caseData.assigned_unit_name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Currently assigned</p>
        </div>
      )}
      {loading ? (
        <div className="h-9 bg-muted animate-pulse rounded-md" />
      ) : units.length === 0 ? (
        <p className="text-xs text-muted-foreground">No active units available</p>
      ) : (
        <Select value={caseData.assigned_unit_id || ""} onValueChange={assign}>
          <SelectTrigger>
            <SelectValue placeholder="Assign a unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                <span className="flex items-center gap-2">
                  <UnitTypeBadge type={u.unit_type} />
                  {u.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}