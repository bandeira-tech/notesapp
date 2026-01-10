import type { UserProfile } from "../types";
import { walletClient, httpClient } from "./b3nd-client";
import type { AuthSession } from "@bandeira-tech/b3nd-web/wallet";
import {
  generateSessionKeypair,
  getSessionKeypair,
  clearSessionKeypair,
  getAppIdentity,
  type SessionKeypair,
} from "./identity";
import { createAuthenticatedMessageWithHex } from "@bandeira-tech/b3nd-web/encrypt";

export type { AuthSession };

// Re-export WalletSession type for compatibility
export type WalletSession = AuthSession;

// Session storage key
const SESSION_KEY = "firecat-notes-session";

// Load session from localStorage and restore to walletClient
function loadStoredSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const session = JSON.parse(stored) as AuthSession;
      // Check if session is expired
      const expiresAt = Date.now() + session.expiresIn * 1000;
      if (expiresAt > Date.now()) {
        walletClient.setSession(session);
        return session;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      localStorage.removeItem(SESSION_KEY);
    }
  }
  return null;
}

// Save session to localStorage
function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  walletClient.setSession(session);
}

// Clear session from localStorage and walletClient
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  walletClient.logout();
}

/**
 * Create a session using the B3nd session protocol:
 * 1. Generate local session keypair
 * 2. Post signed session request to inbox
 * 3. Approve session in accounts
 */
async function createSession(): Promise<SessionKeypair> {
  console.log("🔐 Creating session...");

  // Get app identity for signing
  const appIdentity = await getAppIdentity();
  console.log("🔑 App identity:", appIdentity.publicKeyHex.substring(0, 16) + "...");

  // Step 1: Get or generate session keypair
  let sessionKeypair = getSessionKeypair();
  if (!sessionKeypair) {
    sessionKeypair = await generateSessionKeypair();
  }

  try {
    // Step 2: Post signed session request to inbox
    const inboxUri = `immutable://inbox/${appIdentity.publicKeyHex}/sessions/${sessionKeypair.publicKeyHex}`;
    console.log("📬 Posting session request to inbox:", inboxUri);

    const sessionRequest = await createAuthenticatedMessageWithHex(
      { timestamp: Date.now() },
      sessionKeypair.publicKeyHex,
      sessionKeypair.privateKeyHex
    );

    const inboxResult = await httpClient.write(inboxUri, sessionRequest);
    if (!inboxResult.success) {
      throw new Error("Failed to post session request to inbox");
    }
    console.log("✅ Session request posted to inbox");

    // Step 3: Approve session in accounts (value = 1, signed by app identity)
    // The accounts protocol requires pubkey in URI to match the signer
    const approvalUri = `mutable://accounts/${appIdentity.publicKeyHex}/sessions/${sessionKeypair.publicKeyHex}`;
    console.log("✍️  Approving session in accounts:", approvalUri);

    const approval = await createAuthenticatedMessageWithHex(
      1,
      appIdentity.publicKeyHex,
      appIdentity.privateKeyHex
    );

    const approvalResult = await httpClient.write(approvalUri, approval);
    console.log("📝 Approval write result:", approvalResult);
    console.log("📝 Approval message structure:", JSON.stringify(approval, null, 2));
    if (!approvalResult.success) {
      throw new Error(`Failed to approve session in accounts: ${JSON.stringify(approvalResult)}`);
    }
    console.log("✅ Session approved in accounts");

    // Verify approval was written - read it back
    const verifyResult = await httpClient.read(approvalUri);
    console.log("🔍 Verification read result:", JSON.stringify(verifyResult, null, 2));

    // Check what the payload value is
    const data = verifyResult.record?.data;
    const status = typeof data === "object" && data !== null && "payload" in data ? (data as any).payload : data;
    console.log("🔍 Extracted status value:", status, "Type:", typeof status);

    return sessionKeypair;
  } catch (error) {
    console.error("❌ Session creation failed:", error);
    // Clear failed session
    clearSessionKeypair();
    throw error;
  }
}

export class AuthService {
  private sessionKeypair: SessionKeypair | null = null;
  private sessionInitPromise: Promise<void> | null = null;

  constructor() {
    // Initialize session on construction
    this.sessionInitPromise = this.initializeSession();
  }

  /**
   * Initialize session at app startup
   * Creates and approves session if not already done
   */
  private async initializeSession(): Promise<void> {
    try {
      // Check if we already have a valid session
      const existingSession = getSessionKeypair();
      if (existingSession) {
        console.log("📱 Using existing session:", existingSession.publicKeyHex.substring(0, 16) + "...");
        this.sessionKeypair = existingSession;
        return;
      }

      // Create new session
      console.log("🔐 Creating new app session...");
      this.sessionKeypair = await createSession();
      console.log("✅ App session ready:", this.sessionKeypair.publicKeyHex.substring(0, 16) + "...");
    } catch (error) {
      console.error("❌ Failed to initialize session:", error);
      // Don't throw - we'll retry on login/signup
    }
  }

  /**
   * Ensure session is ready before login/signup
   */
  private async ensureSession(): Promise<SessionKeypair> {
    // Wait for initialization to complete
    if (this.sessionInitPromise) {
      await this.sessionInitPromise;
      this.sessionInitPromise = null;
    }

    // If session failed to initialize, try again
    if (!this.sessionKeypair) {
      console.log("🔄 Retrying session creation...");
      this.sessionKeypair = await createSession();
    }

    return this.sessionKeypair;
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<AuthSession> {
    try {
      console.log("🔑 AuthService.login: Authenticating...");

      // Ensure session is ready
      const sessionKeypair = await this.ensureSession();

      // Get app identity for the appKey parameter
      const appIdentity = await getAppIdentity();

      // Use session for authentication
      const session = await walletClient.login(
        appIdentity.publicKeyHex,
        sessionKeypair,
        {
          type: 'password',
          username: credentials.username,
          password: credentials.password
        }
      );

      console.log("✅ Login successful:", { username: session.username });
      saveSession(session);
      return session;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw new Error(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async signup(credentials: {
    username: string;
    password: string;
    name?: string;
  }): Promise<AuthSession> {
    try {
      console.log("🔧 AuthService.signup: Registering...", {
        username: credentials.username,
        hasPassword: !!credentials.password,
        name: credentials.name,
      });

      // Ensure session is ready
      const sessionKeypair = await this.ensureSession();

      // Get app identity for the appKey parameter
      const appIdentity = await getAppIdentity();

      // Use session for signup
      const session = await walletClient.signup(
        appIdentity.publicKeyHex,
        sessionKeypair,
        {
          type: 'password',
          username: credentials.username,
          password: credentials.password,
        }
      );

      console.log("✅ Signup successful:", { username: session.username });
      saveSession(session);

      // Store profile in localStorage
      const profile: UserProfile = {
        pubkey: session.username, // Use username as identifier
        name: credentials.name || credentials.username,
      };
      console.log("💾 Saving profile...", profile);
      localStorage.setItem(`profile-${session.username}`, JSON.stringify(profile));

      return session;
    } catch (error) {
      console.error("❌ Signup failed:", error);
      throw new Error(
        `Signup failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  logout(): void {
    clearSession();
    // Don't clear session keypair - it's app-level, not user-level
    // clearSessionKeypair();
  }

  getSession(): AuthSession | null {
    return walletClient.getSession();
  }

  isAuthenticated(): boolean {
    return walletClient.isAuthenticated();
  }

  getCurrentPubkey(): string | null {
    return walletClient.getUsername();
  }
}

export const authService = new AuthService();

// Initialize auth session on module load
loadStoredSession();
