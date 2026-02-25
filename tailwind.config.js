/** @type {import('tailwindcss').Config} */
export default {
  // 1. AGREGAR ESTA LÍNEA: Permite activar el modo oscuro manualmente con una clase
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#13ECEC',
          dark: '#0EBABA',
        },
        cezeus: {
          dark: '#050A15',   
          card: '#111827',   
          accent: '#1E293B', 
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}