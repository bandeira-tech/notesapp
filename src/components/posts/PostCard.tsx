import type { Post } from "../../types";
import { formatDistanceToNow, format } from "date-fns";
import { ThumbsUp, Smile, Send, Share2 } from "lucide-react";
import { useUpdatePost } from "../../hooks/usePosts";
import { useAuthStore } from "../../stores/authStore";
import { ReactionModal } from "../reactions/ReactionModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  post: Post;
  visibility?: "public" | "protected" | "private";
  password?: string;
}

export function PostCard({ post, visibility = "public", password }: PostCardProps) {
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const timestamp = post.createdAt
    ? format(new Date(post.createdAt), "MMM d, yyyy · h:mm a")
    : "";

  const session = useAuthStore((s) => s.session);
  const updatePost = useUpdatePost();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    await updatePost.mutateAsync({
      notebookPubkey: post.notebookPubkey,
      postPubkey: post.pubkey,
      updates: {
        reactionCount: {
          ...post.reactionCount,
          likes: isLiked ? Math.max(0, post.reactionCount.likes - 1) : post.reactionCount.likes + 1,
        },
      },
      visibility,
      password,
    });
  };

  const handleReference = () => {
    // Navigate to user's primary notebook with the reference data
    if (!session) {
      alert("You need to be logged in to reference posts");
      return;
    }
    // Store the reference to pass to the notebook
    sessionStorage.setItem("referencePost", JSON.stringify({
      notebookPubkey: post.notebookPubkey,
      postPubkey: post.pubkey,
      content: post.content,
    }));
    // Navigate to user's primary notebook (you may need to adjust this based on your routing)
    navigate(`/notebook/${session.username}`);
  };

  const handleShare = () => {
    // Copy post URL to clipboard
    const postUrl = `${window.location.origin}${window.location.pathname}#post-${post.pubkey}`;
    navigator.clipboard.writeText(postUrl);
  };

  return (
    <article className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex gap-3">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
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

          {/* Timestamp */}
          <div className="mt-2 text-xs text-gray-300">
            <time title={timestamp}>{timeAgo}</time>
          </div>
        </div>

        {/* Action buttons - stacked on right */}
        <div className="flex flex-col gap-1 items-end justify-end self-end">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-lg transition-colors text-sm flex items-center gap-1 ${
              isLiked
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
            }`}
            title="Like"
            aria-label="Like this post"
          >
            <ThumbsUp size={14} />
            {post.reactionCount.likes > 0 && <span className="text-xs">{post.reactionCount.likes}</span>}
          </button>

          {/* Comments/Reactions button */}
          <button
            onClick={() => setShowReactions(true)}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-blue-500 flex items-center gap-1"
            title="Comments"
            aria-label="View and add comments"
          >
            <Smile size={14} />
            {post.reactionCount.comments > 0 && <span className="text-xs">{post.reactionCount.comments}</span>}
          </button>

          {/* Reference button - available to everyone */}
          <button
            onClick={handleReference}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-green-500"
            title="Reference this post in your notebook"
            aria-label="Reference this post"
          >
            <Send size={14} />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-purple-500"
            title="Share"
            aria-label="Share this post"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Reaction Modal for comments */}
      <ReactionModal
        isOpen={showReactions}
        onClose={() => setShowReactions(false)}
        notebookPubkey={post.notebookPubkey}
        postPubkey={post.pubkey}
        visibility={visibility}
        password={password}
      />
    </article>
  );
}
