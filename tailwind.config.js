/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        love: {
          50: '#fff1f3',
          100: '#ffe1e7',
          200: '#ffc7d2',
          300: '#ff9cb1',
          400: '#ff6188',
          500: '#fb3565',
          600: '#e91550',
          700: '#c40b43',
          800: '#a30d3f',
          900: '#8a1039',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        serif: ['DMSerifDisplay_400Regular'],
      },
    },
  },
  plugins: [],
};
