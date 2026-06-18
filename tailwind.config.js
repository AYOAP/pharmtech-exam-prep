/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./content/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 45px -24px rgba(15, 23, 42, 0.45)",
        card: "0 18px 60px -26px rgba(125, 29, 72, 0.24)",
        glow: "0 22px 70px -24px rgba(236, 72, 153, 0.35)",
      },
      colors: {
        ink: {
          950: "#111827",
        },
        shell: "#fff7fb",
        rosebrand: {
          50: "#fff2f8",
          100: "#ffe4f1",
          200: "#ffc8e3",
          300: "#ffa2cf",
          400: "#ff6bb4",
          500: "#f63393",
          600: "#df177d",
          700: "#b80f64",
          800: "#971055",
          900: "#7e134b",
          950: "#520327",
        },
        plum: {
          950: "#2b0b22",
        },
        peach: {
          100: "#fff1e7",
          300: "#ffccad",
          500: "#ff8e53",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-body, 'Instrument Sans')",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-display, 'Space Grotesk')",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        rise: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        bob: "bob 4.8s ease-in-out infinite",
        rise: "rise 320ms ease-out both",
      },
    },
  },
  plugins: [],
};
