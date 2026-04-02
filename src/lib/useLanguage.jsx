import { createContext, useContext, useState } from "react";
import { translations } from "./i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "id");

  function changeLang(code) {
    setLang(code);
    localStorage.setItem("app_lang", code);
  }

  const t = (key) => translations[lang]?.[key] ?? translations["id"]?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}