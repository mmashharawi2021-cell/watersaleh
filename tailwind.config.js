/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f8',
          500: '#0e8ce9',
          600: '#026ec7',
          700: '#0358a1',
          800: '#074b85',
          900: '#0c3f6e',
          950: '#082849',
        },
        accent: {
          emerald: '#10b981',
          aqua: '#06b6d4',
          violet: '#8b5cf6',
          rose: '#f43f5e',
        },
        dark: {
          bg: '#020617',
          card: '#0f172a',
          border: '#1e293b',
          text: '#f8fafc',
          textMuted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['"Readex Pro"', '"Tajawal"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
