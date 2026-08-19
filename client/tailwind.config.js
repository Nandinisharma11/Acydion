/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#07090e',
          850: '#0c1017',
          800: '#111827',
          750: '#182234',
          700: '#1f293d',
          600: '#374151'
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669'
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48'
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite'
      }
    },
  },
  plugins: [],
}
