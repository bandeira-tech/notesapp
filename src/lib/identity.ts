/**
 * Identity Management for Firecat Notes
 *
 * Every entity in B3nd has its own Ed25519 keypair. The pubkey IS the identity/ID.
 * - App has a keypair for shared data (public indexes)
 * - Each notebook has a keypair (owner stores private key in their account)
 * - Writes are signed with the entity's private key
 */

import {
  generateSigningKeyPair,
  createAuthenticatedMessageWithHex,
  deriveKeyFromSeed,
  encryptSymmetric,
  decryptSymmetric,
} from "@bandeira-tech/b3nd-web/encrypt";

// App identity seed - used to derive deterministic app keypair
// In production, this would be managed securely
const APP_SEED = "firecat-notes-app-identity-v1";
const APP_SALT = "firecat-notes-salt-v1";

export interface Identity {
  publicKeyHex: string;
  privateKeyHex: string;
}

export interface SignedMessage<T = unknown> {
  auth: Array<{ pubkey: string; signature: string }>;
  payload: T;
}

// Cache for app identity
let appIdentity: Identity | null = null;

/**
 * Get the app's identity (deterministic keypair)
 * Used for writing shared data like public notebook index
 */
export async function getAppIdentity(): Promise<Identity> {
  if (appIdentity) return appIdentity;

  // Derive a deterministic key from the seed
  // Note: In production, this would be used to derive the keypair deterministically
  await deriveKeyFromSeed(APP_SEED, APP_SALT, 100000);

  // For now, generate a fresh one and store in localStorage for persistence
  const stored = localStorage.getItem("firecat-app-identity");
  if (stored) {
    appIdentity = JSON.parse(stored);
    return appIdentity!;
  }

  // Generate new keypair for the app
  const keypair = await generateSigningKeyPair();
  appIdentity = {
    publicKeyHex: keypair.publicKeyHex,
    privateKeyHex: keypair.privateKeyHex,
  };

  // Store for persistence
  localStorage.setItem("firecat-app-identity", JSON.stringify(appIdentity));

  console.log("🔑 Generated app identity:", appIdentity.publicKeyHex);
  return appIdentity;
}

/**
 * Generate a new identity for an entity (notebook, etc.)
 */
export async function generateIdentity(): Promise<Identity> {
  const keypair = await generateSigningKeyPair();
  return {
    publicKeyHex: keypair.publicKeyHex,
    privateKeyHex: keypair.privateKeyHex,
  };
}

/**
 * Create a signed message using an identity's private key
 */
export async function signMessage<T>(
  payload: T,
  identity: Identity
): Promise<SignedMessage<T>> {
  return createAuthenticatedMessageWithHex(
    payload,
    identity.publicKeyHex,
    identity.privateKeyHex
  );
}

/**
 * Encrypt an identity's private key for storage
 * Uses a key derived from user's encryption key (stored via proxyWrite)
 */
export async function encryptPrivateKey(
  privateKeyHex: string,
  encryptionKeyHex: string
): Promise<string> {
  const encrypted = await encryptSymmetric({ key: privateKeyHex }, encryptionKeyHex);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt an identity's private key from storage
 */
export async function decryptPrivateKey(
  encryptedData: string,
  encryptionKeyHex: string
): Promise<string> {
  const encrypted = JSON.parse(encryptedData);
  const decrypted = (await decryptSymmetric(encrypted, encryptionKeyHex)) as {
    key: string;
  };
  return decrypted.key;
}
