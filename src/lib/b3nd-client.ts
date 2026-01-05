/**
 * B3nd Client with Identity-Based Writes
 *
 * All writes in B3nd must be signed with the entity's private key.
 * The entity's pubkey determines where data can be written:
 * - mutable://accounts/{pubkey}/... requires signature from that pubkey
 *
 * Encryption model:
 * - All data is encrypted for storage
 * - Public: encrypted with app-wide symmetric key (anyone with app can decrypt)
 * - Protected: encrypted with location + password (anyone with password can decrypt)
 * - Private: encrypted via wallet proxyWrite (only user can decrypt)
 */

import { HttpClient } from "@bandeira-tech/b3nd-web";
import { WalletClient } from "@bandeira-tech/b3nd-web/wallet";
import {
  encryptSymmetric,
  decryptSymmetric,
  deriveKeyFromSeed,
} from "@bandeira-tech/b3nd-web/encrypt";
import { config } from "../config/firecat";
import type { Identity, SignedMessage } from "./identity";
import { signMessage, getAppIdentity, generateIdentity } from "./identity";
import type { Visibility } from "../types";

// App-wide encryption key for public data (derived from app seed)
const PUBLIC_ENCRYPTION_SEED = "firecat-notes-public-encryption-v1";
const PUBLIC_ENCRYPTION_SALT = "firecat-notes-public-salt-v1";

let publicEncryptionKey: string | null = null;

async function getPublicEncryptionKey(): Promise<string> {
  if (!publicEncryptionKey) {
    publicEncryptionKey = await deriveKeyFromSeed(
      PUBLIC_ENCRYPTION_SEED,
      PUBLIC_ENCRYPTION_SALT,
      100000
    );
  }
  return publicEncryptionKey;
}

// HTTP Client for direct B3nd operations
export const httpClient = new HttpClient({
  url: config.backend,
});

// Wallet Client for user account operations (proxyWrite/proxyRead)
export const walletClient = new WalletClient({
  walletServerUrl: config.wallet,
  apiBasePath: "/api/v1",
});

export interface WriteOptions {
  visibility: Visibility;
  password?: string; // Required for protected visibility
}

export interface ReadOptions {
  visibility: Visibility;
  password?: string; // Required for protected visibility
}

// Encrypted payload wrapper
interface EncryptedPayload {
  _encrypted: true;
  _visibility: Visibility;
  data: string;
  nonce: string;
}

function isEncryptedPayload(data: unknown): data is EncryptedPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    "_encrypted" in data &&
    (data as EncryptedPayload)._encrypted === true
  );
}

/**
 * Get the encryption key for a given visibility
 */
async function getEncryptionKey(
  visibility: Visibility,
  uri: string,
  password?: string
): Promise<string> {
  switch (visibility) {
    case "public":
      return getPublicEncryptionKey();
    case "protected":
      if (!password) throw new Error("Password required for protected visibility");
      return deriveKeyFromSeed(uri, password, 50000);
    case "private":
      throw new Error("Private visibility uses proxyWrite encryption");
    default:
      throw new Error(`Unknown visibility: ${visibility}`);
  }
}

/**
 * Encrypt data for storage
 */
async function encryptData(
  data: unknown,
  visibility: Visibility,
  uri: string,
  password?: string
): Promise<EncryptedPayload> {
  const key = await getEncryptionKey(visibility, uri, password);
  const encrypted = await encryptSymmetric(data, key);
  return {
    _encrypted: true,
    _visibility: visibility,
    data: encrypted.data,
    nonce: encrypted.nonce,
  };
}

/**
 * Decrypt data from storage
 */
async function decryptPayload<T>(
  payload: EncryptedPayload,
  uri: string,
  password?: string
): Promise<T> {
  const key = await getEncryptionKey(payload._visibility, uri, password);
  const decrypted = await decryptSymmetric(
    { data: payload.data, nonce: payload.nonce },
    key
  );
  return decrypted as T;
}

/**
 * Get URI for an entity's data
 */
export function getEntityUri(pubkey: string, path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `mutable://accounts/${pubkey}${cleanPath}`;
}

export class B3ndClient {
  /**
   * Write data signed with an entity's identity
   *
   * @param uri - The URI to write to (e.g., mutable://accounts/{pubkey}/path)
   * @param data - The data to write
   * @param identity - The entity's identity (keypair) for signing
   * @param options - Visibility and encryption options
   */
  async write(
    uri: string,
    data: unknown,
    identity: Identity,
    options: WriteOptions
  ): Promise<boolean> {
    const { visibility, password } = options;

    try {
      console.log(`📝 B3ndClient.write: ${uri} (${visibility})`);
      console.log(`   Signer: ${identity.publicKeyHex.substring(0, 16)}...`);

      if (visibility === "private") {
        throw new Error("Use writePrivate() for private visibility");
      }

      // Encrypt the data based on visibility
      const encryptedPayload = await encryptData(data, visibility, uri, password);

      // Sign the message with the entity's private key
      const signedMessage = await signMessage(encryptedPayload, identity);

      // Write to B3nd
      const result = await httpClient.write(uri, signedMessage);

      if (!result.success) {
        console.error(`❌ Write failed:`, result);
        return false;
      }

      console.log(`✅ Write success: ${uri}`);
      return true;
    } catch (error) {
      console.error(`❌ Write error for ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Write private data to user's account via wallet proxyWrite
   * This uses the wallet server's encryption with user's keys
   */
  async writePrivate(uri: string, data: unknown): Promise<boolean> {
    try {
      console.log(`📝 B3ndClient.writePrivate: ${uri}`);

      if (!walletClient.isAuthenticated()) {
        throw new Error("Not authenticated. Please login first.");
      }

      const result = await walletClient.proxyWrite({
        uri,
        data,
        encrypt: true,
      });

      if (!result.success) {
        console.error(`❌ Private write failed`);
        return false;
      }

      console.log(`✅ Private write success: ${uri}`);
      return true;
    } catch (error) {
      console.error(`❌ Private write error for ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Read data and decrypt based on visibility
   */
  async read<T>(uri: string, options: ReadOptions): Promise<T | null> {
    const { visibility, password } = options;

    try {
      console.log(`📖 B3ndClient.read: ${uri} (${visibility})`);

      if (visibility === "private") {
        return this.readPrivate<T>(uri);
      }

      const result = await httpClient.read(uri);
      if (!result.success || !result.record?.data) {
        console.log(`   Not found or no data`);
        return null;
      }

      // The data might be wrapped in a signed message
      const rawData = result.record.data;
      let payload: unknown;

      // Check if it's a signed message
      if (
        typeof rawData === "object" &&
        rawData !== null &&
        "auth" in rawData &&
        "payload" in rawData
      ) {
        payload = (rawData as SignedMessage).payload;
      } else {
        payload = rawData;
      }

      if (isEncryptedPayload(payload)) {
        const decrypted = await decryptPayload<T>(payload, uri, password);
        console.log(`✅ Read & decrypt success: ${uri}`);
        return decrypted;
      }

      // Legacy unencrypted data
      console.log(`✅ Read success (unencrypted): ${uri}`);
      return payload as T;
    } catch (error) {
      console.error(`❌ Read error for ${uri}:`, error);
      return null;
    }
  }

  /**
   * Read private data from user's account via wallet proxyRead
   */
  async readPrivate<T>(uri: string): Promise<T | null> {
    try {
      console.log(`📖 B3ndClient.readPrivate: ${uri}`);

      if (!walletClient.isAuthenticated()) {
        throw new Error("Not authenticated. Please login first.");
      }

      const result = await walletClient.proxyRead({ uri });
      if (!result.success) {
        console.log(`   Not found`);
        return null;
      }

      console.log(`✅ Private read success: ${uri}`);
      return (result.decrypted ?? result.record?.data) as T;
    } catch (error) {
      console.error(`❌ Private read error for ${uri}:`, error);
      return null;
    }
  }

  /**
   * List items at a URI path and decrypt based on visibility
   * Note: B3nd list returns URIs, so we read each item individually
   */
  async list<T>(
    uri: string,
    options: ReadOptions & { page?: number; limit?: number }
  ): Promise<T[]> {
    const { visibility, password, page, limit } = options;

    try {
      // For private URIs with :key placeholder, resolve to user's pubkey
      let resolvedUri = uri;
      if (uri.includes(":key")) {
        const username = walletClient.getUsername();
        if (!username) {
          console.error(`❌ Cannot list private URI without authentication`);
          return [];
        }
        resolvedUri = uri.replace(":key", username);
      }

      console.log(`📋 B3ndClient.list: ${resolvedUri} (${visibility})`);

      const result = await httpClient.list(resolvedUri, { page, limit });
      if (!result.success || !result.data) {
        console.log(`   No items found`);
        return [];
      }

      console.log(`   Found ${result.data.length} items, reading each...`);

      const items: T[] = [];
      for (const entry of result.data) {
        try {
          // B3nd list returns {uri, type} objects - we need to read each one
          if (
            typeof entry === "object" &&
            entry !== null &&
            "uri" in entry &&
            "type" in entry
          ) {
            const itemUri = (entry as { uri: string; type: string }).uri;
            // Fix malformed URI (sometimes has extra colons)
            const fixedUri = itemUri.replace("accounts:///", "accounts/");

            // Only read files, skip directories
            if ((entry as { type: string }).type === "file") {
              const item = await this.read<T>(fixedUri, { visibility, password });
              if (item) {
                items.push(item);
              }
            }
          } else {
            // Fallback: maybe it's already the data (legacy format)
            let payload: unknown;
            if (
              typeof entry === "object" &&
              entry !== null &&
              "auth" in entry &&
              "payload" in entry
            ) {
              payload = (entry as SignedMessage).payload;
            } else {
              payload = entry;
            }

            if (isEncryptedPayload(payload)) {
              const decrypted = await decryptPayload<T>(payload, uri, password);
              items.push(decrypted);
            } else {
              items.push(payload as T);
            }
          }
        } catch (err) {
          console.warn(`⚠️ Failed to read/decrypt list item:`, err);
        }
      }

      console.log(`✅ List success: ${items.length} items`);
      return items;
    } catch (error) {
      console.error(`❌ List error for ${uri}:`, error);
      return [];
    }
  }

  /**
   * Delete data at a URI (requires signing with entity key)
   */
  async delete(uri: string, _identity?: Identity): Promise<boolean> {
    try {
      console.log(`🗑️ B3ndClient.delete: ${uri}`);

      const result = await httpClient.delete(uri);
      if (!result.success) {
        console.error(`❌ Delete failed`);
        return false;
      }

      console.log(`✅ Delete success: ${uri}`);
      return true;
    } catch (error) {
      console.error(`❌ Delete error for ${uri}:`, error);
      return false;
    }
  }
}

export const b3ndClient = new B3ndClient();

// Re-export identity functions
export { getAppIdentity, generateIdentity, signMessage };
export type { Identity, SignedMessage };
