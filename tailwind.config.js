/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        onyx: '#07080a',
        graphite: '#0e1015',
        platinum: '#f3f4f6',
        silver: '#9ca3af',
        icyCyan: '#a5f3fc',
        luxeCyan: '#38bdf8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
    },
  },
  plugins: [],
}

