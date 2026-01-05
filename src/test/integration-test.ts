/**
 * Integration test for notebook CRUD operations
 * Tests the full flow: create notebook -> list notebooks -> verify
 *
 * Run with: npx tsx src/test/integration-test.ts
 */

import { HttpClient } from "@bandeira-tech/b3nd-web";
import { WalletClient } from "@bandeira-tech/b3nd-web/wallet";
import {
  generateSigningKeyPair,
  createAuthenticatedMessageWithHex,
  deriveKeyFromSeed,
  encryptSymmetric,
  decryptSymmetric,
} from "@bandeira-tech/b3nd-web/encrypt";

const BACKEND_URL = "https://testnet-evergreen.fire.cat";
const WALLET_URL = "https://testnet-wallet.fire.cat";
const APP_KEY = "firecat-notes";
const PUBLIC_ENCRYPTION_SEED = "firecat-notes-public-encryption-v1";
const PUBLIC_ENCRYPTION_SALT = "firecat-notes-public-salt-v1";

const httpClient = new HttpClient({ url: BACKEND_URL });
const walletClient = new WalletClient({
  walletServerUrl: WALLET_URL,
  apiBasePath: "/api/v1",
});

interface Identity {
  publicKeyHex: string;
  privateKeyHex: string;
}

interface EncryptedPayload {
  _encrypted: true;
  _visibility: string;
  data: string;
  nonce: string;
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

async function encryptPublic(data: unknown): Promise<EncryptedPayload> {
  const key = await getPublicEncryptionKey();
  const encrypted = await encryptSymmetric(data, key);
  return {
    _encrypted: true,
    _visibility: "public",
    data: encrypted.data,
    nonce: encrypted.nonce,
  };
}

async function decryptPublic(payload: EncryptedPayload): Promise<unknown> {
  const key = await getPublicEncryptionKey();
  return decryptSymmetric({ data: payload.data, nonce: payload.nonce }, key);
}

async function signMessage<T>(payload: T, identity: Identity): Promise<object> {
  return createAuthenticatedMessageWithHex(
    payload,
    identity.publicKeyHex,
    identity.privateKeyHex
  );
}

async function runTest() {
  console.log("🧪 Running integration test (public flow only)...\n");
  console.log("Note: Skipping user creation - testing public notebook flow\n");

  const testAuthorPubkey = "test-author-" + Date.now();

  // Step 1: Create app identity
  console.log("1️⃣ Creating app identity...");
  const appIdentity = await generateIdentity();
  console.log(`   App pubkey: ${appIdentity.publicKeyHex.substring(0, 16)}...`);

  // Step 2: Create notebook identity
  console.log("\n2️⃣ Creating notebook identity...");
  const notebookIdentity = await generateIdentity();
  console.log(`   Notebook pubkey: ${notebookIdentity.publicKeyHex.substring(0, 16)}...`);

  const now = Date.now();
  const notebook = {
    pubkey: notebookIdentity.publicKeyHex,
    title: `Test Notebook ${now}`,
    description: "Integration test notebook",
    visibility: "public",
    createdAt: now,
    updatedAt: now,
    author: { pubkey: testAuthorPubkey },
    postCount: 0,
  };

  // Step 3: Write notebook metadata
  console.log("\n3️⃣ Writing notebook metadata...");
  const metaUri = `mutable://accounts/${notebookIdentity.publicKeyHex}/meta`;
  const encryptedNotebook = await encryptPublic(notebook);
  const signedNotebook = await signMessage(encryptedNotebook, notebookIdentity);
  const writeResult = await httpClient.write(metaUri, signedNotebook);
  console.log(`   Write success: ${writeResult.success}`);

  // Step 4: Write to public index
  console.log("\n4️⃣ Writing to public notebook index...");
  const indexUri = `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks/${notebookIdentity.publicKeyHex}`;
  const publicEntry = {
    pubkey: notebookIdentity.publicKeyHex,
    title: notebook.title,
    description: notebook.description,
    author: notebook.author,
    postCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const encryptedEntry = await encryptPublic(publicEntry);
  const signedEntry = await signMessage(encryptedEntry, appIdentity);
  const indexResult = await httpClient.write(indexUri, signedEntry);
  console.log(`   Write success: ${indexResult.success}`);

  // Step 5: Verify - List public notebooks
  console.log("\n5️⃣ Verifying public notebook list...");
  const publicListUri = `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks`;
  const publicListResult = await httpClient.list(publicListUri);
  console.log(`   List success: ${publicListResult.success}`);
  console.log(`   Items found: ${publicListResult.data?.length || 0}`);

  if (publicListResult.data && publicListResult.data.length > 0) {
    console.log("\n   Reading each public notebook...");
    for (const entry of publicListResult.data as Array<{ uri: string; type: string }>) {
      if (entry.type === "file") {
        const fixedUri = entry.uri.replace("accounts:///", "accounts/");
        console.log(`   - ${fixedUri}`);
        const readResult = await httpClient.read(fixedUri);
        if (readResult.success && readResult.record?.data) {
          const payload = (readResult.record.data as { payload?: EncryptedPayload }).payload;
          if (payload && payload._encrypted) {
            const decrypted = await decryptPublic(payload);
            console.log(`     Data: ${JSON.stringify(decrypted)}`);
          }
        }
      }
    }
  }

  // Step 6: Verify - Read notebook metadata directly
  console.log("\n6️⃣ Verifying notebook metadata read...");
  const metaReadResult = await httpClient.read(metaUri);
  console.log(`   Read success: ${metaReadResult.success}`);
  if (metaReadResult.success && metaReadResult.record?.data) {
    const payload = (metaReadResult.record.data as { payload?: EncryptedPayload }).payload;
    if (payload && payload._encrypted) {
      const decrypted = await decryptPublic(payload);
      console.log(`   Notebook data: ${JSON.stringify(decrypted)}`);
    }
  }

  console.log("\n✅ Integration test complete!");
  console.log("\n📋 Summary:");
  console.log(`   - App pubkey: ${appIdentity.publicKeyHex.substring(0, 16)}...`);
  console.log(`   - Notebook pubkey: ${notebookIdentity.publicKeyHex.substring(0, 16)}...`);
  console.log(`   - Notebook title: ${notebook.title}`);
}

runTest().catch(console.error);
