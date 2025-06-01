module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: '#D1D5DB',
        input: '#D1D5DB',
        ring: '#1A3A6D',
        background: '#FAFAFA',
        foreground: '#111827',
        primary: {
          DEFAULT: '#1A3A6D',
          light: '#2A4A7D',
          dark: '#0A2A5D',
          foreground: '#FAFAFA',
        },
        secondary: {
          DEFAULT: '#FF7A59',
          light: '#FF8A69',
          dark: '#EF6A49',
          foreground: '#111827',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#F4F7F6',
          foreground: '#4B5563',
        },
        accent: {
          DEFAULT: '#62C370',
          light: '#72D380',
          dark: '#52B360',
          foreground: '#111827',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F7F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#333333',
          900: '#111827',
        },
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
