/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A0F2C',
          light: '#111936',
          border: '#1E2A4A',
          muted: '#1A2340',
        },
        orange: {
          DEFAULT: '#FF6B2B',
          dark: '#E05520',
          light: '#FF8C5A',
          glow: 'rgba(255,107,43,0.15)',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'dot-pattern': 'radial-gradient(circle, #1E2A4A 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-lg': '28px 28px',
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        pulse2: 'pulse2 2s ease-in-out infinite',
        fadeIn: 'fadeIn 0.4s ease forwards',
        slideUp: 'slideUp 0.5s ease forwards',
        scaleIn: 'scaleIn 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}
