import { LANGUAGES } from "@/lib/gbvTranslations";
import { useLanguage } from "@/lib/LanguageContext";

// Compact, always-visible language switcher backed by the global context.
// Tapping a chip updates state instantly — every consumer re-renders.
export default function LanguageSwitcher({ variant = "dark" }) {
  const { lang, setLang } = useLanguage();
  const isDark = variant === "dark";

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {LANGUAGES.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide transition-all border ${
              active
                ? isDark
                  ? "bg-orange-500 text-white border-orange-400 shadow-sm shadow-orange-500/30"
                  : "bg-primary text-primary-foreground border-primary"
                : isDark
                  ? "bg-white/5 text-white/60 border-white/10 hover:text-white/90 hover:border-white/20"
                  : "bg-background text-foreground/70 border-border hover:border-primary/40"
            }`}
            aria-pressed={active}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}