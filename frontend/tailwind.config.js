/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          fadeIn: 'fadeIn 0.3s ease-out forwards',
          fadeUp: 'fadeUp 0.5s ease-out forwards',
        },
        keyframes: {
          fadeIn: {
            from: { opacity: '0', transform: 'translateY(-8px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
          },
          fadeUp: {
            from: { opacity: '0', transform: 'translateY(20px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
          },
        }
      }
    },
    plugins: [],
}