'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const UserProfile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    const warrantyStats = [
        { label: t('account.productsRegistered'), value: '3', color: 'text-blue-400' },
        { label: t('account.activeWarranty'), value: '2', color: 'text-green-400' },
        { label: t('account.expiredWarranty'), value: '1', color: 'text-red-400' },
        { label: t('account.expiringSoon'), value: '1', color: 'text-yellow-400' }
    ];

    const recentActivity = [
        {
            id: '1',
            type: 'purchase',
            title: t('account.warrantyRegistration'),
            description: 'Chuot Gaming 4T Elite',
            date: '20/11/2023',
            icon: '📝'
        },
        {
            id: '2',
            type: 'warranty',
            title: t('account.warrantyRequest'),
            description: 'Laptop Gaming 4T Pro - ' + t('account.warrantyRepair'),
            date: '15/10/2023',
            icon: '🔧'
        },
        {
            id: '3',
            type: 'extension',
            title: t('account.warrantyExtension'),
            description: 'Man hinh Gaming 4T Ultra - ' + t('account.warrantyExtended'),
            date: '05/09/2023',
            icon: '📅'
        }
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="text-xl font-bold mb-6 text-white">{t('account.accountOverview')}</h2>

                {/* User Info Card */}
                <div className="bg-[#0c131d]/50 rounded-xl p-6 border border-gray-700/40 mb-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                            <span className="text-white font-bold text-xl">{user?.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1">{user?.name}</h3>
                            <p className="text-gray-400 mb-2 text-sm">{user?.email}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                                    {t('account.vipGold')}
                                </span>
                                <span className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                                    {t('account.customerSince')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {warrantyStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-[#0c131d]/30 rounded-lg p-4 border border-gray-700/30 text-center hover:border-gray-600/50 transition-all duration-300 backdrop-blur-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className={`text-2xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                            <div className="text-xs text-gray-400 leading-tight">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-[#0c131d]/50 rounded-xl p-6 border border-gray-700/40 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('account.recentActivity')}</h3>

                    <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 bg-[#1a2332]/40 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                    <span className="text-sm">{activity.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white text-sm">{activity.title}</h4>
                                    <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                                </div>
                                <div className="text-xs text-gray-500 flex-shrink-0">{activity.date}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.button
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 p-4 rounded-lg transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.open('/products', '_blank')}
                    >
                        <div className="text-lg mb-2 group-hover:scale-110 transition-transform duration-300">👁️</div>
                        <div className="font-medium text-sm">{t('account.viewProducts')}</div>
                    </motion.button>

                    <motion.button
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 p-4 rounded-lg transition-all duration-300 border border-green-500/30 hover:border-green-400/50 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('switchTab', { detail: 'extend' });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="text-lg mb-2 group-hover:scale-110 transition-transform duration-300">📅</div>
                        <div className="font-medium text-sm">{t('account.extendWarranty')}</div>
                    </motion.button>

                    <motion.button
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 p-4 rounded-lg transition-all duration-300 border border-orange-500/30 hover:border-orange-400/50 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('switchTab', { detail: 'request' });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="text-lg mb-2 group-hover:scale-110 transition-transform duration-300">🔧</div>
                        <div className="font-medium text-sm">{t('account.requestWarranty')}</div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default UserProfile;
