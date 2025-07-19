'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const UserProfile = () => {
    const { user } = useAuth();

    const warrantyStats = [
        { label: 'San pham da dang ky', value: '3', color: 'text-blue-400' },
        { label: 'Con bao hanh', value: '2', color: 'text-green-400' },
        { label: 'Het bao hanh', value: '1', color: 'text-red-400' },
        { label: 'Sap het han', value: '1', color: 'text-yellow-400' }
    ];

    const recentActivity = [
        {
            id: '1',
            type: 'purchase',
            title: 'Dang ky bao hanh',
            description: 'Chuot Gaming 4T Elite',
            date: '20/11/2023',
            icon: '📝'
        },
        {
            id: '2',
            type: 'warranty',
            title: 'Yeu cau bao hanh',
            description: 'Laptop Gaming 4T Pro - Sua loi man hinh',
            date: '15/10/2023',
            icon: '🔧'
        },
        {
            id: '3',
            type: 'extension',
            title: 'Gia han bao hanh',
            description: 'Man hinh Gaming 4T Ultra - Gia han 1 nam',
            date: '05/09/2023',
            icon: '📅'
        }
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="text-2xl font-bold mb-6">Tong quan tai khoan</h2>

                {/* User Info Card */}
                <div className="bg-[#1a2332] rounded-lg p-6 border border-gray-700 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">{user?.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">{user?.name}</h3>
                            <p className="text-gray-400 mb-1">{user?.email}</p>
                            <p className="text-sm text-gray-500">Khach hang tu 2022</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                                VIP Gold
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {warrantyStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-[#1a2332] rounded-lg p-4 border border-gray-700 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                            <div className="text-sm text-gray-400">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-[#1a2332] rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Hoat dong gan day</h3>

                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 bg-[#0c131d] rounded-lg border border-gray-600"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <span className="text-lg">{activity.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-white">{activity.title}</h4>
                                    <p className="text-sm text-gray-400">{activity.description}</p>
                                </div>
                                <div className="text-sm text-gray-500">{activity.date}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.button
                        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-all duration-300 hover:scale-105"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.open('/products', '_blank')}
                    >
                        <div className="text-2xl mb-2">👁️</div>
                        <div className="font-medium">Xem san pham</div>
                    </motion.button>

                    <motion.button
                        className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-all duration-300 hover:scale-105"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('switchTab', { detail: 'extend' });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="text-2xl mb-2">📅</div>
                        <div className="font-medium">Gia han bao hanh</div>
                    </motion.button>

                    <motion.button
                        className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-all duration-300 hover:scale-105"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('switchTab', { detail: 'request' });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="text-2xl mb-2">🔧</div>
                        <div className="font-medium">Yeu cau bao hanh</div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default UserProfile;
