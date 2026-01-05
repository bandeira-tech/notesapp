// Visibility types
export type Visibility = "private" | "protected" | "public";
export type VisibilityCode = "pvt" | "pro" | "pub";

export const visibilityToCode: Record<Visibility, VisibilityCode> = {
  private: "pvt",
  protected: "pro",
  public: "pub",
};

export const codeToVisibility: Record<VisibilityCode, Visibility> = {
  pvt: "private",
  pro: "protected",
  pub: "public",
};

/**
 * Notebook identity reference stored in user's account
 * Contains the encrypted private key for the notebook
 */
export interface NotebookRef {
  pubkey: string; // Notebook's public key (IS the ID)
  title: string;
  visibility: Visibility;
  createdAt: number;
  // Private key is stored separately encrypted
}

/**
 * Notebook metadata stored in notebook's account
 */
export interface Notebook {
  pubkey: string; // Notebook's public key (IS the ID)
  title: string;
  description?: string;
  coverImage?: string;
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
  author: {
    pubkey: string; // User's public key
    name?: string;
  };
  postCount: number;
}

/**
 * Post data structure
 * Each post has its own identity (pubkey)
 */
export interface Post {
  pubkey: string; // Post's public key (IS the ID)
  notebookPubkey: string; // Parent notebook's pubkey
  content: string;
  images?: string[]; // Base64 or IPFS URIs
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

/**
 * Reaction data structure
 */
export interface Reaction {
  id: string; // Reactions use simple IDs within post scope
  postPubkey: string;
  type: "like" | "comment";
  content?: string; // For comment reactions
  media?: {
    type: "emoji" | "text" | "image";
    data: string;
  };
  createdAt: number;
  author: {
    pubkey: string;
    name?: string;
  };
}

/**
 * Public notebook index entry (stored in app account)
 */
export interface PublicNotebookEntry {
  pubkey: string;
  title: string;
  description?: string;
  author: {
    pubkey: string;
    name?: string;
  };
  postCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * User profile
 */
export interface UserProfile {
  pubkey: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

/**
 * App state
 */
export interface AppState {
  currentUser: UserProfile | null;
  currentNotebook: string | null;
  theme: "light" | "dark" | "peaceful";
}

/**
 * B3nd record wrapper
 */
export interface B3ndRecord<T> {
  data: T;
  timestamp: number;
  uri: string;
}

/**
 * API result types
 */
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
