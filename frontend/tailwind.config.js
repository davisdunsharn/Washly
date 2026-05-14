/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        teal: {
          DEFAULT: '#0ABAB5',
          light: '#E0FAF9',
          mid: '#5CD8D4',
        },
        navy: '#0D1B2A',
        slate: '#1E3448',
        mist: '#F0F7F7',
        border: '#E2EEED',
        muted: '#7A96A0',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
