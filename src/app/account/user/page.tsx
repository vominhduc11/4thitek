'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { UserProfile, PurchasedProducts, WarrantyExtension, WarrantyRequest } from './components';

const UserAccountPage = () => {
    const [activeTab, setActiveTab] = useState('warranty');
    const { user, isAuthenticated, logout } = useAuth();
    const { t } = useLanguage();
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
                    <p className="text-gray-400">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/warranty-check');
    };

    const tabs = [
        { id: 'warranty', label: t('account.overview'), icon: '🏠' },
        { id: 'products', label: t('account.registeredProducts'), icon: '📦' },
        { id: 'extend', label: t('account.warrantyExtension'), icon: '📅' },
        { id: 'request', label: t('account.warrantyRequest'), icon: '🔧' }
    ];

    return (
        <div className="min-h-screen bg-[#0c131d] text-white relative">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c131d]/50 to-[#0c131d] pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative z-10 pt-16 sm:pt-20">
                {/* User Header Section */}
                <motion.div
                    className="bg-[#1a2332]/80 backdrop-blur-md border-b border-gray-700/30 shadow-2xl"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-6 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                                        <span className="text-white font-bold text-xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1a2332] flex items-center justify-center">
                                        <span className="text-xs">✓</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                                        {t('account.welcome')}, {user.name}
                                    </h1>
                                    <p className="text-gray-400 mb-3 text-sm sm:text-base">{user.email}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                                            {t('account.vipGold')}
                                        </span>
                                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                            {t('account.customerSince')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-all duration-300 border border-red-600/30 hover:border-red-500/50 font-medium text-sm"
                            >
                                {t('account.logout')}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    className="bg-[#1a2332]/60 backdrop-blur-md border-b border-gray-700/30 sticky top-16 sm:top-20 z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-6 sm:px-8 md:px-12 lg:px-16">
                        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-all duration-300 rounded-lg relative ${
                                        activeTab === tab.id
                                            ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                                    }`}
                                >
                                    <span className="text-sm">{tab.icon}</span>
                                    <span className="font-medium text-sm">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="absolute inset-0 bg-blue-500/5 rounded-lg border border-blue-500/20"
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
                    className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-6 sm:px-8 md:px-12 lg:px-16 py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="bg-[#1a2332]/40 backdrop-blur-md rounded-xl border border-gray-700/40 shadow-xl min-h-[500px]">
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
