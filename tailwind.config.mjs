/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined neutral palette with warm undertones
        surface: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Dark blue accent (#1e3a8a base)
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        // Modern system font stack (no external requests, better performance)
        sans: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Andale Mono',
          'Ubuntu Mono',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.4s ease-out forwards',
        'progress': 'progress 1s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        progress: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.surface.700'),
            '--tw-prose-headings': theme('colors.surface.900'),
            '--tw-prose-links': theme('colors.accent.600'),
            '--tw-prose-bold': theme('colors.surface.900'),
            '--tw-prose-code': theme('colors.surface.800'),
            '--tw-prose-pre-bg': theme('colors.surface.900'),
            '--tw-prose-pre-code': theme('colors.surface.100'),
            '--tw-prose-invert-body': theme('colors.surface.300'),
            '--tw-prose-invert-headings': theme('colors.surface.50'),
            '--tw-prose-invert-links': theme('colors.accent.400'),
            '--tw-prose-invert-bold': theme('colors.surface.100'),
            '--tw-prose-invert-code': theme('colors.surface.200'),
            '--tw-prose-invert-pre-bg': theme('colors.surface.800'),
            '--tw-prose-invert-pre-code': theme('colors.surface.200'),
            'h1, h2, h3, h4': {
              fontFamily: theme('fontFamily.display').join(', '),
              fontWeight: '600',
              letterSpacing: '-0.02em',
            },
            a: {
              textDecoration: 'none',
              fontWeight: '500',
              borderBottom: `1px solid ${theme('colors.accent.300')}`,
              transition: 'border-color 0.2s ease, color 0.2s ease',
              '&:hover': {
                borderColor: theme('colors.accent.500'),
              },
            },
            code: {
              fontFamily: theme('fontFamily.mono').join(', '),
              fontWeight: '400',
              backgroundColor: theme('colors.surface.100'),
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              borderRadius: '0.5rem',
              padding: '1.25rem 1.5rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            blockquote: {
              borderLeftColor: theme('colors.accent.400'),
              fontStyle: 'normal',
              color: theme('colors.surface.600'),
            },
            // Blue border around images in articles
            img: {
              borderRadius: '0.5rem',
              border: `2px solid ${theme('colors.accent.300')}`,
            },
          },
        },
        invert: {
          css: {
            code: {
              backgroundColor: theme('colors.surface.800'),
            },
            // Brighter blue border in dark mode
            img: {
              borderColor: theme('colors.accent.500'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
};
