import { create } from "zustand";
import type { Notebook, Post } from "../types";

interface NotebookState {
  notebooks: Map<string, Notebook>;
  posts: Map<string, Post[]>; // notebookPubkey -> posts
  currentPost: Post | null;
}

interface NotebookActions {
  addNotebook: (notebook: Notebook) => void;
  updateNotebook: (pubkey: string, updates: Partial<Notebook>) => void;
  removeNotebook: (pubkey: string) => void;
  setPosts: (notebookPubkey: string, posts: Post[]) => void;
  addPost: (notebookPubkey: string, post: Post) => void;
  updatePost: (notebookPubkey: string, postPubkey: string, updates: Partial<Post>) => void;
  removePost: (notebookPubkey: string, postPubkey: string) => void;
  setCurrentPost: (post: Post | null) => void;
  getNotebook: (pubkey: string) => Notebook | undefined;
  getPosts: (notebookPubkey: string) => Post[];
}

export const useNotebookStore = create<NotebookState & NotebookActions>()(
  (set, get) => ({
    notebooks: new Map(),
    posts: new Map(),
    currentPost: null,

    addNotebook: (notebook) => {
      const notebooks = new Map(get().notebooks);
      notebooks.set(notebook.pubkey, notebook);
      set({ notebooks });
    },

    updateNotebook: (pubkey, updates) => {
      const notebooks = new Map(get().notebooks);
      const existing = notebooks.get(pubkey);
      if (existing) {
        notebooks.set(pubkey, { ...existing, ...updates });
        set({ notebooks });
      }
    },

    removeNotebook: (pubkey) => {
      const notebooks = new Map(get().notebooks);
      notebooks.delete(pubkey);
      const posts = new Map(get().posts);
      posts.delete(pubkey);
      set({ notebooks, posts });
    },

    setPosts: (notebookPubkey, posts) => {
      const postsMap = new Map(get().posts);
      postsMap.set(notebookPubkey, posts);
      set({ posts: postsMap });
    },

    addPost: (notebookPubkey, post) => {
      const postsMap = new Map(get().posts);
      const existing = postsMap.get(notebookPubkey) || [];
      postsMap.set(notebookPubkey, [post, ...existing]); // Prepend for descending order
      set({ posts: postsMap });
    },

    updatePost: (notebookPubkey, postPubkey, updates) => {
      const postsMap = new Map(get().posts);
      const existing = postsMap.get(notebookPubkey) || [];
      const updated = existing.map((p) =>
        p.pubkey === postPubkey ? { ...p, ...updates } : p
      );
      postsMap.set(notebookPubkey, updated);
      set({ posts: postsMap });
    },

    removePost: (notebookPubkey, postPubkey) => {
      const postsMap = new Map(get().posts);
      const existing = postsMap.get(notebookPubkey) || [];
      postsMap.set(
        notebookPubkey,
        existing.filter((p) => p.pubkey !== postPubkey)
      );
      set({ posts: postsMap });
    },

    setCurrentPost: (post) => set({ currentPost: post }),

    getNotebook: (pubkey) => get().notebooks.get(pubkey),

    getPosts: (notebookPubkey) => get().posts.get(notebookPubkey) || [],
  })
);
