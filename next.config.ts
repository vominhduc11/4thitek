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
