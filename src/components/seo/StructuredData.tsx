import { Helmet } from "react-helmet-async";
import type { Notebook, Post } from "../../types";

interface NotebookStructuredDataProps {
  notebook: Notebook;
  url: string;
}

interface PostStructuredDataProps {
  post: Post;
  notebook: Notebook;
  url: string;
}

export function NotebookStructuredData({ notebook, url }: NotebookStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": notebook.title,
    "description": notebook.description || `A notebook by ${notebook.author.name || notebook.author.pubkey}`,
    "url": url,
    "author": {
      "@type": "Person",
      "name": notebook.author.name || notebook.author.pubkey,
      "identifier": notebook.author.pubkey,
    },
    "dateCreated": new Date(notebook.createdAt).toISOString(),
    "dateModified": new Date(notebook.updatedAt).toISOString(),
    "image": notebook.coverImage,
    "publisher": {
      "@type": "Organization",
      "name": "Firecat Notes",
      "logo": {
        "@type": "ImageObject",
        "url": "https://firecat.notes/firecat.svg"
      }
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export function PostStructuredData({ post, notebook, url }: PostStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.content.length > 110
      ? post.content.substring(0, 110)
      : post.content,
    "articleBody": post.content,
    "url": url,
    "datePublished": new Date(post.createdAt).toISOString(),
    "dateModified": new Date(post.updatedAt).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author.name || post.author.pubkey,
      "identifier": post.author.pubkey,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Firecat Notes",
      "logo": {
        "@type": "ImageObject",
        "url": "https://firecat.notes/firecat.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "image": post.images && post.images.length > 0 ? post.images[0] : notebook.coverImage,
    "isPartOf": {
      "@type": "Blog",
      "name": notebook.title,
      "url": `https://firecat.notes/notebook/${notebook.pubkey}`
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": post.reactionCount.likes
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": post.reactionCount.comments
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
