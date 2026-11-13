/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9ec',
          300: '#94bfe0',
          400: '#5e9ed0',
          500: '#3880bd',
          600: '#27669f',
          700: '#205281',
          800: '#1d466d',
          900: '#1b3b5b',
          950: '#11253c',
        },
        khaki: {
          50: '#faf8f5',
          100: '#f3efe8',
          200: '#e5dcce',
          300: '#d2c2ad',
          400: '#bca48b',
          500: '#aa8b6e',
          600: '#9c7a5f',
          700: '#82634f',
          800: '#6b5243',
          900: '#584439',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

