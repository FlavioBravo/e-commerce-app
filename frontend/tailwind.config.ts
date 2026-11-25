import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#222222",
        muted: "#6a6a6a",
        line: "#dddddd",
        fog: "#f7f7f7",
        rausch: "#ff385c",
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.12)",
        search: "0 3px 12px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
