/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- MANA SHU QATOR ISHLATIB BERADI
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#0f172a",
      },
    },
  },
  plugins: [],
}