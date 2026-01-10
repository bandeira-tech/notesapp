/**
 * Create notebook command
 */

import {
  b3ndClient,
  generateIdentity,
  getAppIdentity,
  getCurrentUser,
} from "../lib/b3nd-client.js";
import {
  getNotebookMetaUri,
  getPublicNotebookIndexUri,
  getUserNotebooksIndexUri,
} from "../lib/uris.js";
import type { Notebook, NotebookRef, PublicNotebookEntry, Visibility } from "../lib/types.js";

export async function createNotebook(params: {
  title: string;
  description?: string;
  visibility: Visibility;
  password?: string;
}) {
  const user = getCurrentUser();
  if (!user) throw new Error("Not authenticated - please login first");

  console.log(`📓 Creating notebook: ${params.title}`);

  // 1. Generate identity for the notebook
  const notebookIdentity = await generateIdentity();
  console.log(`  ✓ Generated notebook pubkey: ${notebookIdentity.publicKeyHex.substring(0, 16)}...`);

  const now = Date.now();
  const notebook: Notebook = {
    pubkey: notebookIdentity.publicKeyHex,
    title: params.title,
    description: params.description,
    visibility: params.visibility,
    createdAt: now,
    updatedAt: now,
    author: {
      pubkey: user.identity.publicKeyHex,
    },
    postCount: 0,
  };

  // 2. Write notebook metadata to notebook's account
  const metaUri = getNotebookMetaUri(notebookIdentity.publicKeyHex);
  const success = await b3ndClient.write(metaUri, notebook, notebookIdentity, {
    visibility: params.visibility,
    password: params.password,
  });

  if (!success) {
    throw new Error("Failed to create notebook");
  }
  console.log(`  ✓ Wrote notebook metadata to ${metaUri}`);

  // 3. Add to user's notebooks index
  const indexUri = getUserNotebooksIndexUri();
  const currentIndex = (await b3ndClient.readPrivate<{
    notebooks: NotebookRef[];
    keys: Record<string, string>;
  }>(indexUri)) || { notebooks: [], keys: {} };

  const notebookRef: NotebookRef = {
    pubkey: notebookIdentity.publicKeyHex,
    title: params.title,
    visibility: params.visibility,
    createdAt: now,
  };

  currentIndex.notebooks.push(notebookRef);
  currentIndex.keys[notebookIdentity.publicKeyHex] = notebookIdentity.privateKeyHex;

  await b3ndClient.writePrivate(indexUri, currentIndex);
  console.log(`  ✓ Added to user index (${currentIndex.notebooks.length} total notebooks)`);

  // 4. If public, add to app's public index
  if (params.visibility === "public") {
    const appIdentity = await getAppIdentity();
    const publicIndexUri = getPublicNotebookIndexUri(
      appIdentity.publicKeyHex,
      notebookIdentity.publicKeyHex
    );
    const entry: PublicNotebookEntry = {
      pubkey: notebookIdentity.publicKeyHex,
      author: { pubkey: user.identity.publicKeyHex },
      createdAt: now,
    };
    await b3ndClient.write(publicIndexUri, entry, appIdentity, {
      visibility: "public",
    });
    console.log(`  ✓ Added to public discovery index`);
  }

  console.log(`✅ Notebook created successfully!`);
  console.log(`   Pubkey: ${notebookIdentity.publicKeyHex}`);
  console.log(`   Title: ${params.title}`);
  console.log(`   Visibility: ${params.visibility}`);

  return {
    notebook,
    identity: notebookIdentity,
  };
}
