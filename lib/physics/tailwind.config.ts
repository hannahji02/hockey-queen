import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
        },
        rink: {
          bg: "#0a0e1a",
          surface: "#111827",
          border: "#1f2937",
          line: "#374151",
        },
        neon: {
          cyan: "#22d3ee",
          magenta: "#e879f9",
          yellow: "#fde047",
          red: "#f87171",
          green: "#4ade80",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
