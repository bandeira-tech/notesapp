import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { AuthModal } from "../auth/AuthModal";
import { SettingsModal } from "../settings/SettingsModal";
import { ThemeToggle } from "../settings/ThemeSelector";
import { LanguageToggle } from "../settings/LanguageSelector";
import { Button } from "../ui/Button";
import { BookOpen, Home, Compass, LogOut, Settings } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, logout, profile } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="bg-theme-bg-secondary border-b border-theme-border-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-display font-bold text-theme-text-primary hover:text-primary-600 transition-colors"
            >
              <BookOpen size={28} className="text-primary-600" />
              {t("app.name")}
            </Link>

            <div className="flex items-center gap-4">
              {/* Theme & Language toggles */}
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <LanguageToggle />
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg hover:bg-theme-bg-tertiary transition-colors"
                  aria-label={t("nav.settings")}
                  data-testid="settings-button"
                >
                  <Settings size={20} className="text-theme-text-secondary" />
                </button>
              </div>

              <div className="w-px h-6 bg-theme-border-medium" />

              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-theme-text-secondary hover:text-primary-600 transition-colors"
                  >
                    <Home size={20} />
                    <span className="hidden sm:inline">{t("nav.home")}</span>
                  </Link>
                  <Link
                    to="/discover"
                    className="flex items-center gap-2 text-theme-text-secondary hover:text-primary-600 transition-colors"
                  >
                    <Compass size={20} />
                    <span className="hidden sm:inline">{t("nav.discover")}</span>
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center gap-2 text-theme-text-secondary hover:text-primary-600 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {profile?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="hidden sm:inline">
                        {profile?.name || "User"}
                      </span>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-theme-bg-secondary rounded-lg shadow-lg border border-theme-border-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-theme-text-secondary hover:bg-theme-bg-tertiary flex items-center gap-2"
                        >
                          <LogOut size={16} />
                          {t("nav.logout")}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/discover"
                    className="flex items-center gap-2 text-theme-text-secondary hover:text-primary-600 transition-colors"
                  >
                    <Compass size={20} />
                    <span className="hidden sm:inline">{t("nav.discover")}</span>
                  </Link>
                  <Button onClick={() => setShowAuthModal(true)}>
                    {t("nav.login")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}
