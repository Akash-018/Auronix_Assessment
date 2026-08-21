/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: "#13191D",
        bgAlt: "#1B2328",
        bgCard: "#232D33",
        borderDark: "#34414A",
        textPrimary: "#F7F5F2",
        textSecondary: "#C9C7C3",
        textMuted: "#8D9498",
        brandChampagne: "#D9C8A3",
        brandGold: "#B89C5E",
        brandLime: "#B8FF4F",
        colorSuccess: "#4ADE80",
        colorWarning: "#FFC857",
        colorError: "#FF5F5F",
      }
    },
  },
  plugins: [],
}
