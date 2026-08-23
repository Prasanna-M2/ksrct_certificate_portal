/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ksrct: {
          midnight: '#050e1d',
          navyDark: '#071830',
          navy: '#0a4c95',
          royal: '#00529b',
          navyLight: '#1163be',
          navyHover: '#1774de',
          orange: '#f37021',
          orangeDark: '#d8580d',
          orangeLight: '#ff863b',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          goldDark: '#d97706',
          emerald: '#10b981',
          cyan: '#0284c7',
          surface: '#ffffff',
          surfaceMuted: '#f8fafc',
          borderLight: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(10, 76, 149, 0.12)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-orange': '0 0 25px -3px rgba(243, 112, 33, 0.45)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.35)',
        'glow-blue': '0 0 25px -3px rgba(10, 76, 149, 0.45)',
        'glow-navy': '0 10px 30px -5px rgba(5, 14, 29, 0.6)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glass-glow': 'glassGlow 4s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glassGlow: {
          '0%': { borderColor: 'rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' },
          '100%': { borderColor: 'rgba(243, 112, 33, 0.35)', boxShadow: '0 8px 32px 0 rgba(243, 112, 33, 0.15)' },
        },
      },
    },
  },
  plugins: [],
}
