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
          navy: '#0f2942',
          navyDark: '#0a1d30',
          navyLight: '#1e3e5c',
          orange: '#f97316',
          orangeDark: '#ea580c',
          gold: '#f59e0b',
          grayBg: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
