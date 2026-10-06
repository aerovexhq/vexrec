/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: "#0c0d10",
          light: "#f8f9fa",
        },
        surface: {
          base: "#14161b",
          panel: "#1b1d24",
          hover: "#232630",
          active: "#2b2f3c",
          border: "rgba(255, 255, 255, 0.08)",
          "border-focus": "rgba(255, 255, 255, 0.16)",
        },
        accent: {
          record: "#e05638",
          "record-hover": "#c9462b",
          focus: "#3b82f6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        pill: "0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        modal: "0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
