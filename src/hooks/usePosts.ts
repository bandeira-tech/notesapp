import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  b3ndClient,
  generateIdentity,
} from "../lib/b3nd-client";
import type { Identity } from "../lib/identity";
import { useAuthStore } from "../stores/authStore";
import { useNotebookStore } from "../stores/notebookStore";
import type { Post, Visibility } from "../types";
import { getPostUri, getPostsListUri } from "../utils/uris";
import { loadNotebookIdentity } from "./useNotebooks";

// Store post identities in memory (loaded from user's account)
const postIdentities = new Map<string, Identity>();

/**
 * Get URI for storing a post's private key in user's account
 */
function getPostKeyUri(postPubkey: string): string {
  return `mutable://accounts/:key/post-keys/${postPubkey}`;
}

/**
 * Fetch posts for a notebook
 */
export function usePosts(
  notebookPubkey: string,
  visibility: Visibility = "public",
  password?: string
) {
  const setPosts = useNotebookStore((s) => s.setPosts);

  return useQuery({
    queryKey: ["posts", notebookPubkey, visibility],
    queryFn: async () => {
      const uri = getPostsListUri(notebookPubkey);
      const posts = await b3ndClient.list<Post>(uri, { visibility, password });
      const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(notebookPubkey, sortedPosts);
      return sortedPosts;
    },
    enabled: !!notebookPubkey,
  });
}

/**
 * Fetch single post
 */
export function usePost(
  notebookPubkey: string,
  postPubkey: string,
  visibility: Visibility = "public",
  password?: string
) {
  return useQuery({
    queryKey: ["post", notebookPubkey, postPubkey, visibility],
    queryFn: async () => {
      const uri = getPostUri(notebookPubkey, postPubkey);
      const post = await b3ndClient.read<Post>(uri, { visibility, password });
      return post;
    },
    enabled: !!notebookPubkey && !!postPubkey,
  });
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const addPost = useNotebookStore((s) => s.addPost);
  const updateNotebook = useNotebookStore((s) => s.updateNotebook);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      content: string;
      images?: string[];
      referenceTo?: {
        notebookPubkey: string;
        postPubkey: string;
      };
      visibility: Visibility;
      password?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      // Load notebook identity (needed to write to notebook's account)
      const notebookIdentity = await loadNotebookIdentity(params.notebookPubkey);
      if (!notebookIdentity) {
        throw new Error("Notebook identity not found - you may not own this notebook");
      }

      // Generate identity for the post
      const postIdentity = await generateIdentity();
      console.log(`📝 Creating post with pubkey: ${postIdentity.publicKeyHex}`);

      const now = Date.now();
      const post: Post = {
        pubkey: postIdentity.publicKeyHex,
        notebookPubkey: params.notebookPubkey,
        content: params.content,
        images: params.images,
        createdAt: now,
        updatedAt: now,
        author: {
          pubkey: session.username,
        },
        referenceTo: params.referenceTo,
        reactionCount: {
          likes: 0,
          comments: 0,
        },
      };

      // Write post to notebook's account (signed with notebook's key)
      const postUri = getPostUri(params.notebookPubkey, postIdentity.publicKeyHex);
      const success = await b3ndClient.write(postUri, post, notebookIdentity, {
        visibility: params.visibility,
        password: params.password,
      });

      if (!success) {
        throw new Error("Failed to create post");
      }

      // Store post's private key in user's account (for future edits)
      const keyUri = getPostKeyUri(postIdentity.publicKeyHex);
      await b3ndClient.writePrivate(keyUri, {
        privateKeyHex: postIdentity.privateKeyHex,
      });

      // Cache the identity
      postIdentities.set(postIdentity.publicKeyHex, postIdentity);

      return post;
    },
    onSuccess: (post) => {
      addPost(post.notebookPubkey, post);
      queryClient.invalidateQueries({ queryKey: ["posts", post.notebookPubkey] });

      // Update notebook post count
      const notebook = useNotebookStore.getState().getNotebook(post.notebookPubkey);
      if (notebook) {
        updateNotebook(post.notebookPubkey, {
          postCount: notebook.postCount + 1,
          updatedAt: Date.now(),
        });
      }
    },
  });
}

/**
 * Update post mutation
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const updatePost = useNotebookStore((s) => s.updatePost);
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      postPubkey: string;
      updates: Partial<Post>;
      visibility: Visibility;
      password?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      const { notebookPubkey, postPubkey, updates, visibility, password } = params;

      // Load notebook identity (posts are stored in notebook's account)
      const notebookIdentity = await loadNotebookIdentity(notebookPubkey);
      if (!notebookIdentity) {
        throw new Error("Notebook identity not found - you may not own this notebook");
      }

      // Fetch current data
      const postUri = getPostUri(notebookPubkey, postPubkey);
      const current = await b3ndClient.read<Post>(postUri, { visibility, password });
      if (!current) throw new Error("Post not found");

      const updated: Post = {
        ...current,
        ...updates,
        updatedAt: Date.now(),
      };

      // Write updated post (signed with notebook's key)
      const success = await b3ndClient.write(postUri, updated, notebookIdentity, {
        visibility,
        password,
      });

      if (!success) {
        throw new Error("Failed to update post");
      }

      return { notebookPubkey, post: updated };
    },
    onSuccess: ({ notebookPubkey, post }) => {
      updatePost(notebookPubkey, post.pubkey, post);
      queryClient.invalidateQueries({
        queryKey: ["post", notebookPubkey, post.pubkey],
      });
    },
  });
}

/**
 * Delete post mutation
 */
export function useDeletePost() {
  const queryClient = useQueryClient();
  const removePost = useNotebookStore((s) => s.removePost);
  const updateNotebook = useNotebookStore((s) => s.updateNotebook);
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      postPubkey: string;
      visibility: Visibility;
    }) => {
      if (!session) throw new Error("Not authenticated");

      const { notebookPubkey, postPubkey } = params;

      // Load notebook identity
      const notebookIdentity = await loadNotebookIdentity(notebookPubkey);
      if (!notebookIdentity) {
        throw new Error("Notebook identity not found - you may not own this notebook");
      }

      // Delete post from notebook's account
      const postUri = getPostUri(notebookPubkey, postPubkey);
      await b3ndClient.delete(postUri, notebookIdentity);

      // Delete post key from user's account
      const keyUri = getPostKeyUri(postPubkey);
      await b3ndClient.delete(keyUri);

      // Clear from cache
      postIdentities.delete(postPubkey);

      return params;
    },
    onSuccess: ({ notebookPubkey, postPubkey }) => {
      removePost(notebookPubkey, postPubkey);
      queryClient.invalidateQueries({ queryKey: ["posts", notebookPubkey] });

      // Update notebook post count
      const notebook = useNotebookStore.getState().getNotebook(notebookPubkey);
      if (notebook) {
        updateNotebook(notebookPubkey, {
          postCount: Math.max(0, notebook.postCount - 1),
          updatedAt: Date.now(),
        });
      }
    },
  });
}
