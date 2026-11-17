import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { translations, getStoredLang, setStoredLang } from "@/lib/gbvTranslations";

// Global reactive language state.
// All GBV components consume this — switching language re-renders everyone instantly.
const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => getStoredLang());

  const setLang = useCallback((next) => {
    setLangState(next);          // triggers re-render across all consumers
    setStoredLang(next);         // persistence is a side-effect, not the source
  }, []);

  // Keep tabs in sync if language changes in another tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "gbv_lang" && e.newValue && translations[e.newValue]) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}