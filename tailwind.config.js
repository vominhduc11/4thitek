/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
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
