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

  const phoneNumbers = Array.from(
    new Set(
      [resource.phone, resource.secondary_phone, resource.tertiary_phone].filter(Boolean)
    )
  );

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
      className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="font-semibold text-[15px] leading-snug tracking-tight text-foreground">
            {resource.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground leading-relaxed">
            <span>
              {typeLabel}
              {resource.district ? ` · ${resource.district}` : ""}
            </span>
            {resource.operating_hours && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{resource.operating_hours}</span>
              </span>
            )}
          </div>
          {showDescription && (
            <p className="text-xs text-foreground/80 pt-1 leading-relaxed whitespace-pre-line">
              {resource.description}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onEdit(resource)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(resource)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-95 transition-all"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5 pt-1">
        {phoneNumbers.map((num, idx) => (
          <Button
            key={num}
            asChild
            size="sm"
            variant={idx === 0 ? "default" : "outline"}
            className={
              idx === 0
                ? "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl flex-1 min-w-[145px] bg-[#E84B1D] hover:bg-[#d13f14] text-white font-medium tracking-wide shadow-sm active:scale-[0.98] transition-all"
                : "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl flex-1 min-w-[145px] font-medium tracking-wide active:scale-[0.98] transition-all"
            }
          >
            <a href={`tel:${num.replace(/[\s-]+/g, "")}`}>
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{t("call")} {num}</span>
            </a>
          </Button>
        ))}
        {hasWhatsapp && (
          <Button
            asChild
            size="sm"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl flex-1 min-w-[145px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium tracking-wide active:scale-[0.98] transition-all"
          >
            <a
              href={`https://wa.me/${cleanWaDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span>WhatsApp {resource.whatsapp}</span>
            </a>
          </Button>
        )}
        {mapUrl && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl flex-1 min-w-[130px] font-medium active:scale-[0.98] transition-all"
          >
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{t("navigate")}</span>
            </a>
          </Button>
        )}
        {hasWebsite && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            <a href={resource.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>{t("visitWebsite")}</span>
            </a>
          </Button>
        )}
        {hasDocument && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            <a href={resource.document_url} target="_blank" rel="noopener noreferrer">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>{t("viewResource")}</span>
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
