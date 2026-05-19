import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        surface: {
          1: '#f4f6f9',
          2: '#e2e8f0',
          3: '#d6deea',
        },
        hairline: {
          DEFAULT: '#d6deea',
          strong: '#0f1b2d',
          tertiary: '#7a8598',
        },
        ink: {
          DEFAULT: '#0f1b2d',
          muted: '#4f5d73',
          subtle: '#7a8598',
          tertiary: '#98a3b6',
        },
        primary: {
          DEFAULT: '#0062ff',
          hover: '#0050e6',
          focus: '#0043ce',
          muted: '#5c89d8',
        },
        success: '#24a148',
        warning: '#f1c21b',
        danger: '#da1e28',
      },
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.075em',
        tighter: '-0.045em',
        tight: '-0.025em',
        snug: '-0.015em',
        eyebrow: '0.025em',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}

export default config
