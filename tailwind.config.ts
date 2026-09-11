import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f2f6ff",
          100: "#e6ecff",
          200: "#c3d1f7",
          300: "#93a9ea",
          400: "#5f76d6",
          500: "#3c52bd",
          600: "#293a99",
          700: "#1d2a72",
          800: "#141d4f",
          900: "#0b1233",
          950: "#060a1e",
        },
        volt: {
          50: "#eefcfd",
          100: "#d3f6fb",
          200: "#a9ecf6",
          300: "#6cdbef",
          400: "#2ab9e2",
          500: "#089cc9",
          600: "#067da9",
          700: "#0a6489",
          800: "#115370",
          900: "#14465e",
        },
        flame: "#ff6a3d",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,51,.06), 0 12px 32px -12px rgba(11,18,51,.18)",
        glow: "0 0 0 1px rgba(42,185,226,.35), 0 20px 60px -20px rgba(42,185,226,.45)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeUp: "fadeUp .5s ease-out both",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(60,82,189,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(60,82,189,.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
