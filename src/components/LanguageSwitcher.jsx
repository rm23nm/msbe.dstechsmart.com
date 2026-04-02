import { useLanguage } from "@/lib/useLanguage";
import { supportedLanguages } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { lang, changeLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <Globe className="h-3.5 w-3.5 text-sidebar-foreground/50" />
      <div className="flex gap-1 ml-1">
        {supportedLanguages.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLang(l.code)}
            className={`text-xs px-2 py-0.5 rounded transition-all ${
              lang === l.code
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            }`}
          >
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}