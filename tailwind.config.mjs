/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
        serif: ['"Lora"', 'serif'],
      },
      colors: {
        space: {
          left: "#121212",
          right: "#161616",
          viewer: "#0a0a0a",
          border: "#242424",
          borderSoft: "#1e1e1e",
          textMuted: "#666666",
          textSoft: "#999999",
          textHighlight: "#e6e6e6",
          active: "#242424",
        },
        paper: {
          bg: "#121212",
          textMain: "#EDEDED",
          textDim: "#737373",
          accent: "#2A2A2A",
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
