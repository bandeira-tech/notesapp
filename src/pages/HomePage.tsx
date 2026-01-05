import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { useUserNotebooks, useCreateNotebook } from "../hooks/useNotebooks";
import { NotebookCard } from "../components/notebooks/NotebookCard";
import { Button } from "../components/ui/Button";
import { Plus, BookOpen } from "lucide-react";
import { generateNotebookName } from "../utils/placeholders";

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { data: notebooks, isLoading } = useUserNotebooks(session?.username);
  const createNotebook = useCreateNotebook();

  const handleQuickCreate = async () => {
    if (createNotebook.isPending) return;

    const placeholderName = generateNotebookName();
    const notebook = await createNotebook.mutateAsync({
      title: placeholderName,
      visibility: "public", // Default to public, user can change later
    });

    // Navigate to the new notebook
    navigate(`/notebook/${notebook.pubkey}`, {
      state: { visibility: notebook.visibility }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-theme-text-muted">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-theme-text-primary">
            {t("home.title")}
          </h1>
          <p className="text-theme-text-secondary mt-2">
            {t("home.subtitle")}
          </p>
        </div>
        <Button
          onClick={handleQuickCreate}
          disabled={createNotebook.isPending}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          {createNotebook.isPending ? t("home.creating") : t("home.newNotebook")}
        </Button>
      </div>

      {notebooks && notebooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.filter(n => n && n.pubkey).map((notebook) => (
            <NotebookCard
              key={notebook.pubkey}
              notebook={notebook}
              onClick={() => navigate(`/notebook/${notebook.pubkey}`, {
                state: { visibility: notebook.visibility }
              })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen size={64} className="mx-auto text-theme-text-muted mb-4" />
          <h3 className="text-xl font-semibold text-theme-text-secondary mb-2">
            {t("home.noNotebooks")}
          </h3>
          <p className="text-theme-text-muted mb-6">
            {t("home.createFirst")}
          </p>
          <Button onClick={handleQuickCreate} disabled={createNotebook.isPending}>
            <Plus size={20} className="mr-2" />
            {createNotebook.isPending ? t("home.creating") : t("home.newNotebook")}
          </Button>
        </div>
      )}
    </div>
  );
}
