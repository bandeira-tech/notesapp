import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";
import { Image, Send } from "lucide-react";
import { useCreatePost } from "../../hooks/usePosts";

interface CreatePostFormProps {
  notebookPubkey: string;
  visibility: "public" | "protected" | "private";
  password?: string;
}

export function CreatePostForm({ notebookPubkey, visibility, password }: CreatePostFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const createPost = useCreatePost();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || createPost.isPending) return;

    await createPost.mutateAsync({
      notebookPubkey,
      content,
      images: images.length > 0 ? images : undefined,
      visibility,
      password,
    });

    // Reset form
    setContent("");
    setImages([]);
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Alt+Enter to submit
    if (e.altKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages([...images, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-theme-bg-secondary rounded-xl shadow-sm border border-theme-border-light p-6">
      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("post.placeholder")}
          className="w-full px-4 py-3 border border-theme-border-medium rounded-lg bg-theme-bg-primary text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
          rows={isExpanded ? 4 : 2}
        />

        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt=""
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-status-error text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-2 text-theme-text-secondary hover:text-primary-600 transition-colors">
              <Image size={20} />
              <span className="text-sm">{t("post.addImage")}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <div className="flex gap-2">
              {content.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent("");
                    setImages([]);
                    setIsExpanded(false);
                  }}
                >
                  {t("post.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!content.trim() || createPost.isPending}
                className="flex items-center gap-2"
              >
                <Send size={16} />
                {t("post.submit")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
