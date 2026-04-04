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
          black: '#0f0f0f',
          charcoal: '#121212',
          gray: '#1a1a1a',
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
