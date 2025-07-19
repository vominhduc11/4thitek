import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
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
