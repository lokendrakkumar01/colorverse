/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark gaming palette
        dark: {
          900: '#050511',
          800: '#0d0d1a',
          700: '#121224',
          600: '#16213e',
          500: '#1a1a2e',
          400: '#252545',
          300: '#2d2d4e',
          200: '#3d3d6b',
        },
        // Brand purple
        brand: {
          DEFAULT: '#7c3aed',
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Accent
        accent: {
          DEFAULT: '#4f46e5',
          cyan: '#06b6d4',
          gold: '#f59e0b',
          emerald: '#10b981',
        },
        // Game colors
        game: {
          red:    '#ef4444',
          green:  '#22c55e',
          blue:   '#3b82f6',
          yellow: '#eab308',
          purple: '#a855f7',
          orange: '#f97316',
          pink:   '#ec4899',
          teal:   '#14b8a6',
          coral:  '#fb7185',
          lime:   '#84cc16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gaming-gradient': 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0d0d1a 0%, #050511 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.05) 100%)',
        'glow-purple': 'radial-gradient(circle at center, rgba(124,58,237,0.3) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'countdown': 'countdown linear 1s',
        'win-flash': 'winFlash 0.5s ease-in-out 3',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 5px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.3)' },
          to: { boxShadow: '0 0 20px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: 0, transform: 'translateY(-20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        winFlash: {
          '0%, 100%': { backgroundColor: 'rgba(34,197,94,0.1)' },
          '50%': { backgroundColor: 'rgba(34,197,94,0.4)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(124,58,237,0.3)',
        'glow': '0 0 20px rgba(124,58,237,0.4)',
        'glow-lg': '0 0 40px rgba(124,58,237,0.5)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.4)',
        'glow-green': '0 0 20px rgba(34,197,94,0.4)',
        'glow-red': '0 0 20px rgba(239,68,68,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'inner-glow': 'inset 0 0 20px rgba(124,58,237,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
