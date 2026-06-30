import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VS Code / Monarch Money dark palette
        bg: {
          DEFAULT: "#1e1e1e",
          secondary: "#252526",
          tertiary: "#2d2d30",
          hover: "#2a2d2e",
          active: "#094771",
        },
        border: {
          DEFAULT: "#3e3e42",
          focus: "#007fd4",
        },
        text: {
          DEFAULT: "#cccccc",
          muted: "#8a8a8a",
          bright: "#ffffff",
          accent: "#4fc1ff",
          link: "#569cd6",
        },
        accent: {
          blue: "#007acc",
          green: "#4ec9b0",
          yellow: "#dcdcaa",
          orange: "#ce9178",
          purple: "#c586c0",
          red: "#f44747",
        },
        status: {
          info: "#007acc",
          success: "#4ec9b0",
          warning: "#cca700",
          error: "#f44747",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
