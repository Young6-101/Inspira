/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accentCoral: '#FF6B5B',
        accentElectric: '#00D4AA',
        accentGold: '#FFB800',
        accentViolet: '#7B61FF',
        bgCream: '#f4f4f0',
        textBlack: '#111111'
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sansAlt: ['Space Grotesk', 'sans-serif']
      },
      keyframes: {
        slideUpFade: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        slideUpFade: 'slideUpFade 1s cubic-bezier(0.16,1,0.3,1) forwards'
      }
    }
  },
  plugins: []
};
