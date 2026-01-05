import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "../../i18n";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-theme-text-secondary mb-3">
        {t("settings.language")}
      </h3>
      <div className="flex gap-2">
        {(Object.keys(supportedLanguages) as SupportedLanguage[]).map((lang) => (
          <button
            key={lang}
            onClick={() => changeLanguage(lang)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              currentLanguage === lang || (currentLanguage.startsWith(lang.split("-")[0]) && lang === "en")
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-theme-border-medium hover:border-theme-border-dark"
            }`}
            data-testid={`lang-${lang}`}
          >
            <span className="text-sm font-medium">
              {supportedLanguages[lang].nativeName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact language switcher for navbar
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];

  const cycleLanguage = () => {
    const currentIndex = languages.findIndex(
      (lang) => lang === currentLanguage || currentLanguage.startsWith(lang.split("-")[0])
    );
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  };

  const displayCode = currentLanguage.startsWith("pt") ? "PT" : "EN";

  return (
    <button
      onClick={cycleLanguage}
      className="flex items-center gap-1 p-2 rounded-lg hover:bg-theme-bg-tertiary transition-colors"
      aria-label="Change language"
      data-testid="language-toggle"
    >
      <Globe size={18} className="text-theme-text-secondary" />
      <span className="text-xs font-medium text-theme-text-secondary">
        {displayCode}
      </span>
    </button>
  );
}
