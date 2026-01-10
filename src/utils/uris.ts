/**
 * URI Schema for Firecat Notes
 *
 * Every entity has its own identity (Ed25519 keypair). The pubkey IS the ID.
 *
 * Notebook Account (notebook's pubkey):
 *   mutable://accounts/{notebook_pubkey}/meta     - Notebook metadata (title, desc, visibility, author)
 *   mutable://accounts/{notebook_pubkey}/posts/   - List container for posts
 *   mutable://accounts/{notebook_pubkey}/posts/{post_pubkey} - Individual post
 *
 * App Account (app's pubkey) - for shared indexes:
 *   mutable://accounts/{app_pubkey}/public-notebooks/{notebook_pubkey} - Public notebook index entry
 *
 * User Account (user's pubkey via :key) - private user data:
 *   mutable://accounts/:key/notebooks/{notebook_pubkey}       - User's notebook reference
 *   mutable://accounts/:key/notebook-keys/{notebook_pubkey}   - Encrypted notebook private key
 *   mutable://accounts/:key/profile                           - User profile
 */

/**
 * Get URI for notebook metadata (stored in notebook's account)
 */
export function getNotebookMetaUri(notebookPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/meta`;
}

/**
 * Get URI for a post (stored in notebook's account)
 */
export function getPostUri(notebookPubkey: string, postPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/posts/${postPubkey}`;
}

/**
 * Get URI for listing posts in a notebook
 */
export function getPostsListUri(notebookPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/posts`;
}

/**
 * Get URI for public notebook index entry (stored in app account)
 */
export function getPublicNotebookIndexUri(
  appPubkey: string,
  notebookPubkey: string
): string {
  return `mutable://accounts/${appPubkey}/public-notebooks/${notebookPubkey}`;
}

/**
 * Get URI for listing all public notebooks (in app account)
 */
export function getPublicNotebooksListUri(appPubkey: string): string {
  return `mutable://accounts/${appPubkey}/public-notebooks`;
}

/**
 * Get URI for user's notebook index (single file with all notebook refs)
 * Stored in user account via proxyWrite
 */
export function getUserNotebooksIndexUri(): string {
  return `mutable://accounts/:key/notebooks-index`;
}

/**
 * @deprecated Use getUserNotebooksIndexUri() instead
 */
export function getUserNotebooksListUri(): string {
  return getUserNotebooksIndexUri();
}

/**
 * Get URI for user's notebook keys index (single file with all notebook private keys)
 * Stored in user account via proxyWrite
 */
export function getNotebookKeysIndexUri(): string {
  return `mutable://accounts/:key/notebook-keys-index`;
}

/**
 * @deprecated Use getNotebookKeysIndexUri() instead
 */
export function getNotebookKeyUri(notebookPubkey: string): string {
  // Legacy: return individual file path (will be migrated to index)
  return `mutable://accounts/:key/notebook-keys/${notebookPubkey}`;
}

/**
 * Get URI for user profile (in user account)
 */
export function getUserProfileUri(): string {
  return `mutable://accounts/:key/profile`;
}

/**
 * Get URI for reactions on a post (stored in notebook's account)
 */
export function getReactionsListUri(
  notebookPubkey: string,
  postPubkey: string
): string {
  return `mutable://accounts/${notebookPubkey}/posts/${postPubkey}/reactions`;
}

/**
 * Get URI for a specific reaction
 */
export function getReactionUri(
  notebookPubkey: string,
  postPubkey: string,
  reactionId: string
): string {
  return `mutable://accounts/${notebookPubkey}/posts/${postPubkey}/reactions/${reactionId}`;
}

/**
 * Parse a B3nd URI into components
 */
export function parseUri(uri: string): {
  protocol: string;
  domain: string;
  path: string;
} {
  const match = uri.match(/^(\w+):\/\/([^/]+)(.*)$/);
  if (!match) {
    throw new Error(`Invalid URI: ${uri}`);
  }
  return {
    protocol: match[1],
    domain: match[2],
    path: match[3] || "/",
  };
}
