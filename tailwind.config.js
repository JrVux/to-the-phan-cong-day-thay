/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        surface: '#f8fafc',
        ink: '#0f172a',
      },
      boxShadow: {
        card: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
