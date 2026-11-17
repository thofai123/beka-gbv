import { Phone, AlertTriangle, HeartHandshake } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function GbvEmergencyBanner() {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive font-medium leading-snug">
            {t("emergency")}
          </p>
          <a
            href="tel:991"
            className="mt-2 inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground rounded-lg px-3 py-1.5 text-xs font-semibold active:opacity-80"
          >
            <Phone className="w-3.5 h-3.5" /> {t("callPolice")} · 991
          </a>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-2">
        <HeartHandshake className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground/80 leading-snug">{t("notAlone")}</p>
      </div>
    </div>
  );
}