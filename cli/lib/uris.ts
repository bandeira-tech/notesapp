/**
 * URI utilities - same as webapp
 */

export function getNotebookMetaUri(notebookPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/meta`;
}

export function getPostUri(notebookPubkey: string, postPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/posts/${postPubkey}`;
}

export function getPostsListUri(notebookPubkey: string): string {
  return `mutable://accounts/${notebookPubkey}/posts`;
}

export function getPublicNotebookIndexUri(
  appPubkey: string,
  notebookPubkey: string
): string {
  return `mutable://accounts/${appPubkey}/public-notebooks/${notebookPubkey}`;
}

export function getPublicNotebooksListUri(appPubkey: string): string {
  return `mutable://accounts/${appPubkey}/public-notebooks`;
}

export function getUserNotebooksIndexUri(): string {
  return `mutable://accounts/:key/notebooks-index`;
}
