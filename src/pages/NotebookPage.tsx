import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotebook } from "../hooks/useNotebooks";
import { usePosts } from "../hooks/usePosts";
import { CreatePostForm } from "../components/posts/CreatePostForm";
import { PostCard } from "../components/posts/PostCard";
import { EditNotebookModal } from "../components/notebooks/EditNotebookModal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ArrowLeft, Settings, Share2, Lock } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useNotebookStore } from "../stores/notebookStore";
import { SEO } from "../components/seo/SEO";
import { NotebookStructuredData } from "../components/seo/StructuredData";
import type { Visibility } from "../types";

export function NotebookPage() {
  const { notebookPubkey } = useParams<{ notebookPubkey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const getLocalNotebook = useNotebookStore((s) => s.getNotebook);

  // State for password-protected notebooks
  const [password, setPassword] = useState("");
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initial visibility guess from navigation state, local store, or default to public
  const initialVisibility: Visibility = useMemo(() => {
    // Check if passed via navigation state
    const stateVisibility = (location.state as { visibility?: Visibility })?.visibility;
    if (stateVisibility) return stateVisibility;

    // Check local notebook store (for user's own notebooks)
    const localNotebook = getLocalNotebook(notebookPubkey!);
    if (localNotebook) return localNotebook.visibility;

    // Default to public for discovery
    return "public";
  }, [location.state, getLocalNotebook, notebookPubkey]);

  // Track current visibility (updates when notebook data changes)
  const [currentVisibility, setCurrentVisibility] = useState<Visibility>(initialVisibility);

  // For protected notebooks, need password before fetching
  const effectivePassword = currentVisibility === "protected" && passwordSubmitted ? password : undefined;

  const { data: notebook, isLoading: notebookLoading, error: notebookError } = useNotebook(
    notebookPubkey!,
    currentVisibility,
    effectivePassword
  );

  // Update current visibility when notebook data loads
  useEffect(() => {
    if (notebook?.visibility) {
      setCurrentVisibility(notebook.visibility);
    }
  }, [notebook?.visibility]);

  const { data: posts, isLoading: postsLoading } = usePosts(
    notebookPubkey!,
    currentVisibility,
    effectivePassword
  );

  // Show password prompt for protected notebooks
  if (currentVisibility === "protected" && !passwordSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg-primary">
        <div className="bg-theme-bg-secondary rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock size={48} className="mx-auto text-theme-text-muted mb-4" />
            <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
              {t("notebook.protected")}
            </h2>
            <p className="text-theme-text-secondary">
              {t("notebook.protectedDescription")}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordSubmitted(true);
            }}
            className="space-y-4"
          >
            <Input
              type="password"
              placeholder={t("notebook.enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                {t("notebook.goBack")}
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                {t("notebook.unlock")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (notebookLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-theme-text-muted">{t("notebook.loading")}</div>
      </div>
    );
  }

  if (notebookError || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
          {currentVisibility === "protected" && passwordSubmitted
            ? t("notebook.wrongPassword")
            : t("notebook.notFound")}
        </h2>
        {currentVisibility === "protected" && passwordSubmitted && (
          <Button
            onClick={() => setPasswordSubmitted(false)}
            variant="ghost"
            className="mb-4"
          >
            {t("notebook.tryAgain")}
          </Button>
        )}
        <Button onClick={() => navigate("/")}>{t("common.goHome")}</Button>
      </div>
    );
  }

  const isOwner = session?.username === notebook.author.pubkey;

  // Generate SEO-friendly description
  const seoDescription = notebook.description ||
    `A notebook by ${notebook.author.name || notebook.author.pubkey} on Firecat Notes. ${notebook.postCount} posts in this decentralized notebook.`;

  const canonicalUrl = `${window.location.origin}/notebook/${notebookPubkey}`;

  return (
    <div className="min-h-screen bg-theme-bg-primary">
      {/* SEO Meta Tags */}
      <SEO
        title={notebook.title}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        image={notebook.coverImage}
        type="website"
      />
      {/* Structured Data */}
      <NotebookStructuredData
        notebook={notebook}
        url={canonicalUrl}
      />

      {/* Header */}
      <div className="bg-theme-bg-secondary border-b border-theme-border-light">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary mb-4"
          >
            <ArrowLeft size={20} />
            {t("notebook.back")}
          </button>

          {notebook.coverImage && (
            <div className="h-48 rounded-xl overflow-hidden mb-6">
              <img
                src={notebook.coverImage}
                alt={notebook.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-display font-bold text-theme-text-primary mb-1">
                {notebook.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                <span>{t("notebook.by")} {notebook.author.name || notebook.author.pubkey.substring(0, 12)}...</span>
                <span>·</span>
                <span>{notebook.postCount} {t("notebook.posts")}</span>
                {notebook.visibility !== "public" && (
                  <>
                    <span>·</span>
                    <span className="capitalize flex items-center gap-1">
                      {notebook.visibility === "protected" && <Lock size={12} />}
                      {t(`visibility.${notebook.visibility}`)}
                    </span>
                  </>
                )}
              </div>
              {notebook.description && (
                <p className="text-theme-text-secondary mt-3">{notebook.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Share2 size={18} />
              </Button>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Settings size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline - posts come directly after header */}
      <div className={`${isOwner ? "pb-32" : ""}`}>
        {posts && posts.length > 0 ? (
          <div className="bg-theme-bg-secondary shadow-sm border-b border-theme-border-light px-6">
            {posts.map((post) => (
              <PostCard
                key={post.pubkey}
                post={post}
                visibility={notebook.visibility}
                password={effectivePassword}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-16 text-theme-text-muted">
            {isOwner
              ? t("notebook.noPostsOwner")
              : t("notebook.noPosts")}
          </div>
        )}
      </div>

      {/* Fixed input overlay for author */}
      {isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-theme-bg-primary border-t border-theme-border-light shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <CreatePostForm
              notebookPubkey={notebookPubkey!}
              visibility={notebook.visibility}
              password={effectivePassword}
            />
          </div>
        </div>
      )}

      {/* Edit notebook modal */}
      {isOwner && (
        <EditNotebookModal
          isOpen={isEditModalOpen}
          onClose={(newPassword) => {
            setIsEditModalOpen(false);
            // Update password if changed to protected
            if (newPassword !== undefined) {
              setPassword(newPassword);
              setPasswordSubmitted(true);
            }
          }}
          notebook={notebook}
          password={effectivePassword}
        />
      )}
    </div>
  );
}
