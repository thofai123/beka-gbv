import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  HeartHandshake,
  Home,
  Scale,
  MessageCircle,
  LifeBuoy,
  Baby,
  MapPin,
  Phone,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const ICONS = {
  vsu: ShieldAlert,
  osc: HeartHandshake,
  shelter: Home,
  legal_aid: Scale,
  counseling: MessageCircle,
  child_protection: Baby,
  emergency_response: LifeBuoy,
  police: ShieldAlert,
  gbv_support: HeartHandshake,
};

const TYPE_KEYS = {
  vsu: "typeVsu",
  osc: "typeOsc",
  shelter: "typeShelter",
  legal_aid: "typeLegalAid",
  counseling: "typeCounseling",
  child_protection: "typeChildProtection",
  emergency_response: "typeEmergency",
  police: "typePolice",
  gbv_support: "typeGbv",
};

export default function ResourceListCard({ resource, isAdmin, onEdit, onDelete, index = 0 }) {
  const { t } = useLanguage();
  const Icon = ICONS[resource.type] || HeartHandshake;
  const typeLabel = t(TYPE_KEYS[resource.type] || "typeGbv");

  const mapUrl =
    resource.map_url || resource.address
      ? resource.map_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${resource.address} Zambia`)}`
      : null;

  const phoneNumbers = [
    resource.phone,
    resource.secondary_phone,
    resource.tertiary_phone,
  ].filter(Boolean);

  const hasWhatsapp = !!resource.whatsapp && resource.type !== "legal_aid";
  const hasWebsite = !!resource.website && !resource.is_builtin;
  const hasDocument = !!resource.document_url && !resource.is_builtin;
  const showDescription = !!resource.description && !resource.is_builtin;

  const cleanWaDigits = resource.whatsapp
    ? resource.whatsapp.replace(/[^0-9]/g, "")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="bg-card border border-border rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{resource.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground mt-0.5">
            <span>
              {typeLabel}
              {resource.district ? ` · ${resource.district}` : ""}
            </span>
            {resource.operating_hours && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <Clock className="w-3 h-3" /> {resource.operating_hours}
              </span>
            )}
          </div>
          {showDescription && (
            <p className="text-xs text-foreground/80 mt-2 leading-relaxed whitespace-pre-line">
              {resource.description}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onEdit(resource)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(resource)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3.5">
        {phoneNumbers.map((num, idx) => (
          <Button
            key={num}
            asChild
            size="sm"
            variant={idx === 0 ? "default" : "outline"}
            className={
              idx === 0
                ? "gap-1.5 h-9 flex-1 min-w-[135px] bg-[#E84B1D] hover:bg-[#d13f14] text-white"
                : "gap-1.5 h-9 flex-1 min-w-[135px]"
            }
          >
            <a href={`tel:${num.replace(/[\s-]+/g, "")}`}>
              <Phone className="w-3.5 h-3.5" /> {t("call")} {num}
            </a>
          </Button>
        ))}
        {hasWhatsapp && (
          <Button
            asChild
            size="sm"
            className="gap-1.5 h-9 flex-1 min-w-[135px] bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <a
              href={`https://wa.me/${cleanWaDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp {resource.whatsapp}
            </a>
          </Button>
        )}
        {mapUrl && (
          <Button asChild size="sm" variant="outline" className="gap-1.5 h-9 flex-1 min-w-[120px]">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-3.5 h-3.5" /> {t("navigate")}
            </a>
          </Button>
        )}
        {hasWebsite && (
          <Button asChild size="sm" variant="outline" className="gap-1.5 h-9">
            <a href={resource.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" /> {t("visitWebsite")}
            </a>
          </Button>
        )}
        {hasDocument && (
          <Button asChild size="sm" variant="outline" className="gap-1.5 h-9">
            <a href={resource.document_url} target="_blank" rel="noopener noreferrer">
              <FileText className="w-3.5 h-3.5" /> {t("viewResource")}
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
