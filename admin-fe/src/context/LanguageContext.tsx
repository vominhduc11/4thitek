import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  type Language,
} from "./translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANGUAGE_STORAGE_KEY = "admin_language";
const FALLBACK_LANGUAGE: Language = "vi";

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "vi" || stored === "en") {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  const browserLang = window.navigator.language.toLowerCase();
  return browserLang.startsWith("en") ? "en" : FALLBACK_LANGUAGE;
};

const interpolate = (value: string, vars?: Record<string, string | number>) => {
  if (!vars) return value;
  return Object.keys(vars).reduce(
    (acc, key) => acc.replaceAll(`{${key}}`, String(vars[key])),
    value,
  );
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // ignore storage errors
      }
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const dictionary = translations[language] || {};
      const fallback = translations[FALLBACK_LANGUAGE] || {};
      const translated = dictionary[key] || fallback[key] || key;
      return interpolate(translated, vars);
    };

    return { language, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
