/**
 * Create post command
 */

import {
  b3ndClient,
  generateIdentity,
  getCurrentUser,
} from "../lib/b3nd-client.js";
import {
  getPostUri,
  getNotebookMetaUri,
  getUserNotebooksIndexUri,
} from "../lib/uris.js";
import type { Post, Notebook, Visibility } from "../lib/types.js";

export async function createPost(params: {
  notebookPubkey: string;
  content: string;
  images?: string[];
}) {
  const user = getCurrentUser();
  if (!user) throw new Error("Not authenticated - please login first");

  console.log(`📝 Creating post in notebook ${params.notebookPubkey.substring(0, 16)}...`);

  // Load notebook identity from user's index
  const indexUri = getUserNotebooksIndexUri();
  const index = await b3ndClient.readPrivate<{
    notebooks: any[];
    keys: Record<string, string>;
  }>(indexUri);

  if (!index || !index.keys || !index.keys[params.notebookPubkey]) {
    throw new Error("Notebook not found in your index - you may not own this notebook");
  }

  const notebookIdentity = {
    publicKeyHex: params.notebookPubkey,
    privateKeyHex: index.keys[params.notebookPubkey],
  };

  // Load notebook to get visibility
  const metaUri = getNotebookMetaUri(params.notebookPubkey);
  const notebook = await b3ndClient.read<Notebook>(metaUri, { visibility: "public" });
  if (!notebook) {
    throw new Error("Notebook not found");
  }

  // Generate identity for the post
  const postIdentity = await generateIdentity();
  console.log(`  ✓ Generated post pubkey: ${postIdentity.publicKeyHex.substring(0, 16)}...`);

  const now = Date.now();
  const post: Post = {
    pubkey: postIdentity.publicKeyHex,
    notebookPubkey: params.notebookPubkey,
    content: params.content,
    images: params.images,
    createdAt: now,
    updatedAt: now,
    author: {
      pubkey: user.identity.publicKeyHex,
    },
    reactionCount: {
      likes: 0,
      comments: 0,
    },
  };

  // Write post to notebook's account
  const postUri = getPostUri(params.notebookPubkey, postIdentity.publicKeyHex);
  const success = await b3ndClient.write(postUri, post, notebookIdentity, {
    visibility: notebook.visibility,
  });

  if (!success) {
    throw new Error("Failed to create post");
  }
  console.log(`  ✓ Wrote post to ${postUri}`);

  // Update notebook post count
  const updatedNotebook: Notebook = {
    ...notebook,
    postCount: notebook.postCount + 1,
    updatedAt: now,
  };

  await b3ndClient.write(metaUri, updatedNotebook, notebookIdentity, {
    visibility: notebook.visibility,
  });
  console.log(`  ✓ Updated notebook post count to ${updatedNotebook.postCount}`);

  console.log(`✅ Post created successfully!`);
  console.log(`   Content: ${params.content.substring(0, 60)}${params.content.length > 60 ? "..." : ""}`);

  return post;
}
