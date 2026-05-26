import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fellten brand palette
        navy: {
          DEFAULT: '#0D1B2A',
          surface: '#152436',
          border: '#1E3045',
          subtle: '#243B55',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C375',
          muted: '#8B6B2A',
        },
        // Status colours
        status: {
          today: '#E07A5F',
          week: '#81B29A',
          blocked: '#9D8189',
          done: '#3D5A80',
          critical: '#C9A84C',
          proposed: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 200ms ease-out',
        'gold-flash': 'goldFlash 600ms ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        goldFlash: {
          '0%': { backgroundColor: '#C9A84C33' },
          '50%': { backgroundColor: '#C9A84C55' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}

export default config
