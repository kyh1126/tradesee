import { type Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue-900': '#1e3a8a',
        'blue-800': '#1e40af',
        'blue-700': '#1d4ed8',
        'blue-600': '#2563eb',
        'blue-500': '#3b82f6',
        'blue-400': '#60a5fa',
        'blue-300': '#93c5fd',
        'blue-200': '#bfdbfe',
        'blue-100': '#dbeafe',
        'blue-50': '#eff6ff',
      },
      backdropBlur: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
} satisfies Config;
