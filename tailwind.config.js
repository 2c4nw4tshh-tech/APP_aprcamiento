/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "car-orbit": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "car-orbit": "car-orbit 1.4s linear infinite",
      },
      colors: {
        accent:   "var(--accent)",
        surface:  "var(--surface)",
        surface2: "var(--surface2)",
        bg:       "var(--bg)",
        border:   "var(--border)",
      },
    },
  },
  plugins: [],
};
