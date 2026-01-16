import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePublicNotebooks } from "../hooks/useNotebooks";
import { NotebookCard } from "../components/notebooks/NotebookCard";
import { Compass, TrendingUp } from "lucide-react";
import { SEO } from "../components/seo/SEO";

export function DiscoverPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: notebooks, isLoading } = usePublicNotebooks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-theme-text-muted">{t("common.loading")}</div>
      </div>
    );
  }

  const canonicalUrl = `${window.location.origin}/discover`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* SEO Meta Tags */}
      <SEO
        title={t("discover.title")}
        description={t("discover.subtitle") || "Discover public notebooks from the Firecat community. Explore trending, recent, and popular decentralized content."}
        canonicalUrl={canonicalUrl}
        type="website"
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass size={32} className="text-primary-600" />
          <h1 className="text-4xl font-display font-bold text-theme-text-primary">
            {t("discover.title")}
          </h1>
        </div>
        <p className="text-theme-text-secondary">
          {t("discover.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button className="px-4 py-2 bg-primary-600 text-theme-text-inverse rounded-lg font-medium">
          <TrendingUp size={16} className="inline mr-2" />
          Trending
        </button>
        <button className="px-4 py-2 bg-theme-bg-tertiary text-theme-text-secondary rounded-lg font-medium hover:bg-theme-bg-accent">
          Recent
        </button>
        <button className="px-4 py-2 bg-theme-bg-tertiary text-theme-text-secondary rounded-lg font-medium hover:bg-theme-bg-accent">
          Popular
        </button>
      </div>

      {notebooks && notebooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.filter(n => n && n.pubkey).map((notebook) => (
            <NotebookCard
              key={notebook.pubkey}
              notebook={notebook}
              onClick={() => navigate(`/notebook/${notebook.pubkey}`, {
                state: { visibility: "public" }
              })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Compass size={64} className="mx-auto text-theme-text-muted mb-4" />
          <h3 className="text-xl font-semibold text-theme-text-secondary mb-2">
            {t("discover.noNotebooks")}
          </h3>
          <p className="text-theme-text-muted">
            {t("discover.beFirst")}
          </p>
        </div>
      )}
    </div>
  );
}
