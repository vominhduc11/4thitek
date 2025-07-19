'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';

/**
 * Hook để xử lý việc chuyển hướng có yêu cầu đăng nhập
 * @param redirectPath Đường dẫn sẽ chuyển hướng sau khi đăng nhập thành công
 */
export function useLoginRedirect(redirectPath: string = '') {
    const { isAuthenticated, isLoading } = useAuth();
    const { openLoginModal } = useLoginModal();
    const router = useRouter();

    // Xử lý khi người dùng click vào liên kết yêu cầu đăng nhập
    const handleAuthenticatedAction = useCallback(() => {
        console.log('handleAuthenticatedAction called');
        console.log('isAuthenticated:', isAuthenticated);
        console.log('isLoading:', isLoading);
        console.log('redirectPath:', redirectPath);

        // Đảm bảo không thực hiện hành động khi đang tải
        if (isLoading) {
            console.log('Still loading auth state, waiting...');
            return;
        }

        if (isAuthenticated) {
            // Nếu đã đăng nhập, chuyển hướng trực tiếp
            console.log('User is authenticated, redirecting to:', redirectPath);
            router.push(redirectPath);
        } else {
            // Nếu chưa đăng nhập, mở modal đăng nhập
            console.log('User is not authenticated, opening login modal');
            // Đảm bảo modal được mở bằng cách sử dụng setTimeout
            setTimeout(() => {
                openLoginModal(redirectPath);
            }, 0);
        }
    }, [isAuthenticated, isLoading, redirectPath, router, openLoginModal]);

    return {
        handleAuthenticatedAction
    };
}
