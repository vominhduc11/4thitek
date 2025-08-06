'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    login: (user: User) => void;
    logout: () => void;
    clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa (từ localStorage)
        const checkAuth = () => {
            console.log('Checking authentication status...');

            // Set hydrated flag first
            setIsHydrated(true);

            // Đảm bảo localStorage có sẵn (client-side)
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const storedUser = localStorage.getItem('4thitek_user');
            console.log('Stored user:', storedUser ? 'exists' : 'not found');

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('User data parsed successfully:', parsedUser);

                    // Đảm bảo dữ liệu người dùng hợp lệ
                    if (parsedUser && parsedUser.id && parsedUser.email) {
                        setUser(parsedUser);

                        // Đảm bảo cookie được đặt nếu có dữ liệu người dùng trong localStorage
                        if (typeof document !== 'undefined' && !document.cookie.includes('4thitek_auth=')) {
                            document.cookie = '4thitek_auth=true; path=/; max-age=86400'; // Hết hạn sau 1 ngày
                            console.log('Auth cookie set');
                        } else if (typeof document !== 'undefined') {
                            console.log('Auth cookie already exists');
                        }
                    } else {
                        console.log('Invalid user data, clearing localStorage');
                        localStorage.removeItem('4thitek_user');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Failed to parse stored user data:', error);
                    localStorage.removeItem('4thitek_user');
                    if (typeof document !== 'undefined') {
                        document.cookie = '4thitek_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    }
                    setUser(null);
                }
            } else {
                console.log('No user data found in localStorage');
                setUser(null);
            }
            setIsLoading(false);
        };

        // Delay để đảm bảo component đã mount
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, []);

    const login = useCallback((user: User) => {
        console.log('Login user:', user);
        setUser(user);

        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem('4thitek_user', JSON.stringify(user));
        console.log('User data saved to localStorage');

        // Đặt cookie để middleware có thể nhận diện
        if (typeof document !== 'undefined') {
            document.cookie = '4thitek_auth=true; path=/; max-age=86400'; // Hết hạn sau 1 ngày
            console.log('Auth cookie set');
        }
    }, []);

    const logout = useCallback(() => {
        console.log('Logging out user');

        // Xóa dữ liệu người dùng khỏi localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('4thitek_user');
            console.log('User data removed from localStorage');

            // Xóa cookie xác thực
            if (typeof document !== 'undefined') {
                document.cookie = '4thitek_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                console.log('Auth cookie removed');
            }
        }

        // Đặt user state về null sau khi đã xóa dữ liệu
        setUser(null);
        console.log('User state set to null');
    }, []);

    // Function để clear authentication manually
    const clearAuth = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('4thitek_user');
            if (typeof document !== 'undefined') {
                document.cookie = '4thitek_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
        }
        setUser(null);
    }, []);

    // Memoized context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        isHydrated,
        login,
        logout,
        clearAuth
    }), [user, isLoading, isHydrated, login, logout, clearAuth]);

    // Log để kiểm tra trạng thái đăng nhập
    useEffect(() => {
        console.log('AuthContext - user:', user);
        console.log('AuthContext - isAuthenticated:', !!user);
    }, [user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
