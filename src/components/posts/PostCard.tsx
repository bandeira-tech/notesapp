import type { Post } from "../../types";
import { formatDistanceToNow, format } from "date-fns";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const timestamp = post.createdAt
    ? format(new Date(post.createdAt), "MMM d, yyyy · h:mm a")
    : "";

  return (
    <article className="py-4 border-b border-gray-100 last:border-b-0">
      {/* Main content - text focused */}
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {post.content}
      </div>

      {/* Images if any */}
      {post.images && post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              className="rounded-lg w-full h-48 object-cover"
            />
          ))}
        </div>
      )}

      {/* Referenced post if any */}
      {post.referenceTo && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300">
          <div className="text-xs text-gray-500">
            → {post.referenceTo.notebookPubkey.substring(0, 12)}...
          </div>
        </div>
      )}

      {/* Just the timestamp, subtle */}
      <div className="mt-2 text-xs text-gray-300 text-right">
        <time title={timestamp}>{timeAgo}</time>
      </div>
    </article>
  );
}
