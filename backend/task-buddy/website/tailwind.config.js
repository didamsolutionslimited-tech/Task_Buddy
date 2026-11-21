/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'buddy-blue': '#3B82F6',
        'buddy-orange': '#F97316',
        'buddy-dark': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
