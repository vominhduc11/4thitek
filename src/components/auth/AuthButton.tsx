'use client';

import { useState } from 'react';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';

export default function AuthButton() {
    const { isAuthenticated, isLoading } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    if (isLoading) {
        return (
            <button className="bg-[#1a2332] text-white px-4 py-2 rounded-lg opacity-50">
                <span className="animate-pulse">...</span>
            </button>
        );
    }

    if (isAuthenticated) {
        return <UserMenu />;
    }

    return (
        <>
            <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center space-x-2 bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0c131d] px-4 py-2 rounded-lg font-medium transition-colors"
            >
                <FiUser className="w-4 h-4" />
                <span>Đăng nhập</span>
            </button>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
}
