import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  b3ndClient,
  getAppIdentity,
  generateIdentity,
  walletClient,
} from "../lib/b3nd-client";
import type { Identity } from "../lib/identity";
import { useAuthStore } from "../stores/authStore";
import { useNotebookStore } from "../stores/notebookStore";
import type { Notebook, NotebookRef, PublicNotebookEntry, Visibility } from "../types";
import {
  getNotebookMetaUri,
  getUserNotebookRefUri,
  getUserNotebooksListUri,
  getNotebookKeyUri,
  getPublicNotebookIndexUri,
  getPublicNotebooksListUri,
} from "../utils/uris";

// Store notebook identities in memory (loaded from user's account)
const notebookIdentities = new Map<string, Identity>();

/**
 * Load a notebook's identity from user's account
 */
async function loadNotebookIdentity(notebookPubkey: string): Promise<Identity | null> {
  // Check cache
  if (notebookIdentities.has(notebookPubkey)) {
    return notebookIdentities.get(notebookPubkey)!;
  }

  // Load from user's account
  const keyUri = getNotebookKeyUri(notebookPubkey);
  const stored = await b3ndClient.readPrivate<{ privateKeyHex: string }>(keyUri);

  if (!stored) return null;

  const identity: Identity = {
    publicKeyHex: notebookPubkey,
    privateKeyHex: stored.privateKeyHex,
  };

  notebookIdentities.set(notebookPubkey, identity);
  return identity;
}

/**
 * Fetch a single notebook by pubkey
 */
export function useNotebook(
  notebookPubkey: string,
  visibility: Visibility = "public",
  password?: string
) {
  return useQuery({
    queryKey: ["notebook", notebookPubkey, visibility],
    queryFn: async () => {
      const uri = getNotebookMetaUri(notebookPubkey);
      const data = await b3ndClient.read<Notebook>(uri, { visibility, password });
      return data;
    },
    enabled: !!notebookPubkey,
  });
}

/**
 * Fetch user's notebooks
 */
export function useUserNotebooks(userPubkey?: string) {
  const session = useAuthStore((s) => s.session);
  const targetPubkey = userPubkey || session?.username;

  return useQuery({
    queryKey: ["user-notebooks", targetPubkey],
    queryFn: async () => {
      if (!targetPubkey || !walletClient.isAuthenticated()) return [];

      // List notebook references from user's account
      const listUri = getUserNotebooksListUri();
      const refs = await b3ndClient.list<NotebookRef>(listUri, {
        visibility: "private", // User's own data
      });

      // For each reference, load the full notebook metadata
      const notebooks: Notebook[] = [];
      for (const ref of refs) {
        try {
          const metaUri = getNotebookMetaUri(ref.pubkey);
          const notebook = await b3ndClient.read<Notebook>(metaUri, {
            visibility: ref.visibility,
          });
          if (notebook) {
            notebooks.push(notebook);
          }
        } catch (err) {
          console.warn(`Failed to load notebook ${ref.pubkey}:`, err);
        }
      }

      return notebooks.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    enabled: !!targetPubkey && walletClient.isAuthenticated(),
  });
}

/**
 * Fetch public notebooks
 */
export function usePublicNotebooks() {
  return useQuery({
    queryKey: ["public-notebooks"],
    queryFn: async () => {
      const appIdentity = await getAppIdentity();
      const listUri = getPublicNotebooksListUri(appIdentity.publicKeyHex);

      const entries = await b3ndClient.list<PublicNotebookEntry>(listUri, {
        visibility: "public",
      });

      return entries.sort((a, b) => b.updatedAt - a.updatedAt);
    },
  });
}

/**
 * Create notebook mutation
 */
export function useCreateNotebook() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const addNotebook = useNotebookStore((s) => s.addNotebook);

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      coverImage?: string;
      visibility: Visibility;
      password?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      // 1. Generate identity for the notebook
      const notebookIdentity = await generateIdentity();
      console.log(`📓 Creating notebook with pubkey: ${notebookIdentity.publicKeyHex}`);

      const now = Date.now();
      const notebook: Notebook = {
        pubkey: notebookIdentity.publicKeyHex,
        title: params.title,
        description: params.description,
        coverImage: params.coverImage,
        visibility: params.visibility,
        createdAt: now,
        updatedAt: now,
        author: {
          pubkey: session.username,
        },
        postCount: 0,
      };

      // 2. Write notebook metadata to notebook's account (signed with notebook's key)
      const metaUri = getNotebookMetaUri(notebookIdentity.publicKeyHex);
      const success = await b3ndClient.write(metaUri, notebook, notebookIdentity, {
        visibility: params.visibility,
        password: params.password,
      });

      if (!success) {
        throw new Error("Failed to create notebook");
      }

      // 3. Store notebook's private key in user's account (encrypted)
      const keyUri = getNotebookKeyUri(notebookIdentity.publicKeyHex);
      await b3ndClient.writePrivate(keyUri, {
        privateKeyHex: notebookIdentity.privateKeyHex,
      });

      // 4. Store notebook reference in user's account
      const refUri = getUserNotebookRefUri(notebookIdentity.publicKeyHex);
      const notebookRef: NotebookRef = {
        pubkey: notebookIdentity.publicKeyHex,
        title: params.title,
        visibility: params.visibility,
        createdAt: now,
      };
      await b3ndClient.writePrivate(refUri, notebookRef);

      // 5. If public, add to app's public index
      if (params.visibility === "public") {
        const appIdentity = await getAppIdentity();
        const indexUri = getPublicNotebookIndexUri(
          appIdentity.publicKeyHex,
          notebookIdentity.publicKeyHex
        );
        const entry: PublicNotebookEntry = {
          pubkey: notebookIdentity.publicKeyHex,
          title: params.title,
          description: params.description,
          author: { pubkey: session.username },
          postCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await b3ndClient.write(indexUri, entry, appIdentity, {
          visibility: "public",
        });
      }

      // Cache the identity
      notebookIdentities.set(notebookIdentity.publicKeyHex, notebookIdentity);

      return notebook;
    },
    onSuccess: (notebook) => {
      addNotebook(notebook);
      queryClient.invalidateQueries({ queryKey: ["user-notebooks"] });
      if (notebook.visibility === "public") {
        queryClient.invalidateQueries({ queryKey: ["public-notebooks"] });
      }
    },
  });
}

/**
 * Update notebook mutation
 */
export function useUpdateNotebook() {
  const queryClient = useQueryClient();
  const updateNotebook = useNotebookStore((s) => s.updateNotebook);
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      updates: Partial<Notebook>;
      visibility: Visibility;
      password?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      const { notebookPubkey, updates, visibility, password } = params;

      // Load notebook identity
      const identity = await loadNotebookIdentity(notebookPubkey);
      if (!identity) {
        throw new Error("Notebook identity not found - you may not own this notebook");
      }

      // Fetch current data
      const metaUri = getNotebookMetaUri(notebookPubkey);
      const current = await b3ndClient.read<Notebook>(metaUri, { visibility, password });
      if (!current) throw new Error("Notebook not found");

      const updated: Notebook = {
        ...current,
        ...updates,
        updatedAt: Date.now(),
      };

      // Write updated metadata
      const success = await b3ndClient.write(metaUri, updated, identity, {
        visibility,
        password,
      });
      if (!success) {
        throw new Error("Failed to update notebook");
      }

      return updated;
    },
    onSuccess: (notebook) => {
      updateNotebook(notebook.pubkey, notebook);
      queryClient.invalidateQueries({ queryKey: ["notebook", notebook.pubkey] });
    },
  });
}

/**
 * Delete notebook mutation
 */
export function useDeleteNotebook() {
  const queryClient = useQueryClient();
  const removeNotebook = useNotebookStore((s) => s.removeNotebook);
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      visibility: Visibility;
    }) => {
      if (!session) throw new Error("Not authenticated");

      const { notebookPubkey, visibility } = params;

      // Load notebook identity
      const identity = await loadNotebookIdentity(notebookPubkey);
      if (!identity) {
        throw new Error("Notebook identity not found - you may not own this notebook");
      }

      // Delete notebook metadata
      const metaUri = getNotebookMetaUri(notebookPubkey);
      await b3ndClient.delete(metaUri, identity);

      // Delete from user's references
      const refUri = getUserNotebookRefUri(notebookPubkey);
      await b3ndClient.delete(refUri);

      // Delete private key from user's account
      const keyUri = getNotebookKeyUri(notebookPubkey);
      await b3ndClient.delete(keyUri);

      // If public, remove from app's index
      if (visibility === "public") {
        const appIdentity = await getAppIdentity();
        const indexUri = getPublicNotebookIndexUri(
          appIdentity.publicKeyHex,
          notebookPubkey
        );
        await b3ndClient.delete(indexUri, appIdentity);
      }

      // Clear from cache
      notebookIdentities.delete(notebookPubkey);

      return notebookPubkey;
    },
    onSuccess: (notebookPubkey) => {
      removeNotebook(notebookPubkey);
      queryClient.invalidateQueries({ queryKey: ["user-notebooks"] });
      queryClient.invalidateQueries({ queryKey: ["public-notebooks"] });
    },
  });
}

/**
 * Export notebook identity loader for use in posts hook
 */
export { loadNotebookIdentity };
