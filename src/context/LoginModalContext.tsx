'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';

interface LoginModalContextType {
    openLoginModal: (redirectPath?: string) => void;
    closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState<string | undefined>(undefined);
    const router = useRouter();

    // Log để kiểm tra trạng thái modal
    useEffect(() => {
        console.log('LoginModalContext - isLoginModalOpen:', isLoginModalOpen);
    }, [isLoginModalOpen]);

    const openLoginModal = (path?: string) => {
        console.log('Opening login modal with redirect path:', path);
        setRedirectPath(path);

        // Đảm bảo modal được mở bằng cách sử dụng setTimeout và requestAnimationFrame
        setTimeout(() => {
            requestAnimationFrame(() => {
                setIsLoginModalOpen(true);
                console.log('Login modal should be open now');
            });
        }, 0);
    };

    const closeLoginModal = () => {
        console.log('Closing login modal');
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = () => {
        console.log('Login successful, redirecting to:', redirectPath);

        // Đảm bảo modal được đóng trước
        setIsLoginModalOpen(false);

        // Đảm bảo chuyển hướng được thực hiện sau khi modal đã đóng và trạng thái đăng nhập đã được cập nhật
        setTimeout(() => {
            if (redirectPath) {
                console.log('Redirecting to:', redirectPath);
                router.push(redirectPath);
            } else {
                // Nếu không có redirectPath, reload trang để cập nhật UI
                console.log('No redirect path, reloading page');
                window.location.reload();
            }
        }, 300); // Đợi 300ms để đảm bảo trạng thái đăng nhập đã được cập nhật
    };

    return (
        <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
            {children}
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onSuccess={handleLoginSuccess} />
        </LoginModalContext.Provider>
    );
}

export function useLoginModal() {
    const context = useContext(LoginModalContext);
    if (context === undefined) {
        throw new Error('useLoginModal must be used within a LoginModalProvider');
    }
    return context;
}
