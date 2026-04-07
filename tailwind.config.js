/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        sidebar: "var(--bg-sidebar)",
        accent: "var(--accent)",
        "accent-violet": "var(--accent-violet)",
        "accent-green": "var(--accent-green)",
        "accent-amber": "var(--accent-amber)",
        "accent-red": "var(--accent-red)",
        "accent-blue": "var(--accent-blue)",
        primary: "var(--text-primary)",
        muted: "var(--text-muted)",
        border: "var(--border)",
        glass: "var(--glass)",
        "glass-border": "var(--glass-border)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
