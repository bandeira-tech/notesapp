import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useTranslation } from "react-i18next";
import { useUpdateNotebook } from "../../hooks/useNotebooks";
import type { Notebook, Visibility } from "../../types";
import { Globe, Shield, Lock } from "lucide-react";

interface EditNotebookModalProps {
  isOpen: boolean;
  onClose: (newPassword?: string) => void;
  notebook: Notebook;
  password?: string;
}

export function EditNotebookModal({
  isOpen,
  onClose,
  notebook,
  password,
}: EditNotebookModalProps) {
  const { t } = useTranslation();
  const updateNotebook = useUpdateNotebook();

  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description || "");
  const [visibility, setVisibility] = useState<Visibility>(notebook.visibility);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<Notebook> = {
      title,
      description,
      visibility,
    };

    await updateNotebook.mutateAsync({
      notebookPubkey: notebook.pubkey,
      updates,
      visibility: notebook.visibility, // Current visibility for reading
      password: password,
      newPassword: visibility === "protected" ? (newPassword || password) : undefined,
    });

    // Pass new password back if changed to protected
    const finalPassword = visibility === "protected" ? (newPassword || password) : undefined;
    onClose(finalPassword);
  };

  const visibilityOptions: { value: Visibility; icon: typeof Globe; label: string; description: string }[] = [
    {
      value: "public",
      icon: Globe,
      label: t("visibility.public"),
      description: t("visibility.publicDescription"),
    },
    {
      value: "protected",
      icon: Shield,
      label: t("visibility.protected"),
      description: t("visibility.protectedDescription"),
    },
    {
      value: "private",
      icon: Lock,
      label: t("visibility.private"),
      description: t("visibility.privateDescription"),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()} title={t("notebook.editSettings")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-theme-text-primary mb-2">
            {t("notebook.title")}
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notebook.titlePlaceholder")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-primary mb-2">
            {t("notebook.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("notebook.descriptionPlaceholder")}
            rows={3}
            className="w-full px-4 py-2 border border-theme-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-theme-bg-primary text-theme-text-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-primary mb-3">
            {t("notebook.visibility")}
          </label>
          <div className="space-y-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    visibility === option.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-theme-border-light hover:border-theme-border-dark bg-theme-bg-primary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      size={20}
                      className={
                        visibility === option.value
                          ? "text-primary-600"
                          : "text-theme-text-muted"
                      }
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          visibility === option.value
                            ? "text-primary-600"
                            : "text-theme-text-primary"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-sm text-theme-text-secondary mt-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {visibility === "protected" && (
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              {notebook.visibility === "protected"
                ? t("notebook.changePassword")
                : t("notebook.setPassword")}
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={
                notebook.visibility === "protected"
                  ? t("notebook.leaveEmptyToKeepPassword")
                  : t("notebook.enterPassword")
              }
              required={notebook.visibility !== "protected"}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onClose()}
            className="flex-1"
            disabled={updateNotebook.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={updateNotebook.isPending}
          >
            {updateNotebook.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
