import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, getSystemPreference, type ThemeName, type ThemeVariant } from "../config/themes";

interface AppState {
  themeName: ThemeName;
  themeVariant: ThemeVariant;
  useSystemTheme: boolean;
  currentNotebookId: string | null;
  sidebarOpen: boolean;
  passwordCache: Map<string, string>;
}

interface AppActions {
  setThemeName: (name: ThemeName) => void;
  setThemeVariant: (variant: ThemeVariant) => void;
  toggleThemeVariant: () => void;
  setUseSystemTheme: (use: boolean) => void;
  setCurrentNotebook: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  cachePassword: (notebookId: string, password: string) => void;
  getCachedPassword: (notebookId: string) => string | undefined;
  clearPasswordCache: () => void;
  initializeTheme: () => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      themeName: "peaceful",
      themeVariant: "light",
      useSystemTheme: false,
      currentNotebookId: null,
      sidebarOpen: true,
      passwordCache: new Map(),

      setThemeName: (name) => {
        set({ themeName: name });
        applyTheme(name, get().themeVariant);
      },

      setThemeVariant: (variant) => {
        set({ themeVariant: variant, useSystemTheme: false });
        applyTheme(get().themeName, variant);
      },

      toggleThemeVariant: () => {
        const newVariant = get().themeVariant === "light" ? "dark" : "light";
        set({ themeVariant: newVariant, useSystemTheme: false });
        applyTheme(get().themeName, newVariant);
      },

      setUseSystemTheme: (use) => {
        set({ useSystemTheme: use });
        if (use) {
          const systemVariant = getSystemPreference();
          set({ themeVariant: systemVariant });
          applyTheme(get().themeName, systemVariant);
        }
      },

      setCurrentNotebook: (id) => set({ currentNotebookId: id }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      cachePassword: (notebookId, password) => {
        const cache = get().passwordCache;
        cache.set(notebookId, password);
        set({ passwordCache: new Map(cache) });
      },

      getCachedPassword: (notebookId) => {
        return get().passwordCache.get(notebookId);
      },

      clearPasswordCache: () => set({ passwordCache: new Map() }),

      initializeTheme: () => {
        const { themeName, themeVariant, useSystemTheme } = get();
        const variant = useSystemTheme ? getSystemPreference() : themeVariant;
        applyTheme(themeName, variant);

        // Listen for system theme changes
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          mediaQuery.addEventListener("change", (e) => {
            if (get().useSystemTheme) {
              const newVariant = e.matches ? "dark" : "light";
              set({ themeVariant: newVariant });
              applyTheme(get().themeName, newVariant);
            }
          });
        }
      },
    }),
    {
      name: "firecat-notes-app",
      partialize: (state) => ({
        themeName: state.themeName,
        themeVariant: state.themeVariant,
        useSystemTheme: state.useSystemTheme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
