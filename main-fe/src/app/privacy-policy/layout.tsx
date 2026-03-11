import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/privacy-policy',
    title: '4ThiTek | Chinh sach bao mat',
    description: 'Tim hieu cach 4ThiTek thu thap va bao ve du lieu cua ban.'
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
