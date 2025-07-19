import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4thitek | chính sách'
};

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
