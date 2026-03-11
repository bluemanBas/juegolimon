import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lemon: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        campo: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
        },
        earth: {
          50: "#faf5f0",
          100: "#f0e6d8",
          200: "#e8d5c4",
          300: "#d4b896",
          400: "#b89a6e",
          500: "#92734e",
          600: "#7a5e3e",
          700: "#5c4033",
          800: "#3d2b22",
        },
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#4ade80",
          700: "#166534",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
