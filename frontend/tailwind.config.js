/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "spin-counter-clockwise": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "spin-counter-clockwise": "spin-counter-clockwise 1s linear infinite",
      },
      minHeight: {
        "1/2-screen": "50vh",
      },
      maxHeight: {
        "9/10-screen": "90vh",
      },
    },
  },
  plugins: [require("daisyui")],
};
