import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { b3ndClient } from "../lib/b3nd-client";
import { useAuthStore } from "../stores/authStore";
import type { Reaction, Visibility } from "../types";
import { getReactionUri, getReactionsListUri } from "../utils/uris";
import { loadNotebookIdentity } from "./useNotebooks";

/**
 * Generate a simple ID for reactions (they don't need full keypairs)
 */
function generateReactionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fetch reactions for a post
 */
export function useReactions(
  notebookPubkey: string,
  postPubkey: string,
  visibility: Visibility = "public"
) {
  return useQuery({
    queryKey: ["reactions", notebookPubkey, postPubkey],
    queryFn: async () => {
      const uri = getReactionsListUri(notebookPubkey, postPubkey);
      // Reactions are always public-readable for simplicity
      const reactions = await b3ndClient.list<Reaction>(uri, {
        visibility,
      });
      return reactions.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!notebookPubkey && !!postPubkey,
  });
}

/**
 * Create reaction (like or comment)
 */
export function useCreateReaction() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      postPubkey: string;
      notebookPubkey: string;
      type: "like" | "comment";
      content?: string;
      media?: {
        type: "emoji" | "text" | "image";
        data: string;
      };
      visibility: Visibility;
      password?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      // Load notebook identity (reactions are stored in notebook's account)
      const notebookIdentity = await loadNotebookIdentity(params.notebookPubkey);
      if (!notebookIdentity) {
        throw new Error("Notebook identity not found");
      }

      const reactionId = generateReactionId();
      const reaction: Reaction = {
        id: reactionId,
        postPubkey: params.postPubkey,
        type: params.type,
        content: params.content,
        media: params.media,
        createdAt: Date.now(),
        author: {
          pubkey: session.username,
        },
      };

      const uri = getReactionUri(
        params.notebookPubkey,
        params.postPubkey,
        reactionId
      );

      // Write reaction to notebook's account (signed with notebook's key)
      const success = await b3ndClient.write(uri, reaction, notebookIdentity, {
        visibility: params.visibility,
        password: params.password,
      });

      if (!success) {
        throw new Error("Failed to create reaction");
      }

      return { ...params, reaction };
    },
    onSuccess: ({ notebookPubkey, postPubkey }) => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", notebookPubkey, postPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ["post", notebookPubkey, postPubkey],
      });
    },
  });
}

/**
 * Delete reaction
 */
export function useDeleteReaction() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      postPubkey: string;
      notebookPubkey: string;
      reactionId: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      // Load notebook identity
      const notebookIdentity = await loadNotebookIdentity(params.notebookPubkey);
      if (!notebookIdentity) {
        throw new Error("Notebook identity not found");
      }

      const uri = getReactionUri(
        params.notebookPubkey,
        params.postPubkey,
        params.reactionId
      );
      await b3ndClient.delete(uri, notebookIdentity);
      return params;
    },
    onSuccess: ({ notebookPubkey, postPubkey }) => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", notebookPubkey, postPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ["post", notebookPubkey, postPubkey],
      });
    },
  });
}

/**
 * Check if user has liked a post
 */
export function useHasLiked(notebookPubkey: string, postPubkey: string) {
  const session = useAuthStore((s) => s.session);
  const { data: reactions } = useReactions(notebookPubkey, postPubkey);

  if (!session || !reactions) return false;

  return reactions.some(
    (r) => r.type === "like" && r.author.pubkey === session.username
  );
}
