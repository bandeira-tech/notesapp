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

export interface Identity {
  publicKeyHex: string;
  privateKeyHex: string;
}

export interface SignedMessage<T = unknown> {
  auth: Array<{ pubkey: string; signature: string }>;
  payload: T;
}

// Session management
export interface SessionKeypair {
  publicKeyHex: string;
  privateKeyHex: string;
  createdAt: number;
}

const SESSION_STORAGE_KEY = "firecat-notes-session-keypair";

// Cache for app identity
let appIdentity: Identity | null = null;

/**
 * Get the app's identity from environment variables
 * Used for writing shared data like public notebook index
 */
export async function getAppIdentity(): Promise<Identity> {
  if (appIdentity) return appIdentity;

  const publicKeyHex = import.meta.env.VITE_APP_PUBLIC_KEY;
  const privateKeyHex = import.meta.env.VITE_APP_PRIVATE_KEY;

  if (!publicKeyHex || !privateKeyHex) {
    throw new Error("VITE_APP_PUBLIC_KEY and VITE_APP_PRIVATE_KEY must be set in .env file");
  }

  appIdentity = {
    publicKeyHex,
    privateKeyHex,
  };

  console.log("🔑 App identity loaded:", appIdentity.publicKeyHex.substring(0, 16) + "...");
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

/**
 * Session Management Functions
 */

/**
 * Generate a new session keypair and store it
 */
export async function generateSessionKeypair(): Promise<SessionKeypair> {
  const keypair = await generateSigningKeyPair();
  const session: SessionKeypair = {
    publicKeyHex: keypair.publicKeyHex,
    privateKeyHex: keypair.privateKeyHex,
    createdAt: Date.now(),
  };
  saveSessionKeypair(session);
  console.log("🔑 Generated session keypair:", session.publicKeyHex.substring(0, 16) + "...");
  return session;
}

/**
 * Get stored session keypair from localStorage
 */
export function getSessionKeypair(): SessionKeypair | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SessionKeypair;
    }
  } catch (error) {
    console.error("Failed to load session keypair:", error);
  }
  return null;
}

/**
 * Save session keypair to localStorage
 */
export function saveSessionKeypair(session: SessionKeypair): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clear session keypair from localStorage
 */
export function clearSessionKeypair(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
