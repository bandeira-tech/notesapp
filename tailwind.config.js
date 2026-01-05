/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        theme: {
          "bg-primary": "var(--bg-primary)",
          "bg-secondary": "var(--bg-secondary)",
          "bg-tertiary": "var(--bg-tertiary)",
          "bg-accent": "var(--bg-accent)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
          "text-inverse": "var(--text-inverse)",
          "border-light": "var(--border-light)",
          "border-medium": "var(--border-medium)",
          "border-dark": "var(--border-dark)",
        },
        // Primary brand colors from theme
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },
        // Status colors from theme
        status: {
          success: "var(--success)",
          warning: "var(--warning)",
          error: "var(--error)",
          info: "var(--info)",
        },
        // Legacy peaceful colors (for backward compatibility)
        peaceful: {
          cream: '#faf8f3',
          sage: '#9caf88',
          lavender: '#c8b8db',
          peach: '#ffd4b8',
          sky: '#b8d8e8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
