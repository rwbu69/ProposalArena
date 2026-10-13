/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#FBFBF9',
          surface: '#F4F3EE',
          dark: '#141413',
          'surface-dark': '#1B1B19',
        },
        ink: {
          DEFAULT: '#181816',
          muted: '#5A5955',
          faint: '#8C8A82',
          dark: '#ECEBE6',
          'muted-dark': '#9E9C94',
          'faint-dark': '#6B6963',
        },
        hairline: {
          DEFAULT: '#E6E4DD',
          dark: '#282725',
        },
        accent: {
          DEFAULT: '#1C2B39',
          hover: '#131E28',
          dark: '#7D98B3',
          'dark-hover': '#98B1CC',
        },
        // Retain backward-compatible space tokens during transition
        space: {
          left: '#141413',
          right: '#1B1B19',
          viewer: '#10100F',
          border: '#282725',
          borderSoft: '#22211F',
          textMuted: '#6B6963',
          textSoft: '#9E9C94',
          textHighlight: '#ECEBE6',
          active: '#282725',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
