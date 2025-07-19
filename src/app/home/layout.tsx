import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4thitek | Trang chủ'
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
