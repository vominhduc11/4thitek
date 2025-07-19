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
            className="bg-[#1a2332] p-6 rounded-lg border border-gray-700 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Dang nhap</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <motion.div
                        className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhap email cua ban"
                        required
                        className="w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                        Mat khau
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhap mat khau cua ban"
                        required
                        className="w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Dang dang nhap...
                        </div>
                    ) : (
                        'Dang nhap'
                    )}
                </Button>
            </form>

            <div className="mt-4 p-3 bg-[#0c131d] rounded-lg border border-gray-600">
                <p className="text-xs text-gray-400 mb-2">Tai khoan demo:</p>
                <p className="text-xs text-gray-300">Email: user@4thitek.com</p>
                <p className="text-xs text-gray-300">Mat khau: password123</p>
            </div>
        </motion.div>
    );
};

export default LoginForm;
