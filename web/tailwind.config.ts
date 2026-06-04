/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cocoa: {
          primary:   '#3D2B1F',
          accent:    '#C8956A',
          gold:      '#D4AF37',
          income:    '#2E9E6B',
          expense:   '#D94F3D',
          warning:   '#E88C2A',
          info:      '#4A7FD4',
          networth:  '#7C5CBF',
          // Surfaces
          bg:        '#F8F5F1',
          card:      '#FFFFFF',
          elevated:  '#FFFFFF',
          input:     '#F0EDE9',
          divider:   '#EAE6E1',
          // Text
          text1:     '#1A1008',
          text2:     '#7A6858',
          text3:     '#B0A090',
        },
        // Dark mode
        cocoaDark: {
          bg:       '#1A1410',
          card:     '#2A2018',
          elevated: '#342A1E',
          input:    '#201810',
          divider:  '#3A3028',
          text1:    '#F0EAE0',
          text2:    '#A8957A',
          text3:    '#6A5A48',
          accent:   '#E8B98A',
          income:   '#4DC88A',
          expense:  '#F07060',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
