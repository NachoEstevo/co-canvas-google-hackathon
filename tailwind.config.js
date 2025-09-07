/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom color system
      colors: {
        // Keep standard Tailwind colors
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        green: {
          500: '#10b981',
          600: '#059669',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#007AFF',
          600: '#0056CC',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#5856D6',
          600: '#4338ca',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F7',
          200: '#E5E5EA',
          300: '#D1D1D6',
          400: '#8E8E93',
          500: '#636366',
          600: '#48484A',
          700: '#3A3A3C',
          800: '#2C2C2E',
          900: '#1C1C1E',
        }
      },
      // Spacing system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '104': '26rem',
      },
      // Animation system
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Transform scale
      scale: {
        '102': '1.02',
      },
      // Box shadows
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'large': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'xl': '0 16px 48px 0 rgba(0, 0, 0, 0.15)',
      },
      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}