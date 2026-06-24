/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gameBg: '#0A0A0A',
        cyanGlow: '#00d2ff',
        blueGlow: '#0066ff',
        greenGlow: '#00ff88',
        warningGlow: '#ffb700',
        glassBg: 'rgba(15, 15, 20, 0.6)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassBorderHover: 'rgba(0, 210, 255, 0.3)'
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Outfit', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        cyan: '0 0 15px rgba(0, 210, 255, 0.35)',
        blue: '0 0 15px rgba(0, 102, 255, 0.35)',
        cyanHeavy: '0 0 25px rgba(0, 210, 255, 0.5)'
      }
    },
  },
  plugins: [],
}
