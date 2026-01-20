import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FC4A1A',
        'primary-dark': '#E33E14',
        secondary: '#4ABDAC',
        'secondary-dark': '#2A9D8F',
        navy: '#0D1B2A',
        accent: '#A7C957',
        'bg-cool': '#F0F4F8'
      },
    },
  },
  plugins: [],
};
export default config;