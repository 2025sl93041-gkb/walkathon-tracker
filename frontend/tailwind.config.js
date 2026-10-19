/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e40af', light: '#3b82f6' },
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
        bounce2: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        shake: 'shake 0.4s ease-in-out',
        bounce2: 'bounce2 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
