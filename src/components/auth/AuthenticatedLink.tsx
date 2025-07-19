'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { useRouter } from 'next/navigation';

interface AuthenticatedLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    buttonStyle?: boolean;
}

/**
 * Component liên kết yêu cầu xác thực
 * Hiển thị modal đăng nhập nếu người dùng chưa đăng nhập
 * Chuyển hướng trực tiếp nếu người dùng đã đăng nhập
 */
export default function AuthenticatedLink({
    href,
    children,
    className = '',
    buttonStyle = false
}: AuthenticatedLinkProps) {
    const { isAuthenticated } = useAuth();
    const { openLoginModal } = useLoginModal();
    const router = useRouter();

    // Log để kiểm tra khi component được render
    useEffect(() => {
        console.log('AuthenticatedLink rendered with href:', href);
        console.log('AuthenticatedLink - isAuthenticated:', isAuthenticated);
    }, [href, isAuthenticated]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
        console.log('AuthenticatedLink clicked');
        console.log('isAuthenticated:', isAuthenticated);

        if (isAuthenticated) {
            console.log('User is authenticated, redirecting to:', href);
            router.push(href);
        } else {
            console.log('User is not authenticated, opening login modal');
            // Đảm bảo modal được mở bằng cách sử dụng setTimeout
            setTimeout(() => {
                openLoginModal(href);
            }, 0);
        }
    };

    return (
        <>
            {buttonStyle ? (
                <button onClick={handleClick} className={className}>
                    {children}
                </button>
            ) : (
                <a href="#" onClick={handleClick} className={className}>
                    {children}
                </a>
            )}
        </>
    );
}
