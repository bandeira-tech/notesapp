import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

const APP_SALT = "firecat-notes-v1";

// Generate keypair for signing
export function generateKeypair() {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
}

// Derive encryption key from URI and password
export async function deriveKey(
  uri: string,
  password: string = ""
): Promise<Uint8Array> {
  const seed = `${APP_SALT}:${uri}:${password}`;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(seed),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(APP_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

// Encrypt data with password
export async function encryptData(
  data: any,
  uri: string,
  password: string = ""
): Promise<string> {
  const key = await deriveKey(uri, password);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageUint8 = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = nacl.secretbox(messageUint8, nonce, key.slice(0, 32));

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return encodeBase64(fullMessage);
}

// Decrypt data with password
export async function decryptData(
  encrypted: string,
  uri: string,
  password: string = ""
): Promise<any> {
  const key = await deriveKey(uri, password);
  const messageWithNonce = decodeBase64(encrypted);
  const nonce = messageWithNonce.slice(0, nacl.secretbox.nonceLength);
  const message = messageWithNonce.slice(nacl.secretbox.nonceLength);

  const decrypted = nacl.secretbox.open(message, nonce, key.slice(0, 32));
  if (!decrypted) {
    throw new Error("Failed to decrypt - wrong password?");
  }

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

// Hash password for storage
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + APP_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
