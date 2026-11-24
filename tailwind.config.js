/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        amanah: {
          green: "#0B3D2E",
          deep: "#10251D",
          gold: "#C9A227",
          ivory: "#F8F5ED",
          paper: "#FFFEFA",
          muted: "#66736D",
          line: "#DEDBD2"
        }
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["DM Sans", "sans-serif"]
      },
      maxWidth: {
        shell: "1280px"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(16, 37, 29, .09)"
      }
    }
  },
  plugins: []
};
