import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4thitek | Danh sách sản phẩm'
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
