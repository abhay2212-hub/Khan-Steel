/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./about.html",
    "./services.html",
    "./projects.html",
    "./contact.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          black: 'rgba(15, 15, 15, 0.4)',
          charcoal: 'rgba(18, 18, 18, 0.4)',
          gray: 'rgba(26, 26, 26, 0.5)',
          steel: '#8e8e8e',
          orange: '#ffffff',
          yellow: '#ffffff',
        }
      },
      fontFamily: {
        'industrial': ['Inter', 'sans-serif'],
        'display': ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
