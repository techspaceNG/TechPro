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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          blue: "#0066FF",
          "blue-light": "#E6F0FF",
          "blue-dark": "#0052CC",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 15px rgba(0, 102, 255, 0.15)",
        "glow-strong": "0 0 25px rgba(0, 102, 255, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
