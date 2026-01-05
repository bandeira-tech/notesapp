import type { UserProfile } from "../types";
import { walletClient } from "./b3nd-client";
import { APP_KEY } from "../config/firecat";
import type { AuthSession } from "@bandeira-tech/b3nd-web/wallet";

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

// Initialize session on module load
loadStoredSession();

export class AuthService {
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<AuthSession> {
    try {
      console.log("🔑 AuthService.login: Authenticating with wallet server...");

      // Generate a session key for this login
      const sessionKey = crypto.randomUUID();

      const session = await walletClient.loginWithTokenSession(
        APP_KEY,
        sessionKey,
        { username: credentials.username, password: credentials.password }
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
      console.log("🔧 AuthService.signup: Registering with wallet server...", {
        username: credentials.username,
        hasPassword: !!credentials.password,
        name: credentials.name,
      });

      const session = await walletClient.signupWithToken(APP_KEY, {
        username: credentials.username,
        password: credentials.password,
      });

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
