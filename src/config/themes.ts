/**
 * Theme Configuration
 *
 * Each theme has light and dark variants.
 * CSS variables are applied to :root based on selection.
 */

export type ThemeVariant = "light" | "dark";
export type ThemeName = "default" | "peaceful" | "ocean" | "forest";
export type FullTheme = `${ThemeName}-${ThemeVariant}`;

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgAccent: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Border colors
  borderLight: string;
  borderMedium: string;
  borderDark: string;

  // Primary brand colors
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

export const themes: Record<FullTheme, ThemeColors> = {
  // Default theme - Clean modern look
  "default-light": {
    bgPrimary: "#ffffff",
    bgSecondary: "#f9fafb",
    bgTertiary: "#f3f4f6",
    bgAccent: "#e5e7eb",
    textPrimary: "#111827",
    textSecondary: "#374151",
    textMuted: "#9ca3af",
    textInverse: "#ffffff",
    borderLight: "#f3f4f6",
    borderMedium: "#e5e7eb",
    borderDark: "#d1d5db",
    primary50: "#eff6ff",
    primary100: "#dbeafe",
    primary200: "#bfdbfe",
    primary300: "#93c5fd",
    primary400: "#60a5fa",
    primary500: "#3b82f6",
    primary600: "#2563eb",
    primary700: "#1d4ed8",
    primary800: "#1e40af",
    primary900: "#1e3a8a",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    scrollbarTrack: "#f1f1f1",
    scrollbarThumb: "#cbd5e0",
    scrollbarThumbHover: "#a0aec0",
  },
  "default-dark": {
    bgPrimary: "#0f172a",
    bgSecondary: "#1e293b",
    bgTertiary: "#334155",
    bgAccent: "#475569",
    textPrimary: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    textInverse: "#0f172a",
    borderLight: "#1e293b",
    borderMedium: "#334155",
    borderDark: "#475569",
    primary50: "#eff6ff",
    primary100: "#dbeafe",
    primary200: "#bfdbfe",
    primary300: "#93c5fd",
    primary400: "#60a5fa",
    primary500: "#3b82f6",
    primary600: "#2563eb",
    primary700: "#1d4ed8",
    primary800: "#1e40af",
    primary900: "#1e3a8a",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
    scrollbarTrack: "#1e293b",
    scrollbarThumb: "#475569",
    scrollbarThumbHover: "#64748b",
  },

  // Peaceful theme - Warm, cozy aesthetics
  "peaceful-light": {
    bgPrimary: "#faf8f3",
    bgSecondary: "#ffffff",
    bgTertiary: "#f5f3ee",
    bgAccent: "#e8e5dc",
    textPrimary: "#2d3436",
    textSecondary: "#4a5568",
    textMuted: "#a0aec0",
    textInverse: "#ffffff",
    borderLight: "#f0ede6",
    borderMedium: "#e2dfd6",
    borderDark: "#d4d0c5",
    primary50: "#f0f9ff",
    primary100: "#e0f2fe",
    primary200: "#bae6fd",
    primary300: "#7dd3fc",
    primary400: "#38bdf8",
    primary500: "#0ea5e9",
    primary600: "#0284c7",
    primary700: "#0369a1",
    primary800: "#075985",
    primary900: "#0c4a6e",
    success: "#9caf88",
    warning: "#ffd4b8",
    error: "#e57373",
    info: "#b8d8e8",
    scrollbarTrack: "#f5f3ee",
    scrollbarThumb: "#d4d0c5",
    scrollbarThumbHover: "#b8b4a9",
  },
  "peaceful-dark": {
    bgPrimary: "#1a1a1d",
    bgSecondary: "#252528",
    bgTertiary: "#2f2f33",
    bgAccent: "#3a3a3f",
    textPrimary: "#f5f3ee",
    textSecondary: "#d4d0c5",
    textMuted: "#8a8780",
    textInverse: "#1a1a1d",
    borderLight: "#2f2f33",
    borderMedium: "#3a3a3f",
    borderDark: "#4a4a50",
    primary50: "#f0f9ff",
    primary100: "#e0f2fe",
    primary200: "#bae6fd",
    primary300: "#7dd3fc",
    primary400: "#38bdf8",
    primary500: "#0ea5e9",
    primary600: "#0284c7",
    primary700: "#0369a1",
    primary800: "#075985",
    primary900: "#0c4a6e",
    success: "#9caf88",
    warning: "#ffd4b8",
    error: "#e57373",
    info: "#b8d8e8",
    scrollbarTrack: "#252528",
    scrollbarThumb: "#4a4a50",
    scrollbarThumbHover: "#5a5a60",
  },

  // Ocean theme - Blue and teal tones
  "ocean-light": {
    bgPrimary: "#f0f9ff",
    bgSecondary: "#ffffff",
    bgTertiary: "#e0f2fe",
    bgAccent: "#bae6fd",
    textPrimary: "#0c4a6e",
    textSecondary: "#075985",
    textMuted: "#7dd3fc",
    textInverse: "#ffffff",
    borderLight: "#e0f2fe",
    borderMedium: "#bae6fd",
    borderDark: "#7dd3fc",
    primary50: "#ecfeff",
    primary100: "#cffafe",
    primary200: "#a5f3fc",
    primary300: "#67e8f9",
    primary400: "#22d3ee",
    primary500: "#06b6d4",
    primary600: "#0891b2",
    primary700: "#0e7490",
    primary800: "#155e75",
    primary900: "#164e63",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
    scrollbarTrack: "#e0f2fe",
    scrollbarThumb: "#7dd3fc",
    scrollbarThumbHover: "#38bdf8",
  },
  "ocean-dark": {
    bgPrimary: "#0c1929",
    bgSecondary: "#132337",
    bgTertiary: "#1a3045",
    bgAccent: "#234058",
    textPrimary: "#e0f2fe",
    textSecondary: "#bae6fd",
    textMuted: "#7dd3fc",
    textInverse: "#0c1929",
    borderLight: "#1a3045",
    borderMedium: "#234058",
    borderDark: "#2d506b",
    primary50: "#ecfeff",
    primary100: "#cffafe",
    primary200: "#a5f3fc",
    primary300: "#67e8f9",
    primary400: "#22d3ee",
    primary500: "#06b6d4",
    primary600: "#0891b2",
    primary700: "#0e7490",
    primary800: "#155e75",
    primary900: "#164e63",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#22d3ee",
    scrollbarTrack: "#132337",
    scrollbarThumb: "#234058",
    scrollbarThumbHover: "#2d506b",
  },

  // Forest theme - Green and earth tones
  "forest-light": {
    bgPrimary: "#f0fdf4",
    bgSecondary: "#ffffff",
    bgTertiary: "#dcfce7",
    bgAccent: "#bbf7d0",
    textPrimary: "#14532d",
    textSecondary: "#166534",
    textMuted: "#86efac",
    textInverse: "#ffffff",
    borderLight: "#dcfce7",
    borderMedium: "#bbf7d0",
    borderDark: "#86efac",
    primary50: "#f0fdf4",
    primary100: "#dcfce7",
    primary200: "#bbf7d0",
    primary300: "#86efac",
    primary400: "#4ade80",
    primary500: "#22c55e",
    primary600: "#16a34a",
    primary700: "#15803d",
    primary800: "#166534",
    primary900: "#14532d",
    success: "#22c55e",
    warning: "#eab308",
    error: "#dc2626",
    info: "#0ea5e9",
    scrollbarTrack: "#dcfce7",
    scrollbarThumb: "#86efac",
    scrollbarThumbHover: "#4ade80",
  },
  "forest-dark": {
    bgPrimary: "#0a1f0f",
    bgSecondary: "#0f2918",
    bgTertiary: "#143320",
    bgAccent: "#1a4028",
    textPrimary: "#dcfce7",
    textSecondary: "#bbf7d0",
    textMuted: "#86efac",
    textInverse: "#0a1f0f",
    borderLight: "#143320",
    borderMedium: "#1a4028",
    borderDark: "#225030",
    primary50: "#f0fdf4",
    primary100: "#dcfce7",
    primary200: "#bbf7d0",
    primary300: "#86efac",
    primary400: "#4ade80",
    primary500: "#22c55e",
    primary600: "#16a34a",
    primary700: "#15803d",
    primary800: "#166534",
    primary900: "#14532d",
    success: "#4ade80",
    warning: "#facc15",
    error: "#f87171",
    info: "#38bdf8",
    scrollbarTrack: "#0f2918",
    scrollbarThumb: "#1a4028",
    scrollbarThumbHover: "#225030",
  },
};

/**
 * Generate CSS variables string from theme colors
 */
export function generateCSSVariables(theme: ThemeColors): string {
  return Object.entries(theme)
    .map(([key, value]) => `--${kebabCase(key)}: ${value};`)
    .join("\n  ");
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Apply theme to document
 */
export function applyTheme(themeName: ThemeName, variant: ThemeVariant): void {
  const fullTheme: FullTheme = `${themeName}-${variant}`;
  const colors = themes[fullTheme];

  if (!colors) {
    console.error(`Theme not found: ${fullTheme}`);
    return;
  }

  const root = document.documentElement;

  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${kebabCase(key)}`, value);
  });

  // Set data attributes for CSS selectors
  root.setAttribute("data-theme", themeName);
  root.setAttribute("data-variant", variant);

  // Toggle dark class for Tailwind dark mode
  if (variant === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Get system preference for dark mode
 */
export function getSystemPreference(): ThemeVariant {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
