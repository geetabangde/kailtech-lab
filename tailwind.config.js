/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '.dark'], // or 'class'
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      fontSize: {
        'tiny': ['0.625rem', { lineHeight: '0.8125rem' }],
        'tiny-plus': ['0.6875rem', { lineHeight: '0.875rem' }],
        'xs-plus': ['0.8125rem', { lineHeight: '1.125rem' }],
        'sm-plus': ['0.9375rem', { lineHeight: '1.375rem' }],
      },
      boxShadow: {
        'soft': 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
        'soft-dark': '0 3px 10px 0 rgb(25 25 25 / 30%)',
      },
      transitionTimingFunction: {
        'elastic': 'cubic-bezier(0.53, 0.21, 0.29, 0.67)',
      },
      borderWidth: {
        '3': '3px',
      },
      zIndex: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      colors: {
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          150: 'var(--color-gray-150)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
          950: 'var(--color-gray-950)',
        },
        dark: {
          50: 'var(--color-dark-50)',
          100: 'var(--color-dark-100)',
          200: 'var(--color-dark-200)',
          300: 'var(--color-dark-300)',
          400: 'var(--color-dark-400)',
          450: 'var(--color-dark-450)',
          500: 'var(--color-dark-500)',
          600: 'var(--color-dark-600)',
          700: 'var(--color-dark-700)',
          750: 'var(--color-dark-750)',
          800: 'var(--color-dark-800)',
          900: 'var(--color-dark-900)',
        },
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        secondary: {
          lighter: '#ff75df',
          light: '#ff2ecf',
          DEFAULT: '#e000ad',
          darker: '#b8008c',
        },
        info: {
          lighter: 'var(--color-sky-400)',
          light: 'var(--color-sky-500)',
          DEFAULT: 'var(--color-sky-600)',
          darker: 'var(--color-sky-700)',
        },
        success: {
          lighter: 'var(--color-emerald-400)',
          light: 'var(--color-emerald-500)',
          DEFAULT: 'var(--color-emerald-600)',
          darker: 'var(--color-emerald-700)',
        },
        warning: {
          lighter: '#ffba42',
          light: '#ffa71a',
          DEFAULT: '#f59200',
          darker: '#db7c00',
        },
        error: {
          lighter: '#ff8a5c',
          light: '#ff6933',
          DEFAULT: '#ff4f1a',
          darker: '#e52e00',
        },
        this: {
          lighter: 'var(--this-lighter)',
          light: 'var(--this-light)',
          DEFAULT: 'var(--this)',
          darker: 'var(--this-darker)',
        },
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        }
      }
    },
  },
  plugins: [
    function({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = '') {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];
          if (typeof value === 'string') {
            const key = colorKey === 'DEFAULT' ? '' : `-${colorKey}`;
            return { ...vars, [`--color${colorGroup}${key}`]: value };
          } else if (typeof value === 'object' && value !== null) {
            return { ...vars, ...extractColorVars(value, `${colorGroup}-${colorKey}`) };
          }
          return vars;
        }, {});
      }

      addBase({
        ':root': extractColorVars(theme('colors')),
      });
    }
  ],
}
