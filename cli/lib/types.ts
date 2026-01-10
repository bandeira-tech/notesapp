/**
 * Types - same as webapp
 */

export type Visibility = "public" | "protected" | "private";

export interface Notebook {
  pubkey: string;
  title: string;
  description?: string;
  coverImage?: string;
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
  author: {
    pubkey: string;
    name?: string;
  };
  postCount: number;
}

export interface NotebookRef {
  pubkey: string;
  title: string;
  visibility: Visibility;
  createdAt: number;
}

export interface Post {
  pubkey: string;
  notebookPubkey: string;
  content: string;
  images?: string[];
  createdAt: number;
  updatedAt: number;
  author: {
    pubkey: string;
    name?: string;
  };
  referenceTo?: {
    notebookPubkey: string;
    postPubkey: string;
  };
  reactionCount: {
    likes: number;
    comments: number;
  };
}

export interface PublicNotebookEntry {
  pubkey: string;
  author: {
    pubkey: string;
  };
  createdAt: number;
}
