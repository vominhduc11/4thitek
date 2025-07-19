import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4thitek | Danh sách blog'
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
