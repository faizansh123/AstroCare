/** @type {import('tailwindcss').Config} */
// Design tokens: macOS-style dark appearance (file 14 §5a, v3 visual refresh). Neutral graphite surfaces, one blue
// accent, Apple system colours for status. Status colours are reserved for status and always paired with an icon and
// a text label (CLAUDE.md, file 07 §10). Contrast checked: white on action 4.7:1, fg-3 on card-2 4.9:1.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#000000",
        side: "#161618",
        card: { DEFAULT: "#1c1c1e", 2: "#2c2c2e", 3: "#3a3a3c" },
        edge: { DEFAULT: "#2a2a2d", strong: "#3a3a3c" },
        fg: { DEFAULT: "#f5f5f7", 2: "#d1d1d6", 3: "#98989f" },
        accent: { DEFAULT: "#409cff", 2: "#409cff" },
        action: { DEFAULT: "#0071e3", hover: "#0062c4", 2: "#3a3a3c" },
        earth: "#aeaeb2",
        space: "#409cff",
        ok: { bg: "#132a1b", fg: "#30d158", line: "#1f5c30" },
        warn: { bg: "#2e2810", fg: "#ffd60a", line: "#6b5a12" },
        bad: { bg: "#331817", fg: "#ff6961", line: "#7a2c28" },
        unk: { bg: "#2a2a2e", fg: "#d1d1d6", line: "#48484a" },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"Inter Variable"', "Inter", "system-ui", '"Segoe UI"', "sans-serif"],
      },
      keyframes: { enter: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { enter: "enter 260ms cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
