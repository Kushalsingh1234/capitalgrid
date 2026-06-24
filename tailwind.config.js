/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gameBg: '#0B0F19',
        cyanGlow: '#0066ff',
        blueGlow: '#1D4ED8',
        greenGlow: '#38A169',
        warningGlow: '#DD6B20',
        glassBg: 'rgba(12, 16, 28, 0.65)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassBorderHover: 'rgba(0, 102, 255, 0.35)'
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Outfit', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        cyan: '0 0 15px rgba(0, 102, 255, 0.3)',
        blue: '0 0 15px rgba(29, 78, 216, 0.35)',
        cyanHeavy: '0 0 25px rgba(0, 102, 255, 0.45)'
      }
    },
  },
  plugins: [],
}

