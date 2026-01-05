import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Modal";
import { ThemeSelector } from "./ThemeSelector";
import { LanguageSelector } from "./LanguageSelector";
import { Settings } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={24} className="text-theme-text-secondary" />
          <h2 className="text-2xl font-display font-bold text-theme-text-primary">
            {t("settings.title")}
          </h2>
        </div>

        <div className="space-y-8">
          <ThemeSelector />
          <div className="border-t border-theme-border-light pt-6">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </Modal>
  );
}
