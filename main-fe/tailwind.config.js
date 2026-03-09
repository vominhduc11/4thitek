/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        fontSize: {
            xs: ['0.75rem', { lineHeight: '1rem' }],
            sm: ['0.875rem', { lineHeight: '1.25rem' }],
            base: ['1rem', { lineHeight: '1.6' }],
            lg: ['1.125rem', { lineHeight: '1.75rem' }],
            xl: ['1.25rem', { lineHeight: '1.75rem' }],
            '2xl': ['1.5rem', { lineHeight: '2rem' }],
            '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
            '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
            '5xl': ['3rem', { lineHeight: '1.1' }],
            '6xl': ['3.75rem', { lineHeight: '1.08' }],
            '7xl': ['4.5rem', { lineHeight: '1.05' }],
            '8xl': ['5.5rem', { lineHeight: '1' }],
            '9xl': ['6.5rem', { lineHeight: '1' }]
        },
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
                mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono]
            },
            screens: {
                xs: '480px', // Extra small screen breakpoint
                sm: '640px',
                md: '700px', // Điều chỉnh từ 768px xuống 700px
                lg: '844px',
                desktop: '1024px', // Standard desktop breakpoint
                xl: '1280px',
                '2xl': '1536px',
                '3xl': '1920px',
                '4xl': '2560px',
                '5xl': '3200px'
            },
            colors: {
                primary: {
                    DEFAULT: '#4FC8FF',
                    50: '#F0FBFF',
                    100: '#E1F7FF',
                    200: '#C3EFFF',
                    300: '#A5E7FF',
                    400: '#87DFFF',
                    500: '#4FC8FF',
                    600: '#17B1FF',
                    700: '#0090D9',
                    800: '#006EA6',
                    900: '#004C73'
                },
                dark: {
                    DEFAULT: '#0a0f1a',
                    50: '#1a2332',
                    100: '#243447',
                    200: '#2d3a4d',
                    300: '#364153',
                    400: '#3f4859',
                    500: '#0a0f1a',
                    600: '#080c15',
                    700: '#060910',
                    800: '#04060a',
                    900: '#020305'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }
        }
    },
    plugins: []
};
