/** @type {import('tailwindcss').Config} */
// Design tokens from the clickable prototype CSS (file 14 §5a). Status colours are reserved for status and always
// paired with an icon and a text label (CLAUDE.md, file 07 §10).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#071322",
        side: "#0a1c30",
        card: { DEFAULT: "#10263c", 2: "#0c2033", 3: "#173c54" },
        edge: { DEFAULT: "#25445d", strong: "#365570" },
        fg: { DEFAULT: "#e8f3ff", 2: "#b5cbe0", 3: "#96aec7" },
        accent: { DEFAULT: "#4be0d6", 2: "#54d4e4" },
        action: { DEFAULT: "#2d8fbb", 2: "#1c3e57" },
        earth: "#4daee7",
        space: "#b69bff",
        ok: { bg: "#12483b", fg: "#81f1bf", line: "#2f8a6d" },
        warn: { bg: "#54401a", fg: "#ffd581", line: "#a57c2c" },
        bad: { bg: "#5a2334", fg: "#ffacb4", line: "#a8485e" },
        unk: { bg: "#2a3a4d", fg: "#d3e2f2", line: "#5a7590" },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", '"Segoe UI"', "sans-serif"],
      },
      keyframes: { enter: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { enter: "enter 220ms cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
