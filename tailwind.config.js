/** @type {import('tailwindcss').Config} */
// Neutral graphite UI with one accent. Status colours (emerald / amber / red / zinc) are reserved for status and
// always paired with an icon and a text label (FR-07, NFR-06).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0c",
        surface: { DEFAULT: "#121214", 2: "#18181b", 3: "#202024" },
        edge: { DEFAULT: "#232327", strong: "#303036" },
        fg: { DEFAULT: "#ededef", 2: "#a1a1aa", 3: "#71717a" },
        accent: { DEFAULT: "#7aa7ff", soft: "#7aa7ff1f" },
      },
      fontFamily: {
        sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: { "2xs": ["0.75rem", { lineHeight: "1rem" }] },
      keyframes: { enter: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { enter: "enter 260ms cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
