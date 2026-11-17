import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Edit2 } from "lucide-react";
import UnitTypeBadge from "./UnitTypeBadge";
import UnitStatusBadge from "./UnitStatusBadge";

export default function ResponseUnitCard({ unit, index = 0, onEdit, isAdmin = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <UnitTypeBadge type={unit.unit_type} />
            <UnitStatusBadge status={unit.on_call_status || "available"} />
            {!unit.is_active && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
            )}
          </div>
          <h3 className="font-semibold mt-2 truncate">{unit.name}</h3>
          {unit.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{unit.description}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
            {unit.contact_phone && (
              <a href={`tel:${unit.contact_phone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="w-3 h-3" /> {unit.contact_phone}
              </a>
            )}
            {unit.contact_email && (
              <a href={`mailto:${unit.contact_email}`} className="flex items-center gap-1 hover:text-primary truncate max-w-[180px]">
                <Mail className="w-3 h-3" /> {unit.contact_email}
              </a>
            )}
            {(unit.district || unit.province) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[unit.district, unit.province].filter(Boolean).join(", ")}
              </span>
            )}
            {unit.operating_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {unit.operating_hours}
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => onEdit(unit)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="Edit unit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}