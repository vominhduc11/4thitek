'use client';

import { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiSettings, FiPackage, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
    const { user, logout, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-[#1a2332] hover:bg-[#243447] text-white rounded-full p-1 pr-3 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-[#00d4ff] text-[#0c131d] flex items-center justify-center overflow-hidden">
                    <FiUser className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{user.username}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1a2332] rounded-lg shadow-lg border border-gray-600 overflow-hidden z-20">
                    <div className="p-4 border-b border-gray-600">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-[#00d4ff] text-[#0c131d] flex items-center justify-center overflow-hidden">
                                <FiUser className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{user.username}</p>
                                <p className="text-gray-400 text-sm">ID: {user.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2">
                        <button className="w-full text-left px-4 py-2 text-white hover:bg-[#243447] transition-colors flex items-center space-x-3">
                            <FiPackage className="w-4 h-4 text-[#00d4ff]" />
                            <span>Đơn hàng của tôi</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-white hover:bg-[#243447] transition-colors flex items-center space-x-3">
                            <FiSettings className="w-4 h-4 text-[#00d4ff]" />
                            <span>Cài đặt tài khoản</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-white hover:bg-[#243447] transition-colors flex items-center space-x-3">
                            <FiHelpCircle className="w-4 h-4 text-[#00d4ff]" />
                            <span>Trợ giúp & Hỗ trợ</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-600 py-2">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#243447] transition-colors flex items-center space-x-3"
                        >
                            <FiLogOut className="w-4 h-4" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
