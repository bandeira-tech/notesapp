import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "../hooks/usePosts";
import { useNotebook } from "../hooks/useNotebooks";
import { PostCard } from "../components/posts/PostCard";
import { Button } from "../components/ui/Button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { PostStructuredData } from "../components/seo/StructuredData";

export function PostPage() {
  const { notebookPubkey, postPubkey } = useParams<{
    notebookPubkey: string;
    postPubkey: string;
  }>();
  const navigate = useNavigate();

  const { data: post, isLoading: postLoading } = usePost(notebookPubkey!, postPubkey!);
  const { data: notebook, isLoading: notebookLoading } = useNotebook(notebookPubkey!, "public");

  const isLoading = postLoading || notebookLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading post...</div>
      </div>
    );
  }

  if (!post || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Post not found
        </h2>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  // Generate SEO-friendly description from post content
  const seoDescription = post.content.length > 160
    ? post.content.substring(0, 157) + "..."
    : post.content;

  const postTitle = post.content.length > 60
    ? post.content.substring(0, 60) + "..."
    : post.content;

  const canonicalUrl = `${window.location.origin}/notebook/${notebookPubkey}/post/${postPubkey}`;

  return (
    <div className="min-h-screen bg-peaceful-cream">
      {/* SEO Meta Tags */}
      <SEO
        title={postTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        image={post.images?.[0] || notebook.coverImage}
        type="article"
        author={post.author.name || post.author.pubkey}
        publishedTime={new Date(post.createdAt).toISOString()}
        modifiedTime={new Date(post.updatedAt).toISOString()}
        tags={["notebook", "firecat", "decentralized"]}
      />
      {/* Structured Data */}
      <PostStructuredData
        post={post}
        notebook={notebook}
        url={canonicalUrl}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/notebook/${notebookPubkey}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to notebook
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 mb-4">
          <PostCard post={post} visibility="public" />
        </div>

        <button
          onClick={() => navigate(`/notebook/${notebookPubkey}`)}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ExternalLink size={18} />
          View in notebook context
        </button>
      </div>
    </div>
  );
}
