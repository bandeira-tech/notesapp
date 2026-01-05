/**
 * Debug script to test the notebook creation and listing flow
 * Run with: npx tsx src/test/debug-flow.ts
 */

import { HttpClient } from "@bandeira-tech/b3nd-web";
import {
  generateSigningKeyPair,
  createAuthenticatedMessageWithHex,
  deriveKeyFromSeed,
  encryptSymmetric,
} from "@bandeira-tech/b3nd-web/encrypt";

const BACKEND_URL = "https://testnet-evergreen.fire.cat";
const PUBLIC_ENCRYPTION_SEED = "firecat-notes-public-encryption-v1";
const PUBLIC_ENCRYPTION_SALT = "firecat-notes-public-salt-v1";

const httpClient = new HttpClient({ url: BACKEND_URL });

interface Identity {
  publicKeyHex: string;
  privateKeyHex: string;
}

async function generateIdentity(): Promise<Identity> {
  const keypair = await generateSigningKeyPair();
  return {
    publicKeyHex: keypair.publicKeyHex,
    privateKeyHex: keypair.privateKeyHex,
  };
}

async function getPublicEncryptionKey(): Promise<string> {
  return deriveKeyFromSeed(PUBLIC_ENCRYPTION_SEED, PUBLIC_ENCRYPTION_SALT, 100000);
}

async function encryptPublic(data: unknown, _uri: string): Promise<object> {
  const key = await getPublicEncryptionKey();
  const encrypted = await encryptSymmetric(data, key);
  return {
    _encrypted: true,
    _visibility: "public",
    data: encrypted.data,
    nonce: encrypted.nonce,
  };
}

async function signMessage<T>(payload: T, identity: Identity): Promise<object> {
  return createAuthenticatedMessageWithHex(
    payload,
    identity.publicKeyHex,
    identity.privateKeyHex
  );
}

async function runTest() {
  console.log("🧪 Starting debug flow test...\n");

  // Step 1: Create app identity (for public index)
  console.log("1️⃣ Creating app identity...");
  const appIdentity = await generateIdentity();
  console.log(`   App pubkey: ${appIdentity.publicKeyHex}`);

  // Step 2: Create notebook identity
  console.log("\n2️⃣ Creating notebook identity...");
  const notebookIdentity = await generateIdentity();
  console.log(`   Notebook pubkey: ${notebookIdentity.publicKeyHex}`);

  // Step 3: Create notebook metadata
  const now = Date.now();
  const notebook = {
    pubkey: notebookIdentity.publicKeyHex,
    title: "Test Notebook",
    description: "A test notebook for debugging",
    visibility: "public",
    createdAt: now,
    updatedAt: now,
    author: {
      pubkey: "test-user-pubkey",
    },
    postCount: 0,
  };

  // Step 4: Write notebook metadata to notebook's account
  console.log("\n3️⃣ Writing notebook metadata...");
  const metaUri = `mutable://accounts/${notebookIdentity.publicKeyHex}/meta`;
  console.log(`   URI: ${metaUri}`);

  const encryptedNotebook = await encryptPublic(notebook, metaUri);
  const signedNotebook = await signMessage(encryptedNotebook, notebookIdentity);

  const writeResult = await httpClient.write(metaUri, signedNotebook);
  console.log(`   Write result:`, writeResult);

  // Step 5: Read notebook metadata back
  console.log("\n4️⃣ Reading notebook metadata back...");
  const readResult = await httpClient.read(metaUri);
  console.log(`   Read result:`, JSON.stringify(readResult, null, 2));

  // Step 6: Write to public index
  console.log("\n5️⃣ Writing to public notebook index...");
  const indexUri = `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks/${notebookIdentity.publicKeyHex}`;
  console.log(`   URI: ${indexUri}`);

  const publicEntry = {
    pubkey: notebookIdentity.publicKeyHex,
    title: notebook.title,
    description: notebook.description,
    author: notebook.author,
    postCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const encryptedEntry = await encryptPublic(publicEntry, indexUri);
  const signedEntry = await signMessage(encryptedEntry, appIdentity);

  const indexWriteResult = await httpClient.write(indexUri, signedEntry);
  console.log(`   Write result:`, indexWriteResult);

  // Step 7: List public notebooks
  console.log("\n6️⃣ Listing public notebooks...");
  const listUri = `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks`;
  console.log(`   URI: ${listUri}`);

  const listResult = await httpClient.list(listUri);
  console.log(`   List result:`, JSON.stringify(listResult, null, 2));

  // Step 7b: Read each item from the list
  if (listResult.success && listResult.data && listResult.data.length > 0) {
    console.log("\n6️⃣b Reading each list item...");
    for (const entry of listResult.data as Array<{ uri: string; type: string }>) {
      if (entry.type === "file") {
        // Fix malformed URI
        const fixedUri = entry.uri.replace("accounts:///", "accounts/");
        console.log(`   Reading: ${fixedUri}`);
        const itemResult = await httpClient.read(fixedUri);
        console.log(`   Item result:`, JSON.stringify(itemResult, null, 2));
      }
    }
  }

  // Step 8: Check if the individual entry can be read
  console.log("\n7️⃣ Reading individual public notebook entry...");
  const entryReadResult = await httpClient.read(indexUri);
  console.log(`   Read result:`, JSON.stringify(entryReadResult, null, 2));

  console.log("\n✅ Debug flow complete!");
  console.log("\n📋 Summary:");
  console.log(`   - App identity: ${appIdentity.publicKeyHex}`);
  console.log(`   - Notebook identity: ${notebookIdentity.publicKeyHex}`);
  console.log(`   - Notebook meta URI: ${metaUri}`);
  console.log(`   - Public index URI: ${indexUri}`);
  console.log(`   - List URI: ${listUri}`);
}

runTest().catch(console.error);
