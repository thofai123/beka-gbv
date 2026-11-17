import { LANGUAGES } from "@/lib/gbvTranslations";
import { useLanguage } from "@/lib/LanguageContext";
import { Languages } from "lucide-react";

export default function LanguageChips() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Languages className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {t("chooseLanguage")}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map((l) => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-foreground"
              }`}
              aria-pressed={active}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}