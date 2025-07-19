'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// Đảm bảo bind modal với app container cho accessibility
if (typeof window !== 'undefined') {
    try {
        Modal.setAppElement('#__next');
        console.log('Modal.setAppElement set to #__next');
    } catch (error) {
        console.error('Failed to set app element for Modal:', error);
    }
}

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    // Log khi modal được mở hoặc đóng
    useEffect(() => {
        console.log('LoginModal isOpen:', isOpen);
        if (isOpen) {
            // Đảm bảo modal được hiển thị đúng cách
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    // Sử dụng hook để khóa cuộn trang khi modal mở
    useBodyScrollLock(isOpen);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
        setError('');
        setIsSubmitting(true);
        console.log('Login form submitted with email:', email);

        try {
            // Simulate login API call - replace with actual API call
            const mockUser = {
                id: '1',
                email: email,
                name: 'User Name'
            };
            login(mockUser);
            const success = true;
            console.log('Login result:', success);

            if (!success) {
                setError('Email hoặc mật khẩu không chính xác');
            } else {
                console.log('Login successful, calling onSuccess callback');
                setEmail('');
                setPassword('');

                // Đảm bảo callback được gọi sau khi state đã được cập nhật
                setTimeout(() => {
                    console.log('Calling onSuccess callback');
                    onSuccess?.();
                    onClose();

                    // Nếu không có onSuccess callback, reload trang để cập nhật UI
                    if (!onSuccess) {
                        console.log('No onSuccess callback, reloading page');
                        window.location.reload();
                    }
                }, 100); // Đợi 100ms để đảm bảo trạng thái đăng nhập đã được cập nhật
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
            console.error(err);
        }

        setIsSubmitting(false);
    };

    const customStyles = {
        overlay: {
            backgroundColor: 'rgba(12, 19, 29, 0.9)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000
        },
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1a2332',
            border: 'none',
            borderRadius: '0.5rem',
            padding: 0,
            maxWidth: '450px',
            width: '100%'
        }
    };

    // Đảm bảo modal được hiển thị đúng cách
    useEffect(() => {
        if (isOpen) {
            console.log('Modal should be visible now');
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => {
                console.log('Modal onRequestClose triggered');
                onClose();
            }}
            onAfterOpen={() => {
                console.log('Modal opened');
            }}
            style={customStyles}
            contentLabel="Login Modal"
            ariaHideApp={false} // Tắt ariaHideApp để tránh lỗi
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            closeTimeoutMS={300}
        >
            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-600">
                    <h2 className="text-2xl font-bold text-white">Đăng Nhập</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-3 flex items-start space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-white font-medium mb-2">Email</label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập địa chỉ email"
                                className="w-full bg-[#0c131d] text-white border border-gray-600 rounded-lg pl-10 pr-4 py-3 focus:border-[#00d4ff] focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Mật khẩu</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full bg-[#0c131d] text-white border border-gray-600 rounded-lg pl-10 pr-4 py-3 focus:border-[#00d4ff] focus:outline-none"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="text-right mt-1">
                            <button type="button" className="text-[#00d4ff] text-sm hover:underline">
                                Quên mật khẩu?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#00d4ff] text-[#0c131d] py-3 px-6 rounded-lg font-medium hover:bg-[#00b8e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>

                {/* Demo accounts */}
                <div className="px-6 pb-6">
                    <div className="bg-[#0c131d] rounded-lg p-3 border border-gray-600">
                        <p className="text-gray-300 text-sm mb-2">Tài khoản demo:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-gray-400">Email: nguyenvana@email.com</p>
                                <p className="text-gray-400">Password: password123</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Email: tranthib@email.com</p>
                                <p className="text-gray-400">Password: password123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
