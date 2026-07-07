import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

function getPathLang() {
  if (typeof window === "undefined") return "tr";
  const match = window.location.pathname.match(/^\/(tr|en)(?=\/|$)/);
  return match?.[1] || "tr";
}

function stripLangPrefix(pathname) {
  return pathname.replace(/^\/(tr|en)(?=\/|$)/, "") || "/";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getPathLang);
  const t = translations[lang];

  useEffect(() => {
    const syncLang = () => setLang(getPathLang());
    window.addEventListener("popstate", syncLang);
    return () => window.removeEventListener("popstate", syncLang);
  }, []);

  const localizedPath = (path) => {
    const cleanPath = stripLangPrefix(path || "/");
    return `/${lang}${cleanPath === "/" ? "" : cleanPath}`;
  };
  const toggleLang = () => {
    const nextLang = lang === "tr" ? "en" : "tr";
    setLang(nextLang);
    if (typeof window !== "undefined") {
      const cleanPath = stripLangPrefix(window.location.pathname);
      const nextPath = `/${nextLang}${cleanPath === "/" ? "" : cleanPath}${window.location.search}${window.location.hash}`;
      window.history.pushState(null, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, localizedPath, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
