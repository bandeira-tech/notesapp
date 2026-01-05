import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "../types";
import { authService, type WalletSession } from "../lib/auth";

interface AuthState {
  session: WalletSession | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  signup: (credentials: {
    username: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      session: authService.getSession(),
      profile: null,
      isAuthenticated: authService.isAuthenticated(),

      login: async (credentials) => {
        const session = await authService.login(credentials);
        set({
          session,
          isAuthenticated: true,
        });
      },

      signup: async (credentials) => {
        console.log("🏪 AuthStore.signup called");
        const session = await authService.signup(credentials);
        console.log("🏪 AuthStore received session:", session);

        const newState = {
          session,
          isAuthenticated: true,
          profile: {
            pubkey: session.username, // AuthSession uses username as identifier
            name: credentials.name || credentials.username,
            notebookIds: [],
          },
        };

        console.log("🏪 AuthStore setting state:", newState);
        set(newState);
        console.log("🏪 AuthStore state updated!");

        // Verify state was set
        const currentState = get();
        console.log("🏪 Current auth state:", {
          isAuthenticated: currentState.isAuthenticated,
          hasSession: !!currentState.session,
          hasProfile: !!currentState.profile,
          profileName: currentState.profile?.name
        });
      },

      logout: () => {
        authService.logout();
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
        });
      },

      setProfile: (profile) => {
        set({ profile });
      },

      updateProfile: (updates) => {
        const { profile } = get();
        if (profile) {
          set({ profile: { ...profile, ...updates } });
        }
      },
    }),
    {
      name: "firecat-notes-auth",
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
      }),
    }
  )
);
