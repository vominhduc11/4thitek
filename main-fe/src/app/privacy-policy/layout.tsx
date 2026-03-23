import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/privacy-policy',
    title: '4ThiTek | Chinh sach bao mat',
    description:
        'Tim hieu cach 4ThiTek thu thap, su dung va bao ve thong tin ca nhan cua ban theo quy dinh bao mat du lieu.',
    keywords: ['chinh sach bao mat 4ThiTek', 'bao ve du lieu ca nhan', 'quyen rieng tu', 'GDPR 4ThiTek']
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
