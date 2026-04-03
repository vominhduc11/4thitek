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
                serif: ['var(--font-serif)', ...defaultTheme.fontFamily.sans],
                mono: ['var(--font-sans)', ...defaultTheme.fontFamily.sans]
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
                    DEFAULT: '#29ABE2',
                    50: '#F1FBFE',
                    100: '#DFF5FC',
                    200: '#B7EAF8',
                    300: '#84D9F2',
                    400: '#4EC2EA',
                    500: '#29ABE2',
                    600: '#118BC5',
                    700: '#0071BC',
                    800: '#0B527C',
                    900: '#083857'
                },
                dark: {
                    DEFAULT: '#06111B',
                    50: '#132131',
                    100: '#1A2A3C',
                    200: '#243548',
                    300: '#314152',
                    400: '#3F4856',
                    500: '#06111B',
                    600: '#050D14',
                    700: '#03090E',
                    800: '#020509',
                    900: '#010305'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }
        }
    },
    plugins: []
};
