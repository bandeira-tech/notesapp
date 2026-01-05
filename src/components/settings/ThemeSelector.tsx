import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";
import { Sun, Moon, Monitor } from "lucide-react";
import type { ThemeName } from "../../config/themes";

const themeOptions: { value: ThemeName; icon: string }[] = [
  { value: "default", icon: "bg-blue-500" },
  { value: "peaceful", icon: "bg-amber-200" },
  { value: "ocean", icon: "bg-cyan-500" },
  { value: "forest", icon: "bg-green-500" },
];

export function ThemeSelector() {
  const { t } = useTranslation();
  const {
    themeName,
    themeVariant,
    useSystemTheme,
    setThemeName,
    setThemeVariant,
    setUseSystemTheme,
  } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-medium text-theme-text-secondary mb-3">
          {t("settings.theme")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setThemeName(theme.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                themeName === theme.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-theme-border-medium hover:border-theme-border-dark"
              }`}
              data-testid={`theme-${theme.value}`}
            >
              <div className={`w-6 h-6 rounded-full ${theme.icon}`} />
              <span className="text-sm font-medium text-theme-text-primary">
                {t(`settings.themes.${theme.value}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Light/Dark/System Toggle */}
      <div>
        <h3 className="text-sm font-medium text-theme-text-secondary mb-3">
          {t("settings.appearance")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setThemeVariant("light")}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              !useSystemTheme && themeVariant === "light"
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-theme-border-medium hover:border-theme-border-dark"
            }`}
            data-testid="variant-light"
          >
            <Sun size={18} />
            <span className="text-sm font-medium">{t("settings.light")}</span>
          </button>
          <button
            onClick={() => setThemeVariant("dark")}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              !useSystemTheme && themeVariant === "dark"
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-theme-border-medium hover:border-theme-border-dark"
            }`}
            data-testid="variant-dark"
          >
            <Moon size={18} />
            <span className="text-sm font-medium">{t("settings.dark")}</span>
          </button>
          <button
            onClick={() => setUseSystemTheme(true)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              useSystemTheme
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-theme-border-medium hover:border-theme-border-dark"
            }`}
            data-testid="variant-system"
          >
            <Monitor size={18} />
            <span className="text-sm font-medium">{t("settings.system")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact theme toggle for navbar
 */
export function ThemeToggle() {
  const { themeVariant, toggleThemeVariant } = useAppStore();

  return (
    <button
      onClick={toggleThemeVariant}
      className="p-2 rounded-lg hover:bg-theme-bg-tertiary transition-colors"
      aria-label="Toggle theme"
      data-testid="theme-toggle"
    >
      {themeVariant === "light" ? (
        <Moon size={20} className="text-theme-text-secondary" />
      ) : (
        <Sun size={20} className="text-theme-text-secondary" />
      )}
    </button>
  );
}
