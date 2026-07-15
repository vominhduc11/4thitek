import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/privacy-policy',
    title: '4T HITEK | Chính sách bảo mật',
    description:
        'Tìm hiểu cách 4T HITEK thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn theo quy định bảo mật dữ liệu.',
    keywords: ['chính sách bảo mật 4T HITEK', 'bảo vệ dữ liệu cá nhân', 'quyền riêng tư', 'GDPR 4T HITEK']
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
