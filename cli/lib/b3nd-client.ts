/**
 * B3nd Client Setup for CLI
 * Uses the same B3nd SDK as the webapp
 */

import { HttpClient } from "@bandeira-tech/b3nd-web";
import { WalletClient } from "@bandeira-tech/b3nd-web/wallet";
import {
  generateSigningKeyPair,
  createAuthenticatedMessageWithHex,
} from "@bandeira-tech/b3nd-web/encrypt";

// Firecat testnet configuration
export const FIRECAT_CONFIG = {
  backend: "https://testnet-evergreen.fire.cat",
  wallet: "https://testnet-wallet.fire.cat",
  app: "https://testnet-app.fire.cat",
};

// Global clients
export const httpClient = new HttpClient({ url: FIRECAT_CONFIG.backend });

export const walletClient = new WalletClient({
  walletServerUrl: FIRECAT_CONFIG.wallet,
  apiBasePath: "/api/v1",
});

/**
 * Sign data using B3nd SDK (same as webapp)
 */
async function signWithHex(data: unknown, privateKeyHex: string, publicKeyHex: string) {
  return createAuthenticatedMessageWithHex(data, publicKeyHex, privateKeyHex);
}

/**
 * Get app identity from environment variables
 */
export async function getAppIdentity() {
  const publicKeyHex = process.env.APP_PUBLIC_KEY;
  const privateKeyHex = process.env.APP_PRIVATE_KEY;

  if (!publicKeyHex || !privateKeyHex) {
    throw new Error("APP_PUBLIC_KEY and APP_PRIVATE_KEY must be set in .env file");
  }

  return {
    publicKeyHex,
    privateKeyHex,
  };
}

/**
 * Generate a new identity (for notebooks, posts, etc.)
 */
export async function generateIdentity() {
  const keyPair = await generateSigningKeyPair();
  return {
    publicKeyHex: keyPair.publicKeyHex,
    privateKeyHex: keyPair.privateKeyHex,
  };
}

/**
 * Simplified session management for CLI
 * Bypasses wallet server - stores user identities locally
 */
interface CLIUser {
  username: string;
  password: string;
  identity: { publicKeyHex: string; privateKeyHex: string };
}

const users = new Map<string, CLIUser>();
let currentUser: CLIUser | null = null;

/**
 * Simplified signup - generates identity and stores locally
 */
export async function signup(username: string, password: string) {
  console.log(`  Creating user identity for ${username}...`);

  if (users.has(username)) {
    throw new Error(`User ${username} already exists`);
  }

  // Generate user identity
  const userIdentity = await generateSigningKeyPair();

  const user: CLIUser = {
    username,
    password,
    identity: {
      publicKeyHex: userIdentity.publicKeyHex,
      privateKeyHex: userIdentity.privateKeyHex,
    },
  };

  users.set(username, user);
  currentUser = user;

  console.log(`  ✓ User identity: ${userIdentity.publicKeyHex.substring(0, 16)}...`);

  return {
    username,
    token: "cli-token",
  };
}

/**
 * Simplified login - retrieves stored identity
 */
export async function login(username: string, password: string) {
  const user = users.get(username);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  if (user.password !== password) {
    throw new Error("Invalid password");
  }

  currentUser = user;

  return {
    username,
    token: "cli-token",
  };
}

export function getCurrentSession() {
  if (!currentUser) return null;
  return {
    username: currentUser.identity.publicKeyHex,
    token: "cli-token",
  };
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * B3nd client wrapper with authentication
 */
export const b3ndClient = {
  async read<T>(
    uri: string,
    options?: { visibility?: "public" | "protected" | "private"; password?: string }
  ): Promise<T | null> {
    const result = await httpClient.read(uri);
    if (!result.success) return null;

    const data = result.record?.data;
    if (!data) return null;

    // If data is a signed message, extract the payload
    if (typeof data === "object" && data !== null && "payload" in data) {
      return (data as any).payload as T;
    }

    return data as T;
  },

  async readPrivate<T>(uri: string): Promise<T | null> {
    if (!currentUser) throw new Error("Not authenticated");

    // For CLI, we simulate private reads by signing with user identity
    // In production, this would go through wallet server
    const realUri = uri.replace(":key", currentUser.identity.publicKeyHex);
    const result = await httpClient.read(realUri);
    if (!result.success) return null;

    const data = result.record?.data;
    if (!data) return null;

    // If data is a signed message, extract the payload
    if (typeof data === "object" && data !== null && "payload" in data) {
      return (data as any).payload as T;
    }

    return data as T;
  },

  async write<T>(
    uri: string,
    data: T,
    identity: { publicKeyHex: string; privateKeyHex: string },
    options?: { visibility?: "public" | "protected" | "private"; password?: string }
  ): Promise<boolean> {
    const signed = await signWithHex(data, identity.privateKeyHex, identity.publicKeyHex);
    const result = await httpClient.write(uri, signed);
    if (!result.success) {
      console.error(`❌ Write failed for ${uri}:`, result.error || result);
    }
    return result.success;
  },

  async writePrivate<T>(uri: string, data: T): Promise<boolean> {
    if (!currentUser) throw new Error("Not authenticated");

    // For CLI, we write directly with user identity (no encryption)
    // In production, this would go through wallet server with encryption
    const realUri = uri.replace(":key", currentUser.identity.publicKeyHex);
    const signed = await signWithHex(data, currentUser.identity.privateKeyHex, currentUser.identity.publicKeyHex);
    const result = await httpClient.write(realUri, signed);
    return result.success;
  },

  async delete(
    uri: string,
    identity: { publicKeyHex: string; privateKeyHex: string }
  ): Promise<boolean> {
    const result = await httpClient.delete(uri);
    return result.success;
  },

  async list<T>(
    uri: string,
    options?: { visibility?: "public" | "protected" | "private"; password?: string }
  ): Promise<T[]> {
    const result = await httpClient.list(uri);
    if (!result.success) return [];
    return result.data as T[];
  },
};
