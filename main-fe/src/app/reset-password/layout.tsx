import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '4ThiTek | Đặt lại mật khẩu',
    robots: { index: false, follow: false }
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
