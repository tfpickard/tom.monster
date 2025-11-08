import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f92ff",
          foreground: "#f5fbff",
        },
        accent: {
          DEFAULT: "#f97316",
          foreground: "#0f1115",
        },
      },
    },
  },
  plugins: [],
};

export default config;
