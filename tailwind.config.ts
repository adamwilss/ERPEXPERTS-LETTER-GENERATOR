import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Premium warm palette
        cream: {
          50: '#FDFCF7',
          100: '#FAFAF8',
          200: '#F2F2F0',
          300: '#E8E8E4',
          400: '#D8D8D4',
          500: '#C8C8C4',
          600: '#A8A8A6',
          700: '#8A8A88',
          800: '#6A6A68',
          900: '#4A4A48',
          950: '#1A1A1A',
        },
        // Rich dark palette
        void: {
          50: '#25272D',
          100: '#1E2026',
          200: '#1C1E24',
          300: '#181A20',
          400: '#16181D',
          500: '#14161B',
          600: '#111317',
          700: '#0F1117',
          800: '#0D0F13',
          900: '#0A0C10',
          950: '#080A0E',
        },
      },
    },
  },
  plugins: [],
}

export default config
