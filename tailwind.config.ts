import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0d9488', dark: '#0f766e', light: '#5eead4' },
      },
    },
  },
  plugins: [],
};
export default config;
