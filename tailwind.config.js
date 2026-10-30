/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          bg: "#0a0a0c",
          panel: "#141418",
          ink: "#ffffff",
          accent: "#ff2a2a",
        },
      },
    },
  },
  plugins: [],
}

