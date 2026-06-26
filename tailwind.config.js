/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        confetti1: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-60px, -34px) scale(0)', opacity: '0' },
        },
        confetti2: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(55px, -40px) scale(0)', opacity: '0' },
        },
        confetti3: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-40px, 36px) scale(0)', opacity: '0' },
        },
        confetti4: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(48px, 38px) scale(0)', opacity: '0' },
        },
        confetti5: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(4px, -52px) scale(0)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
