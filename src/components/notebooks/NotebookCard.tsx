import { Card, CardContent } from "../ui/Card";
import type { Notebook } from "../../types";
import { Lock, Globe, Shield, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
}

export function NotebookCard({ notebook, onClick }: NotebookCardProps) {
  const visibility = notebook.visibility;

  const VisibilityIcon = {
    public: Globe,
    protected: Shield,
    private: Lock,
  }[visibility];

  const visibilityColors = {
    public: "text-green-600 bg-green-50",
    protected: "text-yellow-600 bg-yellow-50",
    private: "text-red-600 bg-red-50",
  };

  const coverImage = "coverImage" in notebook ? notebook.coverImage : undefined;

  return (
    <Card hover onClick={onClick} className="overflow-hidden">
      {coverImage && (
        <div className="h-40 overflow-hidden">
          <img
            src={coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-semibold text-xl text-gray-900 flex-1">
            {notebook.title}
          </h3>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              visibilityColors[visibility]
            }`}
          >
            <VisibilityIcon size={12} />
          </div>
        </div>

        {notebook.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {notebook.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <BookOpen size={14} />
            <span>{notebook.postCount || 0} posts</span>
          </div>
          <span>
            {notebook.updatedAt
              ? formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })
              : "recently"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
