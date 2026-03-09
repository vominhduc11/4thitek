import type { NextConfig } from 'next';

const internalApiBaseUrl = (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.4thitek.vn/api'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
    /* config options here */
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'taidat.vn',
                port: '',
                pathname: '/wp-content/uploads/**'
            },
            {
                protocol: 'https',
                hostname: 'thinkzone.vn',
                port: '',
                pathname: '/uploads/**'
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**'
            }
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [375, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
    },
    async redirects() {
        return [
            {
                source: '/warranty_check',
                destination: '/warranty-check',
                permanent: true
            }
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${internalApiBaseUrl}/:path*`
            }
        ];
    }
};

export default nextConfig;
