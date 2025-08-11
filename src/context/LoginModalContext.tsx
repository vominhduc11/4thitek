'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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


    const openLoginModal = (path?: string) => {
        setRedirectPath(path);

        // Simplified modal opening to avoid hydration timing issues
        setIsLoginModalOpen(true);
    };

    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = () => {

        // Đảm bảo modal được đóng trước
        setIsLoginModalOpen(false);

        // Simplified redirect handling
        if (redirectPath) {
            router.push(redirectPath);
        } else {
            // Nếu không có redirectPath, reload trang để cập nhật UI
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        }
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
