import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            screens: {
                xs: '475px'
                // sm: '640px' (default)
                // md: '768px' (default)
                // lg: '1024px' (default)
                // xl: '1280px' (default)
                // 2xl: '1536px' (default)
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)'
            }
        }
    },
    plugins: [require('@tailwindcss/line-clamp')]
};

export default config;
