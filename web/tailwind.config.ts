import type { Config } from "tailwindcss";

// Preflight is off: the prototype ships its own reset and relies on inline SVG defaults.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)", surface: "var(--surface)", ink: "var(--ink)",
        gold: "var(--gold)", rose: "var(--rose)", lav: "var(--lav)", sage: "var(--sage)",
      },
      fontFamily: { display: "var(--display)", body: "var(--body)", hand: "var(--hand)", mono: "var(--mono)" },
    },
  },
  plugins: [],
};
export default config;
