'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

interface LoginFormProps {
    onClose: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Mock login - trong thực tế sẽ gọi API
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock validation
            if (email === 'user@4thitek.com' && password === 'password123') {
                const mockUser = {
                    id: '1',
                    email: 'user@4thitek.com',
                    name: 'Nguyen Van A',
                    avatar: '/avatars/user1.jpg'
                };

                login(mockUser);
                onClose();
                router.push('/account/user');
            } else {
                setError('Email hoac mat khau khong dung');
            }
        } catch {
            setError('Co loi xay ra, vui long thu lai');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="bg-[#1a2332] p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-700 shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <div className="flex justify-between items-center mb-6">
                <motion.h2 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Đăng nhập
                </motion.h2>
                <motion.button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-700/50 p-1 sm:p-1.5 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-3 sm:space-y-4 lg:space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {error && (
                    <motion.div
                        className="bg-red-900/20 border border-red-700 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        required
                        className="w-full h-10 sm:h-11 lg:h-12 px-3 sm:px-4 text-sm sm:text-base bg-[#0c131d] border-gray-600 text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] hover:border-gray-500"
                        autoFocus
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                        Mật khẩu
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn"
                        required
                        className="w-full h-10 sm:h-11 lg:h-12 px-3 sm:px-4 text-sm sm:text-base bg-[#0c131d] border-gray-600 text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] hover:border-gray-500"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white py-2 sm:py-3 lg:py-4 text-sm sm:text-base font-medium rounded-lg border border-[#4FC8FF]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm sm:text-base">Đang đăng nhập...</span>
                        </div>
                    ) : (
                        <span className="text-sm sm:text-base font-medium">Đăng nhập</span>
                    )}
                </Button>
            </motion.form>

            <motion.div 
                className="mt-4 sm:mt-6 p-3 sm:p-4 lg:p-5 bg-[#0c131d] rounded-lg border border-gray-600/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <p className="text-xs sm:text-sm lg:text-base text-gray-400 mb-2 font-medium">Tài khoản demo:</p>
                <div className="space-y-1">
                    <p className="text-xs sm:text-sm lg:text-base text-gray-300"><span className="text-gray-400">Email:</span> user@4thitek.com</p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-300"><span className="text-gray-400">Mật khẩu:</span> password123</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LoginForm;
