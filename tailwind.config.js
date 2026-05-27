/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          primary: '#1A1A1A',
          secondary: '#333333',
          accent: '#F5C500',
          'accent-hover': '#D4A900',
          light: '#F5F5F5',
          dark: '#0A0A0A',
        }
      }
    },
  },
  plugins: [],
}
