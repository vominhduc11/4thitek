import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'taidat.vn',
                port: '',
                pathname: '/wp-content/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'thinkzone.vn',
                port: '',
                pathname: '/uploads/**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [375, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    async redirects() {
        return [
            {
                source: '/warranty_check',
                destination: '/warranty-check',
                permanent: true
            }
        ];
    }
};

export default nextConfig;
