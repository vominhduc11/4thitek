import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/privacy-policy',
    title: '4T HITEK | Chinh sach bao mat',
    description:
        'Tim hieu cach 4T HITEK thu thap, su dung va bao ve thong tin ca nhan cua ban theo quy dinh bao mat du lieu.',
    keywords: ['chinh sach bao mat 4T HITEK', 'bao ve du lieu ca nhan', 'quyen rieng tu', 'GDPR 4T HITEK']
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
