import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  b3ndClient,
  getAppIdentity,
  generateIdentity,
  walletClient,
} from "../lib/b3nd-client";
import type { Identity } from "../lib/identity";
import { useAuthStore } from "../stores/authStore";
import type { Notebook, NotebookRef, PublicNotebookEntry, Visibility } from "../types";
import {
  getNotebookMetaUri,
  getUserNotebooksIndexUri,
  getPublicNotebookIndexUri,
  getPublicNotebooksListUri,
} from "../utils/uris";

// Store notebook identities in memory (loaded from user's account)
const notebookIdentities = new Map<string, Identity>();

/**
 * Load a notebook's identity from user's account index
 */
async function loadNotebookIdentity(notebookPubkey: string): Promise<Identity | null> {
  // Check cache
  if (notebookIdentities.has(notebookPubkey)) {
    return notebookIdentities.get(notebookPubkey)!;
  }

  // Load from user's notebooks index
  const indexUri = getUserNotebooksIndexUri();
  const index = await b3ndClient.readPrivate<{ notebooks: NotebookRef[]; keys: Record<string, string> }>(indexUri);

  if (!index || !index.keys || !index.keys[notebookPubkey]) {
    return null;
  }

  const identity: Identity = {
    publicKeyHex: notebookPubkey,
    privateKeyHex: index.keys[notebookPubkey],
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

      // Read notebook index from user's account (single file with all refs)
      const indexUri = getUserNotebooksIndexUri();
      const index = await b3ndClient.readPrivate<{ notebooks: NotebookRef[] }>(indexUri);

      if (!index || !index.notebooks || index.notebooks.length === 0) {
        console.log("📋 No notebooks found in index");
        return [];
      }

      console.log(`📋 Found ${index.notebooks.length} notebooks in index`);

      // For each reference, load the full notebook metadata
      const notebooks: Notebook[] = [];
      for (const ref of index.notebooks) {
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

      // Get list of references from public index
      const entries = await b3ndClient.list<PublicNotebookEntry>(listUri, {
        visibility: "public",
      });

      // Resolve actual metadata for each notebook
      const notebooks: Notebook[] = [];
      for (const entry of entries) {
        try {
          const metaUri = getNotebookMetaUri(entry.pubkey);
          const notebook = await b3ndClient.read<Notebook>(metaUri, {
            visibility: "public",
          });
          if (notebook) {
            notebooks.push(notebook);
          }
        } catch (err) {
          console.warn(`Failed to load public notebook ${entry.pubkey}:`, err);
        }
      }

      return notebooks.sort((a, b) => b.updatedAt - a.updatedAt);
    },
  });
}

/**
 * Create notebook mutation
 */
export function useCreateNotebook() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);

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

      // 3. Add to user's notebooks index (read-modify-write)
      const indexUri = getUserNotebooksIndexUri();
      const currentIndex = await b3ndClient.readPrivate<{ notebooks: NotebookRef[]; keys: Record<string, string> }>(indexUri) || { notebooks: [], keys: {} };

      const notebookRef: NotebookRef = {
        pubkey: notebookIdentity.publicKeyHex,
        title: params.title,
        visibility: params.visibility,
        createdAt: now,
      };

      // Add notebook ref and private key to index
      currentIndex.notebooks.push(notebookRef);
      currentIndex.keys[notebookIdentity.publicKeyHex] = notebookIdentity.privateKeyHex;

      // Write updated index
      await b3ndClient.writePrivate(indexUri, currentIndex);
      console.log(`📝 Added notebook to user index (${currentIndex.notebooks.length} total)`);

      // 5. If public, add to app's public index (reference only, no denormalized data)
      if (params.visibility === "public") {
        const appIdentity = await getAppIdentity();
        const indexUri = getPublicNotebookIndexUri(
          appIdentity.publicKeyHex,
          notebookIdentity.publicKeyHex
        );
        const entry: PublicNotebookEntry = {
          pubkey: notebookIdentity.publicKeyHex,
          author: { pubkey: session.username },
          createdAt: now,
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
  const session = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (params: {
      notebookPubkey: string;
      updates: Partial<Notebook>;
      visibility: Visibility;
      password?: string;
      newPassword?: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      const { notebookPubkey, updates, visibility, password, newPassword } = params;

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

      const oldVisibility = current.visibility;
      const newVisibility = updated.visibility;
      const now = Date.now();

      // Write updated metadata with new visibility
      const success = await b3ndClient.write(metaUri, updated, identity, {
        visibility: newVisibility,
        password: newVisibility === "protected" ? newPassword : undefined,
      });
      if (!success) {
        throw new Error("Failed to update notebook");
      }

      // Handle visibility changes for public index
      const appIdentity = await getAppIdentity();

      // If changing FROM public, remove from public index
      if (oldVisibility === "public" && newVisibility !== "public") {
        const indexUri = getPublicNotebookIndexUri(
          appIdentity.publicKeyHex,
          notebookPubkey
        );
        await b3ndClient.delete(indexUri, appIdentity);
      }

      // If changing TO public, add to public index
      if (oldVisibility !== "public" && newVisibility === "public") {
        const indexUri = getPublicNotebookIndexUri(
          appIdentity.publicKeyHex,
          notebookPubkey
        );
        const entry: PublicNotebookEntry = {
          pubkey: notebookPubkey,
          author: { pubkey: session.username },
          createdAt: now,
        };
        await b3ndClient.write(indexUri, entry, appIdentity, {
          visibility: "public",
        });
      }

      // Update user's notebook index with new visibility
      const userIndexUri = getUserNotebooksIndexUri();
      const userIndex = await b3ndClient.readPrivate<{ notebooks: NotebookRef[]; keys: Record<string, string> }>(userIndexUri);

      if (userIndex) {
        const notebookIndex = userIndex.notebooks.findIndex(ref => ref.pubkey === notebookPubkey);
        if (notebookIndex !== -1) {
          userIndex.notebooks[notebookIndex] = {
            ...userIndex.notebooks[notebookIndex],
            title: updated.title,
            visibility: updated.visibility,
          };
          await b3ndClient.writePrivate(userIndexUri, userIndex);
        }
      }

      return updated;
    },
    onSuccess: (notebook, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notebook", notebook.pubkey] });
      queryClient.invalidateQueries({ queryKey: ["user-notebooks"] });
      // Invalidate public notebooks if either old or new visibility was public
      const wasPublic = variables.updates.visibility
        ? variables.visibility === "public" || notebook.visibility === "public"
        : notebook.visibility === "public";
      if (wasPublic) {
        queryClient.invalidateQueries({ queryKey: ["public-notebooks"] });
      }
    },
  });
}

/**
 * Delete notebook mutation
 */
export function useDeleteNotebook() {
  const queryClient = useQueryClient();
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

      // Remove from user's notebooks index
      const indexUri = getUserNotebooksIndexUri();
      const currentIndex = await b3ndClient.readPrivate<{ notebooks: NotebookRef[]; keys: Record<string, string> }>(indexUri);

      if (currentIndex) {
        currentIndex.notebooks = currentIndex.notebooks.filter(ref => ref.pubkey !== notebookPubkey);
        delete currentIndex.keys[notebookPubkey];
        await b3ndClient.writePrivate(indexUri, currentIndex);
        console.log(`🗑️ Removed notebook from user index (${currentIndex.notebooks.length} remaining)`);
      }

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-notebooks"] });
      if (variables.visibility === "public") {
        queryClient.invalidateQueries({ queryKey: ["public-notebooks"] });
      }
    },
  });
}

/**
 * Export notebook identity loader for use in posts hook
 */
export { loadNotebookIdentity };
