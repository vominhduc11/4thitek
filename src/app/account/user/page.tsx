'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { UserProfile, PurchasedProducts, WarrantyExtension, WarrantyRequest } from './components';

const UserAccountPage = () => {
    const [activeTab, setActiveTab] = useState('warranty');
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    // Redirect neu chua dang nhap
    React.useEffect(() => {
        if (!isAuthenticated) {
            router.push('/warranty-check');
        }
    }, [isAuthenticated, router]);

    // Listen for tab switch events from UserProfile component
    React.useEffect(() => {
        const handleTabSwitch = (event: CustomEvent) => {
            setActiveTab(event.detail);
        };

        window.addEventListener('switchTab', handleTabSwitch as EventListener);
        return () => {
            window.removeEventListener('switchTab', handleTabSwitch as EventListener);
        };
    }, []);

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-[#0c131d] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Dang tai...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/warranty-check');
    };

    const tabs = [
        { id: 'warranty', label: 'Tong quan', icon: '🏠' },
        { id: 'products', label: 'San pham da dang ky', icon: '📦' },
        { id: 'extend', label: 'Gia han bao hanh', icon: '📅' },
        { id: 'request', label: 'Yeu cau bao hanh', icon: '🔧' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0c131d] to-[#1a2332] text-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div
                    className="absolute inset-0 bg-repeat"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                ></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 pt-20">
                {/* User Header Section */}
                <motion.div
                    className="bg-gradient-to-r from-[#1a2332] to-[#243447] backdrop-blur-sm border-b border-gray-700/50 shadow-xl"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-2xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <span className="text-xs">✓</span>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Xin chao, {user.name}
                                    </h1>
                                    <p className="text-gray-400 mt-1">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                                            VIP Gold
                                        </div>
                                        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                            Khach hang tu 2022
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg font-medium"
                            >
                                Dang xuat
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    className="bg-[#1a2332]/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-16 z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="container mx-auto px-4">
                        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-300 rounded-t-lg relative ${
                                        activeTab === tab.id
                                            ? 'text-blue-400 bg-[#0c131d]/50 border-b-2 border-blue-400'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                                    }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="absolute inset-0 bg-blue-500/10 rounded-t-lg"
                                            layoutId="activeTab"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.div
                    className="container mx-auto px-4 py-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="bg-[#1a2332]/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl min-h-[600px]">
                        <div className="p-6">
                            {activeTab === 'products' && (
                                <PurchasedProducts
                                    onWarrantyExtension={() => {
                                        setActiveTab('extend');
                                    }}
                                    onWarrantyRequest={() => {
                                        setActiveTab('request');
                                    }}
                                />
                            )}
                            {activeTab === 'warranty' && <UserProfile />}
                            {activeTab === 'extend' && <WarrantyExtension />}
                            {activeTab === 'request' && <WarrantyRequest />}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UserAccountPage;
