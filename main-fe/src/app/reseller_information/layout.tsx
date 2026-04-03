import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4T HITEK | Thông tin đại lý',
    robots: { index: false, follow: false }
};

export default function ResellerInfomationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
